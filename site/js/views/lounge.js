// Lounge: the dashboard you keep open all shift. Today's numbers, what to patch first, two plain charts,
// a quick indicator lookup, headlines, ransomware activity, the arrivals board and your shift partner.
import { $, h, html, ext, put, on, RM, seedFrom, mulberry32, pick, pickDay, daysSince, ago, store, todayKey, fmtNum, copyText, toast, modal, pad, nextPatchTuesday, icon } from "../core.js";
import { classify, pivots, TYPE_NAME, defang } from "../ti.js";
import { load, cveList } from "../data.js";
import { detail, status, productName, isEdge } from "../cvecard.js";
import { clatter, sfx } from "../audio.js";
import { profile, quests, setMood, todayMood, bump, earn, xp, buddyInfo } from "../state.js";
import { drill } from "../incidents.js";
import { shiftState } from "./shift.js";
import { HORO, MOODS, MOOD_REPLY } from "../content/legacy.js";

let cves = [], news = null, mal = null, rw = null, stats = {};
let page = 0, flapTimer = 0, clockTimer = 0;
const FLAP_CH = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./";

export async function mount(sec) {
  html(sec, `
  <header class="dhead"><div><h1 id="hello2">Good shift</h1><p class="muted" id="today"></p></div>
    <button class="btn ghost sm" id="miDrill"><svg class="ic"><use href="#i-siren"/></svg>Run a drill</button></header>
  <div class="kpis" id="kpis" aria-label="Today at a glance"></div>
  <div class="dcols"><div class="dcol c1">
    <section class="panel w-patch"><div class="ph"><h3>Patch first</h3><a class="link" href="#menu">CVE menu</a></div>
      <p class="muted small">Exploited in the wild. Ransomware use and internet-facing devices go to the top.</p><ol class="pf" id="pfList"></ol></section>

    <section class="panel w-news"><div class="ph"><h3>Headlines</h3><a class="link" href="#brew">Full brew</a></div><ul class="hl" id="headlines"></ul></section>
    </div><div class="dcol c2">
    <section class="panel w-charts"><div class="ph"><h3>Exploited CVEs added per day</h3><span class="muted small" id="perDaySub"></span></div>
      <div class="vbars" id="perDay" role="img"></div><div class="vaxis" id="perDayAxis" aria-hidden="true"></div>
      <div class="ph ph2"><h3>Where they hit</h3><span class="muted small">last 30 days, tap a row</span></div><ol class="bars hbars" id="areas"></ol>
      <div class="ctip" id="ctip" hidden></div></section>
    <section class="panel w-rw"><div class="ph"><h3>Ransomware this week</h3><a class="link" href="#malware">Malware bar</a></div><ol class="bars" id="rwMini"></ol><p class="muted small" id="rwNote"></p>
      <div class="ph ph2"><h3>AI and MCP</h3><a class="link" href="#ai">AI lab</a></div><ul class="hl" id="aiMini"></ul></section>
    </div><div class="dcol c3"><form class="panel w-lookup lookup" id="tiForm" autocomplete="off">
      <div class="ph"><h3>Quick lookup</h3></div>
      <p class="muted small">IP, domain, URL, hash, email, CVE or ATT&amp;CK ID. Defanged is fine.</p>
      <div class="lk-row"><input id="tiIn" class="inp" spellcheck="false" aria-label="Indicator to look up" placeholder="185.220.101.4"><button class="btn">Look up</button></div>
      <div id="tiOut" class="lk-out" aria-live="polite"></div></form>
    <section class="panel w-partner buddy"><div class="ph"><h3 id="partnerName">Your shift partner</h3><span class="muted small" id="partnerDesc"></span></div>
      <div class="buddy-row"><div class="petwrap"><button class="mascot" id="buddy" title="Say hi"></button></div><div class="say" id="say" aria-live="polite">…</div></div>
      <div class="moods" id="moods"></div><p class="muted small" id="moodReply"></p></section>
    <div class="panel"><div class="ph"><h3>Today in ten seconds</h3></div><ul class="mini" id="miniBrew"></ul></div>
  </div></div>



  <div class="board compact" id="flapBoard" aria-label="Arrivals board of newly exploited CVEs">
    <div class="board-head"><h2 class="board-title">Arrivals</h2><p class="board-foot" id="boardFoot"></p></div>
    <div class="board-cols" aria-hidden="true"><span>CVE</span><span class="col-nk">Flight</span><span class="col-prod">From</span><span>Status</span></div>
    <div class="board-rows" id="flapRows"></div>
  </div>
  <div class="dgrid2">
    <div class="panel"><div class="ph"><h3>Daily quests</h3></div><div id="quests"></div></div>
    <div class="panel"><div class="ph"><h3>Shift horoscope</h3><span class="muted" id="horoRole"></span></div><p id="horo" class="horo"></p><p class="muted small" id="lucky"></p></div>
  </div>
  <div class="pager"><span class="pager-label">Pager</span><div class="ticker"><div class="track" id="ticker">Loading headlines…</div></div></div>`);

  $("#miDrill").addEventListener("click", () => drill());
  $("#flapRows").addEventListener("click", (e) => { const r = e.target.closest(".frow"); const c = r && cves.find((x) => x.id === r.dataset.id); if (c) detail(c); });
  $("#flapRows").addEventListener("keydown", (e) => { if (e.key === "Enter") { const r = e.target.closest(".frow"); const c = r && cves.find((x) => x.id === r.dataset.id); if (c) detail(c); } });
  $("#tiForm").addEventListener("submit", (e) => { e.preventDefault(); lookup($("#tiIn").value); });
  moodsUI(); questsUI(); horoscope(); partner();
  on("stat", questsUI); on("quests", questsUI); on("mood", questsUI); on("profile", () => { horoscope(); partner(); greet(); });
  const b = await import("../buddy.js"); b.initBuddy();
  greet(); clearInterval(clockTimer); clockTimer = setInterval(() => { if (location.hash.replace("#", "") === "lounge" || !location.hash) { greet(); kpis(); } }, 60000);
  const [c, n, m, r] = await Promise.all([load("cves"), load("news"), load("malware"), load("ransomware")]);
  apply(c, n, m, r);
  clearInterval(flapTimer);
  flapTimer = setInterval(() => { if (document.visibilityState === "visible" && location.hash.replace("#", "") === "lounge") { page++; board(true); } }, 60000);
}
export function show() { if (cves.length) board(false); greet(); }
export async function refresh() {
  const [c, n, m, r] = await Promise.all([load("cves"), load("news"), load("malware"), load("ransomware")]);
  apply(c, n, m, r);
}
function apply(c, n, m, r) {
  news = n; mal = m; rw = r; stats = c ? c.stats : {};
  cves = cveList(c);
  kpis(); patchFirst(); perDay(c); areas(); headlines(); rwMini(); board(true); brief(); ticker();
}

// ---------- header and numbers ----------
function greet() {
  const p = profile(); const hr = new Date().getHours();
  const part = hr < 5 ? "Hello, night owl" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  $("#hello2").textContent = p.name ? `${part}, ${p.name}` : part;
  const st = shiftState(); const d = new Date();
  $("#today").textContent = `${d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · ` +
    (st.on ? `on shift, ${Math.max(0, Math.round((st.e - d) / 6e4 / 6) / 10)} h to go` : "off shift. Set your hours in Shift buddy.");
}
function kpis() {
  const box = $("#kpis"); if (!box) return;
  const last = stats.lastEdge; const days = last ? Math.max(0, daysSince(last + "T00:00:00Z")) : null;
  const pt = nextPatchTuesday(new Date()); const ptd = Math.ceil((pt - new Date()) / 864e5);
  const grp = rw?.groups7?.[0];
  const tile = (href, n, label, sub, tone) => h("a.kpi" + (tone ? "." + tone : ""), { href }, h("span.kn", String(n)), h("span.kl", label), sub ? h("span.ks", sub) : null);
  put(box,
    tile("#menu", stats.kevAdded7 ?? "–", "exploited CVEs added this week", stats.kevAdded30 != null ? `${stats.kevAdded30} in 30 days` : "", stats.kevAdded7 >= 5 ? "hot" : ""),
    tile("#menu", stats.criticalNew7 ?? "–", "new critical CVEs this week", "CVSS 9 and up", ""),
    tile("#menu", stats.ransomware30 ?? "–", "exploited CVEs used by ransomware", "last 30 days", stats.ransomware30 ? "warn" : ""),
    tile("#malware", rw ? fmtNum(rw.total7) : "–", "ransomware leak-site posts this week", grp ? `busiest: ${grp[0]}` : "", ""),
    tile("#menu", days === null ? "–" : days, "days since an exploited edge device", days === 0 ? "it happened today" : days !== null && days < 7 ? "don't lean on the VPN box" : "", days === 0 ? "hot" : ""),
    tile("#shift", ptd <= 0 ? "today" : ptd, ptd <= 0 ? "Patch Tuesday is today" : `day${ptd === 1 ? "" : "s"} to Patch Tuesday`, pt.toLocaleDateString(undefined, { day: "numeric", month: "short" }), ptd <= 1 ? "warn" : ""));
}

// ---------- patch first ----------
function patchFirst() {
  const score = (c) => (c.ransomware ? 40 : 0) + (isEdge(c) ? 30 : 0) + (c.epss || 0) * 30 + Math.max(0, 30 - (Date.now() - Date.parse(c.date || 0)) / 864e5);
  const top = cves.filter((c) => c.kev && !c.snapshot).sort((a, b) => score(b) - score(a)).slice(0, 6);
  put($("#pfList"), top.length ? top.map((c) => { const [st, cls] = status(c); return h("li", h("button.pf-i", { type: "button", onclick: () => detail(c) },
    h("span.pf-top", h("b", [c.vendor, c.product].filter(Boolean).join(" ")), h("span.pill.stp." + cls, st)),
    h("span.muted.small", [c.id, isEdge(c) ? "edge device" : "", c.epss != null ? `EPSS ${(c.epss * 100).toFixed(c.epss < 0.1 ? 1 : 0)}%` : "", c.date ? `added ${ago(c.date + "T12:00:00Z")}` : ""].filter(Boolean).join(" · ")))); })
    : [h("li.muted", "Live data is on its way.")]);
}

// ---------- charts ----------
function tipAt(el, text) {
  const t = $("#ctip"); const box = t.parentElement.getBoundingClientRect(); const r = el.getBoundingClientRect();
  t.textContent = text; t.hidden = false;
  t.style.left = Math.max(4, Math.min(box.width - 200, r.left - box.left + r.width / 2 - 60)) + "px"; t.style.top = (r.top - box.top - 34) + "px";
}
const hideTip = () => { const t = $("#ctip"); if (t) t.hidden = true; };
function perDay(c) {
  const box = $("#perDay"); const days = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5); days.push(d.toISOString().slice(0, 10)); }
  const by = {}; for (const k of c?.kev || []) by[k.added] = (by[k.added] || []).concat(k);
  const vals = days.map((d) => (by[d] || []).length); const max = Math.max(1, ...vals); const total = vals.reduce((a, b) => a + b, 0);
  $("#perDaySub").textContent = c ? `${total} in 30 days · busiest day ${max}` : "";
  box.setAttribute("aria-label", `Exploited CVEs added to CISA KEV per day for the last 30 days. ${total} in total, at most ${max} on one day.`);
  put(box, days.map((d, i) => {
    const v = vals[i]; const list = by[d] || [];
    const b = h("button.vb" + (v ? "" : ".zero") + (i === 29 ? ".today" : ""), { type: "button", "aria-label": `${d}: ${v}` });
    const fill = h("span.vb-f"); fill.style.height = (v ? Math.max(6, (v / max) * 100) : 0) + "%"; b.append(fill);
    const label = `${new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short" })}: ${v} added${list.length ? " · " + list.slice(0, 2).map((x) => `${x.vendor} ${x.product}`.trim()).join(", ") + (list.length > 2 ? "…" : "") : ""}`;
    b.addEventListener("pointerenter", () => tipAt(b, label)); b.addEventListener("focus", () => tipAt(b, label));
    b.addEventListener("pointerleave", hideTip); b.addEventListener("blur", hideTip);
    b.addEventListener("click", () => { if (list.length) listModal(`Added to KEV on ${d}`, list.map((k) => cves.find((x) => x.id === k.id)).filter(Boolean)); });
    return b;
  }));
  const fmt = (d) => new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short" });
  put($("#perDayAxis"), h("span", fmt(days[0])), h("span", fmt(days[15])), h("span", "today"));
}
const SECTORS = [
  ["Edge & network", /router|firewall|vpn|gateway|switch|load balanc|fortinet|fortios|fortigate|ivanti|connect secure|citrix|netscaler|palo alto|pan-os|sonicwall|cisco|juniper|\bf5\b|big-ip|zyxel|d-link|tp-link|netgear|draytek|ubiquiti|mikrotik|check point|\bnas\b|qnap|synology/],
  ["OS & browsers", /windows|win32k|kernel|linux|macos|\bios\b|ipados|android|chrome|chromium|firefox|safari|webkit|apple|samsung|\bsmb\b|ntlm|kerberos|pixel/],
  ["Servers & business apps", /exchange|sharepoint|oracle|\bsap\b|netweaver|vmware|vcenter|esxi|veeam|confluence|jira|atlassian|servicenow|sql server|weblogic|tomcat|moveit|goanywhere|papercut|backup|\berp\b|crm|commvault|solarwinds|manageengine|zoho|trimble|cityworks|kaseya|connectwise|screenconnect/],
  ["AI & dev tools", /\bai\b|\bllm|langchain|langflow|ollama|vllm|\bmcp\b|comfyui|gradio|jupyter|hugging ?face|openai|copilot|litellm|open webui|n8n|\bnpm\b|pypi|node\.js|github|gitlab|jenkins|teamcity|docker|kubernetes|terraform|\bgit\b/],
  ["Web & CMS", /wordpress|wp plugin|plugin|drupal|joomla|magento|craft cms|\bphp\b|\bcms\b|web application|cross-site|\bxss\b|laravel|struts|spring/],
  ["Everything else", /.*/],
];

function sectorOf(c) {
  if (isEdge(c)) return 0;
  const who = `${c.vendor} ${c.product}`.toLowerCase(); const all = `${who} ${c.title} ${c.desc}`.toLowerCase();
  const i = SECTORS.findIndex(([, rx], k) => k < 5 && rx.test(who)); // vendor/product first, it's the most reliable
  return i >= 0 ? i : SECTORS.findIndex(([, rx]) => rx.test(all));
}

function areas() {
  const recent = cves.filter((c) => !c.snapshot && c.date && Date.now() - Date.parse(c.date) < 30.5 * 864e5);
  const groups = SECTORS.map(([n]) => ({ n, items: [] })); for (const c of recent) groups[sectorOf(c)].items.push(c);
  const rows = groups.filter((g) => g.items.length).sort((a, b) => b.items.length - a.items.length);
  const max = Math.max(1, ...rows.map((g) => g.items.length));
  put($("#areas"), rows.length ? rows.map((g) => {
    const kev = g.items.filter((c) => c.kev).length;
    const fill = h("span.bar-fill"); fill.style.width = Math.max(4, (g.items.length / max) * 100) + "%";
    return h("li", h("button.bar-k.bar-btn", { type: "button", onclick: () => listModal(g.n, g.items) }, g.n), h("span.bar", fill), h("span.bar-v", { title: `${kev} exploited` }, String(g.items.length)));
  }) : [h("li.muted", "No recent CVEs yet.")]);
}
function listModal(title, items) {
  modal([h("h2", title), h("ul.aicve", items.sort((a, b) => b.heat - a.heat).slice(0, 30).map((c) => { const [st, cls] = status(c);
    return h("li", h("button.rt", { type: "button", onclick: () => detail(c) }, h("span.rt-id", c.id), h("span.rt-p", productName(c)), h("span.pill.stp." + cls, st))); }))], { label: title });
}

// ---------- lists ----------
function headlines() {
  const items = (news?.security || []).slice(0, 8);
  put($("#headlines"), items.length ? items.map((n) => h("li", ext(n.u, n.t), h("span.hm", `${n.s} · ${ago(n.d)}`))) : [h("li.muted", "Headlines appear after the first data refresh.")]);
  const ai = [...(news?.ai || []).slice(0, 2).map((n) => h("li", ext(n.u, n.t), h("span.hm", `${n.s} · ${ago(n.d)}`))),
    ...(news?.mcp || []).slice(0, 2).map((m) => h("li", m.u ? ext(m.u, m.t.split("/").pop()) : m.t, h("span.hm", `New MCP server · ${ago(m.d)}`)))];
  put($("#aiMini"), ai.length ? ai : [h("li.muted", "Nothing yet.")]);
}
function rwMini() {
  const box = $("#rwMini"); const g = rw?.groups7?.length ? rw.groups7 : rw?.groups30 || [];
  if (!g.length) { put(box, h("li.muted", "Ransomware activity appears after the first data refresh.")); $("#rwNote").textContent = ""; return; }
  const max = Math.max(1, ...g.map((x) => x[1]));
  put(box, g.slice(0, 5).map(([k, v]) => { const f = h("span.bar-fill.rwf"); f.style.width = Math.max(4, (v / max) * 100) + "%"; return h("li", h("span.bar-k", k), h("span.bar", f), h("span.bar-v", String(v))); }));
  const sec = rw.sectors30?.[0]; $("#rwNote").textContent = sec ? `Most-hit sector this month: ${sec[0]}. Claims from leak sites, counts only.` : "";
}
function partner() {
  const b = buddyInfo(); if (!b) return;
  $("#partnerName").textContent = b.n; $("#partnerDesc").textContent = b.d;
}

// ---------- ten-second brief ----------
function brief() {
  const ul = $("#miniBrew"); const items = [];
  const top = cves.find((c) => c.kev);
  if (stats.kevAdded7 !== undefined) items.push(h("li", h("b", `${stats.kevAdded7} new exploited CVEs this week.`), top ? ` Newest: ${top.id} in ${productName(top)}.` : ""));
  const fam = mal ? Object.entries(mal.families).sort((a, b) => (b[1].mentions || 0) + (b[1].iocs7 || 0) - (a[1].mentions || 0) - (a[1].iocs7 || 0))[0] : null;
  if (fam && (fam[1].mentions || fam[1].iocs7)) items.push(h("li", "Malware in the news: ", h("a.link", { href: "#malware" }, fam[0].split(".")[1].replace(/_/g, " ")), "."));
  const s = news?.soc?.[0]; if (s) items.push(h("li", h("span.muted", "From SOC teams: "), ext(s.u, s.t)));
  put(ul, items.length ? items : [h("li.muted", "Live data is on its way. The first refresh runs a few minutes after deploy.")]);
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
