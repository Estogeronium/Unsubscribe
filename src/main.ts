import "./styles/tokens.css";
import "./styles/app.css";
import { Hud } from "./engine/hud";
import { Game } from "./engine/game";
import { attachClickSound } from "./engine/sound";

attachClickSound();

const app = document.getElementById("app")!;
app.innerHTML = `
  <div id="hud"></div>
  <main id="stage" class="stage"></main>
`;

const hud = new Hud(document.getElementById("hud")!);
const game = new Game(document.getElementById("stage")!, hud);

// dev: open "#7" to start on level 7 (1-based). Ignored without a numeric hash.
const startAt = Number.parseInt(location.hash.slice(1), 10);
game.start(Number.isNaN(startAt) ? 0 : startAt - 1);
