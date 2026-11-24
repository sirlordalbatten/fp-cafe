// FP Café leaderboard backend: shared logic for the Pages Functions in /functions.
// Pure functions are exported so they can be unit-tested with `node --test`.
//
// Threat model in short: anyone can call these endpoints with any payload.
// We never trust the client. A score is accepted only if
//   1. it comes with a run token this server signed when the game started,
//   2. the token is fresh, unused, and for the same game,
//   3. the time between start and submit is plausible for the game,
//   4. the score is within what a human could reach in that time,
//   5. the client solved a small proof-of-work bound to the token,
//   6. the caller is under the per-IP rate limits (IP stored only as a
//      salted, daily-rotating hash).
// Names and team codes are allow-list validated; nothing user-supplied is
// ever interpreted as HTML by the site (it renders with textContent).

export const GAMES = {
  //            min run   max run     score/sec  hard cap
  phish:    { minMs: 15000, maxMs: 6 * 60e3, rate: 1350, cap: 120000, label: "Swipe the phish" },
  triage:   { minMs: 15000, maxMs: 8 * 60e3, rate: 2250, cap: 300000, label: "Alert rush" },
  worm:     { minMs: 10000, maxMs: 30 * 60e3, rate: 900, cap: 450000, label: "Contain the worm" },
  logs:     { minMs: 15000, maxMs: 6 * 60e3, rate: 1800, cap: 150000, label: "Needle in the logs" },
  firewall: { minMs: 15000, maxMs: 6 * 60e3, rate: 1800, cap: 150000, label: "Firewall frenzy" },
  socdle:   { minMs: 8000, maxMs: 6 * 3600e3, rate: 1, cap: 6, label: "SOCdle" },
};

export const POW_BITS = 14;
export const LIMITS = { run: 60, score: 40, board: 300 }; // per IP per 10 minutes
const WINDOW_MS = 10 * 60e3;

const NAME_RE = /^[A-Za-z0-9_-]{3,16}$/;
const TEAM_RE = /^[A-Z0-9]{3,12}(-[A-Z0-9]{2,12})?$/;
const BLOCK = ["fuck", "shit", "cunt", "nigg", "fag", "rape", "hitler", "nazi", "kkk", "porn", "whore", "slut", "retard"];
const RESERVED = ["admin", "root", "system", "moderator", "fpcafe", "anonymous", "null", "undefined"];

const enc = new TextEncoder();

export function validName(n) {
  if (typeof n !== "string" || !NAME_RE.test(n)) return false;
  const l = n.toLowerCase().replace(/[_-]/g, "").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s");
  if (RESERVED.includes(l)) return false;
  return !BLOCK.some((b) => l.includes(b));
}

export function normTeam(t) {
  if (t === undefined || t === null || t === "") return null;
  if (typeof t !== "string") return false;
  const u = t.trim().toUpperCase();
  return TEAM_RE.test(u) ? u : false;
}

// ---------- encoding / crypto ----------
export function b64u(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function unb64u(s) {
  if (typeof s !== "string" || !/^[A-Za-z0-9_-]{1,400}$/.test(s)) throw new Error("bad b64");
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
export function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function hmacHex(secret, msg) {
  return hex(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(msg)));
}
export async function sha256(msg) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(msg)));
}
export function leadingZeroBits(bytes) {
  let n = 0;
  for (const b of bytes) {
    if (b === 0) { n += 8; continue; }
    n += Math.clz32(b) - 24;
    break;
  }
  return n;
}

// ---------- run tokens ----------
export async function issueToken(secret, game, now = Date.now()) {
  const nonce = hex(crypto.getRandomValues(new Uint8Array(12)));
  const payload = b64u(enc.encode(JSON.stringify({ g: game, t: now, n: nonce })));
  const sig = b64u(new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload))));
  return `${payload}.${sig}`;
}

export async function verifyToken(secret, token) {
  if (typeof token !== "string" || token.length > 400) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  let sig;
  try { sig = unb64u(parts[1]); } catch { return null; }
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), sig, enc.encode(parts[0]));
  if (!ok) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64u(parts[0])));
    if (!GAMES[p.g] || !Number.isSafeInteger(p.t) || !/^[0-9a-f]{24}$/.test(p.n)) return null;
    return p;
  } catch { return null; }
}

export async function checkPow(token, solution, bits = POW_BITS) {
  if (typeof solution !== "string" || !/^[0-9a-z]{1,16}$/.test(solution)) return false;
  return leadingZeroBits(await sha256(`${token}.${solution}`)) >= bits;
}

// ---------- plausibility ----------
export function plausible(game, score, elapsedMs) {
  const g = GAMES[game];
  if (!g) return "unknown game";
  if (!Number.isSafeInteger(score) || score < 0) return "bad score";
  if (elapsedMs < g.minMs) return "too fast";
  if (elapsedMs > g.maxMs) return "run expired";
  const ceiling = Math.min(g.cap, Math.ceil((elapsedMs / 1000) * g.rate) + (game === "socdle" ? 6 : 500));
  if (score > ceiling) return "score not plausible";
  return null;
}

// ---------- time helpers ----------
export function dayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}
export function weekKey(now = Date.now()) {
  const d = new Date(now);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t - y0) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}

// ---------- HTTP helpers ----------
export const API_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
};

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...API_HEADERS, "Cache-Control": "no-store", ...extra } });
}

export async function readJson(request, max = 2048) {
  const ct = request.headers.get("Content-Type") || "";
  if (!ct.toLowerCase().startsWith("application/json")) throw new HttpError(415, "send JSON");
  const len = Number(request.headers.get("Content-Length") || "0");
  if (len > max) throw new HttpError(413, "too large");
  const text = await request.text();
  if (text.length > max) throw new HttpError(413, "too large");
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error();
    return v;
  } catch { throw new HttpError(400, "bad JSON"); }
}

export class HttpError extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}

export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}

export function ready(env) {
  if (!env || !env.DB || typeof env.RUN_SECRET !== "string" || env.RUN_SECRET.length < 32) {
    throw new HttpError(503, "leaderboards are not set up yet");
  }
}

export async function ipHash(env, request, now = Date.now()) {
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  return (await hmacHex(env.RUN_SECRET, `ip:${dayKey(now)}:${ip}`)).slice(0, 32);
}

export async function rateLimit(env, request, action, now = Date.now()) {
  const who = await ipHash(env, request, now);
  const win = Math.floor(now / WINDOW_MS);
  const row = await env.DB.prepare(
    `INSERT INTO rl (k, win, n) VALUES (?1, ?2, 1)
     ON CONFLICT(k) DO UPDATE SET n = CASE WHEN rl.win = excluded.win THEN rl.n + 1 ELSE 1 END, win = excluded.win
     RETURNING n`
  ).bind(`${who}:${action}`, win).first();
  if (row && row.n > LIMITS[action]) throw new HttpError(429, "slow down");
}

// ---------- handlers ----------
export async function startRun(request, env, now = Date.now()) {
  ready(env);
  if (!sameOrigin(request)) throw new HttpError(403, "cross-origin request refused");
  const body = await readJson(request, 256);
  if (!GAMES[body.game]) throw new HttpError(400, "unknown game");
  await rateLimit(env, request, "run", now);
  const token = await issueToken(env.RUN_SECRET, body.game, now);
  return json({ token, pow: POW_BITS });
}

export async function submitScore(request, env, now = Date.now()) {
  ready(env);
  if (!sameOrigin(request)) throw new HttpError(403, "cross-origin request refused");
  const body = await readJson(request, 1024);
  await rateLimit(env, request, "score", now);

  const p = await verifyToken(env.RUN_SECRET, body.token);
  if (!p) throw new HttpError(400, "invalid run token");
  if (body.game !== p.g) throw new HttpError(400, "token is for another game");
  if (!validName(body.name)) throw new HttpError(400, "pick a 3-16 character callsign: letters, numbers, - and _");
  const team = normTeam(body.team);
  if (team === false) throw new HttpError(400, "team codes are 3-12 letters/numbers, optionally TEAM-NAME");
  const why = plausible(p.g, body.score, now - p.t);
  if (why) throw new HttpError(422, why);
  if (!(await checkPow(body.token, body.pow))) throw new HttpError(400, "proof of work failed");

  const used = await env.DB.prepare("INSERT INTO used_runs (nonce, at) VALUES (?1, ?2) ON CONFLICT(nonce) DO NOTHING RETURNING nonce")
    .bind(p.n, now).first();
  if (!used) throw new HttpError(409, "this run was already submitted");

  const teamHash = team ? (await hmacHex(env.RUN_SECRET, `team:${team}`)).slice(0, 24) : null;
  await env.DB.prepare(
    "INSERT INTO scores (game, name, team, score, day, week, created, daily) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
  ).bind(p.g, body.name, teamHash, body.score, dayKey(now), weekKey(now), now, body.daily ? 1 : 0).run();

  if (Math.random() < 0.03) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM used_runs WHERE at < ?1").bind(now - 3 * 864e5),
      env.DB.prepare("DELETE FROM rl WHERE win < ?1").bind(Math.floor(now / WINDOW_MS) - 12),
    ]);
  }
  const rank = await env.DB.prepare(
    `SELECT COUNT(*) + 1 AS r FROM (SELECT name, MAX(score) AS s FROM scores WHERE game = ?1 AND week = ?2 GROUP BY name)
     WHERE s > ?3`
  ).bind(p.g, weekKey(now), body.score).first();
  return json({ ok: true, weekRank: rank ? rank.r : null });
}

export async function getBoard(request, env, now = Date.now()) {
  ready(env);
  const u = new URL(request.url);
  const game = u.searchParams.get("game") || "";
  const period = u.searchParams.get("period") || "week";
  if (!["day", "week", "all"].includes(period)) throw new HttpError(400, "bad period");
  const team = normTeam(u.searchParams.get("team"));
  if (team === false) throw new HttpError(400, "bad team code");
  await rateLimit(env, request, "board", now);

  const where = [];
  const args = [];
  if (period === "day") { where.push(`day = ?${args.length + 1}`); args.push(dayKey(now)); }
  if (period === "week") { where.push(`week = ?${args.length + 1}`); args.push(weekKey(now)); }
  if (team) { where.push(`team = ?${args.length + 1}`); args.push((await hmacHex(env.RUN_SECRET, `team:${team}`)).slice(0, 24)); }

  if (game === "*") {
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await env.DB.prepare(
      `SELECT game, name, MAX(score) AS score FROM scores ${w} GROUP BY game`
    ).bind(...args).all();
    const players = await env.DB.prepare(`SELECT COUNT(DISTINCT name) AS n FROM scores ${w}`).bind(...args).first();
    return json({ period, champions: rows.results || [], players: players ? players.n : 0 }, 200, { "Cache-Control": "public, max-age=30" });
  }
  if (!GAMES[game]) throw new HttpError(400, "unknown game");
  where.unshift(`game = ?${args.length + 1}`);
  args.push(game);
  const rows = await env.DB.prepare(
    `SELECT name, MAX(score) AS score, MIN(created) AS at FROM scores WHERE ${where.join(" AND ")}
     GROUP BY name ORDER BY score DESC, at ASC LIMIT 25`
  ).bind(...args).all();
  return json({ game, period, rows: rows.results || [] }, 200, { "Cache-Control": "public, max-age=15" });
}

export async function guard(handler, request, env) {
  try {
    return await handler(request, env);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.log("unhandled", e && e.stack ? e.stack.slice(0, 300) : String(e));
    return json({ error: "something broke on our side" }, 500);
  }
}
