import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

const PHRASE = "отменяю";

// Каждый раз «почти распознали» — но не совсем.
const MISREADS = [
  "Мы распознали: «отеляю». Не уверены. Напишите разборчивее.",
  "Теперь вышло «отмскаю». Уже теплее! Ещё разок.",
];

export const level17: Level = {
  id: "handwriting",
  name: "Распознавание почерка",
  mount(root, game) {
    let attempts = 0;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Рукописное подтверждение</h1>
        <p class="muted-line">Напишите от руки слово «${PHRASE}» — так мы сверим почерк с вашей анкетой.</p>
        <div class="hw">
          <canvas class="hw-pad" data-pad width="600" height="240" aria-label="поле для рукописного ввода"></canvas>
          <span class="hw-ghost" data-ghost>${PHRASE}</span>
        </div>
        <div class="hw-actions">
          <button class="btn btn-ghost" type="button" data-clear>Очистить</button>
          <button class="btn btn-primary" type="button" data-check>Распознать</button>
        </div>
        <button class="link-evil" type="button" data-type>Не хочу писать от руки — оставить подписку</button>
      </div>`);

    const canvas = view.querySelector<HTMLCanvasElement>("[data-pad]")!;
    const ghost = view.querySelector<HTMLElement>("[data-ghost]")!;
    const ctx = canvas.getContext("2d")!;

    let inkPoints = 0;
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    let drawing = false;
    let last: { x: number; y: number } | null = null;

    const stroke = (color: string): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
    stroke(getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1a23");

    const posOf = (e: PointerEvent): { x: number; y: number } => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * canvas.width,
        y: ((e.clientY - r.top) / r.height) * canvas.height,
      };
    };

    const clear = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      inkPoints = 0;
      bounds.minX = bounds.minY = Infinity;
      bounds.maxX = bounds.maxY = -Infinity;
      ghost.hidden = false;
    };

    canvas.addEventListener("pointerdown", (e) => {
      drawing = true;
      ghost.hidden = true;
      last = posOf(e);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic or already-released pointer */
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing || !last) return;
      const p = posOf(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      inkPoints += 1;
      bounds.minX = Math.min(bounds.minX, p.x);
      bounds.maxX = Math.max(bounds.maxX, p.x);
      bounds.minY = Math.min(bounds.minY, p.y);
      bounds.maxY = Math.max(bounds.maxY, p.y);
    });
    const endStroke = (): void => {
      drawing = false;
      last = null;
    };
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointercancel", endStroke);

    view.querySelector<HTMLElement>("[data-clear]")!.addEventListener("click", clear);

    view.querySelector<HTMLElement>("[data-check]")!.addEventListener("click", () => {
      const wide = bounds.maxX - bounds.minX;
      const tall = bounds.maxY - bounds.minY;
      if (inkPoints < 55 || wide < 90 || tall < 18) {
        toast("Мы ничего не разобрали. Пишите крупнее и медленнее.");
        return;
      }
      if (attempts < MISREADS.length) {
        toast(MISREADS[attempts]!);
        attempts += 1;
        clear();
        return;
      }
      view.querySelector<HTMLElement>(".hw")!.classList.add("hw-ok");
      toast("Почерк совпал с образцом из анкеты 2011 года. Принято.");
      window.setTimeout(() => game.complete(), 1100);
    });

    view.querySelector<HTMLElement>("[data-type]")!.addEventListener("click", () => {
      game.fail("Рукописная подпись — обязательное условие отмены. Раз её нет, подписка сохраняется.");
    });

    root.appendChild(view);
  },
};
