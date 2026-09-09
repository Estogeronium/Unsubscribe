import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

const CLAUSES = [
  "Настоящее Соглашение регулирует порядок прекращения предоставления доступа к сервису «Инопоиск Флюс» (далее — «Сервис»), а также порядок, в котором вы будете об этом жалеть.",
  "1. Отмена подписки не является отменой подписки в значении, которое вы могли бы предположить, исходя из значения слова «отмена».",
  "2. Отмена отмены не является отменой. Отмена отмены отмены приравнивается к отмене, но только в письменной форме.",
  "3. Пользователь подтверждает, что ознакомился с настоящим текстом полностью, включая настоящий пункт, который является доказательством обратного.",
  "4. Сервис вправе считать любое ваше действие, а также бездействие, согласием на продление подписки, если иное не доказано в суде по месту нахождения Сервиса.",
  "5. Несогласие с несохранением подписки считается согласием на её сохранение. Согласие с несохранением рассматривается индивидуально.",
  "6. Прокрутка настоящего текста до конца приравнивается к его прочтению. Прочтение настоящего текста ни к чему не приравнивается.",
  "7. Стороны договорились считать 30 дней равными 45 дням для целей расчёта даты фактического прекращения списаний.",
  "8. Отказ от бонусной программы влечёт автоматическое согласие с новой бонусной программой.",
  "9. Настоящий пункт намеренно оставлен длинным, чтобы вы устали читать и пролистали дальше. Спасибо за понимание.",
  "10. Продолжая, вы подтверждаете, что все предыдущие пункты были прочитаны вами вслух и с выражением.",
];

interface Statement {
  text: string;
  // true = утверждение согласуется с намерением отменить подписку
  correct: boolean;
}

const STATEMENTS: Statement[] = [
  { text: "Я не хочу продлевать подписку «Флюс».", correct: true },
  { text: "Я не возражаю против того, чтобы отмена не состоялась.", correct: false },
  { text: "Неверно, что я передумал(а) отменять подписку.", correct: true },
  {
    text: "Поскольку отмена отмены — это не отмена, я подтверждаю сохранение подписки.",
    correct: false,
  },
  { text: "Я отказываюсь принимать предложение не отменять подписку.", correct: true },
  { text: "Я подтверждаю, что не хочу не сохранять доступ к «Флюсу».", correct: false },
];

export const level12: Level = {
  id: "terms",
  name: "Прочитайте условия",
  mount(root, game) {
    let reachedEnd = false;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Условия отмены подписки</h1>
        <p class="muted-line">Пролистайте до конца, затем отметьте только те утверждения, которые верны, если вы действительно хотите отменить подписку.</p>
        <div class="terms" data-scroll>
          ${CLAUSES.map((c) => `<p>${c}</p>`).join("")}
          <p class="terms-end" data-end>— конец документа —</p>
        </div>
        <div class="terms-quiz" data-quiz></div>
        <button class="btn btn-primary btn-block" data-next type="button" disabled>Продолжить</button>
        <button class="link-evil" type="button" data-keep>Формулировки слишком запутанные — оставить подписку</button>
      </div>`);

    const scroll = view.querySelector<HTMLElement>("[data-scroll]")!;
    const quiz = view.querySelector<HTMLElement>("[data-quiz]")!;
    const next = view.querySelector<HTMLButtonElement>("[data-next]")!;

    const boxes = STATEMENTS.map((st, i) => {
      const label = el<HTMLLabelElement>(`
        <label class="opt">
          <input type="checkbox" data-i="${i}" />
          <span>${st.text}</span>
        </label>`);
      const input = label.querySelector<HTMLInputElement>("input")!;
      input.addEventListener("change", () => {
        label.classList.toggle("sel", input.checked);
        label.classList.remove("is-wrong");
      });
      quiz.appendChild(label);
      return { st, input, label };
    });

    scroll.addEventListener("scroll", () => {
      if (!reachedEnd && scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 6) {
        reachedEnd = true;
        view.querySelector<HTMLElement>("[data-end]")!.classList.add("lit");
        next.disabled = false;
      }
    });

    next.addEventListener("click", () => {
      if (!reachedEnd) return;
      const allCorrect = boxes.every(({ st, input }) => input.checked === st.correct);
      if (allCorrect) {
        game.complete();
        return;
      }
      const match = boxes.filter(({ st, input }) => input.checked === st.correct).length;
      boxes.forEach(({ st, input, label }) => {
        label.classList.toggle("is-wrong", input.checked && !st.correct);
      });
      toast(`Совпадение: ${match} из ${STATEMENTS.length}. Перечитайте формулировки.`);
    });

    view.querySelector<HTMLElement>("[data-keep]")!.addEventListener("click", () => {
      game.fail("Вы не стали разбираться в формулировках. По пункту 5 это согласие на сохранение подписки.");
    });

    root.appendChild(view);
  },
};
