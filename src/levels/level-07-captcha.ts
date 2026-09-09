import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

type IconKey = "traffic" | "bus" | "hydrant" | "bike" | "cross" | "car" | "tree";

const ICONS: Record<IconKey, string> = {
  traffic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="7.5" y="2.5" width="9" height="17" rx="3"/><circle cx="12" cy="7" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="17" r="1.7"/><path d="M12 19.5V22"/></svg>`,
  bus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M3 11h18"/><path d="M6.5 20v-2m11 2v-2"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>`,
  hydrant: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8.5 21h7"/><path d="M10 21v-3.5h4V21"/><rect x="8" y="7.5" width="8" height="10" rx="4"/><path d="M8 11H5.5M16 11h2.5M12 7.5V5"/><circle cx="12" cy="3.8" r="1.3" fill="currentColor" stroke="none"/></svg>`,
  bike: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="6" cy="15.5" r="4"/><circle cx="18" cy="15.5" r="4"/><path d="M6 15.5l4.5-7H16m-6 0l1.5 7M15.5 8.5L14.5 6h-2"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3.5" y="3" width="3" height="18" rx="1"/><rect x="10.5" y="3" width="3" height="18" rx="1"/><rect x="17.5" y="3" width="3" height="18" rx="1"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 13.5l1.8-4.5A2 2 0 0 1 8.2 7.7h7.6a2 2 0 0 1 1.9 1.3l1.8 4.5"/><rect x="3" y="13.5" width="18" height="5" rx="1.6"/><circle cx="7.5" cy="18.5" r="1.4"/><circle cx="16.5" cy="18.5" r="1.4"/></svg>`,
  tree: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l5 7h-3l3.5 5H4L7.5 10h-3z"/><path d="M12 15v6"/></svg>`,
};

interface Round {
  /** noun in the nominative, shown after "…на которых есть" */
  word: string;
  key: IconKey;
}

const ROUNDS: Round[] = [
  { word: "светофор", key: "traffic" },
  { word: "автобус", key: "bus" },
  { word: "пожарный гидрант", key: "hydrant" },
  { word: "велосипед", key: "bike" },
  { word: "пешеходный переход", key: "cross" },
];

const DISTRACTORS: IconKey[] = ["car", "tree", "bus", "traffic", "hydrant", "bike", "cross"];

const shuffle = (arr: IconKey[]): IconKey[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

export const level07: Level = {
  id: "captcha",
  name: "Капча «вы не робот»",
  mount(root, game) {
    let roundIdx = 0;
    let solved = 0;
    let tries = 0;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Подтвердите, что вы не робот</h1>
        <div class="card captcha">
          <div class="captcha-head">
            <span>Выберите все изображения, на которых есть</span>
            <b data-what>светофор</b>
          </div>
          <div class="captcha-grid" data-grid></div>
          <div class="captcha-foot">
            <button class="link-evil" type="button" data-callme>Не получается — позвоните мне для проверки</button>
            <button class="btn btn-primary btn-block" type="button" data-verify>Подтвердить</button>
          </div>
        </div>
      </div>`);

    const grid = view.querySelector<HTMLElement>("[data-grid]")!;
    const what = view.querySelector<HTMLElement>("[data-what]")!;
    let cells: { key: IconKey; on: boolean }[] = [];

    const buildRound = (): void => {
      const round = ROUNDS[roundIdx % ROUNDS.length]!;
      what.textContent = round.word;

      const count = 3 + Math.floor(Math.random() * 2); // 3–4 correct tiles
      const keys: IconKey[] = Array.from({ length: count }, () => round.key);
      const pool = shuffle(DISTRACTORS.filter((k) => k !== round.key));
      while (keys.length < 9) keys.push(pool[keys.length % pool.length]!);
      cells = shuffle(keys).map((key) => ({ key, on: false }));

      grid.replaceChildren();
      cells.forEach((cell) => {
        const tile = el<HTMLButtonElement>(
          `<button class="captcha-tile" type="button" aria-pressed="false">${ICONS[cell.key]}</button>`,
        );
        tile.addEventListener("click", () => {
          cell.on = !cell.on;
          tile.classList.toggle("on", cell.on);
          tile.setAttribute("aria-pressed", String(cell.on));
        });
        grid.appendChild(tile);
      });
    };
    buildRound();

    view.querySelector<HTMLElement>("[data-callme]")!.addEventListener("click", () => {
      game.fail(
        "Спасибо, что согласились на проверку по телефону. Оператор перезвонит в течение 30 дней, подписка пока сохранена.",
      );
    });

    view.querySelector<HTMLElement>("[data-verify]")!.addEventListener("click", () => {
      tries += 1;
      const round = ROUNDS[roundIdx % ROUNDS.length]!;
      const correct =
        cells.every((c) => (c.key === round.key) === c.on) && cells.some((c) => c.on);

      if (tries >= 5) {
        game.complete();
        return;
      }
      if (correct) {
        solved += 1;
        if (solved >= 2) {
          game.complete();
          return;
        }
        toast("Почти. Пройдите ещё одну проверку.");
      } else {
        toast("Мы не уверены, что вы человек. Попробуйте ещё раз.");
      }
      roundIdx += 1;
      buildRound();
    });

    root.appendChild(view);
  },
};
