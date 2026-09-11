/**
 * Cloudflare Worker: сбор обезличенной статистики игры «Отписаться».
 *
 * Binding: DB — база D1 «unsub_stats» (схема в schema.sql).
 * Маршруты:
 *   POST /e            — принять событие {e, a, b} от игры
 *   GET  /stats.json   — агрегаты для страницы unsubscribe.vonzvyagin.ru/stats
 *
 * Никаких ID, куки, IP или user-agent не сохраняется — только счётчики событий.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const EVENTS = new Set(["start", "level", "fail", "complete"]);

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (err) {
      // Понятная причина вместо голого «error code 1101».
      const hint =
        !env || !env.DB
          ? "нет binding'а D1 с именем DB (Worker → Settings → Bindings)"
          : "проверь, что в базе выполнен schema.sql (таблица events)";
      return json({ ok: false, error: String((err && err.message) || err), hint }, 500);
    }
  },
};

async function route(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (url.pathname === "/e" && request.method === "POST") {
    let d;
    try {
      d = JSON.parse(await request.text());
    } catch {
      return json({ ok: false }, 400);
    }
    const e = String(d?.e ?? "");
    if (!EVENTS.has(e)) return json({ ok: false }, 400);

    const a = clampInt(d?.a, 0, 100000);
    const b = clampInt(d?.b, 0, 1000000);

    try {
      await env.DB.prepare("INSERT INTO events (event, a, b, ts) VALUES (?, ?, ?, ?)")
        .bind(e, a, b, Date.now())
        .run();
    } catch {
      /* глотаем — счётчик не должен ронять игру */
    }
    return json({ ok: true });
  }

  if (url.pathname === "/stats.json" && request.method === "GET") {
    const [byLevel, totals, comp, durations, firstTs] = await Promise.all([
      env.DB.prepare(
        "SELECT event, a AS level, COUNT(*) AS n FROM events WHERE event IN ('level','fail') GROUP BY event, a",
      ).all(),
      env.DB.prepare("SELECT event, COUNT(*) AS n FROM events GROUP BY event").all(),
      env.DB.prepare(
        "SELECT COUNT(*) AS n, AVG(a) AS avg_sec, MIN(a) AS min_sec, MAX(a) AS max_sec, AVG(b) AS avg_clicks FROM events WHERE event='complete' AND a IS NOT NULL",
      ).first(),
      env.DB.prepare(
        "SELECT a FROM events WHERE event='complete' AND a IS NOT NULL ORDER BY a",
      ).all(),
      env.DB.prepare("SELECT MIN(ts) AS t FROM events").first(),
    ]);

    const rows = byLevel.results ?? [];
    const secs = (durations.results ?? []).map((r) => r.a);

    const body = JSON.stringify({
      updated: Date.now(),
      since: firstTs?.t ?? null,
      totals: Object.fromEntries((totals.results ?? []).map((r) => [r.event, r.n])),
      levelReached: Object.fromEntries(
        rows.filter((r) => r.event === "level").map((r) => [r.level, r.n]),
      ),
      fails: Object.fromEntries(
        rows.filter((r) => r.event === "fail").map((r) => [r.level, r.n]),
      ),
      completion: {
        n: comp?.n ?? 0,
        avgSec: comp?.avg_sec != null ? Math.round(comp.avg_sec) : null,
        medianSec: secs.length ? secs[Math.floor(secs.length / 2)] : null,
        minSec: comp?.min_sec ?? null,
        maxSec: comp?.max_sec ?? null,
        avgClicks: comp?.avg_clicks != null ? Math.round(comp.avg_clicks) : null,
      },
    });

    return new Response(body, {
      headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    });
  }

  return new Response("unsub-stats\n", { headers: CORS });
}

function clampInt(v, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
