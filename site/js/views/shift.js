// Shift buddy: custom shift hours, break plan, essential nudges, checklist with suggestions,
// handover builder, focus timer and an analyst toolbox. All local to this browser.
import { $, h, html, put, ext, store, obj, arr, num, str, pad, toast, copyText, emit, nextPatchTuesday, fmtDur, on } from "../core.js";
import { sfx, sting } from "../audio.js";
import { bump, earn, xp, today, profile } from "../state.js";
import { popSettings } from "../incidents.js";
import { loaded, load, cveList } from "../data.js";
import { unwrap, extract, classify, pivots, TYPE_NAME, defang, refang, homograph } from "../ti.js";

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
  </div>
  <div class="panel"><div class="ph"><h3>Analyst toolbox</h3><span class="muted small">runs in your browser, nothing is sent anywhere</span></div>
    <div class="seg tabs wraptabs" id="tbTabs"><button data-t="unwrap" class="on">Unwrap a link</button><button data-t="ioc">IOC extractor</button><button data-t="pivot">TI pivots</button><button data-t="headers">Email headers</button><button data-t="url">URL parser</button><button data-t="look">Lookalike domain</button><button data-t="time">Time converter</button><button data-t="defang">Defang / refang</button><button data-t="decode">Decode</button><button data-t="jwt">JWT</button><button data-t="cidr">CIDR</button><button data-t="hash">Hash type</button></div>
    <div id="toolbox"></div></div>`);
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
  $("#tbTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; [...$("#tbTabs").children].forEach((x) => x.classList.toggle("on", x === b)); tool(b.dataset.t); });
  tool("unwrap");
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

// ---------- toolbox ----------
function headers(raw) {
  const text = raw.replace(/\r/g, "").replace(/\n[ \t]+/g, " "); const get = (k) => (text.match(new RegExp(`^${k}:\\s*(.*)$`, "gim")) || []).map((l) => l.replace(new RegExp(`^${k}:\\s*`, "i"), ""));
  const dom = (s) => (String(s || "").match(/@([a-z0-9.-]+)/i) || [])[1]?.toLowerCase() || "";
  const from = get("From")[0] || "", rp = get("Return-Path")[0] || "", reply = get("Reply-To")[0] || "", mid = get("Message-ID")[0] || "";
  const auth = get("Authentication-Results").join(" ").toLowerCase(); const res = (k) => (auth.match(new RegExp(`${k}=(\\w+)`)) || [])[1] || "not found";
  const recv = get("Received"); const ips = [...new Set(recv.join(" ").match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [])];
  const flags = [];
  if (["fail", "softfail"].includes(res("spf"))) flags.push(`SPF ${res("spf")}: the sending server isn't allowed to send for that domain.`);
  if (res("dkim") === "none" || res("dkim") === "fail") flags.push(`DKIM ${res("dkim")}: the message isn't signed by the domain, or the signature broke.`);
  if (res("dmarc") === "fail") flags.push("DMARC fail: the visible From domain didn't pass. Strong sign of spoofing.");
  if (dom(from) && dom(rp) && dom(from) !== dom(rp)) flags.push(`From (${dom(from)}) and Return-Path (${dom(rp)}) differ. Common for newsletters, suspicious for banks and colleagues.`);
  if (dom(reply) && dom(reply) !== dom(from)) flags.push(`Reply-To goes to ${dom(reply)}, not ${dom(from)}. Replies would go to someone else: classic BEC.`);
  if (dom(mid) && dom(from) && !dom(mid).endsWith(dom(from).split(".").slice(-2).join("."))) flags.push(`Message-ID domain (${dom(mid)}) doesn't match the sender.`);
  const disp = (from.match(/^"?([^"<]+)"?\s*</) || [])[1]; if (disp && /@/.test(disp)) flags.push("The display name contains an email address. Phishers use it to show a fake sender.");
  return `From:          ${from}\nReturn-Path:   ${rp || "not found"}\nReply-To:      ${reply || "not set"}\nSubject:       ${get("Subject")[0] || ""}\nSPF / DKIM / DMARC: ${res("spf")} / ${res("dkim")} / ${res("dmarc")}\nHops:          ${recv.length}\nIPs in chain:  ${ips.join(", ") || "none"}\n\n${flags.length ? "Red flags:\n" + flags.map((x) => "• " + x).join("\n") : "No classic red flags. Still check links and attachments."}`;
}
function tool(t) {
  const box = $("#toolbox"); const inp = h("textarea.short", { spellcheck: "false", "aria-label": "Input" }); const out = h("pre.codebox.out");
  const run = (fn) => { const go = () => { try { out.textContent = fn(inp.value); } catch (e) { out.textContent = "Couldn't read that: " + String(e.message || e).slice(0, 120); } }; inp.addEventListener("input", go); go(); };
  if (t === "unwrap") {
    inp.placeholder = "Paste a SafeLinks, Proofpoint URL Defense, Google or other redirect link";
    inp.value = "https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Furldefense.com%2Fv3%2F__https%3A%2F%2Fexample.com%2Finvoice%3Fid%3D42__%3B!!AbC%24&data=05%7C02&reserved=0";
    run((v) => { const r = unwrap(v); if (!r.steps.length) return `No wrapper found.\n\nFinal URL: ${r.final}\nSafe to share: ${defang(r.final)}`;
      return r.steps.map((s, i) => `${i + 1}. ${s.how}\n   → ${s.to}`).join("\n") + `\n\nFinal URL:     ${r.final}\nSafe to share: ${defang(r.final)}`; });
    put(box, h("p.muted.small", "Strips Microsoft SafeLinks, Proofpoint URL Defense (v1, v2, v3), Barracuda, Google and common ?url= redirects, layer by layer. Nothing is opened or fetched."), inp, out);
  } else if (t === "ioc") {
    inp.placeholder = "Paste an alert, email body, report or log lines"; inp.classList.add("tall");
    inp.value = "User clicked hxxps://login-micros0ft[.]com/auth from 10.20.1.15. Payload a3f5c2e1d4b6978f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f dropped. C2 185.220.101[.]4. Reported by kevin@corp.example. Related: CVE-2026-10005.";
    run((v) => { const x = extract(v); const sec = (n, a, d = false) => a.length ? `${n} (${a.length})\n${a.map((y) => "  " + (d ? defang(y) : y)).join("\n")}` : "";
      return [sec("URLs", x.urls, true), sec("Domains", x.domains, true), sec("IPv4", x.ips), sec("Emails", x.emails), sec("SHA-256", x.sha256), sec("SHA-1", x.sha1), sec("MD5", x.md5), sec("CVEs", x.cves)].filter(Boolean).join("\n\n") || "No indicators found."; });
    put(box, h("p.muted.small", "Pulls URLs, domains, IPs, emails, hashes and CVEs out of messy text. Handles defanged input. URLs and domains come back defanged so you can paste them into a ticket safely."), inp, out,
      h("div.row", h("button.btn.sm", { onclick: () => copyText(out.textContent, "Indicators copied") }, "Copy all")));
  } else if (t === "pivot") {
    const o = h("div.pivot-out"); inp.placeholder = "One indicator: IP, domain, URL, hash, email, CVE or ATT&CK ID"; inp.value = "185.220.101.4";
    const go = () => { const ind = classify(inp.value); const pv = pivots(ind);
      put(o, ind.type === "empty" ? null : h("p.small", h("b", TYPE_NAME[ind.type]), " ", h("code", ind.value)), ind.private ? h("p.note", "Private or reserved address: check your own CMDB and EDR, not public intel.") : null,
        pv.length ? h("ul.pivots", pv.map(([l, u, why]) => h("li", ext(u, l), h("span.muted", why)))) : h("p.muted", "Not a type we can pivot on.")); };
    inp.addEventListener("input", go); go();
    put(box, h("p.muted.small", "Links only. Nothing is looked up until you click, and each opens in a new tab without a referrer."), inp, o);
  } else if (t === "headers") {
    inp.placeholder = "Paste the full email headers (in Outlook: File, Properties, Internet headers)"; inp.classList.add("tall");
    inp.value = "Return-Path: <bounce@mailer-x.top>\nReceived: from mailer-x.top (unknown [203.0.113.50]) by mx.corp.example\nAuthentication-Results: mx.corp.example; spf=fail smtp.mailfrom=mailer-x.top; dkim=none; dmarc=fail header.from=paypal.com\nFrom: \"PayPal Service\" <service@paypal.com>\nReply-To: helpdesk@paypa1-support.top\nSubject: Your account is limited\nMessage-ID: <abc123@mailer-x.top>";
    run(headers);
    put(box, h("p.muted.small", "Reads the authentication results, the sender chain and the classic mismatches. Parsed in your browser."), inp, out);
  } else if (t === "url") {
    inp.placeholder = "Paste a URL (defanged is fine)"; inp.value = "hxxps://login.microsoftonline.com.secure-verify[.]top:8443/common/oauth2/authorize?client_id=abc&redirect_uri=https%3A%2F%2Fevil.example%2Fcb#frag";
    run((v) => { const u = new URL(refang(v).trim()); const parts = u.hostname.split("."); const reg = parts.slice(-2).join(".");
      const q = [...u.searchParams].map(([k, val]) => `  ${k} = ${val}`).join("\n");
      return `Scheme:      ${u.protocol.replace(":", "")}\nHost:        ${u.hostname}\nReal owner:  ${reg}  (read hosts right to left)\nPort:        ${u.port || "default"}\nPath:        ${decodeURIComponent(u.pathname)}\n${q ? "Parameters:\n" + q + "\n" : ""}${u.hash ? "Fragment:    " + u.hash + "\n" : ""}${u.username ? "User info:   " + u.username + "  (text before @ is ignored by browsers: a classic trick)\n" : ""}\nSafe to share: ${defang(u.href)}`; });
    put(box, h("p.muted.small", "Splits a URL into parts and shows who really owns the host."), inp, out);
  } else if (t === "look") {
    inp.placeholder = "A domain, e.g. xn--pple-43d.com or rnicrosoft-login.co"; inp.value = "xn--pple-43d.com";
    run((v) => { const host = (() => { const x = refang(v).trim(); try { return new URL(x.includes("://") ? x : "http://" + x).hostname; } catch { return x; } })(); const r = homograph(host);
      return `Domain:  ${host}\n\n${r.notes.length ? r.notes.map((x) => "• " + x).join("\n") : "Nothing obviously deceptive. Still check the registration date with the TI pivots."}`; });
    put(box, h("p.muted.small", "Checks for punycode, mixed alphabets, brand lookalikes and security-sounding bolt-ons."), inp, out);
  } else if (t === "jwt") {
    inp.placeholder = "Paste a JWT (header.payload.signature)";
    // Built at runtime so no token-shaped string lives in the source (secret scanners rightly flag those).
    const b64u = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    inp.value = `${b64u({ alg: "none", typ: "JWT" })}.${b64u({ sub: "kevin", role: "admin", exp: 1700000000 })}.`;
    run((v) => { const [a, b] = v.trim().split("."); const dec = (x) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(x.length / 4) * 4, "=")), (c) => c.charCodeAt(0))));
      const hd = dec(a), pl = dec(b); const notes = [];
      if (String(hd.alg).toLowerCase() === "none") notes.push("alg is 'none': unsigned. Any server accepting this is broken.");
      for (const k of ["exp", "iat", "nbf"]) if (typeof pl[k] === "number") notes.push(`${k}: ${new Date(pl[k] * 1000).toISOString()}${k === "exp" && pl[k] * 1000 < Date.now() ? " (expired)" : ""}`);
      return `Header:\n${JSON.stringify(hd, null, 2)}\n\nPayload:\n${JSON.stringify(pl, null, 2)}${notes.length ? "\n\n" + notes.map((x) => "• " + x).join("\n") : ""}\n\nThe signature is not checked: decoding is not verifying.`; });
    put(box, h("p.warn", "Tokens are live credentials. Only paste expired or test tokens."), inp, out);
  } else if (t === "cidr") {
    inp.placeholder = "CIDR, optionally followed by an IP to test, e.g. 10.20.0.0/22 10.20.3.7"; inp.value = "10.20.0.0/22 10.20.3.7";
    run((v) => { const [cidr, test] = v.trim().split(/\s+/); const [ip, bits = "32"] = cidr.split("/"); const n = +bits;
      const toI = (x) => { const p = x.split(".").map(Number); if (p.length !== 4 || p.some((o) => !(o >= 0 && o <= 255))) throw new Error("not an IPv4 address"); return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]; };
      const toS = (i) => [24, 16, 8, 0].map((s) => (i >>> s) & 255).join("."); if (!(n >= 0 && n <= 32)) throw new Error("prefix must be 0 to 32");
      const mask = n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0; const net = (toI(ip) & mask) >>> 0; const bc = (net | (~mask >>> 0)) >>> 0; const size = 2 ** (32 - n);
      let o = `Network:    ${toS(net)}/${n}\nNetmask:    ${toS(mask)}\nFirst host: ${toS(n >= 31 ? net : net + 1)}\nLast host:  ${toS(n >= 31 ? bc : bc - 1)}\nBroadcast:  ${toS(bc)}\nAddresses:  ${size.toLocaleString()}`;
      if (test) o += `\n\n${test} is ${((toI(test) & mask) >>> 0) === net ? "INSIDE" : "outside"} this range.`; return o; });
    put(box, h("p.muted.small", "IPv4 subnet maths, and a quick 'is this IP in that range?' check."), inp, out);
  } else if (t === "time") {
    inp.placeholder = "1795449564 or 1795449564569 or 2026-11-23T08:00:00Z"; inp.value = String(Math.floor(Date.now() / 1000));
    run((v) => { v = v.trim(); if (!v) return ""; let d = /^\d{10}$/.test(v) ? new Date(+v * 1000) : /^\d{13}$/.test(v) ? new Date(+v) : /^\d{18}$/.test(v) ? new Date((+v / 1e4) - 11644473600000) : new Date(v);
      if (isNaN(d)) throw new Error("not a date or epoch"); return `UTC:      ${d.toISOString()}\nLocal:    ${d.toString()}\nEpoch s:  ${Math.floor(d / 1000)}\nEpoch ms: ${+d}\nAge:      ${fmtDur(Math.abs(Date.now() - d))} ${d > Date.now() ? "from now" : "ago"}`; });
    put(box, h("p.muted.small", "Paste epoch seconds, milliseconds, Windows FILETIME (18 digits) or an ISO date."), inp, out);
  } else if (t === "defang") {
    inp.placeholder = "Paste URLs, domains or IPs, one per line"; inp.value = "https://evil.example/login\n198.51.100.7";
    run((v) => v.split("\n").map((l) => /\[\.\]|hxxp/i.test(l) ? l.replace(/\[\.\]/g, ".").replace(/hxxp/gi, "http").replace(/\[:\]/g, ":") : l.replace(/\./g, "[.]").replace(/^http/i, "hxxp")).join("\n"));
    put(box, h("p.muted.small", "Defanged IOCs can't be clicked by accident. Already defanged? It refangs them."), inp, out);
  } else if (t === "decode") {
    inp.placeholder = "Base64, URL-encoded or hex"; inp.value = "SGVsbG8gZnJvbSB0aGUgU09D";
    run((v) => { v = v.trim(); const res = []; const printable = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");
      if (/^[A-Za-z0-9+/=\s_-]+$/.test(v) && v.replace(/\s/g, "").length % 4 !== 1) { try { const bin = atob(v.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/")); res.push("Base64 → " + printable(bin)); let u = ""; for (let i = 0; i + 1 < bin.length; i += 2) u += String.fromCharCode(bin.charCodeAt(i) | (bin.charCodeAt(i + 1) << 8)); if (/^[\x20-\x7e\s]+$/.test(u)) res.push("Base64 (UTF-16LE, PowerShell -enc) → " + u); } catch { /* not base64 */ } }
      if (/%[0-9a-f]{2}/i.test(v)) { try { res.push("URL → " + decodeURIComponent(v)); } catch { /* bad */ } }
      if (/^(0x)?([0-9a-f]{2}\s?)+$/i.test(v)) res.push("Hex → " + printable(v.replace(/^0x|\s/gi, "").match(/../g).map((x) => String.fromCharCode(parseInt(x, 16))).join("")));
      return res.join("\n\n") || "Doesn't look like base64, URL encoding or hex."; });
    put(box, h("p.muted.small", "Decodes in your browser. Nothing is executed. Never paste real case data into online decoders."), inp, out);
  } else {
    inp.placeholder = "Paste a hash"; inp.value = "44d88612fea8a8f36de82e1278abb02f";
    run((v) => { v = v.trim(); const L = { 32: "MD5 (or NTLM)", 40: "SHA-1", 56: "SHA-224", 64: "SHA-256", 96: "SHA-384", 128: "SHA-512" };
      if (/^\$2[aby]\$/.test(v)) return "bcrypt"; if (/^\$argon2/.test(v)) return "Argon2"; if (/^\$6\$/.test(v)) return "SHA-512 crypt (Linux /etc/shadow)";
      if (!/^[0-9a-f]+$/i.test(v)) return "Not a hex hash."; return `${v.length} hex characters → ${L[v.length] || "unknown length"}`; });
    put(box, h("p.muted.small", "Identify a hash by its length and format."), inp, out);
  }
}
