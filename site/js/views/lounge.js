// Lounge: the live dashboard. A world threat map, the numbers that matter, what to patch first,
// what the internet is scanning, who ransomware gangs are hitting, the arrivals board and the pager.
import { $, h, html, ext, put, on, RM, ago, store, fmtNum, modal, nextPatchTuesday, daysSince, seedFrom, mulberry32, pick, pickDay, todayKey } from "../core.js";
import { load, cveList, loaded } from "../data.js";
import { live, liveAt } from "../live.js";
import { detail, status, productName, isEdge } from "../cvecard.js";
import { clatter, sfx } from "../audio.js";
import { profile } from "../state.js";
import { drill } from "../incidents.js";
import { shiftState } from "./shift.js";

let cves = [], news = null, rw = null, tm = null, cvesRaw = null, stats = {};
let page = 0, flapTimer = 0, clockTimer = 0, world = null, mapPaused = false;
const FLAP_CH = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./";
const SVGNS = "http://www.w3.org/2000/svg";
const PORTS = { 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS", 80: "HTTP", 81: "HTTP", 123: "NTP", 161: "SNMP", 443: "HTTPS", 445: "SMB", 1433: "MSSQL", 1900: "SSDP", 2323: "Telnet", 2375: "Docker API", 3306: "MySQL", 3389: "RDP", 5060: "SIP", 5432: "PostgreSQL", 5555: "Android ADB", 5900: "VNC", 6379: "Redis", 6443: "Kubernetes", 7547: "TR-069", 8000: "HTTP", 8080: "HTTP proxy", 8443: "HTTPS", 8888: "HTTP", 9200: "Elasticsearch", 11211: "Memcached", 27017: "MongoDB", 37215: "Huawei router", 52869: "UPnP" };

export async function mount(sec) {
  html(sec, `
  <header class="lhead">
    <div><h1 id="hello2">Good shift</h1><p class="lsub"><span class="infocon" id="infocon" hidden></span><span id="today"></span></p></div>
    <div class="lpartner"><div class="say" id="say" aria-live="polite"></div><button class="mascot sm" id="buddy" title="Your shift partner"></button></div>
  </header>
  <section class="mapcard" id="mapcard" aria-label="Live threat map">
    <div class="map-top">
      <h2>Live threat map</h2>
      <div class="layers" id="layers"></div>
      <button class="iconbtn sm" id="mapPause" aria-pressed="false"><span>Pause</span></button>
      <button class="iconbtn sm" id="mapFull"><span>Full screen</span></button>
    </div>
    <div class="map-body">
      <aside class="map-left" id="mapLeft"></aside>
      <div class="map-wrap" id="mapWrap"><div class="map-tip" id="mapTip" hidden></div></div>
      <aside class="map-side" id="mapSide"></aside>
    </div>
    <div class="map-feed" id="mapFeedBox" hidden><h4>Live attacks <span class="muted">flows sampled from the last hours of traffic, plus real claims, C2 servers and malware as they appear</span></h4><div class="mf-wrap"><ol id="mapFeed" aria-live="off"></ol></div></div>
    <div class="map-stats" id="mapStats" hidden></div>
    <div class="map-legend" aria-hidden="true"><span class="lg ddos">Web attack (layer 7)</span><span class="lg l3">Network DDoS (layer 3)</span><span class="lg rw">Ransomware claim</span><span class="lg c2">Botnet C2</span><span class="lg mw">Malware</span></div>
    <p class="map-src" id="mapSrc"></p>
  </section>
  <div class="ktiles" id="ktiles"></div>
  <div class="lgrid">
    <section class="panel"><div class="ph"><h3>Patch first</h3><a class="link" href="#menu">All CVEs</a></div><ol class="pf" id="pfList"></ol></section>
    <section class="panel"><div class="ph"><h3>Most-scanned ports</h3><span class="muted small" id="portSrc"></span></div><ol class="bars vbars2" id="ports"></ol></section>
    <section class="panel"><div class="ph"><h3>Ransomware this week</h3><a class="link" href="#malware">Malware bar</a></div><ol class="bars" id="rwMini"></ol></section>
  </div>
  <div class="board compact" id="flapBoard" aria-label="Arrivals board of newly exploited CVEs">
    <div class="board-head"><h2 class="board-title">Arrivals</h2><p class="board-foot" id="boardFoot"></p></div>
    <div class="board-cols" aria-hidden="true"><span>CVE</span><span class="col-nk">Flight</span><span class="col-prod">From</span><span>Status</span></div>
    <div class="board-rows" id="flapRows"></div>
  </div>
  <div class="pager"><span class="pager-label">Pager</span><div class="ticker"><div class="track" id="ticker">Loading headlines…</div></div></div>
  <div class="lfoot"><button class="btn ghost sm" id="miDrill">Run an incident drill</button></div>`);

  $("#miDrill").addEventListener("click", () => drill());
  $("#flapRows").addEventListener("click", (e) => { const r = e.target.closest(".frow"); const c = r && cves.find((x) => x.id === r.dataset.id); if (c) detail(c); });
  $("#flapRows").addEventListener("keydown", (e) => { if (e.key === "Enter") { const r = e.target.closest(".frow"); const c = r && cves.find((x) => x.id === r.dataset.id); if (c) detail(c); } });
  $("#mapFull").addEventListener("click", toggleFull);
  $("#mapPause").addEventListener("click", () => { mapPaused = !mapPaused; $("#mapWrap").classList.toggle("paused", mapPaused); $("#mapPause").setAttribute("aria-pressed", String(mapPaused)); $("#mapPause span").textContent = mapPaused ? "Play" : "Pause"; });
  on("profile", greet);
  const b = await import("../buddy.js"); b.initBuddy();
  greet(); clearInterval(clockTimer); clockTimer = setInterval(() => { if (location.hash.replace("#", "") === "lounge" || !location.hash) greet(); }, 60000);
  world = await import("../content/world.js");
  const [c, n, r, t] = await Promise.all([load("cves"), load("news"), load("ransomware"), load("threatmap")]);
  liveMap = live("map") || null; liveEvents = live("events") || [];
  apply(c, n, r, t);
  clearInterval(flapTimer);
  flapTimer = setInterval(() => { if (document.visibilityState === "visible" && location.hash.replace("#", "") === "lounge") { page++; board(true); } }, 60000);
}
export function show() { if (cves.length) board(false); greet(); }
export async function refresh() {
  const [c, n, r, t] = await Promise.all([load("cves"), load("news"), load("ransomware"), load("threatmap")]);
  apply(c, n, r, t);
}
function apply(c, n, r, t) {
  cvesRaw = c; news = n; rw = r; tm = t; stats = c ? c.stats : {};
  cves = cveList(c);
  map(); tiles(); patchFirst(); ports(); rwMini(); board(true); ticker();
  const ic = $("#infocon"); if (tm?.infocon) { ic.hidden = false; ic.className = "infocon ic-" + tm.infocon; ic.textContent = `Infocon ${tm.infocon}`; ic.title = "SANS Internet Storm Center threat level"; }
}

// ---------- header ----------
function greet() {
  const p = profile(); const hr = new Date().getHours();
  const part = hr < 5 ? "Night shift" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  $("#hello2").textContent = p.name ? `${part}, ${p.name}` : part;
  const st = shiftState(); const d = new Date();
  $("#today").textContent = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) + (st.on ? ` · ${Math.max(0, Math.round((st.e - d) / 36e5 * 10) / 10)} h left on shift` : "");
}

// ---------- threat map ----------
// The map is driven by two things:
//  * flows: origin -> target shares of attack traffic (Cloudflare Radar, last 2 hours when the live feed has it).
//    A new arc is drawn every second or so, picked in proportion to its share, so busy routes show up more.
//  * events: real, timestamped happenings (ransomware claims, new botnet C2 servers, new malware URLs and samples).
//    Each one is shown once, as a pulse on the map (when it has a country) and a line in the feed.
const T = {
  waf: { n: "Exploit attempt", layer: "web" }, web: { n: "Web attack", layer: "web" }, ddos: { n: "Web attack", layer: "web" }, l3: { n: "Network DDoS", layer: "l3" },
  bot: { n: "Bot attack", layer: "web" }, ransom: { n: "Ransomware claim", layer: "ransom" }, c2: { n: "Botnet C2 online", layer: "malware" },
  url: { n: "Malware URL", layer: "malware" }, sample: { n: "Malware sample", layer: "malware" },
};
// Cloudflare Radar only publishes country-to-country pairs for DDoS-style traffic, so those are the arcs.
// Exploit types and phishing are shown as totals in the panels under the map.
const LAYERS = [["web", "Web attacks"], ["l3", "Network DDoS"], ["malware", "Malware and C2"], ["ransom", "Ransomware"]];
let layerOn = { web: true, l3: true, malware: true, ransom: true };
let engine = 0, ticks = 0, flows = [], total = 0, queue = [], lastRow = 0, liveMap = null, liveEvents = [], baseKey = "", counterTimer = 0;
const seen = new Set();
const SHORTN = { US: "United States", GB: "United Kingdom", RU: "Russia", KR: "South Korea", KP: "North Korea", IR: "Iran", VN: "Vietnam", CD: "DR Congo", CZ: "Czechia", BA: "Bosnia", DO: "Dominican Rep.", AE: "UAE", TW: "Taiwan", SY: "Syria", LA: "Laos", BO: "Bolivia", VE: "Venezuela", TZ: "Tanzania", MD: "Moldova", MK: "North Macedonia" };
const MITIG = { WAF: "Web application firewall", DDOS: "DDoS protection", IP_REPUTATION: "IP reputation", ACCESS_RULES: "Access rules", BOT_MANAGEMENT: "Bot management", API_SHIELD: "API Shield", DATA_LOSS_PREVENTION: "Data loss prevention", L7_DDOS: "DDoS protection" };
const EMAIL = { BrandImpersonation: "Brand impersonation", CredentialHarvester: "Credential harvesting", IdentityDeception: "Identity deception", Link: "Malicious link", Attachment: "Malicious attachment" };
const nice = (k) => MITIG[k] || EMAIL[k] || (/_|[a-z][A-Z]/.test(k) ? k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : k);
const cname = (cc) => SHORTN[cc] || world?.NAMES?.[cc] || cc;
const hhmm = (d) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
function el(tag, attrs = {}) { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; }
const onLounge = () => (location.hash.replace("#", "").split("?")[0] || "lounge") === "lounge";

// Combine live and static data into the pools the engine draws from.
function pools() {
  const L = liveMap; flows = [];
  const add = (list, kind) => { for (const [o, t, v] of list || []) if (world.CENTROIDS[o] && world.CENTROIDS[t] && v > 0) flows.push({ o, t, v, kind }); };
  if (L?.radar && (L.pairs.waf.length || L.pairs.ddos.length || L.pairs.bot.length || L.pairs.l3.length)) { add(L.pairs.waf, "waf"); add(L.pairs.ddos, "ddos"); add(L.pairs.bot, "bot"); add(L.pairs.l3, "l3"); }
  else { add(tm?.radar?.pairs, "web"); add(tm?.radar?.pairs3, "l3"); }
  flows = flows.filter((f) => layerOn[T[f.kind].layer]);
  total = flows.reduce((s, f) => s + f.v, 0);
}
function pickFlow() {
  let r = Math.random() * total;
  for (const f of flows) { r -= f.v; if (r <= 0) return f; }
  return flows[flows.length - 1];
}
const evKey = (e) => `${e.k}|${e.t}|${e.g}|${e.cc}`;
function takeEvents(list, silentSeed) {
  const fresh = list.filter((e) => !seen.has(evKey(e)) && layerOn[T[e.k].layer]).sort((a, b) => a.t.localeCompare(b.t));
  for (const e of fresh) seen.add(evKey(e));
  if (silentSeed) return fresh.slice(-3);
  queue.push(...fresh.slice(-30)); queue = queue.slice(-40);
  return [];
}

function map() {
  const wrap = $("#mapWrap"); if (!wrap || !world) return;
  pools(); base();
  if (!$("#mapFeed").childElementCount) {                // first draw: seed the feed with the latest real events, then arcs
    for (const e of takeEvents(liveEvents, true)) feedRow(e, true);
    for (let i = 0; i < 3 && flows.length; i++) feedRow({ flow: pickFlow(), at: new Date(Date.now() - (3 - i) * 2500) }, true);
  }
  clearInterval(engine); engine = setInterval(spawn, RM ? 2400 : 620);
  panels();
}
// Static layers: land with ransomware heat, botnet C2 dots, graticule, sweep. Rebuilt only when that data changes.
function base() {
  const wrap = $("#mapWrap"); const { W, H, PATHS, CENTROIDS } = world;
  const victims = Object.fromEntries((rw?.countries30 || []).map(([k, v]) => [k.toUpperCase(), v]));
  const c2src = liveMap?.c2?.countries?.length ? liveMap.c2.countries : tm?.c2?.countries || [];
  const key = JSON.stringify([layerOn, Object.keys(victims).length, c2src.slice(0, 5)]);
  if (key === baseKey && wrap.querySelector("svg")) return;
  baseKey = key;
  const c2 = Object.fromEntries(c2src); const vmax = Math.max(1, ...Object.values(victims)); const cmax = Math.max(1, ...Object.values(c2));
  wrap.querySelector("svg")?.remove();
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "worldmap", role: "img", "aria-label": "World map: attack traffic between countries, ransomware victims and botnet command servers" });
  const defs = el("defs"); const g0 = el("linearGradient", { id: "sweepG", x1: 0, x2: 1 });
  for (const [o, c, op] of [[0, "#5CE1C6", 0], [0.8, "#5CE1C6", 0.05], [0.985, "#5CE1C6", 0.35], [1, "#5CE1C6", 0]]) g0.append(el("stop", { offset: o, "stop-color": c, "stop-opacity": op }));
  defs.append(g0); svg.append(defs);
  const grat = el("g", { class: "grat" });
  for (let x = 0; x <= W; x += 50) grat.append(el("line", { x1: x, y1: 0, x2: x, y2: H }));
  for (let y = 0; y <= H; y += 50) grat.append(el("line", { x1: 0, y1: y, x2: W, y2: y }));
  const land = el("g", { class: "land" });
  for (const [cc, d] of Object.entries(PATHS)) {
    const p = el("path", { d, "data-cc": cc }); const v = victims[cc] || 0;
    if (layerOn.ransom && v) { const k = Math.pow(v / vmax, 0.55); p.style.fill = `color-mix(in srgb, #A78BFA ${Math.round(14 + k * 60)}%, #18213D)`; p.classList.add("hot"); }
    land.append(p);
  }
  const dots = el("g", { class: "pulses" });
  if (layerOn.malware) for (const [cc, n] of Object.entries(c2)) {
    const pt = CENTROIDS[cc]; if (!pt) continue; const r = 1.8 + Math.sqrt(n / cmax) * 5;
    const g = el("g", { class: "pulse", transform: `translate(${pt[0]} ${pt[1]})` }); const ring = el("circle", { r, class: "ring" });
    ring.style.animationDelay = `${(mulberry32(seedFrom(cc))() * 3).toFixed(2)}s`; g.append(ring, el("circle", { r: Math.max(1.6, r * 0.4), class: "core" })); dots.append(g);
  }
  svg.append(grat, land, dots, el("g", { id: "arcLayer", class: "arcs" }), el("g", { id: "labelLayer", class: "clabels" }), el("rect", { x: -90, y: 0, width: 90, height: H, fill: "url(#sweepG)", class: "sweep" }));
  wrap.prepend(svg);
  const tip = $("#mapTip");
  land.addEventListener("pointermove", (e) => {
    const cc = e.target.dataset?.cc; if (!cc) { tip.hidden = true; return; }
    const tg = Object.fromEntries(liveMap?.targets?.length ? liveMap.targets : tm?.radar?.targets || []), og = Object.fromEntries(liveMap?.origins?.length ? liveMap.origins : tm?.radar?.origins || []);
    const bits = [];
    if (tg[cc]) bits.push(`${tg[cc]}% of attack traffic targets it`); if (og[cc]) bits.push(`${og[cc]}% of attack traffic comes from it`);
    if (victims[cc]) bits.push(`${victims[cc]} ransomware victims (30 days)`); if (c2[cc]) bits.push(`${c2[cc]} botnet C2 servers`);
    tip.textContent = ""; tip.append(h("b", cname(cc)), ...(bits.length ? bits.map((x) => h("span", x)) : [h("span.muted", "Nothing notable")]));
    const r = wrap.getBoundingClientRect(); tip.hidden = false;
    tip.style.left = Math.min(r.width - 230, Math.max(6, e.clientX - r.left + 14)) + "px"; tip.style.top = Math.max(6, e.clientY - r.top - 10) + "px";
  });
  land.addEventListener("pointerleave", () => { tip.hidden = true; });
  put($("#layers"), LAYERS.map(([k, l]) => {
    const b = h("button.lchip.l-" + k + (layerOn[k] ? ".on" : ""), { type: "button", "aria-pressed": String(layerOn[k]) }, h("i"), l);
    b.addEventListener("click", () => { layerOn[k] = !layerOn[k]; pools(); base(); });
    return b;
  }));
}

// ---------- the engine ----------
const MAX_ARCS = 16;
function spawn() {
  if (mapPaused || document.visibilityState !== "visible" || !onLounge()) return;
  const layer = $("#arcLayer"); if (!layer) return;
  ticks++;
  if (queue.length && ticks % 3 === 0) { const e = queue.shift(); burst(e); feedRow(e); return; }
  if (!flows.length || layer.childElementCount >= MAX_ARCS) return;
  const f = pickFlow(); arc(f);
  if (Date.now() - lastRow > 2600) feedRow({ flow: f, at: new Date() });
}
function life(node, ms) { setTimeout(() => node.remove(), ms); }
function label(cc, cls, ms) {
  const pt = world.CENTROIDS[cc]; const layer = $("#labelLayer"); if (!pt || !layer) return;
  const txt = cname(cc); const w = txt.length * 8.4; const x = Math.min(world.W - w / 2 - 4, Math.max(w / 2 + 4, pt[0])); const y = pt[1] - 11;
  for (const n of layer.children) { const bx = +n.getAttribute("x"), by = +n.getAttribute("y"), bw = +n.dataset.w; if (n.dataset.cc === cc) { n.classList.add(cls); return; } if (Math.abs(bx - x) < (bw + w) / 2 + 4 && Math.abs(by - y) < 16) return; }
  const t = el("text", { x, y, class: "clabel " + cls, "text-anchor": "middle", "data-cc": cc }); t.dataset.w = w; t.textContent = txt;
  t.style.animationDuration = ms + "ms"; layer.append(t); life(t, ms);
}
function arc(f) {
  const a = world.CENTROIDS[f.o], b = world.CENTROIDS[f.t]; const layer = $("#arcLayer");
  const g = el("g", { class: "arc live k-" + f.kind }); const w = 1 + Math.min(2.4, f.v / 6);
  const ms = RM ? 3000 : 4200;
  if (f.o === f.t) {
    g.append(el("circle", { cx: a[0], cy: a[1], r: 5 + w * 3, class: "selfhit" }));
  } else {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = `M${a[0]} ${a[1]} Q${mx} ${my - Math.min(170, dist * (f.kind === "l3" ? 0.3 : 0.45))} ${b[0]} ${b[1]}`;
    g.append(el("circle", { cx: a[0], cy: a[1], r: 2.4, class: "arc-src" }), el("path", { d, class: "arc-trail", "stroke-width": w, pathLength: 100 }),
      el("path", { d, class: "arc-head", "stroke-width": w + 1.2, pathLength: 100 }), el("circle", { cx: b[0], cy: b[1], r: 3, class: "arc-hit" }), el("circle", { cx: b[0], cy: b[1], r: 3, class: "arc-boom" }));
  }
  g.style.animationDuration = ms + "ms"; layer.append(g); life(g, ms);
  label(f.o, "org", ms); label(f.t, "tgt", ms);
}
function burst(e) {
  const pt = e.cc && world.CENTROIDS[e.cc]; const layer = $("#arcLayer"); if (!pt || !layer) return;
  const g = el("g", { class: "burst k-" + e.k, transform: `translate(${pt[0]} ${pt[1]})` });
  g.append(el("circle", { r: 4, class: "b1" }), el("circle", { r: 4, class: "b2" }), el("circle", { r: 3, class: "bcore" }));
  layer.append(g); life(g, 4600); label(e.cc, "ev k-" + e.k, 4600);
}

// Feed rows slide in at the top; the whole list glides down instead of jumping.
function feedRow(x, silent) {
  const list = $("#mapFeed"); if (!list) return;
  $("#mapFeedBox").hidden = false;
  let row;
  if (x.flow) {
    const f = x.flow; lastRow = Date.now();
    row = h("li.mf-row", h("span.mf-k.k-" + f.kind, T[f.kind].n), h("span.mf-t", hhmm(x.at)),
      h("span.mf-p", h("b", cname(f.o)), h("span.mf-arrow", { "aria-hidden": "true" }), h("b", f.o === f.t ? "inside the country" : cname(f.t))), h("span.mf-v", `${f.v}% of traffic`));
  } else {
    const e = x; const when = new Date(e.t);
    const text = e.k === "ransom" ? [h("b", e.g), " claimed a victim", e.cc ? [" in ", h("b", cname(e.cc))] : "", e.s ? ` · ${e.s}` : ""]
      : e.k === "c2" ? ["New ", h("b", e.g), " C2 server online", e.cc ? [" in ", h("b", cname(e.cc))] : ""]
      : e.k === "url" ? ["New malware URL", e.g ? [" · ", h("b", e.g)] : "", e.x ? h("code.mf-ioc", e.x) : ""]
      : ["New ", h("b", e.g || "malware"), " sample", e.s ? ` (${e.s})` : ""];
    row = h("li.mf-row.evt", h("span.mf-k.k-" + e.k, T[e.k].n), h("span.mf-t", { title: when.toLocaleString() }, hhmm(when)), h("span.mf-p", text), h("span.mf-v", ago(e.t)));
  }
  list.prepend(row);
  if (!silent && !RM) {
    const shift = row.getBoundingClientRect().height + 4;
    list.style.transition = "none"; list.style.transform = `translateY(-${shift}px)`; void list.offsetHeight;
    list.style.transition = "transform .7s cubic-bezier(.2,.8,.2,1)"; list.style.transform = "translateY(0)";
    row.classList.add("in");
  }
  setTimeout(() => { while (list.children.length > 7) list.lastElementChild.remove(); }, silent ? 0 : 800);
}

// ---------- panels around the map ----------
function panels() { mapLeft(); mapSide(); mapStats(); mapSrc(); }
function counter() {
  const box = $("#mcCount"); if (!box) return;
  const daily = tm?.daily || []; const y = daily[daily.length - 1]?.[1] || 0;
  const now = new Date(); const day0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const est = Math.round(y * ((Date.now() - day0) / 864e5));
  const real = liveMap?.isc?.day === now.toISOString().slice(0, 10) ? liveMap.isc.today : 0;
  box.textContent = fmtNum(Math.max(est, real));
}
function mapLeft() {
  const box = $("#mapLeft"); if (!box) return;
  const daily = tm?.daily || []; const out = [];
  if (daily.length) {
    const last = daily[daily.length - 1], prev = daily[daily.length - 2];
    const delta = prev ? Math.round(((last[1] - prev[1]) / Math.max(1, prev[1])) * 100) : null;
    out.push(h("div.mcount", { title: "Firewall log records reported to SANS DShield sensors (top 10 ports). Today's figure is estimated from yesterday's rate until the day's count arrives." },
      h("span.mc-l", "Attack reports so far today"), h("span.mc-n", { id: "mcCount" }, "0"), h("span.mc-d", `Yesterday ${fmtNum(last[1])}${delta === null ? "" : ` (${delta > 0 ? "+" : ""}${delta}% on the day before)`}`)));
    out.push(h("div.ms", h("h4", "Daily attack reports, 14 days"), dayBars(daily)));
  }
  const ser = liveMap?.series?.length > 8 ? liveMap.series.map(([t, v]) => [t, v]) : (tm?.radar?.series || []).map(([t, v]) => [t + ":00Z", v]);
  if (ser.length > 4) out.push(h("div.ms", h("h4", liveMap?.series?.length > 8 ? "Attack traffic, last 24 hours" : "Attack traffic, 7 days"), traffic(ser)));
  put(box, out.length ? out : [h("p.muted.small", "Counters appear after the next data refresh.")]);
  counter(); clearInterval(counterTimer); counterTimer = setInterval(() => { if (onLounge()) counter(); }, 1000);
}
function dayBars(daily) {
  const w = 200, hh = 60, max = Math.max(1, ...daily.map((d) => d[1])), bw = w / daily.length;
  const svg = el("svg", { viewBox: `0 0 ${w} ${hh + 12}`, class: "daybars", role: "img", "aria-label": "Daily attack reports for the last 14 days" });
  daily.forEach(([d, v], i) => {
    const bh = Math.max(2, (v / max) * hh); const r = el("rect", { x: i * bw + 1, y: hh - bh, width: bw - 2, height: bh, rx: 2, class: i === daily.length - 1 ? "db-last" : "db" });
    r.style.animationDelay = `${i * 40}ms`;
    const t = el("title"); t.textContent = `${new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}: ${fmtNum(v)}`; r.append(t);
    svg.append(r);
  });
  const lab = (x, s, a) => { const t = el("text", { x, y: hh + 11, class: "db-x", "text-anchor": a }); t.textContent = s; svg.append(t); };
  const fmt = (d) => new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short" });
  lab(0, fmt(daily[0][0]), "start"); lab(w, fmt(daily[daily.length - 1][0]), "end");
  return svg;
}
function traffic(ser) {
  const w = 200, hh = 50, vals = ser.map((p) => p[1]), max = Math.max(...vals) || 1, min = Math.min(...vals);
  const pts = vals.map((v, i) => [((i / (vals.length - 1)) * w).toFixed(1), (hh - 3 - ((v - min) / (max - min || 1)) * (hh - 8)).toFixed(1)]);
  const svg = el("svg", { viewBox: `0 0 ${w} ${hh}`, class: "trafline", preserveAspectRatio: "none", role: "img", "aria-label": "Relative attack traffic over time" });
  svg.append(el("path", { d: `M0 ${hh} L${pts.map((p) => p.join(" ")).join(" L")} L${w} ${hh}Z`, class: "tl-area" }), el("path", { d: `M${pts.map((p) => p.join(" ")).join(" L")}`, class: "tl-line", pathLength: 100 }));
  const peak = vals.indexOf(max); const lastP = pts[pts.length - 1];
  svg.append(el("circle", { cx: pts[peak][0], cy: pts[peak][1], r: 2.6, class: "tl-peak" }), el("circle", { cx: lastP[0], cy: lastP[1], r: 3, class: "tl-now" }));
  return h("div.tl", svg, h("span.muted.small", "Peak " + new Date(ser[peak][0]).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })));
}
function rankRows(list, fmt, label = cname) {
  const max = list[0]?.[1] || 1;
  return list.slice(0, 5).map(([k, v]) => { const f = h("i"); f.style.width = Math.max(4, (v / max) * 100) + "%"; return h("li", h("span", { title: label(k) }, label(k)), h("span.mbar", f), h("b", fmt(v))); });
}
function mapSide() {
  const lv = liveMap?.targets?.length; const tg = lv ? liveMap.targets : tm?.radar?.targets || []; const og = liveMap?.origins?.length ? liveMap.origins : tm?.radar?.origins || [];
  const when = lv ? "last 2 hours" : "last 24 hours"; const side = [];
  if (tg.length) side.push(h("div.ms", h("h4", "Most attacked countries ", h("span.muted", when)), h("ol", rankRows(tg, (v) => v + "%"))));
  if (og.length) side.push(h("div.ms", h("h4", "Attacks come from ", h("span.muted", when)), h("ol", rankRows(og, (v) => v + "%"))));
  if (!side.length && rw?.countries30?.length) side.push(h("div.ms", h("h4", "Most ransomware victims"), h("ol", rankRows(rw.countries30.map(([k, v]) => [k.toUpperCase(), v]), (v) => v))));
  put($("#mapSide"), side.length ? side : [h("p.muted.small", "Live layers appear after the next data refresh.")]);
}
function mapStats() {
  const L = liveMap; const cards = [];
  const ind = L?.industries?.length ? L.industries : tm?.radar?.industries || [];
  if (ind.length) cards.push(h("div.ms", h("h4", "Most attacked industries"), h("ol", rankRows(ind, (v) => v + "%", (k) => k))));
  else if (rw?.sectors30?.length) cards.push(h("div.ms", h("h4", "Sectors ransomware hit, 30 days"), h("ol", rankRows(rw.sectors30, (v) => v, (k) => k))));
  if (L?.rules?.length) cards.push(h("div.ms", h("h4", "Exploit types blocked"), h("ol", rankRows(L.rules, (v) => v + "%", nice))));
  const mit = L?.mitigation?.length ? L.mitigation : tm?.radar?.mitigation || [];
  if (mit.length) cards.push(h("div.ms", h("h4", "How attacks were stopped"), h("ol", rankRows(mit, (v) => v + "%", nice))));
  if (L?.email?.cats?.length) cards.push(h("div.ms", h("h4", "Phishing in email", L.email.malicious != null ? h("span.muted", ` ${L.email.malicious}% malicious`) : null), h("ol", rankRows(L.email.cats, (v) => v + "%", nice))));
  const groups = {}; for (const e of liveEvents) if (e.k === "ransom" && Date.now() - Date.parse(e.t) < 3 * 864e5) groups[e.g] = (groups[e.g] || 0) + 1;
  const gl = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  if (gl.length) cards.push(h("div.ms", h("h4", "Ransomware claims, 3 days"), h("ol", rankRows(gl, (v) => v, (k) => k))));
  const mal = L?.c2?.malware?.length ? L.c2.malware : tm?.c2?.malware || [];
  if (mal.length) cards.push(h("div.ms", h("h4", "Top botnet malware"), h("ol", rankRows(mal, (v) => v, (k) => k))));
  put($("#mapStats"), cards.slice(0, 6)); $("#mapStats").hidden = !cards.length;
}
function mapSrc() {
  const L = liveMap; const src = [L?.radar || tm?.radar ? `Cloudflare Radar (attacks mitigated by Cloudflare, ${L?.radar ? "last 2 hours" : "last 24 hours"})` : "",
    tm?.daily?.length ? "SANS ISC DShield" : "", rw ? "ransomware.live (leak-site claims; victims never named here)" : "", "abuse.ch"].filter(Boolean);
  $("#mapSrc").textContent = "Sources: " + src.join(" · ") + (liveAt() ? ` · live, checked ${ago(new Date(liveAt()).toISOString())}` : tm?.generated ? ` · updated ${ago(tm.generated)}` : "");
}
// called by the router when new live data has arrived
export function onLive(feeds) {
  if (feeds.includes("map")) liveMap = live("map");
  if (feeds.includes("events")) { liveEvents = live("events") || []; takeEvents(liveEvents, false); }
  if (feeds.includes("cves")) { cvesRaw = loaded("cves"); cves = cveList(cvesRaw); stats = cvesRaw?.stats || stats; tiles(); patchFirst(); }
  const ic = $("#infocon"); const lv = liveMap?.isc?.infocon;
  if (ic && lv) { ic.hidden = false; ic.className = "infocon ic-" + lv; ic.textContent = `Infocon ${lv}`; }
  if (!world || !$("#mapWrap")) return;
  pools(); base(); panels();
}
function toggleFull() {
  const card = $("#mapcard");
  if (document.fullscreenElement) document.exitFullscreen?.(); else card.requestFullscreen?.().catch(() => {});
}
document.addEventListener("fullscreenchange", () => { const b = $("#mapFull span"); if (b) b.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen"; });

// ---------- KPI tiles with sparklines ----------
function spark(values, cls) {
  const w = 120, hh = 34, max = Math.max(1, ...values), n = values.length;
  const pts = values.map((v, i) => [((i / Math.max(1, n - 1)) * w).toFixed(1), (hh - 2 - (v / max) * (hh - 6)).toFixed(1)]);
  const svg = el("svg", { viewBox: `0 0 ${w} ${hh}`, class: "ksp " + cls, preserveAspectRatio: "none", "aria-hidden": "true" });
  svg.append(el("path", { d: `M0 ${hh} L${pts.map((p) => p.join(" ")).join(" L")} L${w} ${hh}Z`, class: "sp-area" }), el("path", { d: `M${pts.map((p) => p.join(" ")).join(" L")}`, class: "sp-line", pathLength: 100 }));
  return svg;
}
function countTo(node, to) {
  const t0 = performance.now(), ms = 900;
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); node.textContent = fmtNum(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function tiles() {
  const days = []; for (let i = 29; i >= 0; i--) days.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const by = {}; for (const k of cvesRaw?.kev || []) by[k.added] = (by[k.added] || 0) + 1;
  const kevDaily = days.map((d) => by[d] || 0);
  const pt = nextPatchTuesday(new Date()); const ptd = Math.max(0, Math.ceil((pt - new Date()) / 864e5));
  const top = tm?.ports?.[0];
  const T = [];
  const tile = (href, n, label, extra, tone) => {
    const num = h("span.kn", "0"); const a = h("a.kt" + (tone ? "." + tone : ""), { href }, h("span.kl", label), num, extra || null);
    if (typeof n === "number") countTo(num, n); else num.textContent = n;
    return a;
  };
  T.push(tile("#menu", stats.kevAdded7 ?? 0, "Exploited CVEs this week", spark(kevDaily, "sp-red"), stats.kevAdded7 >= 5 ? "hot" : ""));
  if (rw?.daily?.length) T.push(tile("#malware", rw.total7 || 0, "Ransomware posts this week", spark(rw.daily.map((d) => d[1]), "sp-violet")));
  if (tm?.c2) T.push(tile("#malware", tm.c2.online, "Botnet C2 servers online", h("span.ks", `${fmtNum(tm.c2.total)} tracked`)));
  if (top) T.push(tile("#lounge", `${top[0]}`, "Most-scanned port today", h("span.ks", PORTS[top[0]] || "")));
  T.push(tile("#shift", ptd, "Days to Patch Tuesday", h("span.ks", pt.toLocaleDateString(undefined, { day: "numeric", month: "short" })), ptd <= 1 ? "warn" : ""));
  put($("#ktiles"), T);
}

// ---------- panels ----------
function patchFirst() {
  const score = (c) => (c.ransomware ? 40 : 0) + (isEdge(c) ? 30 : 0) + (c.epss || 0) * 30 + Math.max(0, 30 - (Date.now() - Date.parse(c.date || 0)) / 864e5);
  const top = cves.filter((c) => c.kev && !c.snapshot).sort((a, b) => score(b) - score(a)).slice(0, 5);
  put($("#pfList"), top.length ? top.map((c) => { const [st, cls] = status(c); return h("li", h("button.pf-i", { type: "button", onclick: () => detail(c) },
    h("span.pf-top", h("b", productName(c)), h("span.pill.stp." + cls, st)), h("span.muted.small", c.id + (c.date ? ` · ${ago(c.date + "T12:00:00Z")}` : "")))); })
    : [h("li.muted", "Live data is on its way.")]);
}
function barsInto(box, items, cls) {
  const max = Math.max(1, ...items.map((x) => x[1]));
  put(box, items.map(([k, v, sub], i) => { const f = h("span.bar-fill" + (cls ? "." + cls : "")); f.style.setProperty("--w", Math.max(4, (v / max) * 100) + "%"); f.style.animationDelay = `${i * 70}ms`;
    return h("li", h("span.bar-k", k, sub ? h("small", sub) : null), h("span.bar", f), h("span.bar-v", fmtNum(v))); }));
}
function ports() {
  const p = tm?.ports || [];
  $("#portSrc").textContent = p.length ? "SANS ISC, today" : "";
  if (!p.length) { put($("#ports"), h("li.muted", "Appears after the next data refresh.")); return; }
  barsInto($("#ports"), p.slice(0, 6).map(([port, rec]) => [String(port), rec, PORTS[port] || ""]), "pt");
}
function rwMini() {
  const g = rw?.groups7?.length ? rw.groups7 : rw?.groups30 || [];
  if (!g.length) { put($("#rwMini"), h("li.muted", "Appears after the next data refresh.")); return; }
  barsInto($("#rwMini"), g.slice(0, 6), "rwf");
}

// ---------- split-flap board ----------
function flapSet(el, text, width, delay) {
  text = String(text).toUpperCase().replace(/[^A-Z0-9 \-./]/g, " ").padEnd(width).slice(0, width);
  if (el.children.length !== width) { el.textContent = ""; for (let i = 0; i < width; i++) el.append(h("span.fl", " ")); }
  let changed = 0;
  [...el.children].forEach((c, i) => {
    const tgt = text[i]; if (c.textContent === tgt) return; changed++;
    if (RM) { c.textContent = tgt; return; }
    let n = 3 + Math.floor(Math.random() * 6);
    setTimeout(function step() { c.textContent = n <= 0 ? tgt : FLAP_CH[1 + Math.floor(Math.random() * (FLAP_CH.length - 1))]; c.classList.remove("go"); void c.offsetWidth; c.classList.add("go"); if (n-- > 0) setTimeout(step, 55); }, (delay || 0) + i * 14);
  });
  return changed;
}
function pages() {
  const kev = cves.filter((c) => c.kev).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const crit = cves.filter((c) => !c.kev).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const out = [];
  for (let i = 0; i < Math.min(kev.length, 15); i += 5) out.push({ label: "Newest known-exploited (CISA KEV)", rows: kev.slice(i, i + 5) });
  if (crit.length) out.push({ label: "New critical CVEs (NVD)", rows: crit.slice(0, 5) });
  return out.length ? out : [{ label: "Snapshot", rows: cves.slice(0, 5) }];
}
function board(animate) {
  const ps = pages(); const p = ps[page % ps.length];
  const box = $("#flapRows"); if (!box) return;
  if (box.children.length !== 5) { box.textContent = ""; for (let i = 0; i < 5; i++) box.append(h("div.frow", { role: "button", tabindex: "0" }, h("div.flaps.id"), h("div.flaps.nk"), h("div.flaps.prod"), h("div.flaps.st"))); }
  let changed = 0;
  [...box.children].forEach((r, i) => {
    const c = p.rows[i]; r.dataset.id = c ? c.id : ""; r.setAttribute("aria-label", c ? `${c.id}, ${productName(c)}, ${status(c)[0]}` : "empty");
    const d = animate ? i * 120 : 0; const [st, cls] = c ? status(c) : ["", ""];
    changed += flapSet(r.querySelector(".id"), c ? c.id : "", 14, d) + flapSet(r.querySelector(".nk"), c ? productName(c) : "", 18, d + 50)
      + flapSet(r.querySelector(".prod"), c ? (c.vendor || "") : "", 11, d + 100) + flapSet(r.querySelector(".st"), st, 10, d + 150);
    r.querySelector(".st").className = "flaps st " + cls;
  });
  $("#boardFoot").textContent = `${p.label} · page ${(page % ps.length) + 1} of ${ps.length} · tap a row for details`;
  if (animate && changed && location.hash.replace("#", "") === "lounge") clatter(800);
}


function ticker() {
  const tr = $("#ticker"); const heads = (news?.security || []).slice(0, 14);
  if (!heads.length) { tr.textContent = "Pager quiet. Suspiciously quiet."; return; }
  const run = (copy) => h("span.run", { "aria-hidden": copy ? "true" : null }, heads.map((n) => [h("span.muted", n.s + ": "), copy ? h("span.tick-link", n.t) : ext(n.u, n.t, "tick-link"), h("span.sep", " ◆ ")]));
  put(tr, run(false), run(true));   // two copies back to back = no empty gap when it loops
  scroll(tr);
}

// Pager scroll driven by JS at a fixed reading speed (px per second), whatever the length or screen size.
let tickRaf = 0;
function scroll(tr) {
  cancelAnimationFrame(tickRaf);
  const box = tr.parentElement; tr.classList.add("js");
  const SPEED = 90; // pixels per second. Deliberately not slowed by the OS "reduce animations" setting: a crawling pager is unreadable.
  let x = 0, last = 0, paused = false;
  box.onmouseenter = () => (paused = true); box.onmouseleave = () => (paused = false);
  box.addEventListener("focusin", () => (paused = true)); box.addEventListener("focusout", () => (paused = false));
  const step = (t) => {
    tickRaf = requestAnimationFrame(step);
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    if (paused || document.visibilityState !== "visible" || !tr.isConnected || !tr.offsetParent) return;
    const loop = tr.firstElementChild ? tr.firstElementChild.offsetWidth : tr.scrollWidth;
    x -= SPEED * dt;
    if (loop && x <= -loop) x += loop;
    tr.style.transform = `translateX(${x.toFixed(1)}px)`;
  };
  tickRaf = requestAnimationFrame(step);
}



