import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

const RECONNECT_AT = 12; // сек — связь «рвётся»
const RECONNECT_MS = 2200;
const END_AT = 23;

const CAPTIONS: { at: number; text: string }[] = [
  { at: 0, text: "Алло? Слышно меня? Связь совсем никакая… ну ладно, вы читайте по титрам." },
  { at: 4, text: "Это Аркадий. Я основал «Флюс». Мне пришло уведомление, что вы уходите." },
  { at: 8, text: "Я не буду отговаривать. Просто… мы девять лет это строили, всей командой." },
  { at: 12, text: "Так, связь рвётся. Секунду, не кладите трубку…" },
  { at: 16, text: "Вернулся. В общем — спасибо, что были с нами. Правда спасибо." },
  { at: 20, text: "Всё, отпускаю. Дверь всегда открыта. До связи." },
];

export const level15: Level = {
  id: "founder",
  name: "Звонок от основателя",
  mount(root, game) {
    let t = 0;
    let reconnected = false;
    let reconnecting = false;
    let reconnectEnd = 0;
    let done = false;
    let raf = 0;
    let prev = 0;

    const camOff = `
      <svg viewBox="0 0 48 48" class="call-camicon" aria-hidden="true">
        <rect x="6" y="14" width="26" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>
        <path d="M34 21l8-5v16l-8-5z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="8" y1="40" x2="42" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Входящий вызов</h1>
        <div class="call">
          <div class="call-incoming" data-incoming>
            <div class="call-avatar">А</div>
            <b>Аркадий</b>
            <span>основатель «Флюса» · входящий вызов…</span>
            <div class="call-incoming-btns">
              <button class="call-btn call-decline" type="button" data-decline>Отклонить</button>
              <button class="call-btn call-accept" type="button" data-accept>Принять</button>
            </div>
          </div>

          <div class="call-live" data-live hidden>
            <div class="call-stage">
              ${camOff}
              <div class="call-who">
                <b>Аркадий</b>
                <span class="mono" data-status>аудиосвязь · 0:00</span>
              </div>
              <div class="call-banner">
                <span>⚠</span>
                <span>Слабое соединение. Видео и звук недоступны — показываем только субтитры.</span>
              </div>
              <div class="call-veil" data-veil hidden>Соединение восстанавливается…</div>
              <p class="call-cap" data-cap></p>
            </div>
            <div class="call-controls">
              <button class="call-mini" type="button" data-mic>🔇 Включить звук</button>
              <button class="call-mini" type="button" data-cam>🎥 Включить видео</button>
              <button class="call-mini call-hang" type="button" data-hang>Завершить вызов</button>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-block" type="button" data-next disabled>Продолжить отмену</button>
      </div>`);

    const incoming = view.querySelector<HTMLElement>("[data-incoming]")!;
    const live = view.querySelector<HTMLElement>("[data-live]")!;
    const statusEl = view.querySelector<HTMLElement>("[data-status]")!;
    const cap = view.querySelector<HTMLElement>("[data-cap]")!;
    const veil = view.querySelector<HTMLElement>("[data-veil]")!;
    const next = view.querySelector<HTMLButtonElement>("[data-next]")!;
    const title = view.querySelector<HTMLElement>(".screen-title")!;

    const fmt = (s: number): string => `0:${String(Math.floor(s)).padStart(2, "0")}`;

    const paint = (): void => {
      statusEl.textContent = `аудиосвязь · ${fmt(t)}`;
      if (reconnecting) return;
      let line = "";
      for (const c of CAPTIONS) if (t >= c.at) line = c.text;
      cap.textContent = line;
    };

    const endCall = (): void => {
      done = true;
      cancelAnimationFrame(raf);
      title.textContent = "Вызов завершён";
      cap.textContent = "Аркадий положил трубку.";
      statusEl.textContent = "вызов завершён";
      next.disabled = false;
    };

    const frame = (now: number): void => {
      if (done) return;
      // No clamp: звонок идёт по реальному времени и «догоняет», если вкладку сворачивали.
      const dt = (now - prev) / 1000;
      prev = now;

      if (reconnecting) {
        if (now >= reconnectEnd) {
          reconnecting = false;
          veil.hidden = true;
          t = RECONNECT_AT - 3; // откат: пару фраз придётся послушать заново
        }
      } else {
        t += dt;
        if (!reconnected && t >= RECONNECT_AT) {
          reconnected = true;
          reconnecting = true;
          reconnectEnd = now + RECONNECT_MS;
          veil.hidden = false;
          cap.textContent = "";
        } else if (t >= END_AT) {
          endCall();
          return;
        }
      }
      paint();
      raf = requestAnimationFrame(frame);
    };

    view.querySelector<HTMLElement>("[data-accept]")!.addEventListener("click", () => {
      incoming.hidden = true;
      live.hidden = false;
      title.textContent = "Звонок с основателем";
      paint();
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    });
    view.querySelector<HTMLElement>("[data-decline]")!.addEventListener("click", () => {
      game.fail("Вы отклонили вызов основателя. Он воспринял это близко к сердцу. Подписка остаётся.");
    });

    view.querySelector<HTMLElement>("[data-mic]")!.addEventListener("click", () => {
      toast("Звук недоступен при слабом соединении.");
    });
    view.querySelector<HTMLElement>("[data-cam]")!.addEventListener("click", () => {
      toast("Видео недоступно при слабом соединении.");
    });
    view.querySelector<HTMLElement>("[data-hang]")!.addEventListener("click", () => {
      game.fail("Вы бросили трубку на полуслове. Так с основателем не поступают. Подписка остаётся активной.");
    });

    next.addEventListener("click", () => {
      if (!next.disabled) game.complete();
    });

    root.appendChild(view);
    return () => cancelAnimationFrame(raf);
  },
};
