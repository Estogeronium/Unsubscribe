import type { Level } from "../engine/types";
import { el, escapeHtml } from "../engine/dom";
import { blip } from "../engine/sound";

const SECRET = "ОТМЕНА";

export const level06: Level = {
  id: "chatbot",
  name: "Чат-бот удержания",
  mount(root, game) {
    let confirmations = 0;
    const timers: number[] = [];

    const view = el(`
      <div class="screen">
        <div class="chat-head">
          <span class="chat-ava">С</span>
          <div><b>Стеша</b><span class="chat-status">помощник «Флюса» · онлайн</span></div>
        </div>
        <div class="chat" id="log"></div>
        <form class="chat-input">
          <input class="input" id="msg" placeholder="Напишите сообщение…" autocomplete="off" />
          <button class="btn btn-primary" type="submit" aria-label="Отправить">→</button>
        </form>
      </div>`);

    const log = view.querySelector<HTMLElement>("#log")!;
    const input = view.querySelector<HTMLInputElement>("#msg")!;

    const scroll = (): void => {
      log.scrollTop = log.scrollHeight;
    };
    const addBubble = (who: "bot" | "me", html: string): void => {
      log.appendChild(el(`<div class="bubble ${who}">${html}</div>`));
      scroll();
    };
    const botSays = (html: string, delay = 1100): void => {
      const typing = el('<div class="typing"><i></i><i></i><i></i></div>');
      log.appendChild(typing);
      scroll();
      timers.push(
        window.setTimeout(() => {
          typing.remove();
          addBubble("bot", html);
          blip();
        }, delay),
      );
    };

    timers.push(
      window.setTimeout(
        () =>
          botSays(
            "Здравствуйте! Я Стеша. Жаль, что вы задумались об уходе — уверена, мы всё решим. Опишите, что случилось 💛",
          ),
        450,
      ),
    );

    view.querySelector<HTMLFormElement>("form")!.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addBubble("me", escapeHtml(text));
      input.value = "";

      const wantsCancel = text.toUpperCase().replace(/Ё/g, "Е") === SECRET;
      if (!wantsCancel) {
        botSays(
          "Кажется, это можно решить без отмены. Вот 3 статьи из нашей базы знаний, они обычно помогают 📚" +
            '<ul class="chat-kb">' +
            '<li><a href="https://www.consultant.ru/document/cons_doc_LAW_305/" target="_blank" rel="noopener noreferrer">Как отказаться от услуги в любое время</a> <span>— ЗоЗПП, ст. 32</span></li>' +
            '<li><a href="https://www.consultant.ru/document/cons_doc_LAW_9027/" target="_blank" rel="noopener noreferrer">Что делать, если сервис не отпускает</a> <span>— ГК РФ, ст. 782</span></li>' +
            '<li><a href="https://www.rospotrebnadzor.ru/" target="_blank" rel="noopener noreferrer">Пожаловаться на нас в Роспотребнадзор</a></li>' +
            "</ul>" +
            "Если всё же хотите отменить подписку — напишите слово «ОТМЕНА» заглавными буквами.",
        );
        return;
      }

      confirmations += 1;
      if (confirmations === 1) {
        botSays("Вы точно уверены? Напишите «ОТМЕНА» ещё раз, чтобы подтвердить.");
      } else if (confirmations === 2) {
        botSays("Последнее подтверждение: напишите «ОТМЕНА» в третий раз.");
      } else {
        botSays("Хорошо. Соединяю вас со специалистом отдела удержания…", 900);
        timers.push(window.setTimeout(() => game.complete(), 2400));
      }
    });

    root.appendChild(view);
    return () => timers.forEach((t) => window.clearTimeout(t));
  },
};
