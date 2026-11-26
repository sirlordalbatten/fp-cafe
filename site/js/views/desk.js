// The desk: tickets walk in all day. Route them, bounce what isn't yours, keep the CISO calm.
import { $, h, html, put, store, arr, obj, num, str, pick, fresh, rnd, toast, on, emit, typeText, todayKey, shuffle } from "../core.js";
import { sfx, sfx2, sting } from "../audio.js";
import { avatar } from "../art.js";
import { bump, earn, xp, today } from "../state.js";
import { loaded, load, cveList } from "../data.js";
import { CAST, ROUTES, WRONG, CISO_LINES, CISO_STATES, CH_LABEL, CH_SOUND, TOOLS, PEBKAC } from "../content/legacy.js";
import { T, LIVE, VARS } from "../content/tickets.js";
import { genTicket, SCENE_COUNT } from "../content/deskgen.js";

const MAX_Q = 6;
let q = [], ciso = 70, arrive = 0, feedback = [];

function fill(s, extra = {}) { return s.replace(/\{(\w+)\}/g, (_, k) => extra[k] ?? (VARS[k] ? pick(VARS[k]) : k)); }
function makeTicket() {
  let tpl = null, extra = {};
  if (rnd() < 0.22) {
    const c = cveList(loaded("cves")).filter((x) => x.kev).slice(0, 10);
    const n = (loaded("news")?.security || []).slice(0, 15);
    const live = fresh("liveTicket", LIVE.map((_, i) => i), (x) => x, 0.5);
    if (live < 2 && c.length) { const x = pick(c); tpl = LIVE[live]; extra = { vendor: x.vendor || "a vendor", product: x.product || "that product", id: x.id }; }
    else if (live === 2 && n.length) { tpl = LIVE[2]; extra = { headline: pick(n).t.slice(0, 110) }; }
  }
  const id = Math.random().toString(36).slice(2, 10);
  if (!tpl && rnd() < 0.65) {
    const g = genTicket(rnd, fresh("deskScene", [...Array(SCENE_COUNT).keys()], (x) => x, 0.6));
    return { id, f: g.p ? "gen" : g.f, p: g.p || undefined, ch: g.ch, m: g.m, a: g.a, w: g.w, at: Date.now() };
  }
  if (!tpl) tpl = T[fresh("deskT", T.map((_, i) => i), (x) => x, 0.75)];
  const from = pick(tpl.f);
  return { id, f: from, ch: pick(tpl.ch), m: fill(tpl.m, extra), a: tpl.a, w: tpl.w, at: Date.now() };
}
function load_() {
  const HEX = /^#[0-9A-Fa-f]{6}$/;
  const okP = (p) => p && typeof p === "object" && p.a && ["bg", "skin", "hair", "shirt"].every((k) => HEX.test(p.a[k])) && ["short", "long", "bun", "bald", "cap"].includes(p.a.style);
  q = arr(store.get("deskQ", [])).filter((t) => t && (CAST[t.f] || (t.f === "gen" && okP(t.p))) && ROUTES.some((r) => r[0] === t.a)).map((t) => ({
    id: str(t.id, 12), f: t.f, p: t.f === "gen" ? { n: str(t.p.n, 24), t: str(t.p.t, 30), a: { bg: t.p.a.bg, skin: t.p.a.skin, hair: t.p.a.hair, shirt: t.p.a.shirt, style: t.p.a.style, acc: ["none", "glasses", "headset", "tie", "hoodie"].includes(t.p.a.acc) ? t.p.a.acc : "none" } } : undefined,
    ch: CH_LABEL[t.ch] ? t.ch : "chat", m: str(t.m, 400), a: t.a, w: str(t.w, 300), at: num(t.at, Date.now()) })).slice(0, MAX_Q);
  ciso = num(store.get("ciso", 70), 70, 0, 100);
}
const who = (t) => t.p || CAST[t.f];
const save = () => { store.set("deskQ", q); store.set("ciso", ciso); };

export function addTicket(quiet = false) {
  if (q.length >= MAX_Q) { ciso = Math.max(0, ciso - 4); save(); return; }
  const t = makeTicket(); q.push(t); save();
  if (!quiet) { sfx2(CH_SOUND[t.ch] || "ping"); toast(`${who(t).n} (${CH_LABEL[t.ch]}): "${t.m.slice(0, 60)}${t.m.length > 60 ? "…" : ""}"`); }
  badge(); if ($("#deskQueue")) renderQueue();
}
function badge() { const b = $("#deskCount"); if (b) { b.hidden = !q.length; b.textContent = q.length; } }

function schedule() {
  clearTimeout(arrive);
  arrive = setTimeout(() => { if (document.visibilityState === "visible") addTicket(); schedule(); }, (2 + rnd() * 4) * 60e3);
}
export function startDesk() { load_(); if (!q.length) { addTicket(true); addTicket(true); } badge(); schedule(); }

export async function mount(sec) {
  html(sec, `
  <div class="vh"><h1>The desk</h1><p>A small SOC: you, the queue, and everyone in the building who thinks you're the helpdesk. Route each one. Bounce what isn't yours. Keep the CISO calm.</p></div>
  <div class="deskgrid">
    <div class="panel queue"><div class="ph"><h3>The queue</h3><span class="muted" id="qInfo"></span><button class="btn sm" id="coffeeBtn"><svg class="ic"><use href="#i-brew"/></svg>Make a coffee</button><button class="btn ghost sm" id="nextT"><svg class="ic"><use href="#i-plus"/></svg>Next walk-in</button></div>
      <div class="desknote" id="deskNote" aria-live="polite"></div><div id="deskQueue"></div></div>
    <aside class="stack">
      <div class="panel"><div class="ph"><h3>The CISO</h3></div><div id="cisoBox"></div></div>
      <div class="panel"><div class="ph"><h3>Today at the desk</h3></div><div class="deskstats" id="deskStats"></div></div>
      <div class="panel"><div class="ph"><h3>Tool status</h3><span class="muted">made up, but you know it's true</span></div><div id="tools"></div><div class="toolreply" id="toolReply" aria-live="polite"></div><p class="jarline" id="jar"></p></div>
      <div class="panel"><div class="ph"><h3>The PEBKAC wall</h3><button class="btn ghost sm" id="pebNext">Next story</button></div><div id="pebkac"></div></div>
    </aside>
  </div>
  <p class="muted small">Everyone at this desk is fictional. Tool statuses are jokes about the job, not real outage information.</p>`);
  load_();
  coffeeUI(); setInterval(coffeeUI, 15000);
  $("#coffeeBtn").addEventListener("click", () => {
    const wait = COFFEE_MS - (Date.now() - num(store.get("coffeeAt", 0), 0));
    if (wait > 0) { note(`The machine is still refilling. Next coffee in ${Math.ceil(wait / 60e3)} min. Have some water.`); sfx("thud"); return; }
    store.set("coffeeAt", Date.now()); coffeeUI();
    sfx2("coffee"); bump("coffee"); ciso = Math.min(100, ciso + 6); save(); renderCiso();
    const n = today().coffee || 1; note(n > 4 ? `Coffee number ${n}. Your heart rate is now a detection.` : pick(["Coffee made. The team's morale is up 6%.", "The machine gurgled ominously, then delivered.", "You made coffee for everyone. Even Brad the vendor."]));
    if (n === 1) earn(2, "coffee");
  });
  $("#nextT").addEventListener("click", () => addTicket());
  $("#pebNext").addEventListener("click", pebkac);
  await Promise.all([load("cves"), load("news")]);
  if (!q.length) { addTicket(true); addTicket(true); }
  renderQueue(); renderCiso(); renderStats(); renderTools(); pebkac();
}
export function show() { renderQueue(); renderStats(); }

const COFFEE_MS = 30 * 60e3;
function coffeeUI() {
  const b = $("#coffeeBtn"); if (!b) return;
  const wait = COFFEE_MS - (Date.now() - num(store.get("coffeeAt", 0), 0));
  b.classList.toggle("cooling", wait > 0);
  b.lastChild.textContent = wait > 0 ? `Refilling · ${Math.ceil(wait / 60e3)} min` : "Make a coffee";
  b.title = "One coffee every 30 minutes. The machine has limits, and so do you.";
}
function note(t) { const el = $("#deskNote"); if (el) typeText(el, t); }

function renderQueue() {
  const box = $("#deskQueue"); if (!box) return; badge();
  // FLIP: remember where every card was, so after re-rendering only the cards that moved slide, and new ones glide in.
  const before = new Map([...box.querySelectorAll("[data-id]")].map((e) => [e.dataset.id, e.getBoundingClientRect().top]));
  $("#qInfo").textContent = q.length ? `${q.length} waiting · new ones arrive while this tab is open` : "empty, enjoy it while it lasts";
  const fb = feedback.map((f) => h("div.verdict." + (f.ok ? "ok" : "no"), { role: "status", dataset: { id: f.id } },
    h("div.vd-head", h("b", f.ok ? "Right call" : "Not quite"), h("span.muted.small", ` · ${f.who}: "${f.msg.slice(0, 70)}${f.msg.length > 70 ? "…" : ""}"`),
      h("button.xbtn.sm", { "aria-label": "Dismiss", onclick: () => { feedback = feedback.filter((x) => x !== f); renderQueue(); } }, "×")),
    f.ok ? h("p", h("b", f.right), ". ", f.why) : [h("p", "You picked ", h("b", f.picked), ". The right call was ", h("b", f.right), "."), h("p", f.wrong ? f.wrong + " " : "", f.why)]));
  if (!q.length) { put(box, fb, h("p.empty", "Inbox zero. Nobody believes you, but well done.")); glide(box, before); return; }
  put(box, fb, q.map((t) => {
    const p = who(t); const av = h("span.av"); av.innerHTML = avatar(p.a, 44);
    return h("article.ticket", { dataset: { id: t.id } },
      h("div.tk-head", av, h("div", h("b", p.n), h("span.muted", ` · ${p.t} · ${CH_LABEL[t.ch]}`), p.q ? h("p.muted.small", p.q) : null)),
      h("p.tk-msg", t.m),
      h("div.routes", h("div.rgroup.keep", { role: "group", "aria-label": "Keep it in security" }, btns(t, ["soc", "ir"])),
        h("div.rgroup", { role: "group", "aria-label": "Not ours" }, btns(t, ["it", "net", "close"]))));
  }));
  glide(box, before);
}
const btns = (t, keys) => keys.map((k) => h("button.btn.sm.r-" + k, { onclick: () => route(t, k) }, ROUTES.find((r) => r[0] === k)[1]));
function glide(box, before) {
  if (!box.animate) return;
  const ease = "cubic-bezier(.22,.8,.24,1)";
  for (const e of box.querySelectorAll("[data-id]")) {
    const old = before.get(e.dataset.id); const now = e.getBoundingClientRect().top;
    if (old === undefined) e.animate([{ opacity: 0, transform: "translateY(-16px) scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 560, easing: ease });
    else if (Math.abs(old - now) > 1) e.animate([{ transform: `translateY(${old - now}px)` }, { transform: "none" }], { duration: 560, easing: ease });
  }
}

function route(t, k) {
  q = q.filter((x) => x.id !== t.id);
  const ok = k === t.a; bump("tickets"); if (ok) bump("ticketsRight"); if (ok && (k === "it" || k === "net")) bump("bounced");
  const label = (x) => (ROUTES.find((r) => r[0] === x) || [x, x])[1];
  feedback.unshift({ id: t.id, ok, who: who(t).n, msg: t.m, picked: label(k), right: label(t.a), why: t.w, wrong: ok ? "" : WRONG[k] || "" });
  feedback = feedback.slice(0, 3);
  const entry = feedback[0];
  setTimeout(() => {   // verdicts clear themselves
    const el = document.querySelector(`.verdict[data-id="${entry.id}"]`);
    if (el) { el.classList.add("leaving"); setTimeout(() => { feedback = feedback.filter((x) => x !== entry); renderQueue(); }, 350); }
    else feedback = feedback.filter((x) => x !== entry);
  }, entry.ok ? 4000 : 6000);   // right: 4 s, wrong: 6 s (more to read)
  if (ok) { earn(2, "ticket"); xp(6, "ticket"); ciso = Math.min(100, ciso + 5); sfx("coin"); note(`Right: ${label(t.a)}. ${t.w}`); }
  else {
    ciso = Math.max(0, ciso - 12); sting("fail"); note(`Not quite. You picked "${label(k)}", the right call was "${label(t.a)}". ${t.w}`);
    if (ciso < 45) { sfx2("boss"); emit("ciso", { angry: true }); toast(`The CISO: "${pick(CISO_LINES)}"`); }
  }
  save(); renderQueue(); renderCiso(); renderStats();
}

function renderCiso() {
  const box = $("#cisoBox"); if (!box) return;
  const st = CISO_STATES.find((s) => ciso >= s[0]) || CISO_STATES[CISO_STATES.length - 1];
  const av = h("span.av"); av.innerHTML = avatar({ ...CAST.ciso.a, mood: ciso < 40 ? "angry" : ciso > 75 ? "smug" : "" }, 56);
  put(box, h("div.ciso", av, h("div", h("b", st[1]), h("div.bar.ciso-bar", h("i", { "data-w": ciso, class: ciso < 40 ? "low" : "" })), h("p.muted.small", `Patience ${Math.round(ciso)}%. Right answers and coffee help.`))));
}
function renderStats() {
  const box = $("#deskStats"); if (!box) return; const d = today();
  const n = d.tickets || 0, r = d.ticketsRight || 0;
  put(box, [["routed", n], ["right", n ? Math.round((r / n) * 100) + "%" : "–"], ["bounced", d.bounced || 0], ["coffees", d.coffee || 0]].map(([l, v]) => h("div", h("b", String(v)), h("span", l))));
}

function renderTools() {
  const box = $("#tools"); const r = (seed) => (Math.sin(seed) + 1) / 2;
  const hour = Math.floor(Date.now() / 36e5);
  put(box, TOOLS.map((t, i) => {
    const s = t.s[Math.floor(r(hour + i * 7.3) * t.s.length)]; const bad = s !== t.s[0];
    return h("div.tool", h("span.tdot" + (bad ? ".warn" : "")), h("div.grow", h("b", t.n), h("span.muted.small", " " + s)),
      h("button.btn.ghost.sm", { onclick: () => swear(t) }, "Swear at it"));
  }));
  jar();
}
function swear(t) {
  bump("swears"); sfx("smash");
  const grawlix = shuffle(["#", "$", "%", "&", "@", "!", "*", "?"]).slice(0, 5).join("");
  const el = $("#toolReply"); put(el, h("p", h("b", `You: "${grawlix}!"`)), h("p.muted", `${t.n}: "${pick(t.x)}"`));
  jar();
}
function jar() { const n = today().swears || 0; $("#jar").textContent = n ? `Swear jar today: ${n} ${n === 1 ? "coin" : "coins"}.${n >= 10 ? " That's a team pizza." : ""}` : "Swear jar: empty. Impressive restraint."; }
function pebkac() { const p = fresh("pebkac", PEBKAC, (x) => x[0], 0.7); put($("#pebkac"), h("p.peb-t", p[0]), h("p", p[1]), h("p.muted.small", p[2])); }
