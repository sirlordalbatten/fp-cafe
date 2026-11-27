-- FP Café leaderboard schema (Cloudflare D1 / SQLite).
-- Paste this into the D1 console once. Safe to run again.
CREATE TABLE IF NOT EXISTS scores (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  game    TEXT    NOT NULL,
  name    TEXT    NOT NULL,
  team    TEXT,                 -- HMAC of the team code, never the code itself
  score   INTEGER NOT NULL,
  day     TEXT    NOT NULL,     -- YYYY-MM-DD (UTC)
  week    TEXT    NOT NULL,     -- YYYY-Www (ISO week)
  created INTEGER NOT NULL,     -- ms since epoch
  daily   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS scores_game_day  ON scores (game, day, score DESC);
CREATE INDEX IF NOT EXISTS scores_game_week ON scores (game, week, score DESC);
CREATE INDEX IF NOT EXISTS scores_team_week ON scores (team, game, week, score DESC);
CREATE TABLE IF NOT EXISTS used_runs (nonce TEXT PRIMARY KEY, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rl (k TEXT PRIMARY KEY, win INTEGER NOT NULL, n INTEGER NOT NULL);
-- Cache for /api/live (public threat feeds, refreshed every few minutes). Holds no user data.
CREATE TABLE IF NOT EXISTS live_cache (k TEXT PRIMARY KEY, ts INTEGER NOT NULL, ok INTEGER NOT NULL, body TEXT NOT NULL);
