import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

export const level02: Level = {
  id: "cookies",
  name: "Cookie-согласие",
  mount(root, game) {
    let nags = 0;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Управление подпиской</h1>
        <p class="muted-line">Загружаем раздел…</p>
        <div class="cookie-slot"></div>
      </div>`);
    const slot = view.querySelector<HTMLElement>(".cookie-slot")!;

    const render = (): void => {
      slot.replaceChildren(
        el(`
        <div class="cookie">
          <h3>Мы ценим вашу приватность</h3>
          <p>
            Мы и ещё <b>1 428</b> наших доверенных партнёров используем cookie и похожие
            технологии, чтобы показывать рекламу, которую вы всё равно пролистываете.
          </p>
          <div class="cookie-actions">
            <button class="btn btn-primary btn-block" type="button" data-accept>Принять все</button>
            <button class="link-evil" type="button" data-reject>Только необходимые</button>
          </div>
        </div>`),
      );

      slot.querySelector<HTMLElement>("[data-accept]")!.addEventListener("click", () => {
        nags += 1;
        if (nags >= 2) {
          game.fail("Спасибо, что приняли все 1 428 партнёров и заодно передумали отменять подписку.");
          return;
        }
        toast("Спасибо! Осталось подтвердить ещё раз.");
        render();
      });

      slot.querySelector<HTMLElement>("[data-reject]")!.addEventListener("click", () => {
        game.complete();
      });
    };

    render();
    root.appendChild(view);
  },
};
