// My corner: your shift partner, check-in, daily quests, horoscope, level, badges, mood week, visits, stickers, watchlist, your data.
import { $, h, html, put, store, todayKey, toast, copyText, modal, obj, icon, pick, pickDay, seedFrom, mulberry32, on } from "../core.js";
import { profile, saveProfile, level, stats, moods, visit, inv, quests, setMood, todayMood, earn, xp } from "../state.js";
import { sfx } from "../audio.js";
import { openOnboarding, partnerPicker } from "../onboarding.js";
import { joinBoards } from "../board.js";
import { load, cveList } from "../data.js";
import { card, watchlist } from "../cvecard.js";
import { stickerSVG } from "./shop.js";
import { MOODS, STICKERS, MOOD_REPLY, HORO, BUDDIES } from "../content/legacy.js";

const BADGES = [
  ["tickets", 1, "First ticket", "Route a ticket at the desk"], ["tickets", 50, "Queue whisperer", "Route 50 tickets"], ["bounced", 10, "Not my department", "Bounce 10 tickets to IT or Network"],
  ["incidentsRight", 5, "Cool under pressure", "Get 5 pop incidents right"], ["incidentsRight", 25, "Incident commander", "Get 25 pop incidents right"],
  ["arcade", 1, "Insert coin", "Finish an arcade game"], ["arcade", 25, "Arcade regular", "Finish 25 arcade games"], ["dle", 1, "Wordsmith", "Solve a SOCdle"], ["dle", 7, "Lexicon", "Solve 7 SOCdles"],
  ["lessons", 5, "Snack habit", "Finish 5 lessons"], ["lessons", 16, "Full menu", "Finish 16 lessons"], ["kevRead", 10, "KEV reader", "Open 10 exploited CVEs"], ["malware", 5, "Malware sommelier", "Read 5 malware profiles"],
  ["ai", 3, "Agent whisperer", "Learn 3 things in the AI lab"], ["copies", 5, "Detection engineer", "Copy 5 detections"], ["crack", 3, "Red team curious", "Crack 3 passwords"], ["breath", 5, "Handshake master", "Do 5 breathing breaks"],
  ["coffee", 20, "Barista", "Make 20 coffees"], ["swears", 25, "Sailor", "Swear at tools 25 times"], ["tycoonPrestige", 1, "Lessons learned", "Hold a post-incident review in Tycoon"],
];

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>My corner</h1><p>Your level, badges, mood week and watchlist. It all lives in this browser: no account, nothing to leak.</p></div>
  <div class="panel"><div class="ph"><h3>Your shift partner</h3><span class="muted small" id="partnerNow"></span></div><div id="partnerPick"></div></div>
  <div class="three">
    <div class="panel"><div class="ph"><h3>How are you, really?</h3></div><div class="moods" id="moods"></div><p class="muted small" id="moodReply"></p></div>
    <div class="panel"><div class="ph"><h3>Daily quests</h3></div><div id="quests"></div></div>
    <div class="panel"><div class="ph"><h3>Shift horoscope</h3><span class="muted" id="horoRole"></span></div><p id="horo" class="horo"></p><p class="muted small" id="lucky"></p></div>
  </div>
  <div class="three">
    <div class="panel"><div class="ph"><h3>Level</h3></div><div class="lvl"><div class="lvlnum" id="lvlNum">1</div><div><p class="lvltitle" id="lvlTitle"></p><p class="muted" id="lvlXp"></p></div></div><div class="bar"><i id="lvlBar"></i></div></div>
    <div class="panel"><div class="ph"><h3>Your mood week</h3></div><div class="week" id="week"></div><p class="small" id="weekNote"></p></div>
    <div class="panel"><div class="ph"><h3>Profile</h3><button class="btn ghost sm" id="editProf">Edit</button></div><div id="profSum"></div></div>
  </div>
  <div class="two">
    <div class="panel"><div class="ph"><h3>Visits</h3><span class="muted">last twelve weeks</span></div><div class="heat" id="heat"></div><p class="muted small" id="streakInfo"></p></div>
    <div class="panel"><div class="ph"><h3>Leaderboards</h3></div><div id="lbSet"></div></div>
  </div>
  <div class="panel"><div class="ph"><h3>Badges</h3><span class="muted" id="bdgCount"></span></div><div class="badges" id="badges"></div></div>
  <div class="panel"><div class="ph"><h3>Sticker album</h3><span class="muted" id="albumCount"></span><a class="link" href="#shop">Get capsules</a></div><div class="album" id="album"></div></div>
  <div class="panel"><div class="ph"><h3>CVE watchlist</h3><span class="muted">star cards on the CVE menu</span></div><div class="cards" id="watch"></div></div>
  <div class="panel"><div class="ph"><h3>Your data</h3></div>
    <p class="muted">Move your progress to another browser: copy it here, paste it there. Nothing touches a server.</p>
    <div class="row"><button class="btn sm" id="expBtn">Copy my data</button><button class="btn sm" id="impBtn">Import</button><button class="btn ghost sm" id="wipeBtn">Erase everything</button></div></div>`);
  $("#editProf").addEventListener("click", openOnboarding);
  partnerUI(); moodsUI(); questsUI(); horoscope();
  on("stat", questsUI); on("quests", questsUI); on("mood", questsUI); on("profile", () => { horoscope(); partnerUI(); });
  $("#expBtn").addEventListener("click", exportData); $("#impBtn").addEventListener("click", importData); $("#wipeBtn").addEventListener("click", wipe);
  show();
}
export async function show() {
  if (!$("#lvlNum")) return;
  const L = level(); $("#lvlNum").textContent = L.n; $("#lvlTitle").textContent = L.title; $("#lvlXp").textContent = L.next ? `${L.xp} / ${L.next} XP` : `${L.xp} XP, max level`; $("#lvlBar").style.width = L.pct + "%";
  const m = moods(); const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push([d, m[todayKey(d)]]); }
  put($("#week"), days.map(([d, v]) => h("div.wday", h("span.mface.m" + (v ?? "x")), h("span.small.muted", d.toLocaleDateString(undefined, { weekday: "short" })))));
  const rough = days.filter(([, v]) => v !== undefined && v >= 3).length;
  $("#weekNote").textContent = rough >= 3 ? "A rough week. Talk to someone you trust, and take your breaks. That's not optional." : days.some(([, v]) => v !== undefined) ? "Thanks for checking in with yourself." : "Check in from the Lounge to see your week.";
  const p = profile();
  put($("#profSum"), h("p", h("b", p.name || "Anonymous analyst")), h("p.small.muted", `${p.role} · ${p.siem} · ${p.humor} humour`), p.stack.length ? h("p.small", "Stack: " + p.stack.join(", ")) : h("p.small.muted", "No stack set. Add one so the CVE menu can filter for you."));
  const v = visit(); const set = new Set(v.days); const cells = [];
  for (let i = 83; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); cells.push(h("i" + (set.has(todayKey(d)) ? ".on" : ""), { title: d.toDateString() })); }
  put($("#heat"), cells); $("#streakInfo").textContent = `${v.streak}-day streak · ${v.days.length} days visited`;
  put($("#lbSet"), p.boards ? [h("p", "Playing as ", h("b", p.callsign), p.team ? [" on team ", h("b", p.team)] : ""), h("div.row", h("button.btn.sm", { onclick: () => joinBoards(show) }, "Change"), h("button.btn.ghost.sm", { onclick: () => { saveProfile({ boards: false }); show(); } }, "Stop submitting"))]
    : [h("p.small", "Not on the leaderboards. Your scores stay here."), h("button.btn.sm.primary", { onclick: () => joinBoards(show) }, "Join with a callsign")]);
  const got = BADGES.filter(([k, n]) => stats[k] >= n);
  $("#bdgCount").textContent = `${got.length}/${BADGES.length}`;
  put($("#badges"), BADGES.map(([k, n, t, d]) => h("div.bdg" + (stats[k] >= n ? ".on" : ""), { title: d }, h("b", t), h("span.small.muted", stats[k] >= n ? "earned" : `${d} (${Math.min(stats[k], n)}/${n})`))));
  const st = inv().stickers; $("#albumCount").textContent = `${STICKERS.filter((s) => st[s.id]).length}/${STICKERS.length}`;
  const album = $("#album"); album.textContent = ""; for (const s of STICKERS) { const d = h("div.albumi"); d.innerHTML = stickerSVG(s, !st[s.id]); album.append(d); }
  const list = cveList(await load("cves")); const w = watchlist();
  put($("#watch"), w.length ? list.filter((c) => w.includes(c.id)).map((c) => card(c)).concat(w.filter((id) => !list.some((c) => c.id === id)).map((id) => h("p.small.muted", `${id} (no longer in the live window)`))) : [h("p.empty", "Star cards on the CVE menu to keep an eye on them here.")]);
}

function exportData() {
  const out = {}; for (const k of Object.keys(localStorage)) if (k.startsWith("fpc2_")) out[k] = localStorage.getItem(k);
  copyText(JSON.stringify({ fpcafe: 2, data: out }), "Your data is on the clipboard. Paste it into Import on the other browser.");
}
function importData() {
  const ta = h("textarea", { "aria-label": "Paste exported data", spellcheck: "false" }); const err = h("p.err", { "aria-live": "polite" });
  const close = modal([h("h2", "Import your data"), h("p.muted", "Paste what you copied from the other browser. This replaces what's here."), ta, err,
    h("div.row", h("button.btn.primary", { onclick: () => {
      try {
        if (ta.value.length > 500000) throw new Error("too big");
        const j = JSON.parse(ta.value); if (!j || j.fpcafe !== 2 || typeof j.data !== "object") throw new Error("not FP Café data");
        const entries = Object.entries(j.data).filter(([k, v]) => /^fpc2_[A-Za-z0-9_:-]{1,60}$/.test(k) && typeof v === "string" && v.length < 200000);
        for (const [, v] of entries) JSON.parse(v);
        for (const k of Object.keys(localStorage)) if (k.startsWith("fpc2_")) localStorage.removeItem(k);
        for (const [k, v] of entries) localStorage.setItem(k, v);
        close(); toast("Imported. Reloading…"); setTimeout(() => location.reload(), 800);
      } catch (e) { err.textContent = "That doesn't look like an FP Café export (" + String(e.message).slice(0, 60) + ")."; }
    } }, "Import"), h("button.btn.ghost", { onclick: () => close() }, "Cancel"))], { label: "Import data" });
}
function wipe() {
  const close = modal([h("h2", "Erase everything?"), h("p", "Beans, level, stickers, streaks, checklist and settings in this browser will be gone. Leaderboard scores already submitted stay on the board."),
    h("div.row", h("button.btn.danger", { onclick: () => { for (const k of Object.keys(localStorage)) if (k.startsWith("fpc2_")) localStorage.removeItem(k); close(); location.hash = "#lounge"; location.reload(); } }, "Erase"), h("button.btn.ghost", { onclick: () => close() }, "Keep my stuff"))], { label: "Erase data" });
}

// ---------- shift partner, check-in, quests, horoscope ----------
function partnerUI() {
  const box = $("#partnerPick"); if (!box) return; const p = profile();
  $("#partnerNow").textContent = BUDDIES[p.buddy] ? `${BUDDIES[p.buddy].n} is on shift with you` : "";
  put(box, partnerPicker(p.buddy, (k) => { saveProfile({ buddy: k }); store.set("teamSeen", true); toast(`${BUDDIES[k].n} is on shift with you.`); $("#partnerNow").textContent = `${BUDDIES[k].n} is on shift with you`; }));
}
function horoscope() {
  if (!$("#horo")) return; const p = profile(); const pool = HORO[p.role] || HORO["L1 analyst"];
  $("#horoRole").textContent = p.role;
  $("#horo").textContent = pickDay(pool, seedFrom(p.role) % 97);
  const r = mulberry32(seedFrom(todayKey() + p.role));
  $("#lucky").textContent = `Lucky port ${pick([22, 53, 443, 445, 3389, 8080, 5985, 1337, 4444, 31337], r)} · lucky event ID ${pick([4624, 4688, 4720, 4769, 7045, 1102, 4104, 4625], r)} · avoid ${pick(["change freezes", "Friday deploys", "the CISO's calendar", "reply-all", "the printer", "untested backups"], r)}`;
}
function questsUI() {
  const box = $("#quests"); if (!box) return;
  put(box, quests().map((q) => h("a.quest" + (q.done ? ".done" : ""), { href: q.go }, h("span.qbox", q.done ? icon("check") : ""), h("span.qt", q.t), h("span.qn.muted", `${q.have}/${q.n}`))));
}
function moodsUI() {
  const box = $("#moods"); if (!box) return; const cur = todayMood();
  put(box, MOODS.map((m, i) => h("button.moodb" + (cur === i ? ".on" : ""), { "aria-pressed": String(cur === i), onclick: () => {
    const first = todayMood() === null; setMood(i); moodsUI(); sfx("pop");
    $("#moodReply").textContent = MOOD_REPLY[i] || "";
    if (first) { earn(3, "mood"); xp(5, "mood"); }
  } }, h("span.mface.m" + i), h("span", m[1]))));
  if (cur !== null) $("#moodReply").textContent = MOOD_REPLY[cur] || "";
}
