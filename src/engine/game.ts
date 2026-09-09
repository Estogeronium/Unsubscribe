import type { GameApi, LevelCleanup } from "./types";
import { Hud } from "./hud";
import { el, mmss, plural } from "./dom";
import { levels } from "../levels";
import { TWISTS, type Twist } from "./twists";
import * as sfx from "./sound";

const DEFAULT_FAIL = "Спасибо, что согласились не отменять подписку. Повезёт в другой раз.";

export class Game implements GameApi {
  private index = 0;
  private clickCount = 0;
  private penaltyMs = 0;
  private startedAt = 0; // set when the player actually starts (see begin())
  private cleanup: LevelCleanup | undefined;
  private rafId = 0;
  private readonly twistDone = new Set<number>();

  constructor(
    private readonly stage: HTMLElement,
    private readonly hud: Hud,
  ) {}

  start(fromIndex = 0): void {
    // Dev deep-link (#7 etc.) drops straight into a level, skipping the intro.
    if (fromIndex >= 1 && fromIndex <= levels.length - 1) {
      this.index = fromIndex;
      this.begin();
      return;
    }
    this.mountIntro();
  }

  private mountIntro(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    this.hud.setVisible(false);
    this.stage.replaceChildren();

    const view = el(`
      <div class="screen intro">
        <div class="intro-brand"><span class="intro-glyph">и</span>Инопоиск&nbsp;Флюс</div>
        <h1>Отписаться</h1>
        <div class="intro-lede">
          <p>Вы платите за подписку «Флюс» 399&nbsp;₽ в месяц. Когда вы ей пользовались в последний раз — честно, не вспомнить.</p>
          <p>Сегодня вы её отменяете. Между вами и кнопкой отмены — только их интерфейс. Ничего сложного.</p>
        </div>
        <div class="intro-rules">
          <p>Время и клики считаются с момента старта.</p>
          <p>Согласитесь оставить подписку — начнёте сначала. Счётчик при этом не остановится.</p>
        </div>
        <button class="btn btn-primary btn-block" type="button" data-begin>Начать отмену</button>
        <p class="intro-note">Пародия. «Инопоиск Флюс» — вымышленный сервис, совпадения с реальными компаниями случайны.</p>
        <a class="colophon" href="https://vonzvyagin.ru">Женя Звягин · vonzvyagin.ru</a>
      </div>`);
    view.querySelector<HTMLElement>("[data-begin]")!.addEventListener("click", () => this.begin());
    this.stage.appendChild(view);
    window.scrollTo({ top: 0 });
  }

  /** The clock and click counter start here, not on page load. */
  private begin(): void {
    if (this.startedAt === 0) {
      this.startedAt = performance.now();
      document.addEventListener("click", this.countClick, true);
      this.tickLoop();
    }
    this.mountCurrent();
  }

  elapsed(): number {
    return performance.now() - this.startedAt + this.penaltyMs;
  }

  clicks(): number {
    return this.clickCount;
  }

  penalize(ms: number): void {
    this.penaltyMs += ms;
    this.hud.flashPenalty(ms);
  }

  complete = (): void => {
    if (this.index >= levels.length - 1) return;
    this.index += 1;
    sfx.blip();
    const twist = TWISTS.find((t) => t.before === this.index);
    if (twist && !this.twistDone.has(this.index)) {
      this.twistDone.add(this.index);
      this.runTwist(twist);
    } else {
      this.mountCurrent();
    }
  };

  private runTwist(twist: Twist): void {
    this.cleanup?.();
    this.cleanup = undefined;
    this.stage.replaceChildren();
    this.hud.setVisible(true);
    const cl = twist.render(this.stage, () => this.mountCurrent(), this);
    if (typeof cl === "function") this.cleanup = cl;
    window.scrollTo({ top: 0 });
  }

  fail = (message?: string): void => {
    sfx.fail();
    this.cleanup?.();
    this.cleanup = undefined;
    this.stage.replaceChildren();

    const clicks = this.clickCount;
    const overlay = el(`
      <div class="gameover" role="alertdialog" aria-modal="true">
        <div class="gameover-card">
          <div class="gameover-emoji">🙃</div>
          <h2>Спасибо, что согласились не отменять подписку</h2>
          <p>${message ?? DEFAULT_FAIL}</p>
          <p class="gameover-stat mono">
            на счётчике уже ${mmss(this.elapsed())} и ${clicks} ${plural(clicks, "клик", "клика", "кликов")}
          </p>
          <button class="btn btn-primary btn-block" type="button" data-restart>Начать заново</button>
        </div>
      </div>`);

    overlay.querySelector<HTMLElement>("[data-restart]")!.addEventListener("click", () => {
      overlay.remove();
      document.documentElement.removeAttribute("data-theme");
      this.index = 0;
      this.mountCurrent();
    });

    document.body.appendChild(overlay);
  };

  private countClick = (): void => {
    this.clickCount += 1;
    this.hud.setClicks(this.clickCount);
  };

  private tickLoop = (): void => {
    this.hud.tick(this.elapsed());
    this.rafId = requestAnimationFrame(this.tickLoop);
  };

  private mountCurrent(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    this.stage.replaceChildren();

    const level = levels[this.index]!;
    const isEnding = this.index === levels.length - 1;
    this.hud.setVisible(!isEnding);

    const maybeCleanup = level.mount(this.stage, this);
    if (typeof maybeCleanup === "function") this.cleanup = maybeCleanup;
    window.scrollTo({ top: 0 });
  }

  /** Not used yet, but keeps the loop honest if we ever tear the game down. */
  destroy(): void {
    cancelAnimationFrame(this.rafId);
    document.removeEventListener("click", this.countClick, true);
    this.cleanup?.();
  }
}
