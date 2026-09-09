import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

const randomCode = (): string =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");

export const level09: Level = {
  id: "smscode",
  name: "Код из SMS",
  mount(root, game) {
    let attempt = 0;
    let code = randomCode();
    let cooldown = 0;
    let cooldownTimer = 0;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Подтвердите отмену кодом</h1>
        <div class="card sms">
          <p>Мы отправили код на номер <b>+7 ··· ··· ·· 87</b>.</p>
          <div class="sms-code" data-codeimg aria-hidden="true"></div>
          <input class="input sms-input" data-input inputmode="numeric" maxlength="4" placeholder="4 цифры" />
          <label class="opt sel sms-keep">
            <input type="checkbox" data-keep checked />
            <span>Сохранить подписку, если с кодом возникнут проблемы</span>
          </label>
          <button class="btn btn-primary btn-block" type="button" data-confirm>Подтвердить</button>
          <button class="link-evil" type="button" data-resend>Отправить код повторно</button>
        </div>
      </div>`);

    const codeImg = view.querySelector<HTMLElement>("[data-codeimg]")!;
    const input = view.querySelector<HTMLInputElement>("[data-input]")!;
    const keep = view.querySelector<HTMLInputElement>("[data-keep]")!;
    const keepWrap = view.querySelector<HTMLElement>(".sms-keep")!;
    const resend = view.querySelector<HTMLButtonElement>("[data-resend]")!;

    const drawCode = (): void => {
      codeImg.replaceChildren();
      for (const ch of code) {
        const skew = (Math.random() * 40 - 20).toFixed(0);
        const dy = (Math.random() * 8 - 4).toFixed(0);
        codeImg.appendChild(
          el(`<span style="transform:rotate(${skew}deg) translateY(${dy}px)">${ch}</span>`),
        );
      }
    };
    drawCode();

    keep.addEventListener("change", () => keepWrap.classList.toggle("sel", keep.checked));

    view.querySelector<HTMLElement>("[data-confirm]")!.addEventListener("click", () => {
      if (input.value.trim().length !== 4) {
        toast("Введите 4 цифры кода.");
        return;
      }
      if (keep.checked) {
        game.fail("Галочка «сохранить подписку при проблемах» была установлена. Считаем, что проблемы возникли.");
        return;
      }
      attempt += 1;
      if (attempt === 1) {
        toast("Неверный код. Мы отправили новый.");
        code = randomCode();
        drawCode();
        input.value = "";
        return;
      }
      game.complete();
    });

    resend.addEventListener("click", () => {
      if (cooldown > 0) return;
      cooldown = 15;
      code = randomCode();
      drawCode();
      toast("Новый код отправлен.");
      cooldownTimer = window.setInterval(() => {
        cooldown -= 1;
        resend.textContent = cooldown > 0 ? `Повторно можно через ${cooldown} с` : "Отправить код повторно";
        if (cooldown <= 0) window.clearInterval(cooldownTimer);
      }, 1000);
    });

    root.appendChild(view);
    return () => window.clearInterval(cooldownTimer);
  },
};
