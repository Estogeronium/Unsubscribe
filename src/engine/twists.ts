import type { GameApi } from "./types";
import { el, toast } from "./dom";

/** Небольшие «повороты» между уровнями: короткие экраны, сбивающие с толку. */
export interface Twist {
  /** Показать прямо перед монтированием уровня с этим индексом (0-based). */
  before: number;
  render(root: HTMLElement, done: () => void, game: GameApi): void | (() => void);
}

export const TWISTS: Twist[] = [
  {
    // после «Скидки −75%», перед «Опросом»
    before: 4,
    render(root, done) {
      const view = el(`
        <div class="screen">
          <div class="twist">
            <div class="twist-emoji">🎉</div>
            <h1 class="screen-title">«Инопоиск Флюс» обновился</h1>
            <p class="muted-line">Версия 8.15.0 · только что</p>
            <ul class="twist-list">
              <li>Новый способ не отменять подписку</li>
              <li>Кнопка отмены стала на 12% незаметнее</li>
              <li>Исправлена ошибка, из-за которой отмена иногда срабатывала</li>
              <li>Прочие улучшения, о которых вам не нужно знать</li>
            </ul>
            <button class="btn btn-primary btn-block" type="button" data-go>Продолжить</button>
          </div>
        </div>`);
      view.querySelector<HTMLElement>("[data-go]")!.addEventListener("click", done);
      root.appendChild(view);
    },
  },
  {
    // после «SMS-кода», перед «Пятнашками»
    before: 9,
    render(root, done, game) {
      const view = el(`
        <div class="screen">
          <div class="twist">
            <div class="twist-emoji">🔒</div>
            <h1 class="screen-title">Сессия завершена</h1>
            <p class="muted-line">Для вашей безопасности мы вышли из аккаунта. Войдите снова, чтобы продолжить отмену.</p>
            <div class="twist-login">
              <input class="input" value="m•••@mail.ru" disabled aria-label="Почта" />
              <button class="btn btn-primary btn-block" type="button" data-in>Войти</button>
            </div>
          </div>
        </div>`);
      const btn = view.querySelector<HTMLButtonElement>("[data-in]")!;
      btn.addEventListener("click", () => {
        btn.disabled = true;
        btn.textContent = "Входим…";
        game.penalize(3000);
        window.setTimeout(done, 1500);
      });
      root.appendChild(view);
    },
  },
  {
    // после «Условий», перед «Лабиринтом» — врубаем тёмную тему
    before: 12,
    render(root, done) {
      const view = el(`
        <div class="screen">
          <div class="twist">
            <div class="twist-emoji">🌙</div>
            <h1 class="screen-title">Мы включили тёмную тему</h1>
            <p class="muted-line">Подобрали по времени суток и по тому, как долго вы уже здесь. Светлую вернём попозже.</p>
            <button class="btn btn-primary btn-block" type="button" data-ok>Ладно</button>
          </div>
        </div>`);
      view.querySelector<HTMLElement>("[data-ok]")!.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "dark");
        done();
      });
      root.appendChild(view);
    },
  },
  {
    // после «Понижения тарифа» — возвращаем светлую тему (без экрана)
    before: 15,
    render(_root, done) {
      document.documentElement.setAttribute("data-theme", "light");
      toast("Вернули светлую тему. Глаза, наверное, уже привыкли.");
      done();
    },
  },
];
