// Player state: profile, beans, XP, stats, inventory, quests, moods.
// Everything lives in localStorage and is re-validated on every load.
import { store, obj, arr, num, str, emit, on, todayKey, dayNum, toast, seedFrom, mulberry32, shuffle } from "./core.js";
import { LEVELS, ROLES, SIEMS, BUDDIES } from "./content/legacy.js";

const HUMOR = ["dry", "chaotic", "gentle"];
const KINDS = Object.keys(BUDDIES);

export function profile() {
  const p = obj(store.get("profile", {}));
  return {
    name: str(p.name, 24).replace(/[<>]/g, ""),
    role: ROLES.includes(p.role) ? p.role : "L1 analyst",
    siem: SIEMS.includes(p.siem) ? p.siem : "Sentinel / Defender",
    stack: arr(p.stack).filter((x) => typeof x === "string").slice(0, 12),
    humor: HUMOR.includes(p.humor) ? p.humor : "dry",
    buddy: KINDS.includes(p.buddy) ? p.buddy : "cat",
    callsign: /^[A-Za-z0-9_-]{3,16}$/.test(p.callsign) ? p.callsign : "",
    team: /^[A-Z0-9]{3,12}(-[A-Z0-9]{2,12})?$/.test(p.team) ? p.team : "",
    boards: p.boards === true,
    onboarded: p.onboarded === true,
  };
}
export function saveProfile(patch) { store.set("profile", { ...profile(), ...patch }); emit("profile", profile()); }
export const buddyInfo = () => BUDDIES[profile().buddy];

// ---------- stats ----------
const STAT_KEYS = ["pop", "smash", "breath", "phish", "ffok", "card", "arcade", "brew", "tickets", "ticketsRight", "bounced", "incidents", "incidentsRight",
  "lessons", "dle", "crack", "copies", "kevRead", "malware", "ai", "nudges", "coffee", "tycoonPrestige", "drills", "swears"];
export const stats = (() => { const s = obj(store.get("stats", {})); const o = {}; for (const k of STAT_KEYS) o[k] = num(s[k], 0, 0, 1e9); return o; })();
export function bump(k, n = 1) {
  if (!(k in stats)) return; stats[k] += n; store.set("stats", stats);
  const day = obj(store.get("day_" + todayKey(), {})); day[k] = num(day[k], 0) + n; store.set("day_" + todayKey(), day);
  emit("stat", { k, v: stats[k] });
}
export const today = () => obj(store.get("day_" + todayKey(), {}));

// ---------- beans & XP ----------
export let beans = num(store.get("beans", 20), 20, 0, 1e9);
export function earn(n, why) { beans += n; store.set("beans", beans); emit("beans", { beans, delta: n, why }); }
export function spend(n) { if (beans < n) return false; beans -= n; store.set("beans", beans); emit("beans", { beans, delta: -n }); return true; }

let xpTotal = num(store.get("xp", 0), 0, 0, 1e9);
export function xp(n, why) {
  const before = level(); xpTotal += n; store.set("xp", xpTotal); const after = level();
  emit("xp", { xp: xpTotal, delta: n, why });
  if (after.i > before.i) { emit("levelup", after); toast(`Level up: ${after.title}`); }
}
export function level() {
  let i = 0; for (let k = 0; k < LEVELS.length; k++) if (xpTotal >= LEVELS[k][0]) i = k;
  const next = LEVELS[i + 1]; const base = LEVELS[i][0];
  return { i, n: i + 1, title: LEVELS[i][2], xp: xpTotal, next: next ? next[0] : null, pct: next ? ((xpTotal - base) / (next[0] - base)) * 100 : 100 };
}

// ---------- inventory ----------
export function inv() {
  const v = obj(store.get("inv", {}));
  return { owned: arr(v.owned).filter((x) => typeof x === "string").slice(0, 200), hat: str(v.hat, 20), theme: str(v.theme, 20), snacks: num(v.snacks, 0, 0, 999),
    stickers: obj(v.stickers) };
}
export function saveInv(patch) { store.set("inv", { ...inv(), ...patch }); emit("inv", inv()); }

// ---------- moods ----------
export function moods() { const m = obj(store.get("moods", {})); const o = {}; for (const [k, v] of Object.entries(m)) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) o[k] = num(v, 2, 0, 4); return o; }
export function setMood(i) { const m = moods(); m[todayKey()] = i; store.set("moods", m); emit("mood", i); }
export const todayMood = () => { const v = moods()[todayKey()]; return v === undefined ? null : v; };

// ---------- visit streak ----------
export function visit() {
  const v = obj(store.get("visits", {})); const t = todayKey();
  if (!v[t]) { v[t] = 1; store.set("visits", v); }
  let streak = 0; const d = new Date();
  for (;;) { if (v[todayKey(d)]) { streak++; d.setDate(d.getDate() - 1); } else break; }
  return { days: Object.keys(v).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)), streak };
}

// ---------- daily quests ----------
const QUESTS = [
  { id: "brew", t: "Read today's brew", stat: "brew", n: 1, go: "#brew" },
  { id: "desk3", t: "Route 3 tickets at the desk", stat: "tickets", n: 3, go: "#desk" },
  { id: "bounce", t: "Bounce something that isn't yours", stat: "bounced", n: 1, go: "#desk" },
  { id: "kev", t: "Open 2 exploited CVEs on the menu", stat: "kevRead", n: 2, go: "#menu" },
  { id: "mal", t: "Read up on a malware family", stat: "malware", n: 1, go: "#malware" },
  { id: "ai", t: "Learn one thing in the AI lab", stat: "ai", n: 1, go: "#ai" },
  { id: "game", t: "Finish an arcade game", stat: "arcade", n: 1, go: "#arcade" },
  { id: "game3", t: "Finish 3 arcade games", stat: "arcade", n: 3, go: "#arcade" },
  { id: "dle", t: "Solve today's SOCdle", stat: "dle", n: 1, go: "#socdle" },
  { id: "lesson", t: "Finish a snack lesson", stat: "lessons", n: 1, go: "#learn" },
  { id: "lesson2", t: "Finish 2 snack lessons", stat: "lessons", n: 2, go: "#learn" },
  { id: "drill", t: "Handle a pop incident", stat: "incidents", n: 1, go: "#lounge" },
  { id: "break", t: "Take a 60-second break", stat: "breath", n: 1, go: "#breakroom" },
  { id: "crack", t: "Crack today's password", stat: "crack", n: 1, go: "#pwlab" },
  { id: "copy", t: "Copy a detection into your SIEM", stat: "copies", n: 1, go: "#detect" },
  { id: "coffee", t: "Make the team a coffee", stat: "coffee", n: 1, go: "#desk" },
];
export function quests() {
  const r = mulberry32(seedFrom("quests" + todayKey()));
  const picks = shuffle(QUESTS, r).filter((q, i, a) => a.findIndex((x) => x.stat === q.stat) === i).slice(0, 3);
  picks.unshift({ id: "mood", t: "Check in: how are you, really?", stat: "_mood", n: 1, go: "#lounge" });
  const d = today(); const done = arr(store.get("questsPaid_" + todayKey(), []));
  return picks.map((q) => {
    const have = q.stat === "_mood" ? (todayMood() === null ? 0 : 1) : num(d[q.stat], 0);
    return { ...q, have: Math.min(have, q.n), done: have >= q.n, paid: done.includes(q.id) };
  });
}
function payQuests() {
  const paid = arr(store.get("questsPaid_" + todayKey(), []));
  let changed = false;
  for (const q of quests()) if (q.done && !paid.includes(q.id)) { paid.push(q.id); changed = true; earn(8, "quest"); xp(15, "quest"); toast(`Quest done: ${q.t}. +8 beans`); }
  if (changed) { store.set("questsPaid_" + todayKey(), paid); emit("quests"); }
}
on("stat", payQuests); on("mood", payQuests);

// ---------- housekeeping: drop day-keyed records older than 120 days ----------
export function tidy() {
  const cutoff = dayNum() - 120;
  for (const k of store.keys()) {
    const m = k.match(/_(\d{4})-(\d{2})-(\d{2})$/);
    if (m && dayNum(new Date(+m[1], +m[2] - 1, +m[3])) < cutoff) store.del(k);
  }
}
