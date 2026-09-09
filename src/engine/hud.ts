import { mmss, plural } from "./dom";
import { isSoundOn, setSoundOn } from "./sound";

export class Hud {
  private readonly el: HTMLElement;
  private readonly time: HTMLElement;
  private readonly clicksEl: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;

  constructor(mount: HTMLElement) {
    mount.innerHTML = `
      <div class="hud">
        <div class="hud-in">
          <span class="hud-brand"><span class="hud-glyph">и</span>Инопоиск&nbsp;Флюс</span>
          <span class="hud-stats mono">
            <span class="hud-time">0:00</span>
            <span class="hud-dot">·</span>
            <span class="hud-clicks">0 кликов</span>
          </span>
          <button class="hud-sound" type="button" aria-label="Звук"></button>
        </div>
      </div>`;
    this.el = mount.querySelector<HTMLElement>(".hud")!;
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
