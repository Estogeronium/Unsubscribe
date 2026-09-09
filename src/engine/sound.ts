// Крошечный синтезатор на Web Audio: без ассетов, всё из осцилляторов.
// Звук по умолчанию включён, но тихий; переключатель — в HUD, выбор в localStorage.

const KEY = "ipp-sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = readEnabled();
let clickAttached = false;

function readEnabled(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

function resumeIfNeeded(): void {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

export function isSoundOn(): boolean {
  return enabled;
}

export function setSoundOn(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* приватный режим — просто не запоминаем */
  }
  if (on) {
    ensureCtx();
    resumeIfNeeded();
    blip();
  }
}

interface ToneOpts {
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  from?: number;
  to?: number;
  delay?: number;
}

function tone(freq: number, o: ToneOpts = {}): void {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c || !master) return;
  resumeIfNeeded();

  const { type = "sine", dur = 0.09, vol = 1, delay = 0 } = o;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(o.from ?? freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t + dur);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

/** Мягкий тик — на любые кнопки/ссылки. */
export function click(): void {
  tone(1300, { type: "triangle", dur: 0.028, vol: 0.45 });
}

/** Короткий восходящий блип — переход дальше, сообщение бота. */
export function blip(): void {
  tone(640, { type: "sine", dur: 0.08, vol: 0.7, to: 960 });
}

/** Нисходящий «увы» — экран провала. */
export function fail(): void {
  tone(340, { type: "sawtooth", dur: 0.55, vol: 0.55, from: 360, to: 90 });
  tone(170, { type: "sine", dur: 0.55, vol: 0.4, from: 190, to: 60, delay: 0.02 });
}

/** Восходящее арпеджио — финал. */
export function win(): void {
  [523, 659, 784, 1047].forEach((f, i) =>
    tone(f, { type: "triangle", dur: 0.24, vol: 0.55, delay: i * 0.1 }),
  );
}

/** Одиночный высокий тик — секунды в очереди оператора. */
export function tick(): void {
  tone(2100, { type: "square", dur: 0.014, vol: 0.22 });
}

/** Замедляющийся треск храповика — колесо фортуны (~4 с). */
export function wheelSpin(): void {
  if (!enabled || !ensureCtx()) return;
  let t = 0;
  for (let i = 0; i < 44; i += 1) {
    const frac = i / 44;
    t += 0.028 + frac * frac * 0.22;
    if (t > 4.1) break;
    tone(1700 - i * 10, { type: "square", dur: 0.012, vol: 0.2, delay: t });
  }
}

/** Глобальный тик на клики по интерактивным элементам. Ставится один раз. */
export function attachClickSound(): void {
  if (clickAttached) return;
  clickAttached = true;
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a, label, [role='button'], summary")) click();
    },
    true,
  );
}
