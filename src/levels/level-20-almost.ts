import type { Level } from "../engine/types";
import { el } from "../engine/dom";

export const level20: Level = {
  id: "almost",
  name: "Готово… почти",
  mount(root, game) {
    const timers: number[] = [];
    const screen = el(`<div class="screen"></div>`);

    // 1. Фейковый успех
    const showSuccess = (): void => {
      screen.replaceChildren(
        el(`
          <div class="almost">
            <div class="almost-emoji">✅</div>
            <h1 class="screen-title">Подписка отменена</h1>
            <p class="muted-line">Изменения вступят в силу немедленно. Спасибо, что были с «Флюсом».</p>
            <button class="btn btn-primary btn-block" type="button" data-done>Готово</button>
            <button class="link-evil" type="button" data-back>Вернуться в приложение</button>
          </div>`),
      );
      screen.querySelector<HTMLElement>("[data-done]")!.addEventListener("click", showSaving);
      screen.querySelector<HTMLElement>("[data-back]")!.addEventListener("click", () => {
        game.fail("Вы вернулись в приложение, не завершив отмену. Подписка осталась активной.");
      });
      // если просто сидеть — «сохранение» запустится само
      timers.push(window.setTimeout(showSaving, 4000));
    };

    // 2. «Сохраняем» → ошибка
    let savingShown = false;
    const showSaving = (): void => {
      if (savingShown) return;
      savingShown = true;
      screen.replaceChildren(
        el(`
          <div class="almost">
            <div class="wait-spinner" aria-hidden="true"></div>
            <p class="wait-line">Сохраняем изменения…</p>
          </div>`),
      );
      timers.push(
        window.setTimeout(() => {
          screen.replaceChildren(
            el(`
              <div class="almost">
                <div class="almost-emoji">⚠️</div>
                <h1 class="screen-title">Не удалось завершить отмену</h1>
                <p class="muted-line">Соединение прервалось на последнем шаге, изменения откатились. Такое бывает — попробуйте ещё раз.</p>
                <button class="btn btn-primary btn-block" type="button" data-retry>Повторить отмену</button>
              </div>`),
          );
          screen.querySelector<HTMLElement>("[data-retry]")!.addEventListener("click", showFinal);
        }, 2100),
      );
    };

    // 3. Настоящий последний шаг — ловушка в галочке
    const showFinal = (): void => {
      screen.replaceChildren(
        el(`
          <div class="almost almost-final">
            <h1 class="screen-title">Последний шаг</h1>
            <p class="muted-line">На этот раз точно последний.</p>
            <label class="opt sel" data-keepwrap>
              <input type="checkbox" data-keep checked />
              <span>Сохранить резервную копию подписки на 90 дней (рекомендуется)</span>
            </label>
            <button class="btn btn-primary btn-block" type="button" data-confirm>Подтвердить отмену окончательно</button>
          </div>`),
      );
      const keep = screen.querySelector<HTMLInputElement>("[data-keep]")!;
      const keepWrap = screen.querySelector<HTMLElement>("[data-keepwrap]")!;
      keep.addEventListener("change", () => keepWrap.classList.toggle("sel", keep.checked));
      screen.querySelector<HTMLElement>("[data-confirm]")!.addEventListener("click", () => {
        if (keep.checked) {
          game.fail("Галочка «сохранить резервную копию подписки» осталась включённой. Копия — это активная подписка.");
          return;
        }
        game.complete();
      });
    };

    showSuccess();
    root.appendChild(screen);
    return () => timers.forEach((t) => window.clearTimeout(t));
  },
};
