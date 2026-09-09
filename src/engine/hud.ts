import { mmss, plural } from "./dom";
import { isSoundOn, setSoundOn } from "./sound";

// The bar never tells the truth. Indexed by the real level index.
const FAKE_WIDTH = [8, 34, 82, 51, 93, 44, 88, 70, 60, 95, 40, 86, 72, 97, 55, 90, 66, 99, 78, 100];

export class Hud {
  private readonly el: HTMLElement;
  private readonly fill: HTMLElement;
  private readonly step: HTMLElement;
  private readonly time: HTMLElement;
  private readonly clicksEl: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;

  constructor(mount: HTMLElement) {
    mount.innerHTML = `
      <div class="hud">
        <div class="hud-in">
          <span class="hud-brand"><span class="hud-glyph">и</span>Инопоиск&nbsp;Флюс</span>
          <div class="hud-prog" role="progressbar" aria-label="Прогресс отмены">
            <div class="bar"><i></i></div>
            <span class="hud-step mono"></span>
          </div>
          <span class="hud-stats mono">
            <span class="hud-time">0:00</span>
            <span class="hud-dot">·</span>
            <span class="hud-clicks">0 кликов</span>
          </span>
          <button class="hud-sound" type="button" aria-label="Звук"></button>
        </div>
      </div>`;
    this.el = mount.querySelector<HTMLElement>(".hud")!;
    this.fill = mount.querySelector<HTMLElement>(".bar > i")!;
    this.step = mount.querySelector<HTMLElement>(".hud-step")!;
    this.time = mount.querySelector<HTMLElement>(".hud-time")!;
    this.clicksEl = mount.querySelector<HTMLElement>(".hud-clicks")!;
    this.soundBtn = mount.querySelector<HTMLButtonElement>(".hud-sound")!;

    this.renderSound();
    this.soundBtn.addEventListener("click", () => {
      setSoundOn(!isSoundOn());
      this.renderSound();
    });
  }

  private renderSound(): void {
    const on = isSoundOn();
    this.soundBtn.textContent = on ? "🔊" : "🔇";
    this.soundBtn.classList.toggle("is-off", !on);
    this.soundBtn.setAttribute("aria-pressed", String(on));
  }

  setStep(index: number, total: number): void {
    const w = FAKE_WIDTH[Math.min(index, FAKE_WIDTH.length - 1)]!;
    this.fill.style.width = `${w}%`;
    // Бар врёт всю игру, но «почти готово» словами — только на финишной прямой.
    const nearEnd = index >= total - 6;
    this.step.textContent = nearEnd && w >= 80 ? "почти готово" : `шаг ${index + 1} из ${total}`;
  }

  tick(ms: number): void {
    this.time.textContent = mmss(ms);
  }

  setClicks(n: number): void {
    this.clicksEl.textContent = `${n} ${plural(n, "клик", "клика", "кликов")}`;
  }

  flashPenalty(_ms: number): void {
    this.time.classList.remove("hud-pen");
    void this.time.offsetWidth; // restart the animation
    this.time.classList.add("hud-pen");
  }

  setVisible(visible: boolean): void {
    this.el.classList.toggle("hud-hidden", !visible);
  }
}
