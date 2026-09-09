import type { Level } from "../engine/types";
import { el, toast } from "../engine/dom";

interface Service {
  name: string;
  price: number;
  stat: string;
  cloud?: boolean;
}

const SERVICES: Service[] = [
  { name: "Флюс Кино", price: 199, stat: "47 просмотренных фильмов" },
  { name: "Флюс Музыка", price: 149, stat: "1 240 треков в избранном" },
  { name: "Флюс Доставка", price: 99, stat: "84 бесплатные доставки" },
  { name: "Флюс Облако", price: 79, stat: "11 ГБ ваших файлов", cloud: true },
];

export const level14: Level = {
  id: "unbundle",
  name: "Отключение услуг",
  mount(root, game) {
    const off = new Set<number>();
    let busy = false;
    const timers: number[] = [];

    const view = el(`
      <div class="screen">
        <h1 class="screen-title">Услуги подписки</h1>
        <p class="muted-line">«Флюс» — это 4 услуги в одной подписке. Чтобы отменить, отключите каждую по отдельности.</p>
        <div class="svc-list" data-list></div>
        <div data-final></div>
        <button class="link-evil" type="button" data-keep>Мне нужны эти услуги — оставить подписку</button>
      </div>`);

    const list = view.querySelector<HTMLElement>("[data-list]")!;
    const finalSlot = view.querySelector<HTMLElement>("[data-final]")!;

    const renderFinal = (): void => {
      if (off.size < SERVICES.length) {
        finalSlot.replaceChildren();
        return;
      }
      const done = el<HTMLButtonElement>(
        `<button class="btn btn-primary btn-block" type="button">Все услуги отключены — отменить подписку</button>`,
      );
      done.addEventListener("click", () => game.complete());
      finalSlot.replaceChildren(done);
    };

    const render = (): void => {
      list.replaceChildren(
        ...SERVICES.map((svc, i) => {
          const isOff = off.has(i);
          const row = el(`
            <div class="svc-row ${isOff ? "is-off" : ""}">
              <div class="svc-info">
                <b>${svc.name}</b>
                <span>${isOff ? "услуга отключена" : `${svc.price} ₽ / мес · ${svc.stat}`}</span>
              </div>
              <div class="svc-ctl" data-ctl></div>
            </div>`);
          const ctl = row.querySelector<HTMLElement>("[data-ctl]")!;
          if (isOff) {
            ctl.innerHTML = `<span class="svc-check">✓</span>`;
          } else {
            const btn = el<HTMLButtonElement>(`<button class="btn btn-ghost svc-btn" type="button">Выключить</button>`);
            btn.disabled = busy;
            btn.addEventListener("click", () => {
              if (svc.cloud) askCloud(i, row);
              else disable(i);
            });
            ctl.appendChild(btn);
          }
          return row;
        }),
      );
      renderFinal();
    };

    const disable = (i: number): void => {
      if (busy) return;
      busy = true;
      off.add(i);
      render();
      toast("Применяем изменения…");
      timers.push(
        window.setTimeout(() => {
          busy = false;
          render();
        }, 1200),
      );
    };

    const askCloud = (i: number, row: HTMLElement): void => {
      if (busy) return;
      let downloading = false;
      row.classList.add("is-cloud");
      row.querySelector<HTMLElement>("[data-ctl]")!.replaceChildren();
      const box = el(`
        <div class="svc-cloud">
          <p>В «Облаке» 11 ГБ фото и документов. После отключения они удаляются через 30 дней.</p>
          <div class="svc-cloud-btns" data-btns></div>
        </div>`);
      const btns = box.querySelector<HTMLElement>("[data-btns]")!;
      const dl = el<HTMLButtonElement>(`<button class="btn btn-ghost" type="button">Скачать архив</button>`);
      const skip = el<HTMLButtonElement>(`<button class="btn btn-primary" type="button">Отключить без скачивания</button>`);

      dl.addEventListener("click", () => {
        if (downloading) return;
        downloading = true;
        btns.replaceChildren(el(`<div class="svc-bar"><i></i></div>`));
        const bar = btns.querySelector<HTMLElement>("i")!;
        let p = 0;
        const t = window.setInterval(() => {
          p += 6 + Math.random() * 8;
          if (p >= 87) {
            window.clearInterval(t);
            bar.style.width = "87%";
            toast("Не удалось скачать архив. Попробуйте позже.");
            timers.push(
              window.setTimeout(() => {
                downloading = false;
                btns.replaceChildren(dl, skip);
              }, 1000),
            );
          } else {
            bar.style.width = `${p}%`;
          }
        }, 240);
        timers.push(t);
      });
      skip.addEventListener("click", () => disable(i));

      btns.append(dl, skip);
      row.appendChild(box);
    };

    view.querySelector<HTMLElement>("[data-keep]")!.addEventListener("click", () => {
      game.fail("Вы оставили услуги, а вместе с ними и подписку. Пакет «4 в 1» и правда выгоднее по отдельности.");
    });

    render();
    root.appendChild(view);
    return () => timers.forEach((t) => window.clearTimeout(t));
  },
};
