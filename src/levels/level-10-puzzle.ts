import type { Level } from "../engine/types";
import { el } from "../engine/dom";

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const SIZE = 3;

const neighbours = (i: number): number[] => {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  const out: number[] = [];
  if (r > 0) out.push(i - SIZE);
  if (r < SIZE - 1) out.push(i + SIZE);
  if (c > 0) out.push(i - 1);
  if (c < SIZE - 1) out.push(i + 1);
  return out;
};

// Scramble by walking the blank randomly, so the board is always solvable.
// Only a handful of moves — looks shuffled, solvable in ~20 seconds.
const scramble = (): number[] => {
  const board = [...SOLVED];
  let blank = 8;
  let prev = -1;
  const steps = 5 + Math.floor(Math.random() * 4); // 5–8
  for (let step = 0; step < steps; step += 1) {
    const options = neighbours(blank).filter((n) => n !== prev);
    const pick = options[Math.floor(Math.random() * options.length)]!;
    [board[blank], board[pick]] = [board[pick]!, board[blank]!];
    prev = blank;
    blank = pick;
  }
  return board;
};

export const level10: Level = {
  id: "puzzle",
  name: "Пятнашки",
  mount(root, game) {
    let board = scramble();
    while (board.every((v, i) => v === SOLVED[i])) board = scramble();

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Соберите картинку, чтобы подтвердить отмену</h1>
        <p class="muted-line">Расставьте плитки по порядку. Это обязательный шаг.</p>
        <div class="puzzle" data-grid></div>
        <button class="link-evil" type="button" data-skip>Пропустить головоломку</button>
      </div>`);

    const grid = view.querySelector<HTMLElement>("[data-grid]")!;

    const render = (): void => {
      grid.replaceChildren();
      board.forEach((value, i) => {
        if (value === 0) {
          grid.appendChild(el(`<div class="tile tile-empty"></div>`));
          return;
        }
        const tile = el<HTMLButtonElement>(`<button class="tile" type="button">${value}</button>`);
        tile.addEventListener("click", () => {
          const blank = board.indexOf(0);
          if (!neighbours(i).includes(blank)) return;
          [board[blank], board[i]] = [board[i]!, board[blank]!];
          if (board.every((v, k) => v === SOLVED[k])) {
            render();
            grid.classList.add("puzzle-done");
            window.setTimeout(() => game.complete(), 700);
          } else {
            render();
          }
        });
        grid.appendChild(tile);
      });
    };
    render();

    view.querySelector<HTMLElement>("[data-skip]")!.addEventListener("click", () => {
      game.fail("Пропуск головоломки засчитан как согласие остаться на «Флюсе».");
    });

    root.appendChild(view);
  },
};
