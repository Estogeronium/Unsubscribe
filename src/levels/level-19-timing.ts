import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

const NEED = 3; // попаданий подряд не требуется — просто всего

export const level19: Level = {
  id: "timing",
  name: "Точность отмены",
  mount(root, game) {
    let pos = 0; // 0..1 положение бегунка
    let dir = 1;
    let speed = 0.9; // доля трека в секунду
    let zoneStart = 0.4;
    let zoneWidth = 0.26;
    let hits = 0;
    let done = false;
    let raf = 0;
    let prev = 0;

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Последняя проверка</h1>
        <p class="muted-line">Остановите бегунок в зелёной зоне. Нужно ${NEED} попадания.</p>
        <div class="tm">
          <div class="tm-track" data-track>
            <div class="tm-zone" data-zone></div>
            <div class="tm-marker" data-marker></div>
          </div>
          <p class="tm-status mono" data-status>0 / ${NEED}</p>
          <button class="btn btn-primary btn-block" type="button" data-stop>Стоп</button>
        </div>
        <button class="link-evil" type="button" data-give-up>Слишком быстро для меня — оставить подписку</button>
      </div>`);

    const zone = view.querySelector<HTMLElement>("[data-zone]")!;
    const marker = view.querySelector<HTMLElement>("[data-marker]")!;
    const status = view.querySelector<HTMLElement>("[data-status]")!;
    const stopBtn = view.querySelector<HTMLButtonElement>("[data-stop]")!;

    const placeZone = (): void => {
      zoneStart = Math.random() * (1 - zoneWidth);
      zone.style.left = `${zoneStart * 100}%`;
      zone.style.width = `${zoneWidth * 100}%`;
    };

    const frame = (now: number): void => {
      const dt = (now - prev) / 1000;
      prev = now;
      if (done) return;
      pos += dir * speed * dt;
      if (pos >= 1) {
        pos = 1;
        dir = -1;
      } else if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      marker.style.left = `${pos * 100}%`;
      raf = requestAnimationFrame(frame);
    };

    const attempt = (): void => {
      if (done) return;
      const inZone = pos >= zoneStart && pos <= zoneStart + zoneWidth;
      if (inZone) {
        hits += 1;
        status.textContent = `${hits} / ${NEED}`;
        if (hits >= NEED) {
          done = true;
          cancelAnimationFrame(raf);
          view.querySelector<HTMLElement>(".tm")!.classList.add("is-done");
          toast("Готово. Отмена подтверждена.");
          window.setTimeout(() => game.complete(), 700);
          return;
        }
        toast("Есть! Зона стала меньше.");
        zoneWidth = Math.max(0.1, zoneWidth - 0.05);
        speed += 0.22;
        placeZone();
      } else {
        toast("Мимо. Ещё раз.");
        zoneWidth = Math.min(0.32, zoneWidth + 0.03); // чуть проще, чтобы не застрять
        placeZone();
      }
    };

    stopBtn.addEventListener("click", attempt);
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        attempt();
      }
    };
    window.addEventListener("keydown", onKey);

    view.querySelector<HTMLElement>("[data-give-up]")!.addEventListener("click", () => {
      game.fail("Согласны, темп высокий. Оставляем подписку — с ней спокойнее.");
    });

    placeZone();
    prev = performance.now();
    raf = requestAnimationFrame(frame);
    root.appendChild(view);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  },
};
