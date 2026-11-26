// Shift buddy: custom shift hours, break plan, essential nudges, checklist with suggestions,
// handover builder and focus timer. All local to this browser.
import { $, h, html, put, ext, store, obj, arr, num, str, pad, toast, copyText, emit, nextPatchTuesday, fmtDur, on } from "../core.js";
import { sfx, sting } from "../audio.js";
import { bump, earn, xp, today, profile } from "../state.js";
import { popSettings } from "../incidents.js";
import { loaded, load, cveList } from "../data.js";

// ---------- settings ----------
const PRESETS = [["Day 9–5", "09:00", "17:00"], ["Early 7–3", "07:00", "15:00"], ["Day 12h", "07:00", "19:00"], ["Night 12h", "19:00", "07:00"], ["Late 3–11", "15:00", "23:00"]];
const NUDGES = [
  { id: "water", g: "Body", t: "Drink some water", every: 90, def: true, msg: ["Water break. The SIEM can wait 30 seconds.", "Refill the bottle. Dehydration feels a lot like alert fatigue.", "Sip of water. Your brain is mostly water and it's doing triage."] },
  { id: "posture", g: "Body", t: "Posture check", every: 45, def: true, msg: ["Posture check: feet flat, shoulders down, screen top at eye level.", "Unclench your jaw. Drop your shoulders. Okay, carry on.", "Are you leaning into the monitor? Sit back. The alert won't get closer."] },
  { id: "stretch", g: "Body", t: "Stand up and move", every: 60, def: true, msg: ["Stand up for two minutes. Walk to the window and back.", "Stretch break: roll your shoulders, stretch your wrists. There's a 2-minute routine in the break room.", "Up you get. Sitting for hours is harder on your back than any incident."] },
  { id: "eyes", g: "Body", t: "20-20-20 eye break", every: 20, def: false, msg: ["Look at something 20 feet away for 20 seconds. Blink a few times.", "Eyes off the screen for 20 seconds. Find something far away."] },
  { id: "meal", g: "Fuel", t: "Proper meal at the middle of the shift", every: 0, def: true, msg: ["Halfway through. Eat something real, away from the screen. Not over the keyboard."] },
  { id: "caffeine", g: "Fuel", t: "Caffeine cut-off (about 6 hours before you sleep)", every: 0, def: true, msg: ["Caffeine cut-off. Coffee now is still in your system when you're trying to sleep. Switch to water or decaf."] },
  { id: "micro", g: "Mind", t: "One-minute reset", every: 75, def: false, msg: ["One-minute reset: three slow breaths, longer out than in.", "Look away, breathe out slowly, name one thing that's going fine."] },
  { id: "buddy", g: "Mind", t: "Check in on a teammate", every: 240, def: true, msg: ["Check in on a teammate. A two-line message counts.", "Who's had a rough queue today? Ask them how it's going.", "Say thanks to someone on the team for something specific."] },
  { id: "handover", g: "Work", t: "Handover reminder, 30 min before the end", every: 0, def: true, msg: ["30 minutes left. Start your handover notes now, not at minus one."] },
  { id: "night", g: "Night shift", t: "Night low point (02:00 to 05:00)", every: 0, def: true, msg: ["This is the hardest stretch of a night shift. Walk, bright light, cold water. Double-check anything you close."] },
  { id: "sleep", g: "Night shift", t: "Sleep prep before a night shift ends", every: 0, def: true, msg: ["Night shift ends soon. Plan the trip home: sunglasses, no screens in bed, blackout curtains, phone on do-not-disturb. Sleep is part of the job."] },
  { id: "end", g: "Work", t: "Log off properly at the end", every: 0, def: true, msg: ["Shift's over. Hand over, log off, and don't check the queue from your phone. Add one win to the jar if you like."] },
  { id: "pt", g: "Work", t: "Patch Tuesday heads-up", every: 0, def: true, msg: ["It's Patch Tuesday. Expect a wave of advisories this evening."] },
];
const SUGGEST = [
  "Read the previous shift's handover", "Check SIEM ingestion: are all critical sources reporting?", "Check EDR console for offline or unhealthy agents",
  "Review open P1/P2 incidents and their owners", "Skim today's brew", "Check the newest KEV entries against the asset list", "Confirm last night's backup jobs succeeded",
  "Look at failed-logon trends for VPN and SSO", "Check certificates expiring this month", "Review new admin accounts or role grants from the last 24h",
  "Check email quarantine for anything the team should know", "Verify the on-call rota and escalation contacts", "Tune one noisy rule (just one)",
];
const DEFAULT_CK = ["Read the previous shift's handover", "Check SIEM ingestion: are all critical sources reporting?", "Check EDR console for offline or unhealthy agents", "Review open P1/P2 incidents and their owners"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function cfg() {
  const c = obj(store.get("shiftCfg", {}));
  const nud = obj(c.nudges); const nudges = {}; for (const n of NUDGES) nudges[n.id] = typeof nud[n.id] === "boolean" ? nud[n.id] : n.def;
  return { start: TIME.test(c.start) ? c.start : "09:00", end: TIME.test(c.end) ? c.end : "17:00", auto: c.auto === true, notify: c.notify === true, nudges };
}
const saveCfg = (p) => store.set("shiftCfg", { ...cfg(), ...p });
function window_(now = new Date()) {
  const c = cfg(); const [sh, sm] = c.start.split(":").map(Number), [eh, em] = c.end.split(":").map(Number);
  const s = new Date(now); s.setHours(sh, sm, 0, 0); const e = new Date(now); e.setHours(eh, em, 0, 0);
  if (e <= s) { if (now < e) s.setDate(s.getDate() - 1); else e.setDate(e.getDate() + 1); }
  return { s, e, on: now >= s && now < e, len: e - s };
}
function manual() { const m = obj(store.get("shiftManual", {})); return m.s && Date.now() - m.s < 16 * 36e5 ? { s: num(m.s), e: num(m.e) } : null; }
export function shiftState(now = new Date()) {
  const m = manual(); if (m) return { s: new Date(m.s), e: new Date(m.e), on: now < m.e, manual: true, len: m.e - m.s };
  const w = window_(now); return { ...w, on: cfg().auto && w.on };
}

// ---------- nudge engine (runs on every page) ----------
let lastFire = obj(store.get("nudgeLast", {}));
function fire(n) {
  lastFire[n.id] = Date.now(); store.set("nudgeLast", lastFire); bump("nudges");
  const m = n.msg[Math.floor(Math.random() * n.msg.length)];
  toast(m); sting("alert");
  if (cfg().notify && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
    try { new Notification("FP Café", { body: m, silent: false }); } catch { /* ignore */ }
  }
}
function nudgeTick() {
  const st = shiftState(); const c = cfg(); const now = new Date();
  const left = st.e - now;
  document.title = st.on ? `${fmtDur(Math.max(0, left)).slice(0, 5)} left · FP Café` : "FP Café";
  const nav = $("#shiftNav"); if (nav) { nav.hidden = !st.on; nav.textContent = st.on ? fmtDur(left).slice(0, 5) : ""; }
  if (!st.on) return;
  for (const n of NUDGES) {
    if (!c.nudges[n.id]) continue; const last = num(lastFire[n.id], 0);
    if (n.every && now - Math.max(last, st.s) >= n.every * 60e3) fire(n);
    if (n.id === "handover" && left < 30 * 60e3 && left > 0 && last < st.s.getTime()) fire(n);
    if (n.id === "night" && now.getHours() >= 2 && now.getHours() < 5 && now - last > 6 * 36e5) fire(n);
    const once = last < st.s.getTime(); const len = st.e - st.s; const el = now - st.s;
    if (n.id === "meal" && once && len >= 5 * 36e5 && el >= len / 2 && el < len / 2 + 60 * 60e3) fire(n);
    if (n.id === "caffeine" && once && left <= 5 * 36e5 && left > 4 * 36e5 && len >= 6 * 36e5) fire(n);
    if (n.id === "sleep" && once && st.e.getHours() >= 4 && st.e.getHours() <= 10 && st.s.getHours() >= 17 && left < 45 * 60e3 && left > 0) fire(n);
    if (n.id === "end" && once && left < 5 * 60e3 && left > 0) fire(n);
    if (n.id === "pt") { const pt = nextPatchTuesday(new Date(now - 864e5)); if (pt.toDateString() === now.toDateString() && now - last > 12 * 36e5) fire(n); }
  }
}
export function startNudges() { nudgeTick(); setInterval(nudgeTick, 30000); }

// ---------- checklist ----------
function ck() {
  const c = obj(store.get("checklist2", {}));
  return { items: arr(c.items).filter((x) => typeof x === "string").map((x) => x.slice(0, 160)).slice(0, 30), done: arr(c.done).filter((x) => typeof x === "string"), shift: num(c.shift, 0) };
}
const saveCk = (c) => store.set("checklist2", c);

export async function mount(sec) {
  if (!store.get("checklist2", null)) saveCk({ items: DEFAULT_CK, done: [], shift: 0 });
  html(sec, `<div class="vh"><h1>Shift buddy</h1><p>Your shift hours, a break plan, only the nudges that matter, a checklist you can make your own, and a handover that writes itself. Everything stays in this browser.</p></div>
  <div class="three">
    <div class="panel"><div class="ph"><h3>Shift clock</h3><span class="muted small" id="shiftMode"></span></div>
      <div class="bignum" id="shiftClock">--:--:--</div><div class="bar"><i id="shiftBar"></i></div><p class="muted" id="shiftInfo"></p>
      <div class="field"><span class="l">My usual shift</span><div class="row"><input type="time" id="shStart" aria-label="Shift start"><span>to</span><input type="time" id="shEnd" aria-label="Shift end"></div>
        <div class="seg small" id="shPre"></div><label class="chk"><input type="checkbox" id="shAuto"> Start and stop automatically at these times</label></div>
      <div class="row"><button class="btn primary" id="shiftBtn"></button></div></div>
    <div class="panel"><div class="ph"><h3>Break plan</h3></div><ol class="breaks" id="breaks"></ol><p class="muted small">Short breaks every two hours beat one long one. Nobody triages well on hour nine without food.</p>
      <div class="focus" id="focus"></div></div>
    <div class="panel"><div class="ph"><h3>Nudges</h3><span class="muted small">only while you're on shift</span></div><div id="nudges"></div>
      <label class="chk"><input type="checkbox" id="shNotify"> Also show desktop notifications when this tab is in the background</label>
      <div class="field"><span class="l">Pop incidents</span><label class="chk"><input type="checkbox" id="popOn"> Surprise me with short scenarios</label>
        <label class="sortl">about every <select id="popEvery"><option value="20">20 min</option><option value="40">40 min</option><option value="60">hour</option><option value="120">2 hours</option></select></label></div></div>
  </div>
  <div class="two">
    <div class="panel"><div class="ph"><h3>Start-of-shift checklist</h3><span class="muted" id="ckCount"></span></div>
      <div id="checklist"></div>
      <div class="row"><input class="search grow" id="ckNew" placeholder="Add your own item" maxlength="160" aria-label="Add checklist item"><button class="btn sm" id="ckAdd">Add</button></div>
      <details class="sugg" open><summary>Suggestions <span class="muted small">tap to add</span></summary><div id="ckSugg" class="chips"></div></details>
      <button class="btn ghost sm" id="ckReset"><svg class="ic"><use href="#i-refresh"/></svg>New shift: clear the ticks</button></div>
    <div class="panel"><div class="ph"><h3>Handover</h3><span class="muted small">saved in this browser only</span></div>
      <p class="warn">Don't paste real hostnames, IPs, usernames or case details. Treat this like a sticky note on a shared screen.</p>
      <textarea id="pad" aria-label="Handover notes" maxlength="6000"></textarea>
      <div class="row"><button class="btn sm primary" id="padBuild">Build my handover</button><button class="btn sm" id="padCopy"><svg class="ic"><use href="#i-copy"/></svg>Copy</button><button class="btn ghost sm" id="padClear"><svg class="ic"><use href="#i-trash"/></svg>Clear</button></div></div>
  </div>`);
  const c = cfg();
  $("#shStart").value = c.start; $("#shEnd").value = c.end; $("#shAuto").checked = c.auto; $("#shNotify").checked = c.notify;
  const setTimes = (s, e) => { if (TIME.test(s) && TIME.test(e)) { saveCfg({ start: s, end: e, auto: true }); $("#shAuto").checked = true; $("#shStart").value = s; $("#shEnd").value = e; clock(); breaks(); } };
  $("#shStart").addEventListener("change", () => setTimes($("#shStart").value, $("#shEnd").value));
  $("#shEnd").addEventListener("change", () => setTimes($("#shStart").value, $("#shEnd").value));
  put($("#shPre"), PRESETS.map(([l, s, e]) => h("button", { onclick: () => setTimes(s, e) }, l)));
  $("#shAuto").addEventListener("change", () => { saveCfg({ auto: $("#shAuto").checked }); clock(); });
  $("#shNotify").addEventListener("change", async () => {
    if ($("#shNotify").checked && "Notification" in window && Notification.permission !== "granted") { const p = await Notification.requestPermission().catch(() => "denied"); if (p !== "granted") { $("#shNotify").checked = false; toast("Notifications are blocked for this site in your browser."); } }
    saveCfg({ notify: $("#shNotify").checked });
  });
  $("#shiftBtn").addEventListener("click", () => {
    const st = shiftState();
    if (st.on) { store.set("shiftManual", { s: st.s.getTime(), e: Date.now() }); sting("win"); toast("Shift ended. Go home. Drink water. Don't check the queue."); earn(5, "shift"); xp(10, "shift"); }
    else { const w = window_(); const len = w.len || 8 * 36e5; store.set("shiftManual", { s: Date.now(), e: Date.now() + len }); const k = ck(); k.done = []; saveCk(k); ckUI(); sfx("chime"); toast("Shift started. You've got this."); }
    clock();
  });
  const ps = popSettings(); $("#popOn").checked = ps.on; $("#popEvery").value = String(ps.every);
  $("#popOn").addEventListener("change", () => { store.set("popOn", $("#popOn").checked); emit("popSettings"); });
  $("#popEvery").addEventListener("change", () => { store.set("popEvery", +$("#popEvery").value); emit("popSettings"); });
  nudgesUI(); ckUI(); breaks(); focus(); clock(); setInterval(clock, 1000);
  $("#ckAdd").addEventListener("click", addItem); $("#ckNew").addEventListener("keydown", (e) => { if (e.key === "Enter") addItem(); });
  $("#ckReset").addEventListener("click", () => { const k = ck(); k.done = []; saveCk(k); ckUI(); toast("Ticks cleared for a new shift."); });
  $("#pad").value = str(store.get("pad", ""), 6000); $("#pad").addEventListener("input", () => store.set("pad", $("#pad").value));
  $("#padCopy").addEventListener("click", () => copyText($("#pad").value, "Handover copied"));
  $("#padClear").addEventListener("click", () => { $("#pad").value = ""; store.set("pad", ""); });
  $("#padBuild").addEventListener("click", buildHandover);
  load("cves").then(() => ckUI());
}

function clock() {
  if (!$("#shiftClock")) return; const st = shiftState(); const now = new Date();
  $("#shiftMode").textContent = st.manual ? "started manually" : cfg().auto ? "automatic" : "manual";
  if (st.on) {
    const el = now - st.s, left = st.e - now; $("#shiftClock").textContent = fmtDur(el);
    $("#shiftBar").style.width = Math.min(100, (el / (st.e - st.s)) * 100) + "%";
    $("#shiftInfo").textContent = `${fmtDur(left).slice(0, 5)} to go · ends ${pad(st.e.getHours())}:${pad(st.e.getMinutes())}`;
    $("#shiftBtn").textContent = "End shift now";
  } else {
    const w = window_(); const next = w.s > now ? w.s : new Date(w.s.getTime() + 864e5);
    $("#shiftClock").textContent = "off shift"; $("#shiftBar").style.width = "0";
    $("#shiftInfo").textContent = `Next shift starts ${next.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}.`;
    $("#shiftBtn").textContent = "Start shift now";
  }
}
function breaks() {
  const w = window_(); const len = w.len / 36e5; const out = []; const fmt = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  for (let hr = 2; hr < len - 0.5; hr += 2) { const t = new Date(w.s.getTime() + hr * 36e5); const meal = Math.abs(hr - len / 2) < 1.01 && len >= 6; out.push([t, meal ? "Proper meal break, 30 minutes, away from the screen" : "10-minute break: walk, water, no phone"]); }
  out.push([new Date(w.e.getTime() - 30 * 60e3), "Write the handover"]);
  const now = new Date();
  put($("#breaks"), out.map(([t, d]) => h("li" + (t < now && w.on ? ".past" : ""), h("b.mono", fmt(t)), " ", d)));
}
function nudgesUI() {
  const c = cfg(); const groups = [...new Set(NUDGES.map((n) => n.g))];
  put($("#nudges"), groups.map((g) => h("div.ngroup", h("p.ng", g), NUDGES.filter((n) => n.g === g).map((n) => h("label.toggle", h("input", { type: "checkbox", checked: c.nudges[n.id] ? true : null, onchange: (e) => { const x = cfg().nudges; x[n.id] = e.target.checked; saveCfg({ nudges: x }); } }),
    h("span", n.t, n.every ? h("span.muted.small", ` · every ${n.every} min`) : null), h("button.linkbtn.small", { type: "button", onclick: (e) => { e.preventDefault(); toast(n.msg[0]); } }, "preview"))))));
}
function ckUI() {
  const k = ck(); const box = $("#checklist"); if (!box) return;
  put(box, k.items.map((it) => h("div.ckrow" + (k.done.includes(it) ? ".done" : ""),
    h("label.chk.grow", h("input", { type: "checkbox", checked: k.done.includes(it) ? true : null, onchange: (e) => {
      const kk = ck(); kk.done = e.target.checked ? [...new Set([...kk.done, it])] : kk.done.filter((x) => x !== it); saveCk(kk);
      if (e.target.checked) { sfx("tick"); if (kk.items.every((x) => kk.done.includes(x))) { sting("win"); toast("Checklist done. Now the queue."); earn(4, "checklist"); xp(8, "checklist"); } }
      ckUI();
    } }), h("span", it)),
    h("button.xbtn.sm", { "aria-label": `Remove: ${it}`, title: "Remove", onclick: () => { const kk = ck(); kk.items = kk.items.filter((x) => x !== it); kk.done = kk.done.filter((x) => x !== it); saveCk(kk); ckUI(); } }, "×"))));
  $("#ckCount").textContent = `${k.done.filter((x) => k.items.includes(x)).length}/${k.items.length}`;
  const live = cveList(loaded("cves")).filter((x) => x.kev).slice(0, 2).map((x) => `Check exposure to ${x.id} (${[x.vendor, x.product].filter(Boolean).join(" ")}), newly exploited`);
  const role = profile().role === "SOC manager" ? ["Check team workload and who needs a break", "Review overnight escalations with the lead"] : profile().role === "Detection eng" ? ["Review rules that fired most yesterday", "Check the fresh rules in the Detection lab"] : [];
  const sugg = [...live, ...role, ...SUGGEST].filter((s) => !k.items.includes(s));
  put($("#ckSugg"), sugg.slice(0, 12).map((s) => h("button.chip", { onclick: () => { const kk = ck(); kk.items.push(s); saveCk(kk); sfx("pop"); ckUI(); } }, "+ ", s)));
}
function addItem() { const v = $("#ckNew").value.replace(/[<>]/g, "").trim().slice(0, 160); if (!v) return; const k = ck(); if (!k.items.includes(v)) k.items.push(v); saveCk(k); $("#ckNew").value = ""; ckUI(); }

function buildHandover() {
  const st = shiftState(); const k = ck(); const d = today(); const p = profile();
  const fmt = (x) => `${pad(x.getHours())}:${pad(x.getMinutes())}`;
  const lines = [
    `HANDOVER · ${new Date().toLocaleDateString()} · ${fmt(st.s)}–${fmt(st.e)}${p.name ? ` · ${p.name}` : ""}`, "",
    "Checklist:", ...k.items.map((x) => `  [${k.done.includes(x) ? "x" : " "}] ${x}`), "",
    `Desk: ${d.tickets || 0} tickets routed, ${d.bounced || 0} bounced to IT/Network.`,
    "", "Open items:", "  - ", "", "Watch out for:", "  - ", "", "Notes:", ($("#pad").value.split("Notes:").pop() || "").trim(),
  ];
  const kev = cveList(loaded("cves")).filter((x) => x.kev).slice(0, 3);
  if (kev.length) lines.splice(lines.indexOf("Watch out for:") + 1, 1, ...kev.map((x) => `  - ${x.id} (${[x.vendor, x.product].filter(Boolean).join(" ")}) is newly exploited. Exposure checked?`));
  $("#pad").value = lines.join("\n"); store.set("pad", $("#pad").value); sfx("chime");
}

// ---------- focus timer ----------
let ftimer = 0;
function focus() {
  const box = $("#focus"); let end = num(store.get("focusEnd", 0)); let mode = str(store.get("focusMode", "focus"), 10);
  const label = h("b.midnum", "25:00"); const btn = h("button.btn.sm");
  const draw = () => { const left = end - Date.now(); if (end && left > 0) { label.textContent = fmtDur(left).slice(3); btn.textContent = "Stop"; } else { label.textContent = mode === "break" ? "05:00" : "25:00"; btn.textContent = mode === "break" ? "Start 5-min break" : "Start 25-min focus"; if (end && left <= 0) { end = 0; store.set("focusEnd", 0); sting("win"); toast(mode === "focus" ? "Focus block done. Take five." : "Break over. Back to it."); mode = mode === "focus" ? "break" : "focus"; store.set("focusMode", mode); } } };
  btn.addEventListener("click", () => { if (end && end > Date.now()) { end = 0; } else { end = Date.now() + (mode === "break" ? 5 : 25) * 60e3; sfx("chime"); } store.set("focusEnd", end); draw(); });
  put(box, h("p.l", "Focus timer"), h("div.row", label, btn)); clearInterval(ftimer); ftimer = setInterval(draw, 1000); draw();
}

