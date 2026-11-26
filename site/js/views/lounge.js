// Lounge: the live dashboard. A world threat map, the numbers that matter, what to patch first,
// what the internet is scanning, who ransomware gangs are hitting, the arrivals board and the pager.
import { $, h, html, ext, put, on, RM, ago, store, fmtNum, modal, nextPatchTuesday, daysSince, seedFrom, mulberry32, pick, pickDay, todayKey } from "../core.js";
import { load, cveList } from "../data.js";
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
  <section class="mapcard" aria-label="Live threat map">
    <div class="map-top">
      <h2>Threat map</h2>
      <div class="layers" id="layers"></div>
      <button class="iconbtn sm" id="mapPause" aria-pressed="false"><span>Pause</span></button>
    </div>
    <div class="map-body">
      <div class="map-wrap" id="mapWrap"><div class="map-tip" id="mapTip" hidden></div></div>
      <aside class="map-side" id="mapSide"></aside>
    </div>
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
  $("#mapPause").addEventListener("click", () => { mapPaused = !mapPaused; $("#mapWrap").classList.toggle("paused", mapPaused); $("#mapPause").setAttribute("aria-pressed", String(mapPaused)); $("#mapPause span").textContent = mapPaused ? "Play" : "Pause"; });
  on("profile", greet);
  const b = await import("../buddy.js"); b.initBuddy();
  greet(); clearInterval(clockTimer); clockTimer = setInterval(() => { if (location.hash.replace("#", "") === "lounge" || !location.hash) greet(); }, 60000);
  world = await import("../content/world.js");
  const [c, n, r, t] = await Promise.all([load("cves"), load("news"), load("ransomware"), load("threatmap")]);
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
const LAYERS = [["attacks", "Attack traffic"], ["ransom", "Ransomware victims"], ["c2", "Botnet C2"]];
let layerOn = { attacks: true, ransom: true, c2: true };
function el(tag, attrs = {}) { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; }
function map() {
  const wrap = $("#mapWrap"); if (!wrap || !world) return;
  const { W, H, PATHS, CENTROIDS, NAMES } = world;
  const tip = $("#mapTip");
  wrap.querySelector("svg")?.remove();
  const victims = Object.fromEntries((rw?.countries30 || []).map(([k, v]) => [k.toUpperCase(), v]));
  const c2 = Object.fromEntries((tm?.c2?.countries || []).map(([k, v]) => [k, v]));
  const pairs = tm?.radar?.pairs || [];
  const tgtPct = Object.fromEntries((tm?.radar?.targets || []).map(([k, v]) => [k, v]));
  const orgPct = Object.fromEntries((tm?.radar?.origins || []).map(([k, v]) => [k, v]));
  const vmax = Math.max(1, ...Object.values(victims)); const cmax = Math.max(1, ...Object.values(c2));
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "worldmap", role: "img", "aria-label": "World map of ransomware victims, botnet command servers and attack traffic" });
  const defs = el("defs");
  const grad = (tag, id, attrs, stops) => { const g = el(tag, { id, ...attrs }); for (const [o, c, op] of stops) g.append(el("stop", { offset: o, "stop-color": c, "stop-opacity": op })); defs.append(g); };
  grad("linearGradient", "sweepG", { x1: 0, x2: 1 }, [[0, "#5CE1C6", 0], [0.8, "#5CE1C6", 0.05], [0.985, "#5CE1C6", 0.35], [1, "#5CE1C6", 0]]);
  svg.append(defs);
  // graticule for a little depth
  const grat = el("g", { class: "grat" });
  for (let x = 0; x <= W; x += 50) grat.append(el("line", { x1: x, y1: 0, x2: x, y2: H }));
  for (let y = 0; y <= H; y += 50) grat.append(el("line", { x1: 0, y1: y, x2: W, y2: y }));
  svg.append(grat);
  const land = el("g", { class: "land" });
  for (const [cc, d] of Object.entries(PATHS)) {
    const p = el("path", { d, "data-cc": cc });
    const v = victims[cc] || 0;
    if (layerOn.ransom && v) { const k = Math.pow(v / vmax, 0.55); p.style.fill = `color-mix(in srgb, #A78BFA ${Math.round(18 + k * 70)}%, #18213D)`; p.classList.add("hot"); }
    land.append(p);
  }
  svg.append(land);
  // C2 pulses
  const pulses = el("g", { class: "pulses" });
  if (layerOn.c2) for (const [cc, n] of Object.entries(c2)) {
    const pt = CENTROIDS[cc]; if (!pt) continue;
    const r = 2.5 + Math.sqrt(n / cmax) * 7; const rnd = mulberry32(seedFrom(cc));
    const g = el("g", { class: "pulse", transform: `translate(${pt[0]} ${pt[1]})` });
    const ring = el("circle", { r, class: "ring" }); ring.style.animationDelay = `${(rnd() * 3).toFixed(2)}s`;
    g.append(ring, el("circle", { r: Math.max(2, r * 0.45), class: "core" }));
    pulses.append(g);
  }
  svg.append(pulses);
  // attack arcs (Cloudflare Radar origin -> target)
  const arcs = el("g", { class: "arcs" });
  if (layerOn.attacks) {
    const pmax = Math.max(1, ...pairs.map((p) => p[2]));
    pairs.forEach(([o, t, v], i) => {
      const a = CENTROIDS[o], b = CENTROIDS[t]; if (!a || !b) return;
      const w = 0.8 + (v / pmax) * 2.6;
      if (o === t) { const c = el("circle", { cx: a[0], cy: a[1], r: 6 + w * 3, class: "selfhit" }); c.style.animationDelay = `${(i * 0.4) % 4}s`; arcs.append(c); return; }
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const d = `M${a[0]} ${a[1]} Q${mx} ${my - Math.min(160, dist * 0.45)} ${b[0]} ${b[1]}`;
      arcs.append(el("path", { d, class: "arc-base", "stroke-width": w }));
      const comet = el("path", { d, class: "arc-comet", "stroke-width": w + 0.8, pathLength: 100 });
      comet.style.animationDelay = `${(i * 0.37) % 3.2}s`; comet.style.animationDuration = `${2.4 + (i % 4) * 0.35}s`;
      arcs.append(comet, el("circle", { cx: b[0], cy: b[1], r: 2.2 + w * 0.6, class: "arc-hit" }));
    });
  }
  svg.append(arcs);
  const sweep = el("rect", { x: -90, y: 0, width: 90, height: H, fill: "url(#sweepG)", class: "sweep" });
  svg.append(sweep);
  wrap.prepend(svg);
  // hover tooltips
  const SHORTN = { US: "United States", GB: "United Kingdom", RU: "Russia", KR: "South Korea", KP: "North Korea", IR: "Iran", VN: "Vietnam", CD: "DR Congo", CZ: "Czechia", BA: "Bosnia", DO: "Dominican Rep.", AE: "UAE" };
  const name = (cc) => SHORTN[cc] || NAMES[cc] || cc;
  land.addEventListener("pointermove", (e) => {
    const cc = e.target.dataset?.cc; if (!cc) { tip.hidden = true; return; }
    const bits = [];
    if (victims[cc]) bits.push(`${victims[cc]} ransomware victims (30 days)`);
    if (c2[cc]) bits.push(`${c2[cc]} botnet C2 servers`);
    if (tgtPct[cc]) bits.push(`${tgtPct[cc]}% of attack traffic targets it`);
    if (orgPct[cc]) bits.push(`${orgPct[cc]}% of attack traffic comes from it`);
    tip.textContent = ""; tip.append(h("b", name(cc)), ...(bits.length ? bits.map((x) => h("span", x)) : [h("span.muted", "nothing notable")]));
    const r = wrap.getBoundingClientRect(); tip.hidden = false;
    tip.style.left = Math.min(r.width - 230, Math.max(6, e.clientX - r.left + 14)) + "px"; tip.style.top = Math.max(6, e.clientY - r.top - 10) + "px";
  });
  land.addEventListener("pointerleave", () => { tip.hidden = true; });
  // layer chips
  put($("#layers"), LAYERS.map(([k, l]) => {
    const has = k === "attacks" ? pairs.length : k === "ransom" ? Object.keys(victims).length : Object.keys(c2).length;
    const b = h("button.lchip.l-" + k + (layerOn[k] ? ".on" : ""), { type: "button", "aria-pressed": String(layerOn[k]), disabled: !has, title: has ? "" : "No data yet" }, h("i"), l);
    b.addEventListener("click", () => { layerOn[k] = !layerOn[k]; map(); });
    return b;
  }));
  // side lists
  const rows = (pairsIn, fmt) => pairsIn.slice(0, 5).map(([cc, v]) => { const max = pairsIn[0][1] || 1; const f = h("i"); f.style.width = Math.max(4, (v / max) * 100) + "%"; return h("li", h("span", name(cc)), h("span.mbar", f), h("b", fmt(v))); });
  const side = [];
  if (tm?.radar?.targets?.length) side.push(h("div.ms", h("h4", "Most attacked"), h("ol", rows(tm.radar.targets, (v) => v + "%"))));
  if (tm?.radar?.origins?.length) side.push(h("div.ms", h("h4", "Attacks come from"), h("ol", rows(tm.radar.origins, (v) => v + "%"))));
  if (!side.length && rw?.countries30?.length) side.push(h("div.ms", h("h4", "Most ransomware victims"), h("ol", rows(rw.countries30.map(([k, v]) => [k.toUpperCase(), v]), (v) => v))));
  if (tm?.c2?.countries?.length) side.push(h("div.ms", h("h4", "Botnet C2 hosted in"), h("ol", rows(tm.c2.countries, (v) => v))));
  put($("#mapSide"), side.length ? side : [h("p.muted.small", "Live layers appear after the next data refresh.")]);
  const src = [pairs.length ? "Cloudflare Radar (application-layer attacks, last 24 h)" : "", Object.keys(victims).length ? "ransomware.live (leak-site claims, 30 days)" : "", Object.keys(c2).length ? "abuse.ch Feodo Tracker" : ""].filter(Boolean);
  $("#mapSrc").textContent = src.length ? "Sources: " + src.join(" · ") + (tm?.generated ? ` · updated ${ago(tm.generated)}` : "") : "";
}

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



