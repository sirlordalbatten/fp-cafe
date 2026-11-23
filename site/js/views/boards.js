// Leaderboards hub: champions of the week, per-game boards (today / week / all time), team boards.
import { $, h, html, put, visible } from "../core.js";
import { getBoard, joinBoards, isOnline } from "../board.js";
import { profile, saveProfile } from "../state.js";

const GAMES = [["phish", "Swipe the phish"], ["triage", "Alert rush"], ["worm", "Contain the worm"], ["logs", "Needle in the logs"], ["firewall", "Firewall frenzy"], ["socdle", "SOCdle"]];
let game = "phish", period = "week", scope = "global", timer = 0;

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Leaderboards</h1><p>Updated live as people play. Scores are checked on the server: signed game runs, timing checks and proof-of-work, so nobody can just post a million points.</p></div>
  <div class="panel champs"><div class="ph"><h3>Champions this week</h3><span class="muted" id="champN"></span></div><div class="champgrid" id="champs"></div></div>
  <div class="two wide-left">
    <div class="panel">
      <div class="filters"><div class="seg" id="bGame"></div></div>
      <div class="filters"><div class="seg" id="bPeriod"><button data-p="day">Today</button><button data-p="week" class="on">This week</button><button data-p="all">All time</button></div>
        <div class="seg" id="bScope"><button data-s="global" class="on">Everyone</button><button data-s="team">My team</button></div></div>
      <ol class="lb big" id="bList"></ol><p class="muted small" id="bNote"></p>
    </div>
    <div class="stack"><div class="panel"><div class="ph"><h3>You</h3></div><div id="bMe"></div></div>
      <div class="panel"><div class="ph"><h3>Play with your team</h3></div><p class="small">Agree on a team code (like BLUE-OWLS), everyone adds it to their callsign settings, then pick "My team" here. Daily challenges give everyone the same round, so standup bragging is fair.</p></div></div>
  </div>`);
  put($("#bGame"), GAMES.map(([k, l]) => h("button" + (k === game ? ".on" : ""), { dataset: { g: k } }, l)));
  const seg = (id, key, set) => $(id).addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; set(b.dataset[key]); [...$(id).children].forEach((x) => x.classList.toggle("on", x === b)); list(); });
  seg("#bGame", "g", (v) => (game = v)); seg("#bPeriod", "p", (v) => (period = v)); seg("#bScope", "s", (v) => (scope = v));
  me(); await Promise.all([champs(), list()]);
}
export function show() { clearInterval(timer); timer = setInterval(() => { if (visible() && location.hash === "#boards") { champs(); list(); } }, 30000); me(); }
export function hide() { clearInterval(timer); }

async function champs() {
  const d = await getBoard("*", "week");
  if (!d) { put($("#champs"), h("p.muted", "Leaderboards are offline right now.")); return; }
  $("#champN").textContent = d.players ? `${d.players} players` : "";
  const byGame = Object.fromEntries((d.champions || []).map((c) => [c.game, c]));
  put($("#champs"), GAMES.map(([k, l]) => { const c = byGame[k]; return h("div.champ", h("span.muted.small", l), c ? [h("b", String(c.name)), h("span.mono", Number(c.score).toLocaleString())] : h("span.muted", "unclaimed")); }));
}
async function list() {
  const p = profile();
  if (scope === "team" && !p.team) { put($("#bList"), h("li.muted", "Add a team code to your callsign settings to see your team's board.")); return; }
  const d = await getBoard(game, period, scope === "team" ? p.team : "");
  if (!d || !Array.isArray(d.rows)) { put($("#bList"), h("li.muted", isOnline() === false ? "Leaderboards aren't switched on for this site yet." : "Couldn't load the board. Try again in a moment.")); return; }
  put($("#bList"), d.rows.length ? d.rows.map((r, i) => h("li" + (r.name === p.callsign ? ".me" : ""), h("span.rk", String(i + 1)), h("span.nm", String(r.name)), h("b", Number(r.score).toLocaleString())))
    : [h("li.muted", "No scores yet. Be the first.")]);
  $("#bNote").textContent = `Refreshes every 30 seconds while you're here.`;
}
function me() {
  const p = profile(); const box = $("#bMe"); if (!box) return;
  if (!p.boards) { put(box, h("p", "You're not on the leaderboards. Your scores stay in this browser."), h("button.btn.primary", { onclick: () => joinBoards(() => { me(); list(); }) }, "Join with a callsign")); return; }
  put(box, h("p", "Playing as ", h("b", p.callsign), p.team ? [" on team ", h("b", p.team)] : ""),
    h("div.row", h("button.btn.sm", { onclick: () => joinBoards(() => { me(); list(); }) }, "Change"), h("button.btn.ghost.sm", { onclick: () => { saveProfile({ boards: false }); me(); } }, "Stop submitting")));
}
