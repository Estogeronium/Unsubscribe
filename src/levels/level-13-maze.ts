import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

// Одна извилистая дорожка без развилок: S сверху слева, E снизу слева.
const MAZE = [
  "S........",
  "########.",
  ".........",
  ".########",
  ".........",
  "########.",
  "E........",
];

type Role = "start" | "end" | "path" | "wall";

const roleOf = (ch: string): Role =>
  ch === "S" ? "start" : ch === "E" ? "end" : ch === "#" ? "wall" : "path";

export const level13: Level = {
  id: "maze",
  name: "Лабиринт",
  mount(root, game) {
    const rows = MAZE.length;
    const cols = MAZE[0]!.length;

    let tracing = false;
    let won = false;
    let last: { r: number; c: number } | null = null;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Проведите линию к выходу</h1>
        <p class="muted-line">Зажмите синюю клетку и, не отпуская, доведите курсор до зелёной. Заденете стену — придётся начать сначала.</p>
        <div class="maze" data-maze style="grid-template-columns: repeat(${cols}, 1fr)"></div>
        <button class="link-evil" type="button" data-give-up>Не получается мышкой — оставить подписку</button>
      </div>`);

    const maze = view.querySelector<HTMLElement>("[data-maze]")!;
    const cells: HTMLElement[] = [];
    MAZE.forEach((rowStr) => {
      for (const ch of rowStr) {
        const cell = el<HTMLElement>(`<div class="mcell" data-role="${roleOf(ch)}"></div>`);
        cells.push(cell);
        maze.appendChild(cell);
      }
    });

    const cellAt = (r: number, c: number): HTMLElement | undefined => cells[r * cols + c];
    const roleAt = (r: number, c: number): Role | "oob" => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return "oob";
      return roleOf(MAZE[r]![c]!);
    };

    const rcFromEvent = (e: PointerEvent): { r: number; c: number } => {
      const rect = maze.getBoundingClientRect();
      return {
        r: Math.floor(((e.clientY - rect.top) / rect.height) * rows),
        c: Math.floor(((e.clientX - rect.left) / rect.width) * cols),
      };
    };

    const stop = (message?: string): void => {
      if (won) return;
      tracing = false;
      last = null;
      maze.classList.remove("tracing");
      cells.forEach((cell) => cell.classList.remove("lit"));
      if (message) toast(message);
    };

    const enter = (r: number, c: number): void => {
      const role = roleAt(r, c);
      if (role === "oob" || role === "wall") {
        stop("Линия задела стену. Начните заново от синей клетки.");
        return;
      }
      cellAt(r, c)?.classList.add("lit");
      last = { r, c };
      if (role === "end") {
        won = true;
        tracing = false;
        maze.classList.add("maze-done");
        window.setTimeout(() => game.complete(), 450);
      }
    };

    maze.addEventListener("pointerdown", (e) => {
      const { r, c } = rcFromEvent(e);
      if (roleAt(r, c) !== "start") return;
      e.preventDefault();
      tracing = true;
      won = false;
      last = { r, c };
      maze.classList.add("tracing");
      cellAt(r, c)?.classList.add("lit");
      try {
        maze.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic pointer */
      }
    });

    maze.addEventListener("pointermove", (e) => {
      if (!tracing || won || !last) return;
      const { r, c } = rcFromEvent(e);
      // Шагаем по клеткам от прошлой позиции к текущей, чтобы быстрый рывок
      // мышью не «перепрыгнул» через стену.
      let cr = last.r;
      let cc = last.c;
      let guard = 0;
      while ((cr !== r || cc !== c) && guard < 128) {
        guard += 1;
        if (Math.abs(r - cr) >= Math.abs(c - cc)) cr += Math.sign(r - cr);
        else cc += Math.sign(c - cc);
        enter(cr, cc);
        if (!tracing || won) return;
      }
    });

    maze.addEventListener("pointerup", () => stop());
    maze.addEventListener("pointercancel", () => stop());

    view.querySelector<HTMLElement>("[data-give-up]")!.addEventListener("click", () => {
      game.fail("Спасибо, что признали лабиринт непроходимым. Подписка остаётся с вами.");
    });

    root.appendChild(view);
  },
};
