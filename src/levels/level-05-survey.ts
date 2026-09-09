import type { Level } from "../engine/types";
import { el } from "../engine/dom";

interface Question {
  q: string;
  a: string[];
}

const QUESTIONS: Question[] = [
  {
    q: "Как давно вы пользуетесь «Флюсом»?",
    a: ["Меньше месяца", "1–6 месяцев", "Больше года", "Не помню"],
  },
  {
    q: "Насколько вы не согласны с тем, что «Флюс» для вас не бесполезен?",
    a: ["Полностью согласен", "Скорее согласен", "Скорее не согласен", "Затрудняюсь ответить"],
  },
  {
    q: "Что вам нравилось больше всего?",
    a: ["Фильмы и сериалы", "Музыка", "Доставка и такси", "Ничего из перечисленного"],
  },
  {
    q: "Оцените вероятность, что вы посоветуете «Флюс» человеку, который вам неприятен",
    a: ["1", "2", "3", "4", "5"],
  },
  {
    q: "Вы уверены, что не передумаете не остаться?",
    a: ["Уверен, что передумаю остаться", "Не уверен", "Уверен, что не передумаю уйти", "Да"],
  },
];

export const level05: Level = {
  id: "survey",
  name: "Опрос из 6 вопросов",
  mount(root, game) {
    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Почему вы уходите?</h1>
        <p class="muted-line">Все вопросы обязательны. Осталось совсем немного.</p>
        <form class="survey">
          ${QUESTIONS.map(
            (item, i) => `
            <fieldset class="q">
              <legend>${i + 1}. ${item.q}</legend>
              <div class="q-opts">
                ${item.a
                  .map(
                    (opt, j) =>
                      `<label class="opt"><input type="radio" name="q${i}" value="${j}"><span>${opt}</span></label>`,
                  )
                  .join("")}
              </div>
            </fieldset>`,
          ).join("")}
          <fieldset class="q">
            <legend>6. Другое — расскажите подробнее</legend>
            <textarea class="input" id="other" rows="3" placeholder="Минимум 20 символов"></textarea>
            <span class="counter" id="counter">0 / 20</span>
          </fieldset>
          <button class="btn btn-primary btn-block" type="submit" disabled>Отправить и продолжить</button>
        </form>
      </div>`);

    const form = view.querySelector<HTMLFormElement>("form")!;
    const other = view.querySelector<HTMLTextAreaElement>("#other")!;
    const counter = view.querySelector<HTMLElement>("#counter")!;
    const submit = view.querySelector<HTMLButtonElement>("button[type='submit']")!;

    const validate = (): void => {
      view.querySelectorAll<HTMLElement>(".opt").forEach((o) => {
        const input = o.querySelector<HTMLInputElement>("input")!;
        o.classList.toggle("sel", input.checked);
      });
      const answered = QUESTIONS.every((_, i) => form.querySelector(`input[name="q${i}"]:checked`));
      const len = other.value.trim().length;
      counter.textContent = `${len} / 20`;
      counter.classList.toggle("ok", len >= 20);
      submit.disabled = !(answered && len >= 20);
    };

    form.addEventListener("input", validate);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!submit.disabled) game.complete();
    });

    root.appendChild(view);
  },
};
