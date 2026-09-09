import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";
import { blip, tick as tickSound } from "../engine/sound";

// Long enough to hurt, short enough to stay funny. Tune after playtests.
const WAIT_SECONDS = 14;

export const level08: Level = {
  id: "operator",
  name: "Ожидание оператора",
  mount(root, game) {
    let left = WAIT_SECONDS;
    let queue = 8;
    let done = false;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Соединяем с отделом отмены</h1>
        <div class="card wait">
          <div class="wait-spinner" aria-hidden="true"></div>
          <p class="wait-line">Все специалисты сейчас заняты. Пожалуйста, оставайтесь на линии.</p>
          <p class="wait-timer mono"><b data-left>0:14</b> до подключения</p>
          <p class="wait-queue mono">позиция в очереди: <span data-queue>8</span></p>
          <button class="link-evil" type="button" data-callback>Заказать обратный звонок вместо ожидания</button>
        </div>
      </div>`);

    const leftEl = view.querySelector<HTMLElement>("[data-left]")!;
    const queueEl = view.querySelector<HTMLElement>("[data-queue]")!;

    const render = (): void => {
      leftEl.textContent = `0:${String(Math.max(0, left)).padStart(2, "0")}`;
      queueEl.textContent = String(queue);
    };
    render();

    const tick = window.setInterval(() => {
      if (done) return;
      left -= 1;
      queue = Math.max(1, queue + (Math.random() < 0.45 ? 1 : -1));
      render();
      if (left > 0 && left <= 3) tickSound();
      if (left <= 0) {
        done = true;
        window.clearInterval(tick);
        leftEl.textContent = "0:00";
        view.querySelector<HTMLElement>(".wait-line")!.textContent = "Специалист на линии. Соединяем…";
        blip();
        window.setTimeout(() => game.complete(), 1200);
      }
    }, 1000);

    const onHidden = (): void => {
      if (done || document.visibilityState !== "hidden") return;
      left = WAIT_SECONDS;
      queue = 8 + Math.floor(Math.random() * 6);
      render();
      game.penalize(3000);
      toast("Вы отвлеклись от очереди. Ожидание началось заново.");
    };
    document.addEventListener("visibilitychange", onHidden);

    view.querySelector<HTMLElement>("[data-callback]")!.addEventListener("click", () => {
      game.fail("Спасибо, что заказали обратный звонок. Мы позвоним в течение 30 рабочих дней. Подписка сохранена.");
    });

    root.appendChild(view);

    return () => {
      done = true;
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onHidden);
    };
  },
};
