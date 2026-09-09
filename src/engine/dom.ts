/** Build a single element from an HTML string. */
export function el<T extends HTMLElement = HTMLElement>(html: string): T {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as T;
}

/** Russian plural: plural(2, "клик", "клика", "кликов") -> "клика". */
export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ESCAPES[c]!);

let toastHost: HTMLElement | null = null;

function ensureToastHost(): HTMLElement {
  let host = toastHost;
  if (!host) {
    host = el('<div class="toast-host" aria-live="polite"></div>');
    document.body.appendChild(host);
    toastHost = host;
  }
  return host;
}

/** A small transient message, bottom-center. Deliberately calm and friendly. */
export function toast(message: string, ms = 2600): void {
  const host = ensureToastHost();
  const t = el(`<div class="toast"><span class="toast-dot"></span><p>${escapeHtml(message)}</p></div>`);
  host.appendChild(t);
  window.setTimeout(() => {
    t.classList.add("toast-out");
    window.setTimeout(() => t.remove(), 320);
  }, ms);
}

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Lightweight confetti burst on a full-screen canvas. Skipped under reduced motion. */
export function confetti(): void {
  if (prefersReducedMotion()) return;
  const canvas = el<HTMLCanvasElement>('<canvas class="confetti-canvas"></canvas>');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const colors = ["#5B5BD6", "#E8B54A", "#2F9461", "#EF6469", "#7C7CF1"];
  const parts = Array.from({ length: 90 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: window.innerHeight * 0.32,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * -9 - 3,
    r: Math.random() * 5 + 3,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[(Math.random() * colors.length) | 0],
  }));

  const start = performance.now();
  const frame = (now: number) => {
    const life = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of parts) {
      p.vy += 0.22;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - life / 2600);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
      ctx.restore();
    }
    if (life < 2800) {
      requestAnimationFrame(frame);
    } else {
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  };
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);
}
