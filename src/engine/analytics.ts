// Обезличенная телеметрия прохождения: сколько сессий стартовало, до какого
// уровня дошли, где провалились, за сколько закончили. Никаких ID, куки и IP —
// только счётчики. Собирает Cloudflare Worker (см. /worker), дублируется в GA4.

const ENDPOINT = "https://stats-api.vonzvyagin.ru/e";
const PROD = /(^|\.)vonzvyagin\.ru$/i.test(location.hostname);
const SESSION_KEY = "ipp-stat-sent";

// Что уже отправляли в этой сессии — чтобы рестарты не раздували воронку.
const sent = new Set<string>();
try {
  for (const k of JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]") as string[]) {
    sent.add(k);
  }
} catch {
  /* приватный режим / хранилище недоступно — просто не дедупим между перезагрузками */
}

function remember(key: string): void {
  sent.add(key);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...sent]));
  } catch {
    /* не критично */
  }
}

type GameEvent = "start" | "level" | "fail" | "complete";

/**
 * @param a  для "level"/"fail" — номер уровня; для "complete" — секунды
 * @param b  для "complete" — число кликов
 */
export function track(event: GameEvent, a?: number, b?: number): void {
  // "start" и "level:N" — один раз за сессию. "fail"/"complete" — как есть.
  const dedupKey = event === "start" ? "start" : event === "level" ? `L${a}` : null;
  if (dedupKey) {
    if (sent.has(dedupKey)) return;
    remember(dedupKey);
  }

  try {
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("event", `game_${event}`, {
      level: a,
      clicks: b,
    });
  } catch {
    /* GA заблокирована расширением — ну и ладно */
  }

  if (!PROD) return;
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      // text/plain — «простой» запрос, без CORS-preflight
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ e: event, a: a ?? null, b: b ?? null }),
      keepalive: true,
      mode: "cors",
      credentials: "omit",
    }).catch(() => {});
  } catch {
    /* оффлайн — счётчик не приоритет */
  }
}
