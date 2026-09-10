# Статистика игры — сборщик на Cloudflare

Считает обезличенно: сколько сессий стартовало, до какого уровня дошли, где
провалились, за сколько прошли до конца. Ни ID, ни куки, ни IP — только счётчики.

- **Игра** шлёт события на `https://stats-api.vonzvyagin.ru/e` (см. `src/engine/analytics.ts`).
- **Worker** (`unsub-stats.js`) складывает их в базу **D1** и отдаёт агрегаты на `/stats.json`.
- **Страница** `unsubscribe.vonzvyagin.ru/stats` (файл `public/stats/index.html`) рисует дашборд из этого JSON.

Ссылок на `/stats` нигде нет + страница закрыта от поиска (`noindex` + `robots.txt`).

---

## Настройка (панель Cloudflare, ~15 минут, без терминала)

### 1. Создать базу D1

1. [dash.cloudflare.com](https://dash.cloudflare.com) → слева **Storage & Databases → D1 SQL Database** → **Create**.
2. Имя: `unsub_stats` → **Create**.
3. Открой созданную базу → вкладку **Console** → вставь целиком содержимое `schema.sql` → **Execute**.
   Должны создаться таблица `events` и два индекса.

### 2. Создать Worker

1. Слева **Compute (Workers) → Workers & Pages** → **Create** → **Start with Hello World** → **Create Worker**.
2. Имя: `unsub-stats` → **Deploy**.
3. **Edit code** → удали шаблон, вставь целиком содержимое `unsub-stats.js` → **Deploy**.

### 3. Привязать базу к Worker

1. В Worker → **Settings → Bindings → Add → D1 database**.
2. Variable name: `DB` (именно так) · D1 database: `unsub_stats` → **Deploy**.

### 4. Свой адрес для Worker

1. В Worker → **Settings → Domains & Routes → Add → Custom Domain**.
2. Ввести `stats-api.vonzvyagin.ru` → **Add domain**.
   Cloudflare сам создаст DNS-запись и сертификат (пара минут).

### 5. Проверить

- Открой `https://stats-api.vonzvyagin.ru/stats.json` — должен вернуться JSON
  (поначалу с нулями). Если он открылся — сборщик работает.
- Дальше игрок проходит игру → числа растут → видно на `unsubscribe.vonzvyagin.ru/stats`.

---

## Стоимость

Бесплатный тариф Cloudflare: 100 000 запросов Worker в день и 100 000 записей в D1
в день. Для этой игры — с гигантским запасом.

## Если кто-то начнёт накручивать счётчики

Worker → **Settings → добавить правило Rate Limiting** на `stats-api.vonzvyagin.ru/e`
(например 20 запросов в минуту с IP). Или включить Cloudflare Turnstile. Пока не нужно.

## Сбросить статистику

В базе D1 → **Console** → `DELETE FROM events;`
