import type { Level } from "../engine/types";
import { confetti, el, mmss, plural, toast } from "../engine/dom";
import { blip, wheelSpin, win } from "../engine/sound";
import { track } from "../engine/analytics";

const SITE_URL = "https://unsubscribe.vonzvyagin.ru";

interface Segment {
  label: string;
  color: string;
  jackpot?: boolean;
}

// index 0 sits at the top (under the pin) before any rotation.
// `label` is kept short so it fits inside the wedge (wrapped to at most two lines).
const SEGMENTS: Segment[] = [
  { label: "3 месяца бесплатно", color: "#E8B54A", jackpot: true },
  { label: "Стикерпак", color: "#5B5BD6" },
  { label: "−3% у партнёра", color: "#6E6EE0" },
  { label: "Обои на телефон", color: "#5B5BD6" },
  { label: "Промокод", color: "#6E6EE0" },
  { label: "1 ГБ в облаке", color: "#5B5BD6" },
  { label: "Ничего", color: "#6E6EE0" },
  { label: "Ещё оборот", color: "#5B5BD6" },
];

// The wheel is rigged: it stops one notch past the jackpot, on the sticker pack.
const RIGGED_INDEX = 1;

// Split a label into at most two lines so it stays within the wedge.
function wrapLabel(label: string): string[] {
  const words = label.split(" ");
  if (label.length <= 10 || words.length === 1) return [label];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function wheelSvg(): string {
  const n = SEGMENTS.length;
  const seg = 360 / n;
  const cx = 140;
  const cy = 140;
  const r = 132;
  let paths = "";
  let labels = "";

  SEGMENTS.forEach((s, i) => {
    const a0 = ((i - 0.5) * seg - 90) * (Math.PI / 180);
    const a1 = ((i + 0.5) * seg - 90) * (Math.PI / 180);
    const x0 = (cx + r * Math.cos(a0)).toFixed(1);
    const y0 = (cy + r * Math.sin(a0)).toFixed(1);
    const x1 = (cx + r * Math.cos(a1)).toFixed(1);
    const y1 = (cy + r * Math.sin(a1)).toFixed(1);
    paths += `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${s.color}" stroke="rgba(255,255,255,.35)" stroke-width="1"/>`;

    const am = (i * seg - 90) * (Math.PI / 180);
    const tx = (cx + r * 0.64 * Math.cos(am)).toFixed(1);
    const ty = (cy + r * 0.64 * Math.sin(am)).toFixed(1);
    const rot = (i * seg).toFixed(1);
    const lines = wrapLabel(s.label);
    const tspans = lines
      .map((line, k) => {
        const dy = lines.length === 1 ? 0 : k === 0 ? -4.2 : 8.4;
        return `<tspan x="${tx}" dy="${dy}">${line}</tspan>`;
      })
      .join("");
    labels += `<text x="${tx}" y="${ty}" transform="rotate(${rot} ${tx} ${ty})" text-anchor="middle" dominant-baseline="middle" class="wheel-label ${s.jackpot ? "is-jackpot" : ""}">${tspans}</text>`;
  });

  return `
    <svg viewBox="0 0 280 280" class="wheel-svg" aria-hidden="true">
      ${paths}
      ${labels}
      <circle cx="${cx}" cy="${cy}" r="22" fill="var(--surface)" stroke="var(--line-strong)" />
    </svg>`;
}

export const ending: Level = {
  id: "fortune",
  name: "Финал",
  mount(root, game) {
    const elapsedMs = game.elapsed();
    const time = mmss(elapsedMs);
    const clicks = game.clicks();
    const timers: number[] = [];

    track("complete", Math.round(elapsedMs / 1000), clicks);

    const view = el(`
      <div class="screen end">
        <div class="end-hero">
          <div class="end-emoji">🎉</div>
          <h1>Вы отписались!</h1>
          <p class="end-sub">
            Подписка «Флюс» отменена. На это ушло <b>${time}</b> и
            <b>${clicks} ${plural(clicks, "клик", "клика", "кликов")}</b>. Красавчик.
          </p>
        </div>

        <div class="card gift">
          <p class="gift-kicker">🎁 Подарок от партнёров</p>
          <h3>Вам доступен один бесплатный оборот колеса!</h3>
          <div class="wheel-box">
            <div class="wheel-pin"></div>
            <div class="wheel" id="wheel">${wheelSvg()}</div>
          </div>
          <button class="btn btn-primary btn-block" id="spin" type="button">Крутить колесо</button>
          <div class="prize" id="prize" hidden></div>
        </div>

        <button class="btn btn-primary btn-block" id="share" type="button">Поделиться результатом</button>
        <button class="link-quiet" id="again" type="button">Сыграть заново</button>
        <a class="colophon" href="https://vonzvyagin.ru">Женя Звягин · vonzvyagin.ru</a>
      </div>`);

    const shareText = `Отменил подписку на «Флюс» за ${time} и ${clicks} ${plural(clicks, "клик", "клика", "кликов")}. Попробуй быстрее:`;

    view.querySelector<HTMLButtonElement>("#share")!.addEventListener("click", () => {
      if (navigator.share) {
        navigator.share({ title: "Отписаться", text: shareText, url: SITE_URL }).catch(() => {
          /* пользователь закрыл окно шеринга — ничего не делаем */
        });
        return;
      }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(`${shareText} ${SITE_URL}`).then(
          () => toast("Результат скопирован — вставьте, куда хотите поделиться"),
          () => toast("Не получилось скопировать"),
        );
        return;
      }
      toast("Поделитесь ссылкой вручную: unsubscribe.vonzvyagin.ru");
    });

    const wheel = view.querySelector<HTMLElement>("#wheel")!;
    const spin = view.querySelector<HTMLButtonElement>("#spin")!;
    const prize = view.querySelector<HTMLElement>("#prize")!;
    const gift = view.querySelector<HTMLElement>(".gift")!;
    let spun = false;

    spin.addEventListener("click", () => {
      if (spun) return;
      spun = true;
      spin.disabled = true;
      spin.textContent = "Крутится…";
      wheelSpin();

      const seg = 360 / SEGMENTS.length;
      const jitter = (Math.random() - 0.5) * seg * 0.6;
      const rotation = 360 * 6 - RIGGED_INDEX * seg + jitter;
      wheel.style.transform = `rotate(${rotation}deg)`;

      timers.push(
        window.setTimeout(() => {
          confetti();
          blip();
          prize.hidden = false;
          prize.innerHTML = `
            <div class="prize-row">
              <span class="prize-emoji">🎟️</span>
              <div>
                <b>Ваш приз: стикерпак «Флюс»</b>
                <span>Промокод отправлен на почту, которую вы указывали 8 лет назад.</span>
              </div>
            </div>
            <button class="btn btn-primary btn-block" id="claim" type="button">Забрать подарок</button>`;

          prize.querySelector<HTMLElement>("#claim")!.addEventListener("click", () => {
            gift.replaceChildren(
              el(`
              <div class="thanks">
                <span class="thanks-emoji">✅</span>
                <h3>Готово</h3>
                <p>Спасибо, что были с «Флюсом». Возвращайтесь, когда снова забудете отключить автоплатёж.</p>
              </div>`),
            );
          });
        }, 4200),
      );
    });

    view.querySelector<HTMLElement>("#again")!.addEventListener("click", () => location.reload());

    root.appendChild(view);
    win();
    return () => timers.forEach((t) => window.clearTimeout(t));
  },
};
