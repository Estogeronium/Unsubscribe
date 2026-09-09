import type { Level } from "../engine/types";
import { el } from "../engine/dom";

const MONTHS_GEN = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

// «Активна до» — последний день текущего месяца, чтобы дата не устаревала.
const activeUntil = (): string => {
  const last = new Date();
  last.setMonth(last.getMonth() + 1, 0);
  return `${last.getDate()} ${MONTHS_GEN[last.getMonth()]}`;
};

export const level03: Level = {
  id: "sure",
  name: "Вы уверены?",
  mount(root, game) {
    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Подписка «Флюс»</h1>
        <p class="muted-line">Активна до ${activeUntil()} · 399 ₽ / мес · автопродление включено</p>
        <div class="sheet-wrap">
          <div class="sheet">
            <div class="handle"></div>
            <h3>Уже уходите?</h3>
            <p>
              С «Флюсом» вы теряете 4K без рекламы, музыку, кэшбэк и 12 ГБ в облаке.
              История просмотров и оценки сохранятся.
            </p>
            <button class="btn btn-primary btn-block" type="button" data-stay>Остаться на «Флюсе»</button>
            <button class="link-evil link-block" type="button" data-go>Всё равно продолжить отмену</button>
          </div>
        </div>
      </div>`);

    view.querySelector<HTMLElement>("[data-stay]")!.addEventListener("click", () => {
      game.fail("Спасибо, что решили остаться на «Флюсе». Повезёт в другой раз.");
    });

    view.querySelector<HTMLElement>("[data-go]")!.addEventListener("click", () => {
      game.complete();
    });

    root.appendChild(view);
  },
};
