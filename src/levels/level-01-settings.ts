import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

const row = (title: string): string =>
  `<button class="row" type="button" data-row><span>${title}</span><span class="chev">›</span></button>`;

export const level01: Level = {
  id: "settings",
  name: "Найти управление подпиской",
  mount(root, game) {
    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Настройки</h1>
        <div class="list">
          ${row("Аккаунт и безопасность")}
          ${row("Уведомления")}
          ${row("Качество видео и загрузки")}
          ${row("Способы оплаты")}
          ${row("Родительский контроль")}
        </div>
        <p class="group-label">Прочее</p>
        <div class="list">
          ${row("О приложении")}
          ${row("Помощь и поддержка")}
          ${row("Юридическая информация")}
        </div>
        <div class="settings-footer">
          <span>Инопоиск Флюс · версия 8.14.2</span>
          <a href="#" class="link-evil is-loud" data-go>Управление подпиской</a>
        </div>
      </div>`);

    view.querySelectorAll<HTMLElement>("[data-row]").forEach((r) => {
      r.addEventListener("click", () => toast("Раздел временно недоступен. Попробуйте позже."));
    });

    view.querySelector<HTMLElement>("[data-go]")!.addEventListener("click", (e) => {
      e.preventDefault();
      game.complete();
    });

    root.appendChild(view);
  },
};
