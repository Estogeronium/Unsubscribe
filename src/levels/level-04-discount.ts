import type { Level } from "../engine/types";
import { el } from "../engine/dom";

export const level04: Level = {
  id: "discount",
  name: "Удержание скидкой",
  mount(root, game) {
    const view = el(`
      <div class="screen">
        <div class="card offer">
          <div class="offer-badge">−75%</div>
          <h3>Специальное предложение только для вас</h3>
          <p>Останьтесь на «Флюсе» со скидкой 75% на следующие 3 месяца — 99 ₽ вместо 399 ₽.</p>
          <div class="offer-opts">
            <label class="opt"><input type="radio" name="d" value="take" checked><span>Принять скидку 75%</span></label>
            <label class="opt"><input type="radio" name="d" value="leave"><span>Нет, я хочу платить полную цену и всё-таки уйти</span></label>
          </div>
          <button class="btn btn-primary btn-block" type="button" data-next>Продолжить</button>
        </div>
      </div>`);

    const sync = (): void => {
      view.querySelectorAll<HTMLElement>(".opt").forEach((o) => {
        const input = o.querySelector<HTMLInputElement>("input")!;
        o.classList.toggle("sel", input.checked);
      });
    };
    view.querySelectorAll<HTMLInputElement>("input").forEach((i) => i.addEventListener("change", sync));
    sync();

    view.querySelector<HTMLElement>("[data-next]")!.addEventListener("click", () => {
      const value = view.querySelector<HTMLInputElement>("input[name='d']:checked")!.value;
      if (value === "take") {
        game.fail("Скидка активирована. Значит, вы всё-таки остаётесь. Повезёт в другой раз.");
        return;
      }
      game.complete();
    });

    root.appendChild(view);
  },
};
