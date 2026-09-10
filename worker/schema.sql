-- База D1 «unsub_stats». Один раз выполнить в консоли D1 после создания базы.

CREATE TABLE IF NOT EXISTS events (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  event  TEXT    NOT NULL,          -- start | level | fail | complete
  a      INTEGER,                   -- level / fail: номер уровня; complete: секунды
  b      INTEGER,                   -- complete: число кликов
  ts     INTEGER NOT NULL           -- Date.now() на момент приёма
);

CREATE INDEX IF NOT EXISTS idx_events_event ON events (event);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
