/** Everything a level is allowed to do to the game around it. */
export interface GameApi {
  /** Finish this level and move to the next one. */
  complete(): void;
  /** Add a time penalty in milliseconds (shows a small blip in the HUD). */
  penalize(ms: number): void;
  /**
   * The player agreed to keep the subscription. Show the game-over modal and,
   * on "начать заново", restart from level 1. The timer and click counter keep
   * running — they are never reset.
   */
  fail(message?: string): void;
  /** Elapsed time in milliseconds, penalties included. */
  elapsed(): number;
  /** Total clicks anywhere on the page since the game started. */
  clicks(): number;
}

export type LevelCleanup = () => void;

export interface Level {
  /** Stable id, handy for debugging and deep links. */
  id: string;
  /** Short internal name. Not shown to the player unless the level chooses to. */
  name: string;
  /** Render into `root`. Return a cleanup function if the level sets timers/listeners. */
  mount(root: HTMLElement, game: GameApi): void | LevelCleanup;
}
