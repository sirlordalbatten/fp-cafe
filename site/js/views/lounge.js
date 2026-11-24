// Lounge: live arrivals board, threat radar, ten-second briefing, buddy, quests, mood, pager.
import { $, h, html, icon, ext, put, on, RM, seedFrom, mulberry32, pick, pickDay, daysSince, ago, store, todayKey } from "../core.js";
import { load, cveList } from "../data.js";
import { card, detail, status, productName, isEdge } from "../cvecard.js";
import { clatter, sfx } from "../audio.js";
import { profile, quests, setMood, todayMood, bump, earn, xp } from "../state.js";
import { drill } from "../incidents.js";
import { HORO, MOODS, MOOD_REPLY } from "../content/legacy.js";

let cves = [], news = null, mal = null, stats = {};
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
  <div class="lounge">
    <div class="leftcol">
      <div class="radarwrap panel" id="radarWrap">
        <div class="ph"><h3>Threat radar</h3><span class="muted" id="radarSub">live CVEs, newest in the middle</span>
          <button class="iconbtn sm" id="radarFs"><svg class="ic"><use href="#i-expand"/></svg><span>Full screen</span></button></div>
        <div class="radar"><canvas id="radar" role="img" aria-label="Radar of recent vulnerabilities"></canvas><div class="radar-tip" id="radarTip" hidden></div></div>
        <div class="legend"><span class="k kev">exploited (KEV)</span><span class="k ran">ransomware</span><span class="k crit">critical</span><span class="k other">watch</span><span class="muted small">size = EPSS</span></div>
      </div>
      <div class="under">
        <div class="panel"><div class="ph"><h3>Today in ten seconds</h3><a class="link" href="#brew">Full brew</a></div><ul class="mini" id="miniBrew"></ul></div>
        <div class="panel"><div class="ph"><h3>Shift horoscope</h3><span class="muted" id="horoRole"></span></div><p id="horo" class="horo"></p><p class="muted small" id="lucky"></p></div>
      </div>
    </div>
    <aside class="side">
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

  const [c, n, m] = await Promise.all([load("cves"), load("news"), load("malware")]);
  news = n; mal = m; stats = c ? c.stats : {};
  cves = cveList(c);
  board(true); radar(); brief(); ticker();
  clearInterval(flapTimer);
  flapTimer = setInterval(() => { if (document.visibilityState === "visible" && location.hash.replace("#", "") === "lounge") { page++; board(true); } }, 60000);
}
export function show() { if (cves.length) board(false); }

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
let raf = 0;
function radar() {
  const cv = $("#radar"); const ctx = cv.getContext("2d"); const tip = $("#radarTip");
  const list = cves.slice(0, 32);
  const cs = getComputedStyle(document.body);
  const col = (v) => cs.getPropertyValue(v).trim();
  const C = { kev: col("--alarm"), ran: col("--hof"), crit: col("--sodium"), other: col("--phos"), grid: col("--rule"), text: col("--muted") };
  const blips = list.map((c) => {
    const r = mulberry32(seedFrom(c.id));
    const age = c.date ? Math.max(0, daysSince(c.date + "T00:00:00Z")) : 30;
    const ang = ((seedFrom(c.vendor || c.id) % 360) + (r() - 0.5) * 30) * Math.PI / 180;
    return { c, ang: (ang + Math.PI * 2) % (Math.PI * 2), rad: 0.12 + 0.82 * Math.min(1, Math.sqrt(age / 90)), size: 3 + (c.epss || 0.02) * 9 + (c.kev ? 1.5 : 0),
      color: c.kev && c.ransomware ? C.ran : c.kev ? C.kev : c.sev === "critical" ? C.crit : C.other, lit: 0 };
  });
  $("#radarSub").textContent = list.length ? `${list.length} live CVEs · newest in the middle · tap a blip` : "waiting for data";
  let W = 0, Hh = 0, sweep = 0, last = 0, hover = null;
  const fit = () => { const r = cv.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); W = r.width; Hh = r.height; cv.width = W * dpr; cv.height = Hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit(); new ResizeObserver(fit).observe(cv);
  const pos = (b) => { const R = Math.min(W, Hh) / 2 - 10; return [W / 2 + Math.cos(b.ang) * b.rad * R, Hh / 2 + Math.sin(b.ang) * b.rad * R]; };
  const draw = (t) => {
    raf = requestAnimationFrame(draw);
    if (document.visibilityState !== "visible" || !cv.isConnected || !cv.offsetParent) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    const prev = sweep; sweep = RM ? Math.PI * 1.5 : (sweep + dt * 0.9) % (Math.PI * 2);
    const R = Math.min(W, Hh) / 2 - 10, cx = W / 2, cy = Hh / 2;
    if (R < 20) return;
    ctx.clearRect(0, 0, W, Hh);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = "11px JetBrains, monospace"; ctx.fillText("today", cx + 4, cy - 4); ctx.fillText("~90 days", cx + R - 56, cy - 4);
    if (!RM && ctx.createConicGradient) {
      const g = ctx.createConicGradient(sweep - 0.9, cx, cy); g.addColorStop(0, "transparent"); g.addColorStop(0.14, C.other + "33"); g.addColorStop(0.1433, C.other + "AA"); g.addColorStop(0.15, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    }
    for (const b of blips) {
      const crossed = prev <= sweep ? b.ang > prev && b.ang <= sweep : b.ang > prev || b.ang <= sweep;
      if (crossed) b.lit = 1;
      b.lit = RM ? 1 : Math.max(0.28, b.lit - dt * 0.35);
      const [x, y] = pos(b);
      ctx.globalAlpha = b.lit; ctx.fillStyle = b.color;
      ctx.shadowColor = b.color; ctx.shadowBlur = 12 * b.lit;
      ctx.beginPath(); ctx.arc(x, y, b.size * (b === hover ? 1.5 : 1), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
  };
  cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
  const find = (e) => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 18;
    for (const b of blips) { const [bx, by] = pos(b); const d = Math.hypot(bx - x, by - y); if (d < bd) { bd = d; best = b; } } return [best, x, y]; };
  cv.addEventListener("pointermove", (e) => {
    const [b, x, y] = find(e); hover = b; cv.classList.toggle("hit", !!b);
    if (!b) { tip.hidden = true; return; }
    tip.hidden = false; tip.textContent = `${b.c.id} · ${productName(b.c)} · ${status(b.c)[0]}`;
    tip.style.left = Math.min(x + 12, W - 220) + "px"; tip.style.top = y + 12 + "px";
  });
  cv.addEventListener("pointerleave", () => { tip.hidden = true; hover = null; });
  cv.addEventListener("click", (e) => { const [b] = find(e); if (b) { sfx("pop"); detail(b.c); } });
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
