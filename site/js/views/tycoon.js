// SOC Tycoon: build a SOC. Hire, automate, take contracts, survive incidents, avoid burnout.
import { $, h, html, put, store, obj, num, arr, fmtNum, toast, rnd, pick, shuffle, visible, icon, modal } from "../core.js";
import { sfx, sting } from "../audio.js";
import { earn, xp, bump } from "../state.js";

const GEN = [
  { id: "l1", n: "L1 analyst", d: "Coffee in, triage out.", c: 15, r: 0.6, room: "floor", burn: 1 },
  { id: "rule", n: "Detection rule", d: "Catches the obvious so people don't have to.", c: 110, r: 3, room: "lab", burn: 0 },
  { id: "hunter", n: "Threat hunter", d: "Finds what the rules missed. Needs quiet.", c: 900, r: 16, room: "floor", burn: 1.5 },
  { id: "soar", n: "SOAR playbook", d: "Enrich, ticket, close. While you sleep.", c: 6500, r: 70, room: "auto", burn: -0.5 },
  { id: "ti", n: "Threat intel feed", d: "Knows the bad IPs before they knock.", c: 52000, r: 380, room: "intel", burn: 0 },
  { id: "ai", n: "AI copilot", d: "Drafts verdicts. You approve them. Mostly right.", c: 420000, r: 2100, room: "ai", burn: -1 },
  { id: "mssp", n: "MSSP partner", d: "A whole SOC, somewhere else, overnight.", c: 4.5e6, r: 13000, room: "mssp", burn: -2 },
];
const ROOMS = [["floor", "SOC floor", 0], ["lab", "Detection lab", 110], ["auto", "Automation room", 6500], ["intel", "Intel desk", 52000], ["ai", "AI pod", 420000], ["mssp", "MSSP wing", 4.5e6]];
const UPG = [
  { id: "kbd", n: "Mechanical keyboard", d: "Manual triage x3. Louder too.", c: 150, click: 3 },
  { id: "coffee", n: "Proper coffee machine", d: "Analysts x2. Burnout recovers faster.", c: 600, gen: "l1", mult: 2, calm: 1 },
  { id: "tune", n: "Tuning sprint", d: "Detection rules x2. Fewer false positives.", c: 2500, gen: "rule", mult: 2, need: { rule: 5 } },
  { id: "sigma", n: "Sigma library", d: "Detection rules x3.", c: 22000, gen: "rule", mult: 3, need: { rule: 15 } },
  { id: "quiet", n: "Quiet room", d: "Hunters x2, burnout -25%.", c: 12000, gen: "hunter", mult: 2, calm: 1, need: { hunter: 3 } },
  { id: "runbook", n: "Runbooks for everything", d: "SOAR x2.", c: 60000, gen: "soar", mult: 2, need: { soar: 5 } },
  { id: "mfa", n: "MFA everywhere", d: "Everything x1.5. Half the incidents just stop.", c: 180000, all: 1.5 },
  { id: "ctifusion", n: "Intel fusion cell", d: "Threat intel x3.", c: 700000, gen: "ti", mult: 3, need: { ti: 5 } },
  { id: "guard", n: "AI guardrails", d: "AI copilots x2. Prompt injection stops working.", c: 3e6, gen: "ai", mult: 2, need: { ai: 3 } },
  { id: "fourday", n: "Four-day week", d: "Burnout can't go above 50%. Everyone x1.25.", c: 1.2e7, all: 1.25, calm: 2 },
];
const CONTRACTS = [
  { n: "Retail client: triage the holiday rush", goal: 60, secs: 45 }, { n: "Hospital: overnight monitoring", goal: 120, secs: 60 },
  { n: "Bank: audit evidence by Friday", goal: 200, secs: 75 }, { n: "Start-up: 'we just need SOC 2'", goal: 90, secs: 50 },
  { n: "Council: ransomware scare", goal: 160, secs: 60 }, { n: "Airline: new booking system goes live", goal: 250, secs: 90 },
];
const EVENTS = [
  { t: "Ransomware on a file server!", a: ["Isolate it now", "Wait for the change board"], good: 0, win: "Contained in minutes. The board sends cake.", lose: "It spread. Overtime for everyone." },
  { t: "The CISO wants a dashboard by 5pm.", a: ["Make one good chart", "Make 40 charts"], good: 0, win: "One clear chart. The CISO nods. Rare.", lose: "Nobody read the 40 charts. Morale dipped." },
  { t: "A vendor offers an 'AI-powered single pane of glass'.", a: ["Ask for a proper trial", "Sign the 3-year deal"], good: 0, win: "The trial showed it's fine. You negotiated a discount.", lose: "Another pane. Still not single. Budget gone." },
  { t: "Patch Tuesday: 3 exploited zero-days.", a: ["Patch edge and DCs first", "Patch everything at once on Friday"], good: 0, win: "Risk down, nothing broke. Textbook.", lose: "Friday deploy. Saturday outage. Classic." },
  { t: "An analyst has worked 9 nights in a row.", a: ["Send them home", "Ask for one more"], good: 0, win: "They came back sharper. Burnout drops.", lose: "They missed an obvious alert. Burnout rises." },
  { t: "Red team found an exposed RDP server.", a: ["Close it and hunt", "Ignore, it's just the red team"], good: 0, win: "Closed, and you found a real intruder too.", lose: "The real attackers found it next." },
];
const ACH = [[100, "First hundred"], [1e4, "Ten thousand alerts"], [1e6, "A million triaged"], [1e8, "Industrial scale"], [1e10, "Global SOC"]];

let S, timer = 0, goldT = 0, eventT = 0, lastSave = 0;
function load() {
  const s = obj(store.get("tycoon2", {}));
  return {
    total: num(s.total, 0, 0), bank: num(s.bank, 0, 0), owned: Object.fromEntries(GEN.map((g) => [g.id, num(obj(s.owned)[g.id], 0, 0, 1e6)])),
    ups: arr(s.ups).filter((u) => UPG.some((x) => x.id === u)), lessons: num(s.lessons, 0, 0, 1e6), burn: num(s.burn, 0, 0, 100),
    boost: num(s.boost, 0, 0), ach: arr(s.ach).filter((x) => typeof x === "number"), contract: s.contract && typeof s.contract === "object" ? s.contract : null,
    t: num(s.t, Date.now()), clicks: num(s.clicks, 0, 0),
  };
}
const save = () => { S.t = Date.now(); store.set("tycoon2", S); };
const has = (id) => S.ups.includes(id);
const cost = (g) => Math.ceil(g.c * Math.pow(1.15, S.owned[g.id]));
function mult(gid) {
  let m = 1 + S.lessons * 0.1;
  for (const u of UPG) if (has(u.id)) { if (u.gen === gid) m *= u.mult; if (u.all) m *= u.all; }
  return m;
}
function burnFactor() { return 1 - Math.min(0.6, S.burn / 100 * 0.6); }
function rate() {
  let r = 0; for (const g of GEN) r += S.owned[g.id] * g.r * mult(g.id);
  return r * burnFactor() * (S.boost > Date.now() ? 3 : 1);
}
const clickVal = () => Math.max(1, Math.round((1 + rate() * 0.03) * (has("kbd") ? 3 : 1)));

export async function mount(sec) {
  S = load();
  const away = Math.min(2 * 3600, (Date.now() - S.t) / 1000);
  if (away > 60) { const gain = rate() * away * 0.25; S.total += gain; S.bank += gain; save(); setTimeout(() => toast(`While you were away your SOC triaged ${fmtNum(gain)} alerts.`), 600); }
  html(sec, `<div class="vh"><h1>SOC tycoon</h1><p>Build the SOC you wish you worked in. Hire people, automate the boring parts, take on client contracts, and don't burn your team out. It keeps running while this tab is open, and at a quarter speed for up to two hours while you're away.</p></div>
  <div class="tyhud panel">
    <div><span class="muted small">budget</span><b class="bignum" id="tyBank">0</b></div>
    <div><span class="muted small">alerts per second</span><b class="midnum" id="tyRate">0</b></div>
    <div><span class="muted small">burnout</span><div class="bar burn"><i id="tyBurn"></i></div><span class="small muted" id="tyBurnT"></span></div>
    <div><span class="muted small">lessons learned</span><b class="midnum" id="tyLes">0</b></div>
    <button class="tyclick" id="tyClick"><svg class="ic"><use href="#i-eye"/></svg><span>Triage an alert</span><b id="tyClickV">+1</b></button>
  </div>
  <div class="two wide-left">
    <div>
      <div class="floor panel" id="floor" aria-label="Your SOC floor"></div>
      <div class="panel" id="tyContract"></div>
      <div class="panel"><div class="ph"><h3>Hire and build</h3><span class="muted small">cost rises 15% per purchase</span></div><div id="tyGens"></div></div>
    </div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>Upgrades</h3></div><div id="tyUps" class="upgs"></div></div>
      <div class="panel"><div class="ph"><h3>Achievements</h3></div><div id="tyAch"></div></div>
      <div class="panel"><div class="ph"><h3>Post-incident review</h3></div><div id="tyPrestige"></div></div>
      <div class="panel"><div class="ph"><h3>Floor log</h3></div><ul class="tylog" id="tyLog"></ul></div>
    </div>
  </div>`);
  $("#tyClick").addEventListener("click", (e) => {
    const v = clickVal(); S.total += v; S.bank += v; S.clicks++; sfx("clack");
    const f = h("span.tyfloat", "+" + fmtNum(v)); const r = $("#tyClick").getBoundingClientRect(); f.style.left = e.clientX - r.left + "px"; f.style.top = e.clientY - r.top + "px"; $("#tyClick").append(f); setTimeout(() => f.remove(), 800);
    if (S.contract) S.contract.got += 1; hud();
  });
  renderAll();
  clearInterval(timer); timer = setInterval(tick, 250);
  goldT = performance.now() + 20000 + rnd() * 30000; eventT = performance.now() + 60000 + rnd() * 60000;
}
export function show() { if (S) renderAll(); }
export function hide() { if (S) save(); }

let lastTick = performance.now();
function tick() {
  const now = performance.now(); const dt = Math.min(1, (now - lastTick) / 1000); lastTick = now;
  if (!visible()) return;
  const g = rate() * dt; S.total += g; S.bank += g;
  // burnout: people without automation get tired; calm upgrades help
  let pressure = 0; for (const x of GEN) pressure += S.owned[x.id] * x.burn;
  const calm = UPG.filter((u) => has(u.id) && u.calm).reduce((a, u) => a + u.calm, 0);
  S.burn = Math.max(0, Math.min(has("fourday") ? 50 : 100, S.burn + (pressure * 0.004 - 0.05 - calm * 0.08) * dt * 10));
  if (S.contract) {
    S.contract.got += rate() > 0 ? dt * Math.min(5, rate() / 50) : 0;
    if (Date.now() > S.contract.end) { const ok = S.contract.got >= S.contract.goal; const pay = S.contract.pay;
      if (ok) { S.bank += pay; S.total += pay; sting("win"); logLine(`Contract done: ${S.contract.n}. +${fmtNum(pay)} budget.`); earn(4, "contract"); } else { sting("fail"); S.burn = Math.min(100, S.burn + 10); logLine(`Contract missed: ${S.contract.n}. The client is "disappointed".`); }
      S.contract = null; contractUI(); }
    else contractUI(true);
  }
  for (const [n, name] of ACH) if (S.total >= n && !S.ach.includes(n)) { S.ach.push(n); toast(`Achievement: ${name}`); earn(6, "tycoon"); xp(10, "tycoon"); sting("level"); achUI(); }
  if (now > goldT && location.hash === "#tycoon") { goldT = now + 40000 + rnd() * 50000; golden(); }
  if (now > eventT && location.hash === "#tycoon") { eventT = now + 90000 + rnd() * 90000; event(); }
  hud();
  if (now - lastSave > 5000) { lastSave = now; save(); gensUI(true); upsUI(true); }
}
function hud() {
  if (!$("#tyBank")) return;
  $("#tyBank").textContent = fmtNum(S.bank); $("#tyRate").textContent = fmtNum(rate()) + (S.boost > Date.now() ? " ×3" : "");
  $("#tyClickV").textContent = "+" + fmtNum(clickVal()); $("#tyLes").textContent = String(S.lessons);
  const b = $("#tyBurn"); b.style.width = S.burn + "%"; b.className = S.burn > 70 ? "hot" : S.burn > 40 ? "warm" : "";
  $("#tyBurnT").textContent = S.burn > 70 ? "Your team is fried. Output is way down." : S.burn > 40 ? "Getting tired. Automate or buy calm." : "Fresh and caffeinated.";
}
function renderAll() { hud(); floorUI(); gensUI(); upsUI(); achUI(); prestigeUI(); contractUI(); }

function floorUI() {
  const box = $("#floor"); if (!box) return;
  put(box, ROOMS.map(([id, name, unlock]) => {
    const open = S.total >= unlock || GEN.some((g) => g.room === id && S.owned[g.id] > 0);
    const units = GEN.filter((g) => g.room === id).flatMap((g) => Array.from({ length: Math.min(12, S.owned[g.id]) }, () => g.id));
    return h("div.room" + (open ? "" : ".locked"), h("p.rname", name, open ? "" : ` · unlocks at ${fmtNum(unlock)} alerts`),
      h("div.desks", open ? (units.length ? units.map((u, i) => h("span.unit.u-" + u, { title: GEN.find((g) => g.id === u).n }, h("i.screen"), h("i.body"))) : h("span.muted.small", "empty")) : null));
  }));
}
function gensUI(soft = false) {
  const box = $("#tyGens"); if (!box) return;
  if (soft) { [...box.children].forEach((row) => { const g = GEN.find((x) => x.id === row.dataset.id); row.querySelector("button").disabled = S.bank < cost(g); row.querySelector(".c").textContent = fmtNum(cost(g)); }); return; }
  put(box, GEN.map((g) => h("div.genrow", { dataset: { id: g.id } },
    h("span.unit.mini.u-" + g.id, h("i.screen"), h("i.body")),
    h("div.grow", h("b", g.n), h("span.muted.small", ` ×${S.owned[g.id]} · ${fmtNum(g.r * mult(g.id))}/s each`), h("p.small.muted", g.d)),
    h("button.btn.sm", { disabled: S.bank < cost(g), onclick: () => buy(g) }, "Hire ", h("span.c", fmtNum(cost(g)))))));
}
function buy(g) {
  const c = cost(g); if (S.bank < c) return; S.bank -= c; S.owned[g.id]++; sfx("coin");
  logLine(pick([`Hired: ${g.n}.`, `New ${g.n} on the floor.`, `${g.n} onboarded. Welcome pack: one mug.`])); save(); renderAll();
}
function upsUI(soft = false) {
  const box = $("#tyUps"); if (!box) return;
  const avail = UPG.filter((u) => !has(u.id) && Object.entries(u.need || {}).every(([k, v]) => S.owned[k] >= v));
  if (soft && box.children.length === avail.length) { [...box.children].forEach((b) => { const u = UPG.find((x) => x.id === b.dataset.id); if (u) b.disabled = S.bank < u.c; }); return; }
  put(box, avail.length ? avail.slice(0, 6).map((u) => h("button.upg", { dataset: { id: u.id }, disabled: S.bank < u.c, onclick: () => { if (S.bank < u.c) return; S.bank -= u.c; S.ups.push(u.id); sting("combo"); logLine(`Upgrade: ${u.n}.`); save(); renderAll(); } },
    h("b", u.n), h("span.small", u.d), h("span.muted.small", fmtNum(u.c)))) : [h("p.muted.small", "Hire more to unlock upgrades.")]);
}
function achUI() { const box = $("#tyAch"); if (!box) return; put(box, h("div.achs", ACH.map(([n, name]) => h("span.ach" + (S.ach.includes(n) ? ".on" : ""), { title: `${fmtNum(n)} alerts` }, icon(S.ach.includes(n) ? "star" : "lock"), name)))); }
function prestigeUI() {
  const box = $("#tyPrestige"); if (!box) return; const gain = Math.floor(Math.sqrt(S.total / 1e6));
  put(box, h("p.small", "Hold a post-incident review: start over with lessons learned. Each lesson makes everything 10% faster, forever."),
    h("p", `You'd gain ${gain} lesson${gain === 1 ? "" : "s"}.`), h("button.btn.sm", { disabled: gain < 1, onclick: () => {
      if (gain < 1) return; S = { ...load(), total: 0, bank: 0, owned: Object.fromEntries(GEN.map((g) => [g.id, 0])), ups: [], burn: 0, contract: null, lessons: S.lessons + gain, ach: S.ach };
      bump("tycoonPrestige"); earn(15, "prestige"); sting("level"); save(); renderAll(); logLine("Post-incident review done. Lessons learned, as always.");
    } }, "Hold the review"));
}
function contractUI(soft = false) {
  const box = $("#tyContract"); if (!box) return;
  if (!S.contract) {
    if (soft) return;
    const c = CONTRACTS[Math.floor(rnd() * CONTRACTS.length)]; const pay = Math.max(100, Math.round((rate() + 2) * c.secs * 1.5));
    put(box, h("div.ph", h("h3", "Client contract"), h("span.muted.small", "optional")), h("p", h("b", c.n), ` · handle ${c.goal} cases in ${c.secs} seconds · pays ${fmtNum(pay)}`),
      h("p.muted.small", "Every click is a case, and your team handles cases too. Miss it and burnout goes up."),
      h("button.btn.sm.primary", { onclick: () => { S.contract = { n: c.n, goal: c.goal, got: 0, end: Date.now() + c.secs * 1000, pay }; sfx("pager"); contractUI(); } }, "Take the contract"),
      h("button.btn.sm.ghost", { onclick: () => contractUI() }, "Another one"));
    return;
  }
  const c = S.contract; const left = Math.max(0, Math.ceil((c.end - Date.now()) / 1000)); const pct = Math.min(100, (c.got / c.goal) * 100);
  if (soft && box.querySelector(".cbar")) { box.querySelector(".cbar i").style.width = pct + "%"; box.querySelector(".cleft").textContent = `${Math.floor(c.got)}/${c.goal} cases · ${left}s left`; return; }
  put(box, h("div.ph", h("h3", "Contract in progress"), h("span.muted.small.cleft", `${Math.floor(c.got)}/${c.goal} cases · ${left}s left`)), h("p", c.n), h("div.bar.cbar", h("i", { "data-w": pct })));
}
function golden() {
  const floor = $("#floor"); if (!floor) return;
  const g = h("button.goldalert", { "aria-label": "Golden alert, click for a boost" }, icon("bolt"), "True positive!");
  g.style.left = 10 + rnd() * 70 + "%"; g.style.top = 10 + rnd() * 60 + "%";
  g.addEventListener("click", () => { S.boost = Date.now() + 20000; sting("combo"); logLine("Golden alert: a real true positive. Everyone x3 for 20 seconds."); g.remove(); hud(); });
  floor.append(g); setTimeout(() => g.remove(), 8000);
}
function event() {
  const e = pick(EVENTS); sfx("pager");
  const close = modal([h("p.muted.small", "Floor event"), h("h2", e.t), h("div.row", shuffle(e.a.map((a, i) => [a, i])).map(([a, i]) => h("button.btn", { onclick: () => {
    const ok = i === e.good; close();
    if (ok) { const pay = Math.round((rate() + 5) * 30); S.bank += pay; S.total += pay; S.burn = Math.max(0, S.burn - 10); sting("win"); logLine(`${e.win} +${fmtNum(pay)}.`); }
    else { S.bank = Math.max(0, S.bank * 0.9); S.burn = Math.min(100, S.burn + 15); sting("fail"); logLine(`${e.lose}`); }
    hud(); save();
  } }, a)))], { label: "Floor event" });
}
function logLine(t) { const ul = $("#tyLog"); if (!ul) return; ul.prepend(h("li", t)); while (ul.children.length > 8) ul.lastChild.remove(); }
