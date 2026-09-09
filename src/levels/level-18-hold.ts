import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

const BASE_HOLD = 10_000; // мс
const EXTENSION = 3_000; // «секретное» продление у самого финиша, один раз
const R = 52;
const CIRC = 2 * Math.PI * R;

export const level18: Level = {
  id: "hold",
  name: "Удержание кнопки",
  mount(root, game) {
    let holding = false;
    let held = 0;
    let need = BASE_HOLD;
    let extended = false;
    let done = false;
    let releases = 0;
    let raf = 0;
    let prev = 0;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Подтверждение удержанием</h1>
        <p class="muted-line">Нажмите и удерживайте кнопку 10 секунд, не уводя курсор. Отпустите раньше — счётчик обнулится.</p>
        <div class="hold-wrap">
          <button class="hold-btn" type="button" data-btn aria-label="Удерживать для подтверждения">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="hold-track" cx="60" cy="60" r="${R}"></circle>
              <circle class="hold-prog" cx="60" cy="60" r="${R}"
                      stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${CIRC.toFixed(1)}" data-ring></circle>
            </svg>
            <span class="hold-label" data-label>Держать</span>
          </button>
          <button class="hold-nag" type="button" data-nag hidden>⚡ Ускорить подтверждение</button>
          <p class="hold-hint mono" data-hint>0.0 с</p>
        </div>
        <button class="link-evil" type="button" data-give-up>Мне тяжело держать так долго — оставить подписку</button>
      </div>`);

    const btn = view.querySelector<HTMLButtonElement>("[data-btn]")!;
    const ring = view.querySelector<SVGCircleElement>("[data-ring]")!;
    const label = view.querySelector<HTMLElement>("[data-label]")!;
    const hint = view.querySelector<HTMLElement>("[data-hint]")!;
    const nag = view.querySelector<HTMLButtonElement>("[data-nag]")!;

    const paint = (): void => {
      const p = Math.min(1, held / need);
      ring.style.strokeDashoffset = String(CIRC * (1 - p));
      hint.textContent = `${(held / 1000).toFixed(1)} с`;
      if (done) return;
      if (held > need * 0.85) label.textContent = "почти…";
      else if (held > need * 0.4) label.textContent = "не отпускай";
      else label.textContent = "Держать";
    };

    const frame = (now: number): void => {
      const dt = now - prev;
      prev = now;
      if (!holding || done) return;
      held += dt;

      if (held > BASE_HOLD * 0.5) nag.hidden = false;

      // у 85% дистанция один раз незаметно удлиняется
      if (!extended && held > BASE_HOLD * 0.85) {
        extended = true;
        need = BASE_HOLD + EXTENSION;
        toast("Ещё чуть-чуть. Не отпускайте.");
      }

      if (held >= need) {
        done = true;
        holding = false;
        cancelAnimationFrame(raf);
        held = need;
        paint();
        label.textContent = "готово";
        btn.classList.add("is-done");
        nag.hidden = true;
        window.setTimeout(() => game.complete(), 700);
        return;
      }
      paint();
      raf = requestAnimationFrame(frame);
    };

    const start = (): void => {
      if (done || holding) return;
      holding = true;
      btn.classList.add("is-holding");
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = (reason: "release" | "leave"): void => {
      if (done || !holding) return;
      holding = false;
      cancelAnimationFrame(raf);
      btn.classList.remove("is-holding");
      releases += 1;
      const reached = held;
      held = 0;
      need = BASE_HOLD;
      extended = false;
      paint();
      label.textContent = "Держать";
      toast(
        reason === "leave"
          ? "Курсор ушёл с кнопки. Счётчик обнулён."
          : `Вы отпустили на ${(reached / 1000).toFixed(1)} с. Счётчик обнулён.`,
      );
      if (releases === 3) toast("Совет: держать можно двумя руками.");
    };

    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", () => stop("release"));
    btn.addEventListener("pointercancel", () => stop("release"));
    btn.addEventListener("pointerleave", () => stop("leave"));

    nag.addEventListener("click", () => {
      toast("«Ускорение» доступно только на тарифе «Флюс Максимум+».");
    });

    view.querySelector<HTMLElement>("[data-give-up]")!.addEventListener("click", () => {
      game.fail("Держать действительно тяжело. Мы поняли вас — подписка остаётся с вами.");
    });

    paint();
    root.appendChild(view);
    return () => cancelAnimationFrame(raf);
  },
};
