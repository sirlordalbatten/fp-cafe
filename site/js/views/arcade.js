// Arcade: five games, a daily challenge everyone plays with the same seed, live leaderboards.
import { $, h, html, put, icon, num, todayKey } from "../core.js";
import { play, bests, mini, DIFFS, getDiff } from "../games/kit.js";
import { store } from "../core.js";
import { profile } from "../state.js";
import { joinBoards } from "../board.js";
import { PHISH } from "../games/phish.js";
import { TRIAGE } from "../games/triage.js";
import { WORM } from "../games/worm.js";
import { LOGS } from "../games/logs.js";
import { FIREWALL } from "../games/firewall.js";

export const GAMES = [PHISH, TRIAGE, WORM, LOGS, FIREWALL];
const ICON = { phish: "hook", triage: "siren", worm: "link", logs: "scroll", firewall: "lock" };
let cur = GAMES[0], area = null, running = null;

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Arcade</h1><p>Fast games that teach something real. Play free, or take today's daily challenge: everyone gets the same round, so your whole team can compete on the leaderboard.</p></div>
  <div class="gametiles" id="tiles"></div>
  <div class="two wide-left">
    <div class="panel cabinet"><div id="gameArea"></div></div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>Leaderboard</h3><span class="muted" id="lbTitle">this week</span></div><div id="lb"></div><p class="muted small" id="lbNote"></p></div>
      <div class="panel"><div class="ph"><h3>How to play</h3></div><p id="arcHow"></p><p class="muted small" id="arcKeys"></p></div>
    </div>
  </div>`);
  area = $("#gameArea");
  tiles(); title();
}
export function hide() { stopRunning(); if (area) title(); }
function stopRunning() { if (running) { running.abort(); running = null; } delete document.body.dataset.busy; }

function tiles() {
  put($("#tiles"), GAMES.map((g) => h("button.gtile" + (g === cur ? ".on" : ""), { onclick: () => { stopRunning(); cur = g; tiles(); title(); } },
    icon(ICON[g.id] || "arcade", "ic big"), h("b", g.label), h("span.muted.small", `best ${num(bests()[g.id], 0).toLocaleString()}`))));
}
function title() {
  const g = cur; const b = bests(); const dailyBest = num(b[`${g.id}:${todayKey()}`], 0);
  $("#arcHow").textContent = g.how; $("#arcKeys").textContent = "Controls: " + g.keys;
  put(area, h("div.idle",
    h("h2", g.label), h("p.muted", g.duration ? `${g.duration} seconds` : "Rounds until the worm wins"),
    h("div.seg.diffseg", { role: "group", "aria-label": "Difficulty" }, Object.entries(DIFFS).map(([k, d]) => h("button" + (k === getDiff() ? ".on" : ""), { "aria-pressed": String(k === getDiff()), onclick: () => { store.set("diff", k); title(); } }, d.label))),
    h("p.muted.small", `${DIFFS[getDiff()].label}: speed ×${DIFFS[getDiff()].speed}, points ×${DIFFS[getDiff()].mult}. The daily challenge is always Normal, so everyone's comparable.`),
    h("div.row.center",
      h("button.btn.primary.big", { onclick: () => start(false) }, icon("play"), "Play"),
      h("button.btn.big", { onclick: () => start(true) }, icon("calendar"), "Today's daily")),
    h("p.muted.small", `Personal best ${num(b[g.id], 0).toLocaleString()} · today's daily best ${dailyBest.toLocaleString()}`)));
  board();
}
function start(daily) {
  stopRunning();
  play(area, cur, { daily, onStart: (hd) => { running = hd; }, onDone: () => { running = null; tiles(); title(); } });
}
async function board() {
  const p = profile(); const box = $("#lb");
  put(box, h("p.muted.small", "Loading…"));
  await mini(box, cur);
  if (box.textContent === "Loading…") put(box, h("p.muted.small", "Leaderboards are offline right now. Your best scores are saved in this browser."));
  put($("#lbNote"), p.boards ? [`You're on the boards as ${p.callsign}${p.team ? ` (team ${p.team})` : ""}. `, h("a.link", { href: "#boards" }, "All leaderboards")]
    : [h("button.linkbtn", { onclick: () => joinBoards(title) }, "Join the leaderboards"), " with a callsign. No account needed."]);
}
