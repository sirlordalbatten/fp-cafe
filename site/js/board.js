// Leaderboard API client. Same-origin only; nothing here sends personal data.
// Submissions are opt-in and use a callsign the user chooses.
import { h, modal, toast, store, obj, num } from "./core.js";
import { profile, saveProfile } from "./state.js";

const enc = new TextEncoder();
let online = null; // null = unknown, false = API not set up

export async function startRun(game) {
  if (online === false) return null;
  try {
    const r = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game }), credentials: "omit" });
    if (r.status === 503 || r.status === 404 || r.status === 405) { online = false; return null; }
    if (!r.ok) return null;
    const j = await r.json(); online = true;
    return typeof j.token === "string" && Number.isInteger(j.pow) ? { token: j.token, pow: j.pow, game, t: Date.now() } : null;
  } catch { return null; }
}

async function solve(token, bits) {
  for (let i = 0; i < 5e6; i++) {
    const s = i.toString(36);
    const d = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`${token}.${s}`)));
    let z = 0; for (const b of d) { if (b === 0) { z += 8; continue; } z += Math.clz32(b) - 24; break; }
    if (z >= bits) return s;
    if (i % 400 === 399) await new Promise((r) => setTimeout(r));
  }
  throw new Error("pow");
}

/** Submit a finished run. Returns {ok, weekRank} | {error} | null when offline/not opted in. */
export async function submit(run, score, { daily = false } = {}) {
  const p = profile();
  if (!run || !p.boards || !p.callsign) return null;
  try {
    const pow = await solve(run.token, run.pow);
    const r = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
      body: JSON.stringify({ token: run.token, game: run.game, score: Math.max(0, Math.round(score)), name: p.callsign, team: p.team || undefined, pow, daily }) });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, weekRank: num(j.weekRank, null) } : { error: String(j.error || "rejected").slice(0, 120) };
  } catch { return { error: "network" }; }
}

export async function getBoard(game, period = "week", team = "") {
  if (online === false) return null;
  const qs = new URLSearchParams({ game, period }); if (team) qs.set("team", team);
  try {
    const r = await fetch("/api/board?" + qs, { credentials: "omit" });
    if (r.status === 503 || r.status === 404) { online = false; return null; }
    if (!r.ok) return null;
    return obj(await r.json());
  } catch { return null; }
}
export const isOnline = () => online;

/** Opt-in dialog: callsign + optional team code. */
export function joinBoards(after) {
  const p = profile();
  const cs = h("input", { type: "text", maxlength: "16", value: p.callsign || "", placeholder: "e.g. night_owl", autocomplete: "off", spellcheck: "false", id: "csIn" });
  const tm = h("input", { type: "text", maxlength: "25", value: p.team || "", placeholder: "optional, e.g. BLUE-OWLS", autocomplete: "off", spellcheck: "false", id: "tmIn" });
  const err = h("p.err", { "aria-live": "polite" });
  const close = modal([
    h("h2", "Join the leaderboards"),
    h("p", "Pick a callsign. It's the only thing we store with your scores, plus an optional team code so your team gets its own board."),
    h("ul.tight.small", h("li", "Don't use your real name or work username."), h("li", "No account, no email, no cookies. Change or leave any time in My corner."),
      h("li", "Team codes are stored hashed. Anyone who knows the code can post to that team board.")),
    h("div.field", h("label.l", { for: "csIn" }, "Callsign (3 to 16 letters, numbers, - or _)"), cs),
    h("div.field", h("label.l", { for: "tmIn" }, "Team code (optional)"), tm), err,
    h("div.row", h("button.btn.primary", { onclick: () => {
      const c = cs.value.trim(); const t = tm.value.trim().toUpperCase();
      if (!/^[A-Za-z0-9_-]{3,16}$/.test(c)) { err.textContent = "Callsigns are 3 to 16 characters: letters, numbers, - and _."; return; }
      if (t && !/^[A-Z0-9]{3,12}(-[A-Z0-9]{2,12})?$/.test(t)) { err.textContent = "Team codes look like BLUEOWLS or BLUE-OWLS."; return; }
      saveProfile({ callsign: c, team: t, boards: true }); toast(`You're on the boards as ${c}.`); close(); after && after();
    } }, "Join"), h("button.btn.ghost", { onclick: () => close() }, "Not now")),
  ], { label: "Join the leaderboards" });
}
