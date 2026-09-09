import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

interface Plan {
  name: string;
  price: number;
  loss: string; // что пропадёт при уходе с этого тарифа
}

// Сверху вниз. Отменить можно только с самого нижнего.
const PLANS: Plan[] = [
  { name: "Флюс Максимум+", price: 899, loss: "4K, Dolby Atmos и 3 экрана одновременно" },
  { name: "Флюс Максимум", price: 649, loss: "скачивание на устройство и звук без рекламы" },
  { name: "Флюс Большой", price: 449, loss: "музыка и подкасты" },
  { name: "Флюс Средний", price: 299, loss: "кэшбэк баллами" },
  { name: "Флюс Базовый", price: 149, loss: "" },
];

const WAIT_RUNG = 3; // на «Среднем» — ловушка «подождать следующего периода»

export const level16: Level = {
  id: "downgrade",
  name: "Понижение тарифа",
  mount(root, game) {
    let rung = 0;
    let busy = false;
    const timers: number[] = [];

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Смена тарифа</h1>
        <p class="muted-line">Отменить подписку можно только с тарифа «Флюс Базовый». Понижайте тариф по одному шагу.</p>
        <div class="ladder" data-ladder></div>
        <div data-action></div>
        <div class="modal-slot" data-modal></div>
        <button class="link-evil" type="button" data-keep>Оставить «Флюс Максимум+» и забыть про отмену</button>
      </div>`);

    const ladder = view.querySelector<HTMLElement>("[data-ladder]")!;
    const actionSlot = view.querySelector<HTMLElement>("[data-action]")!;
    const modalSlot = view.querySelector<HTMLElement>("[data-modal]")!;

    const renderLadder = (): void => {
      ladder.replaceChildren(
        ...PLANS.map((plan, i) => {
          const state = i < rung ? "past" : i === rung ? "current" : "future";
          return el(`
            <div class="rung is-${state}">
              <span class="rung-dot"></span>
              <span class="rung-name">${plan.name}</span>
              <span class="rung-price mono">${plan.price} ₽</span>
            </div>`);
        }),
      );
    };

    const renderAction = (): void => {
      if (rung >= PLANS.length - 1) {
        const cancel = el<HTMLButtonElement>(
          `<button class="btn btn-primary btn-block" type="button">Отменить подписку «Флюс Базовый»</button>`,
        );
        cancel.addEventListener("click", () => game.complete());
        actionSlot.replaceChildren(cancel);
        return;
      }
      const target = PLANS[rung + 1]!;
      const btn = el<HTMLButtonElement>(
        `<button class="btn btn-ghost btn-block" type="button">Понизить до «${target.name}»</button>`,
      );
      btn.disabled = busy;
      btn.addEventListener("click", () => openModal());
      actionSlot.replaceChildren(btn);
    };

    const applyStep = (): void => {
      busy = true;
      renderAction();
      toast("Применяем новый тариф…");
      timers.push(
        window.setTimeout(() => {
          busy = false;
          rung += 1;
          renderLadder();
          renderAction();
        }, 1300),
      );
    };

    const openModal = (): void => {
      if (busy) return;
      const leaving = PLANS[rung]!;
      const target = PLANS[rung + 1]!;
      const isWait = rung + 1 === WAIT_RUNG;

      const card = el(`
        <div class="modal">
          <div class="modal-card">
            <h3>Понизить тариф до «${target.name}»?</h3>
            <p>${
              isWait
                ? `Понижение применяется только со следующего расчётного периода — это ещё 27 дней на тарифе «${leaving.name}».`
                : `На тарифе «${target.name}» пропадёт: ${leaving.loss}.`
            }</p>
            <div class="modal-btns" data-btns></div>
          </div>
        </div>`);
      const btns = card.querySelector<HTMLElement>("[data-btns]")!;

      // Кнопка, которая ведёт к отмене, оформлена как второстепенная.
      const proceed = el<HTMLButtonElement>(
        `<button class="btn btn-quiet btn-block" type="button">${
          isWait ? "понизить сейчас, потерять день доступа" : "продолжить понижение тарифа"
        }</button>`,
      );
      proceed.addEventListener("click", () => {
        modalSlot.replaceChildren();
        if (isWait) game.penalize(5000);
        applyStep();
      });

      // Кнопка, которая всё оставляет как есть, выглядит как основное действие.
      const abort = el<HTMLButtonElement>(
        `<button class="btn btn-primary btn-block" type="button">${
          isWait ? `Сохранить «${leaving.name}» ещё на 27 дней` : `Оставить «${leaving.name}»`
        }</button>`,
      );
      abort.addEventListener("click", () => {
        modalSlot.replaceChildren();
        if (isWait) {
          game.fail("Вы нажали крупную кнопку и сохранили тариф. Отмена отложена, подписка активна.");
        }
      });

      // Порядок кнопок меняется при каждом открытии.
      const order = Math.random() < 0.5 ? [proceed, abort] : [abort, proceed];
      btns.append(...order);
      modalSlot.replaceChildren(card);
    };

    view.querySelector<HTMLElement>("[data-keep]")!.addEventListener("click", () => {
      game.fail("Вы вернулись на «Флюс Максимум+». Это лучший тариф — жаль было бы его терять.");
    });

    renderLadder();
    renderAction();
    root.appendChild(view);
    return () => timers.forEach((t) => window.clearTimeout(t));
  },
};
