// Lounge: live arrivals board, threat radar, ten-second briefing, buddy, quests, mood, pager.
import { $, h, html, icon, ext, put, on, RM, seedFrom, mulberry32, pick, pickDay, daysSince, ago, store, todayKey, fmtNum, copyText, toast } from "../core.js";
import { classify, pivots, TYPE_NAME, defang } from "../ti.js";
import { load, cveList } from "../data.js";
import { card, detail, status, productName, isEdge } from "../cvecard.js";
import { clatter, sfx } from "../audio.js";
import { profile, quests, setMood, todayMood, bump, earn, xp } from "../state.js";
import { drill } from "../incidents.js";
import { HORO, MOODS, MOOD_REPLY } from "../content/legacy.js";

let cves = [], news = null, mal = null, rw = null, stats = {};
let page = 0, flapTimer = 0;
const FLAP_CH = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./";

export async function mount(sec) {
  html(sec, `
  <div class="board" id="flapBoard" aria-label="Arrivals board of newly exploited CVEs">
    <div class="board-head">
      <h1 class="board-title">Arrivals</h1>
      <div class="board-days"><div class="flaps big" id="daysFlap" aria-hidden="true"></div>
        <p>days since the last exploited edge-device CVE <span class="board-days-sub" id="signsub"></span></p><span class="sr" id="days"></span></div>
    </div>
    <div class="board-cols" aria-hidden="true"><span>CVE</span><span class="col-nk">Flight</span><span class="col-prod">From</span><span>Status</span></div>
    <div class="board-rows" id="flapRows"></div>
    <p class="board-foot" id="boardFoot"></p>
  </div>
  <div class="dash">
    <div class="kpis" id="kpis" aria-label="Today at a glance"></div>
  </div>
  <div class="lounge">
    <div class="leftcol">
      <div class="radarwrap panel" id="radarWrap">
        <div class="ph"><h3>Threat radar</h3><span class="muted" id="radarSub">live CVEs by where they hit</span>
          <button class="iconbtn sm" id="radarFs"><svg class="ic"><use href="#i-expand"/></svg><span>Full screen</span></button></div>
        <div class="radar-grid">
          <div class="radar"><canvas id="radar" role="img" aria-label="Radar of recent vulnerabilities grouped by technology area"></canvas><div class="radar-tip" id="radarTip" hidden></div></div>
          <div class="radar-side"><h4>Look at these first</h4><ol class="rtop" id="radarTop"></ol>
            <div class="legend"><span class="k kev">exploited</span><span class="k ran">ransomware</span><span class="k crit">critical</span><span class="k other">watch</span></div>
            <p class="muted small">Inner ring is this week, then this month, then older. Bigger dot means more likely to be exploited soon (EPSS).</p></div>
        </div>
      </div>
      <div class="under">
        <div class="panel"><div class="ph"><h3>Today in ten seconds</h3><a class="link" href="#brew">Full brew</a></div><ul class="mini" id="miniBrew"></ul></div>
        <div class="panel"><div class="ph"><h3>Shift horoscope</h3><span class="muted" id="horoRole"></span></div><p id="horo" class="horo"></p><p class="muted small" id="lucky"></p></div>
      </div>
    </div>
    <aside class="side">
      <form class="panel lookup" id="tiForm" autocomplete="off">
        <div class="ph"><h3>Quick lookup</h3><span class="muted small">IP, domain, URL, hash, email, CVE or ATT&amp;CK ID. Defanged is fine.</span></div>
        <div class="lk-row"><input id="tiIn" class="inp" spellcheck="false" aria-label="Indicator to look up" placeholder="hxxps://login-micros0ft[.]com/x  or  185.220.101.4"><button class="btn">Look up</button></div>
        <div id="tiOut" class="lk-out" aria-live="polite"></div>
      </form>
      <div class="panel buddy">
        <div class="buddy-row"><div class="petwrap"><button class="mascot" id="buddy" title="Pet your buddy"></button></div><div class="say" id="say" aria-live="polite">…</div></div>
      </div>
      <div class="panel"><div class="ph"><h3>Daily quests</h3><button class="btn ghost sm" id="miDrill"><svg class="ic"><use href="#i-siren"/></svg>Drill</button></div><div id="quests"></div></div>
      <div class="panel"><div class="ph"><h3>How are you, really?</h3></div><div class="moods" id="moods"></div><p class="muted small" id="moodReply"></p></div>
    </aside>
  </div>
  <div class="pager"><span class="pager-label">Pager</span><div class="ticker"><div class="track" id="ticker">Loading headlines…</div></div></div>`);

  $("#miDrill").addEventListener("click", () => drill());
  $("#flapRows").addEventListener("click", (e) => { const r = e.target.closest(".frow"); const c = r && cves.find((x) => x.id === r.dataset.id); if (c) detail(c); });
  $("#flapRows").addEventListener("keydown", (e) => { if (e.key === "Enter") { const r = e.target.closest(".frow"); const c = r && cves.find((x) => x.id === r.dataset.id); if (c) detail(c); } });
  $("#radarFs").addEventListener("click", () => { const w = $("#radarWrap"); if (document.fullscreenElement) document.exitFullscreen(); else w.requestFullscreen?.().catch(() => {}); });
  moodsUI(); questsUI(); horoscope();
  on("stat", questsUI); on("quests", questsUI); on("mood", questsUI); on("profile", horoscope);

  // Re-import the buddy so it binds to the new #buddy element
  const b = await import("../buddy.js"); b.initBuddy();

  $("#tiForm").addEventListener("submit", (e) => { e.preventDefault(); lookup($("#tiIn").value); });
  const [c, n, m, r] = await Promise.all([load("cves"), load("news"), load("malware"), load("ransomware")]);
  apply(c, n, m, r);
  clearInterval(flapTimer);
  flapTimer = setInterval(() => { if (document.visibilityState === "visible" && location.hash.replace("#", "") === "lounge") { page++; board(true); } }, 60000);
}
export function show() { if (cves.length) board(false); }
function apply(c, n, m, r) {
  news = n; mal = m; rw = r; stats = c ? c.stats : {};
  cves = cveList(c);
  board(true); radar(); brief(); ticker(); kpis();
}
/** Called by main.js when the 15-minute refresh brings newer data. */
export async function refresh() {
  const [c, n, m, r] = await Promise.all([load("cves"), load("news"), load("malware"), load("ransomware")]);
  apply(c, n, m, r);
}

// ---------- dashboard ----------
function kpis() {
  const box = $("#kpis"); if (!box) return;
  const top = (stats.topVendors30 || [])[0];
  const grp = rw?.groups7?.[0];
  const tile = (href, n, label, sub, tone) => h("a.kpi" + (tone ? "." + tone : ""), { href }, h("span.kn", n), h("span.kl", label), sub ? h("span.ks", sub) : null);
  put(box,
    tile("#menu", stats.kevAdded7 ?? "–", "exploited CVEs added this week", stats.kevAdded30 != null ? `${stats.kevAdded30} in 30 days` : "", stats.kevAdded7 >= 5 ? "hot" : ""),
    tile("#menu", stats.criticalNew7 ?? "–", "new critical CVEs this week", "CVSS 9 and up", ""),
    tile("#malware", rw ? fmtNum(rw.total7) : "–", "ransomware leak-site posts, 7 days", grp ? `busiest: ${grp[0]}` : "", ""),
    tile("#menu", top ? top[0] : "–", "most-hit vendor in KEV, 30 days", top ? `${top[1]} entries` : "", ""),
    tile("#menu", stats.ransomware30 ?? "–", "KEV entries used by ransomware, 30 days", "patch these before lunch", stats.ransomware30 ? "warn" : ""));
}
function lookup(raw) {
  const out = $("#tiOut"); const ind = classify(raw);
  if (ind.type === "empty") { out.textContent = ""; return; }
  const notes = [];
  if (ind.type === "unknown") { put(out, h("p.muted", "That doesn't look like an IP, domain, URL, hash, email, CVE or technique ID. Try the IOC extractor in Shift buddy for messy text.")); return; }
  if (ind.private) notes.push(h("p.note", "This is a private or reserved address. Public threat intel won't know it: check your own DHCP, CMDB and EDR instead."));
  if (ind.type === "cve") {
    const c = cves.find((x) => x.id === ind.value);
    notes.push(c ? h("p.note.ok", "In today's feed: ", h("button.linkbtn", { type: "button", onclick: () => detail(c) }, `${c.id}, ${productName(c)}, ${status(c)[0]}`)) : h("p.note", "Not in our current feed (we track recent KEV and critical CVEs). The links below have the full story."));
  }
  if (["sha256", "sha1", "md5"].includes(ind.type)) notes.push(h("p.note", "Look up hashes, don't upload files. Uploading a company document to a public sandbox makes it public."));
  if (ind.type === "url" || ind.type === "domain") notes.push(h("p.note", "Don't open it in your normal browser. Use urlscan or a sandbox. Safe to share as: ", h("code", defang(ind.value))));
  put(out, h("p.lk-type", h("b", TYPE_NAME[ind.type]), " ", h("code", ind.value), h("button.btn.ghost.sm", { type: "button", onclick: () => { copyText(ind.value); toast("Copied"); } }, "Copy")),
    notes, h("ul.pivots", pivots(ind).map(([l, u, why]) => h("li", ext(u, l), h("span.muted", why)))),
    h("p.muted.small", "Nothing is sent anywhere until you click a link. Each one opens in a new tab with no referrer."));
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
    changed += flapSet(r.querySelector(".id"), c ? c.id : "", 14, d) + flapSet(r.querySelector(".nk"), c ? productName(c) : "", 22, d + 50)
      + flapSet(r.querySelector(".prod"), c ? (c.vendor || "") : "", 11, d + 100) + flapSet(r.querySelector(".st"), st, 10, d + 150);
    r.querySelector(".st").className = "flaps st " + cls;
  });
  $("#boardFoot").textContent = `${p.label} · page ${(page % ps.length) + 1} of ${ps.length} · tap a row for details`;
  const last = stats.lastEdge; const days = last ? Math.max(0, daysSince(last + "T00:00:00Z")) : null;
  flapSet($("#daysFlap"), days === null ? "--" : String(days).padStart(2, "0"), 2, 0);
  $("#days").textContent = days ?? "unknown";
  $("#signsub").textContent = days === null ? "" : days === 0 ? "Today. It happened today. We're fine. Everything is fine." : days < 7 ? "Please do not lean on the VPN concentrator." : "A personal best is within reach. Don't jinx it.";
  if (animate && changed && location.hash.replace("#", "") === "lounge") clatter(800);
}

// ---------- radar ----------
// Six labelled sectors (where the bug lives) x three rings (how recent). Blips are spread evenly inside
// their cell so nothing piles up, and the five hottest get a name tag.
const SECTORS = [
  ["Edge & network", /router|firewall|vpn|gateway|switch|load balanc|fortinet|fortios|fortigate|ivanti|connect secure|citrix|netscaler|palo alto|pan-os|sonicwall|cisco|juniper|\bf5\b|big-ip|zyxel|d-link|tp-link|netgear|draytek|ubiquiti|mikrotik|check point|\bnas\b|qnap|synology/],
  ["OS & browsers", /windows|win32k|kernel|linux|macos|\bios\b|ipados|android|chrome|chromium|firefox|safari|webkit|apple|samsung|\bsmb\b|ntlm|kerberos|pixel/],
  ["Servers & business apps", /exchange|sharepoint|oracle|\bsap\b|netweaver|vmware|vcenter|esxi|veeam|confluence|jira|atlassian|servicenow|sql server|weblogic|tomcat|moveit|goanywhere|papercut|backup|\berp\b|crm|commvault|solarwinds|manageengine|zoho|trimble|cityworks|kaseya|connectwise|screenconnect/],
  ["AI & dev tools", /\bai\b|\bllm|langchain|langflow|ollama|vllm|\bmcp\b|comfyui|gradio|jupyter|hugging ?face|openai|copilot|litellm|open webui|n8n|\bnpm\b|pypi|node\.js|github|gitlab|jenkins|teamcity|docker|kubernetes|terraform|\bgit\b/],
  ["Web & CMS", /wordpress|wp plugin|plugin|drupal|joomla|magento|craft cms|\bphp\b|\bcms\b|web application|cross-site|\bxss\b|laravel|struts|spring/],
  ["Everything else", /.*/],
];
const SHORT = ["Edge & network", "OS & browsers", "Servers & apps", "AI & dev", "Web & CMS", "Other"];
const RINGS = [["this week", 7], ["this month", 30], ["older", Infinity]];
let raf = 0, radarBound = false;
function sectorOf(c) {
  if (isEdge(c)) return 0;
  const who = `${c.vendor} ${c.product}`.toLowerCase(); const all = `${who} ${c.title} ${c.desc}`.toLowerCase();
  const i = SECTORS.findIndex(([, rx], k) => k < 5 && rx.test(who)); // vendor/product first, it's the most reliable
  return i >= 0 ? i : SECTORS.findIndex(([, rx]) => rx.test(all));
}
function radar() {
  const cv = $("#radar"); const ctx = cv.getContext("2d"); const tip = $("#radarTip");
  const list = cves.filter((c) => !c.snapshot || cves.length < 10).slice(0, 42);
  const cs = getComputedStyle(document.body);
  const col = (v) => cs.getPropertyValue(v).trim();
  const C = { kev: col("--alarm") || "#FF6B6B", ran: col("--hof") || "#C792EA", crit: col("--sodium") || "#F5B841", other: col("--phos") || "#5CE1C6", grid: col("--rule") || "#2A3352", text: col("--muted") || "#9AA3C2", ink: col("--ink") || "#E9ECF5" };
  const font = cs.fontFamily || "system-ui";
  // group into cells
  const cells = new Map();
  for (const c of list) {
    const age = c.date ? Math.max(0, daysSince(c.date + "T00:00:00Z")) : 45;
    const s = sectorOf(c), r = RINGS.findIndex(([, d]) => age <= d);
    const k = s + ":" + r; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(c);
  }
  const SA = (Math.PI * 2) / SECTORS.length, start = -Math.PI / 2 - SA / 2;
  const RING0 = 0.2, RINGW = 0.26; // ring r spans [RING0 + r*RINGW, RING0 + (r+1)*RINGW] of R
  const blips = [];
  for (const [k, arr] of cells) {
    const [s, r] = k.split(":").map(Number);
    arr.sort((a, b) => b.heat - a.heat);
    arr.forEach((c, i) => blips.push({ c, s, r, i, n: arr.length, size: 1 + (c.epss || 0.02) * 0.9 + (c.kev ? 0.15 : 0),
      color: c.kev && c.ransomware ? C.ran : c.kev ? C.kev : c.sev === "critical" ? C.crit : C.other, ph: (seedFrom(c.id) % 100) / 16 }));
  }
  // Lay blips out in rows across their cell, sized to whatever space the cell really has at this canvas size.
  let laidFor = 0;
  const layout = (R) => {
    if (laidFor === R) return; laidFor = R;
    for (const b of blips) {
      const inner = R * (RING0 + b.r * RINGW), outer = R * (RING0 + (b.r + 1) * RINGW);
      let dot = 5.5; let rows, per;
      for (;;) {
        rows = Math.max(1, Math.floor((outer - inner) / (dot * 2 + 5)));
        const arc = (inner + (outer - inner) / 2) * SA * 0.84; per = Math.max(1, Math.floor(arc / (dot * 2 + 5)));
        if (rows * per >= b.n || dot <= 2.6) break; dot -= 0.5;
      }
      const usedRows = Math.min(rows, Math.ceil(b.n / per)); const row = Math.floor(b.i / per) % usedRows, j = b.i % per;
      const inRow = Math.min(per, b.n - row * per);
      b.ang = start + b.s * SA + SA * 0.08 + SA * 0.84 * ((j + 0.5) / inRow);
      b.px = (inner + (outer - inner) * ((row + 0.5) / usedRows)) / R;
      b.dot = Math.min(dot, 4 + b.size * 2.2) * Math.min(1.35, b.size);
    }
  };
  const counts = SECTORS.map((_, i) => blips.filter((b) => b.s === i).length);
  const top = [...list].sort((a, b) => b.heat - a.heat).slice(0, 5); const topSet = new Set(top.map((c) => c.id));
  put($("#radarTop"), top.map((c) => { const [st, cls] = status(c); return h("li", h("button.rt", { type: "button", onclick: () => detail(c), onmouseenter: () => radar.set?.(blips.find((b) => b.c.id === c.id) || null, -1), onmouseleave: () => radar.set?.(null, -1) }, h("span.rt-id", c.id), h("span.rt-p", productName(c)), h("span.pill.stp." + cls, st))); }));
  $("#radarSub").textContent = list.length ? `${list.length} live CVEs, grouped by where they hit. Tap a dot.` : "waiting for data";
  let W = 0, Hh = 0, sweep = 0, last = 0, hover = null, focusS = -1;
  const fit = () => { const r = cv.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); W = r.width; Hh = r.height; cv.width = W * dpr; cv.height = Hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit(); radar.fit = fit; if (!radarBound) new ResizeObserver(() => radar.fit()).observe(cv);
  const geo = () => { const R = Math.max(0, Math.min(W / 2 - (W < 420 ? 38 : 54), Hh / 2 - 16)); return { R, cx: W / 2, cy: Hh / 2 }; };
  const pos = (b) => { const { R, cx, cy } = geo(); layout(R); return [cx + Math.cos(b.ang) * b.px * R, cy + Math.sin(b.ang) * b.px * R]; };
  const draw = (t) => {
    raf = requestAnimationFrame(draw);
    if (document.visibilityState !== "visible" || !cv.isConnected || !cv.offsetParent) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    sweep = RM ? -1 : (sweep + dt * 0.5) % (Math.PI * 2);
    const { R, cx, cy } = geo(); if (R < 40) return;
    ctx.clearRect(0, 0, W, Hh);
    // sector wedges, alternating tint, highlighted on hover
    for (let i = 0; i < SECTORS.length; i++) {
      const a0 = start + i * SA, a1 = a0 + SA;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
      ctx.fillStyle = C.other + (i === focusS ? "1F" : i % 2 ? "0A" : "12"); ctx.fill();
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); ctx.stroke();
    }
    ctx.setLineDash([3, 5]); ctx.strokeStyle = C.grid;
    for (let r = 1; r <= 2; r++) { ctx.beginPath(); ctx.arc(cx, cy, R * (RING0 + r * RINGW), 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * RING0, 0, Math.PI * 2); ctx.fillStyle = C.other + "18"; ctx.fill();
    ctx.fillStyle = C.text; ctx.font = `600 10px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("NOW", cx, cy);
    // ring names sit on the spoke between "Everything else" and "Edge", where no blips go
    ctx.font = `10px ${font}`; ctx.textAlign = "center";
    if (W >= 420) RINGS.forEach(([n], r) => { const rr = R * (RING0 + (r + 0.5) * RINGW); const x = cx + Math.cos(start) * rr, y = cy + Math.sin(start) * rr;
      ctx.fillStyle = C.text; ctx.textAlign = "right"; ctx.fillText(n, x - 4, y + 3); });
    // sector name tags sit on the rim
    ctx.font = `600 ${W < 420 ? 10.5 : 12}px ${font}`; ctx.textAlign = "center";
    SECTORS.forEach(([n], i) => {
      const a = start + i * SA + SA / 2; const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      const label = SHORT[i] + (counts[i] ? `  ${counts[i]}` : ""); const tw = ctx.measureText(label).width + 16;
      ctx.fillStyle = i === focusS ? C.other : "#121A33"; ctx.strokeStyle = i === focusS ? C.other : C.grid;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - tw / 2, y - 11, tw, 22, 11) : ctx.rect(x - tw / 2, y - 11, tw, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = i === focusS ? "#0B1020" : C.ink; ctx.fillText(label, x, y + 0.5);
    });
    // soft sweep
    if (!RM && ctx.createConicGradient) {
      const g = ctx.createConicGradient(sweep - 0.6, cx, cy); g.addColorStop(0, "transparent"); g.addColorStop(0.095, C.other + "22"); g.addColorStop(0.0955, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    }
    for (const b of blips) {
      const [x, y] = pos(b); const big = b === hover ? 1.45 : 1; const sz = b.dot;
      if (b.c.kev && b.r === 0 && !RM) { const p = ((t / 1000 + b.ph) % 2.4) / 2.4; ctx.strokeStyle = b.color; ctx.globalAlpha = 0.45 * (1 - p); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, sz + p * 10, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(x, y, sz * big, 0, Math.PI * 2); ctx.fill();
      if (topSet.has(b.c.id)) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, sz * big + 2.5, 0, Math.PI * 2); ctx.stroke(); }
    }
  };
  cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
  const find = (e) => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 16;
    for (const b of blips) { const [bx, by] = pos(b); const d = Math.hypot(bx - x, by - y); if (d < bd) { bd = d; best = b; } }
    const { cx, cy, R } = geo(); const d = Math.hypot(x - cx, y - cy); let a = Math.atan2(y - cy, x - cx) - start; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return [best, x, y, d <= R + 30 ? Math.floor(a / SA) : -1]; };
  // handlers read the latest closure through these refs so a data refresh doesn't stack listeners
  radar.find = find; radar.set = (b, s) => { hover = b; focusS = s; }; radar.W = () => W;
  if (radarBound) return; radarBound = true;
  cv.addEventListener("pointermove", (e) => {
    const [b, x, y, s] = radar.find(e); radar.set(b, s); cv.classList.toggle("hit", !!b);
    if (!b) { tip.hidden = true; return; }
    tip.hidden = false; tip.textContent = `${b.c.id} · ${productName(b.c)} · ${status(b.c)[0]}`;
    tip.style.left = Math.max(4, Math.min(x + 12, radar.W() - 240)) + "px"; tip.style.top = y + 14 + "px";
  });
  cv.addEventListener("pointerleave", () => { tip.hidden = true; radar.set(null, -1); });
  cv.addEventListener("click", (e) => { const [b] = radar.find(e); if (b) { sfx("pop"); detail(b.c); } });
}

// ---------- ten-second brief ----------
function brief() {
  const ul = $("#miniBrew"); const items = [];
  const top = cves.find((c) => c.kev);
  if (stats.kevAdded7 !== undefined) items.push(h("li", h("b", `${stats.kevAdded7} new exploited CVEs this week.`), top ? ` Newest: ${top.id} in ${productName(top)}.` : ""));
  else if (top) items.push(h("li", `Snapshot: ${top.id} in ${productName(top)}.`));
  const s = news?.security?.[0]; if (s) items.push(h("li", h("span.muted", s.s + ": "), ext(s.u, s.t)));
  const fam = mal ? Object.entries(mal.families).sort((a, b) => (b[1].mentions || 0) + (b[1].iocs7 || 0) - (a[1].mentions || 0) - (a[1].iocs7 || 0))[0] : null;
  if (fam && (fam[1].mentions || fam[1].iocs7)) items.push(h("li", "Malware in the news: ", h("a.link", { href: "#malware" }, fam[0].split(".")[1].replace(/_/g, " ")), "."));
  const a = news?.ai?.[0]; if (a) items.push(h("li", h("span.muted", "AI: "), ext(a.u, a.t)));
  put(ul, items.length ? items : [h("li.muted", "Live data is on its way. The first refresh runs a few minutes after deploy.")]);
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

// ---------- horoscope ----------
function horoscope() {
  const p = profile(); const pool = HORO[p.role] || HORO["L1 analyst"];
  $("#horoRole").textContent = p.role;
  $("#horo").textContent = pickDay(pool, seedFrom(p.role) % 97);
  const r = mulberry32(seedFrom(todayKey() + p.role));
  $("#lucky").textContent = `Lucky port ${pick([22, 53, 443, 445, 3389, 8080, 5985, 1337, 4444, 31337], r)} · lucky event ID ${pick([4624, 4688, 4720, 4769, 7045, 1102, 4104, 4625], r)} · avoid ${pick(["change freezes", "Friday deploys", "the CISO's calendar", "reply-all", "the printer", "untested backups"], r)}`;
}

// ---------- quests ----------
function questsUI() {
  const box = $("#quests"); if (!box) return;
  put(box, quests().map((q) => h("a.quest" + (q.done ? ".done" : ""), { href: q.go },
    h("span.qbox", q.done ? icon("check") : ""), h("span.qt", q.t), h("span.qn.muted", `${q.have}/${q.n}`))));
}

// ---------- mood ----------
function moodsUI() {
  const box = $("#moods"); const cur = todayMood();
  put(box, MOODS.map((m, i) => h("button.moodb" + (cur === i ? ".on" : ""), { "aria-pressed": String(cur === i), onclick: () => {
    const first = todayMood() === null; setMood(i); moodsUI(); sfx("pop");
    $("#moodReply").textContent = MOOD_REPLY[i] || "";
    if (first) { earn(3, "mood"); xp(5, "mood"); }
  } }, h("span.mface.m" + i), h("span", m[1]))));
  if (cur !== null) $("#moodReply").textContent = MOOD_REPLY[cur] || "";
}
