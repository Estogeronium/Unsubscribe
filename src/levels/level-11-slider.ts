import type { Level } from "../engine/types";
import { el } from "../engine/dom";

export const level11: Level = {
  id: "slider",
  name: "Ползунок подтверждения",
  mount(root, game) {
    let confirmed = false;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Финальное подтверждение</h1>
        <div class="card slider-card">
          <p>Доведите ползунок до конца и удерживайте — так вы подтвердите отмену подписки.</p>
          <input class="confirm-slider" type="range" min="0" max="100" value="0" step="1"
                 aria-label="Подтверждение отмены" />
          <p class="slider-hint mono" data-hint>0% — потяните вправо</p>
          <button class="link-evil" type="button" data-give-up>Мне неудобно пользоваться ползунком — оставить подписку</button>
        </div>
      </div>`);

    const slider = view.querySelector<HTMLInputElement>(".confirm-slider")!;
    const hint = view.querySelector<HTMLElement>("[data-hint]")!;

    slider.addEventListener("input", () => {
      if (confirmed) return;
      let v = Number(slider.value);
      // The last stretch fights back — only a decisive drag straight to 100 wins.
      if (v >= 90 && v < 100) {
        v = 78;
        slider.value = String(v);
        hint.textContent = "почти — но ползунок соскользнул назад";
        return;
      }
      hint.textContent = v === 100 ? "готово" : `${v}% — тяните дальше`;
      if (v === 100) {
        confirmed = true;
        slider.disabled = true;
        hint.textContent = "Подтверждение принято…";
        window.setTimeout(() => game.complete(), 900);
      }
    });

    slider.addEventListener("change", () => {
      if (!confirmed && Number(slider.value) < 100) {
        slider.value = "0";
        hint.textContent = "0% — потяните вправо";
      }
    });

    view.querySelector<HTMLElement>("[data-give-up]")!.addEventListener("click", () => {
      game.fail("Спасибо, что признали ползунок неудобным. Подписка остаётся с вами.");
    });

    root.appendChild(view);
  },
};
