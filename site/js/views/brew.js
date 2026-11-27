// Morning brew: a two-minute digest built from today's live data.
import { $, h, html, put, ext, store, todayKey, pickDay, ago, daysSince, copyText } from "../core.js";
import { load, cveList, statusLine } from "../data.js";
import { eventItems, liveStamp } from "../livepanel.js";
import { productName, detail } from "../cvecard.js";
import { bump, earn, xp } from "../state.js";
import { TERMS, FP_DATA, DETECTIONS } from "../content/legacy.js";

export async function mount(sec) {
  html(sec, `<div class="brew">
    <article class="receipt">
      <p class="r-shop">FP CAFÉ&nbsp;&nbsp;&nbsp;TABLE 3&nbsp;&nbsp;&nbsp;<span id="brewShift"></span></p>
      <h1 id="brewDate">Morning brew</h1>
      <p class="r-sub">Your two-minute digest. Read it with coffee, not with panic.</p>
      <p class="r-sub" id="brewStatus"></p>
      <div class="r-rule"></div><h2>Three things to know</h2><ol class="brew3" id="brewItems"></ol>
      <div class="r-rule"></div><h2>For your manager</h2><div id="mgr"></div>
      <div class="r-rule"></div><h2>Fresh off the wire</h2><ul class="wire" id="wire"></ul>
      <div class="r-rule"></div><h2>Word of the day</h2><div id="term"></div>
      <div class="r-rule"></div><h2>On this day</h2><div id="otd"></div>
      <p class="r-thanks">Thank you for defending. Please come again.</p>
    </article>
    <div class="stack">
      <div class="panel livep"><div class="ph"><h3>Happening now</h3><span class="muted small" id="brewNowUpd"></span></div><ol class="evlist" id="brewNow"></ol></div>
      <div class="panel det-today"><div class="ph"><h3>Detection of the day</h3><a class="link" href="#detect">Detection lab</a></div><div id="detBrew"></div></div>
      <div class="panel"><div class="ph"><h3>Copy for team chat</h3></div><p class="muted small">A plain-text version of this brew to paste into Teams or Slack.</p><button class="btn sm" id="brewCopy"><svg class="ic"><use href="#i-copy"/></svg>Copy the brew</button></div>
      <div class="panel"><div class="ph"><h3>Patch deadlines</h3><span class="muted small">CISA KEV due dates</span></div><ol class="due" id="dueList"></ol></div>
      <div class="panel"><div class="ph"><h3>Trending malware</h3><a class="link" href="#malware">Malware bar</a></div><ol class="bars" id="brewMal"></ol></div>
      <div class="panel"><div class="ph"><h3>Sectors ransomware hit</h3><span class="muted small">last 30 days</span></div><ol class="bars" id="brewSec"></ol></div>
      <div class="panel"><div class="ph"><h3>From SOC teams</h3><a class="link" href="#playbook">Playbook</a></div><ul class="hl" id="brewSoc"></ul></div>
    </div></div>`);
  const d = new Date();
  $("#brewDate").textContent = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  $("#brewShift").textContent = d.getHours() >= 22 || d.getHours() < 6 ? "NIGHT SHIFT" : "DAY SHIFT";
  $("#brewCopy").addEventListener("click", () => {
    const lines = [`FP Café brew, ${$("#brewDate").textContent}`, ...[...$("#brewItems").children].map((li, i) => `${i + 1}. ${li.textContent.replace(/Details$/, "").trim()}`), "", ...[...$("#mgr").children].map((p) => p.textContent)];
    copyText(lines.join("\n"), "Brew copied for team chat");
  });
  await fill();
  if (store.get("brewSeen", "") !== todayKey()) { store.set("brewSeen", todayKey()); bump("brew"); earn(5, "brew"); xp(10, "brew"); }
  const dot = $("#brewNew"); if (dot) dot.hidden = true;
}
export async function refresh() { await fill(); }
export function onLive() { return fill(); }
async function fill() {
  put($("#brewNow"), (() => { const it = eventItems(["ransom", "c2", "sample"], 6); return it.length ? it : [h("li.muted.small", "Waiting for the live feed.")]; })());
  $("#brewNowUpd").textContent = liveStamp();
  const [c, n, det] = await Promise.all([load("cves"), load("news"), load("detections")]);
  $("#brewStatus").textContent = c?.generated ? `Full refresh ${ago(c.generated)}, ${liveStamp()}. ${statusLine(c)}` : statusLine(c);
  const list = cveList(c);
  const kev = list.filter((x) => x.kev).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const hot = list.filter((x) => !x.kev && (x.cvss || 0) >= 9).sort((a, b) => (b.epss || 0) - (a.epss || 0))[0];
  const items = [];
  if (kev[0]) items.push(h("li", h("b", `${kev[0].id} is being exploited.`), ` ${productName(kev[0])}${kev[0].vendor ? ` from ${kev[0].vendor}` : ""}. `, kev[0].action || "", " ",
    h("button.linkbtn", { onclick: () => detail(kev[0]) }, "Details")));
  const top = n?.security?.[0]; if (top) items.push(h("li", h("b", "In the news: "), ext(top.u, top.t), h("span.muted", ` (${top.s}, ${ago(top.d)})`)));
  if (hot) items.push(h("li", h("b", `Watch ${hot.id}.`), ` CVSS ${hot.cvss?.toFixed(1)} in ${productName(hot)}, not yet seen exploited. `, h("button.linkbtn", { onclick: () => detail(hot) }, "Details")));
  else if (kev[1]) items.push(h("li", h("b", `Also exploited: ${kev[1].id}`), ` in ${productName(kev[1])}.`));
  put($("#brewItems"), items.length ? items : [h("li", "The live digest appears after the first data refresh. Here's a classic instead: patch your edge devices.")]);
  sidePanels(list, n);

  const s = c?.stats || {};
  const edgeDays = s.lastEdge ? daysSince(s.lastEdge + "T00:00:00Z") : null;
  put($("#mgr"), c ? [
    h("p", `CISA added ${s.kevAdded7} known-exploited vulnerabilities in the last 7 days and ${s.kevAdded30} in the last 30.${s.ransomware30 ? ` ${s.ransomware30} of those are linked to ransomware.` : ""}`),
    s.topVendors30?.length ? h("p", `Most affected vendors this month: ${s.topVendors30.slice(0, 3).map((v) => `${v[0]} (${v[1]})`).join(", ")}.`) : null,
    edgeDays !== null ? h("p", `The last exploited edge-device bug (VPNs, firewalls, gateways) was added ${edgeDays === 0 ? "today" : `${edgeDays} days ago`}. These are the most common way in.`) : null,
    h("p.muted", "Ask: do we run any of these, are they patched, and how do we know?"),
  ] : [h("p", "Numbers for your manager appear once live data arrives.")]);

  put($("#wire"), (n?.security || []).slice(1, 8).map((x) => h("li", ext(x.u, x.t), h("span.muted", ` · ${x.s} · ${ago(x.d)}`))));
  const term = pickDay(TERMS, 3); put($("#term"), h("p", h("b", term[0]), ": ", term[1]));
  const today = new Date(); const hist = FP_DATA.history || [];
  const near = hist.slice().sort((a, b) => Math.abs(mdiff(a.md, today)) - Math.abs(mdiff(b.md, today)))[0];
  put($("#otd"), near ? [h("p", h("b", `${near.year}, ${near.t}. `), near.d), Math.abs(mdiff(near.md, today)) > 0.5 ? h("p.muted.small", `(${near.md.replace("-", "/")}, the closest anniversary to today)`) : null] : h("p", "Every day is somebody's incident anniversary."));

  const fresh = (det?.rules || []).filter((r) => ["high", "critical"].includes(r.level));
  const pickD = fresh.length ? fresh[(Math.floor(Date.now() / 864e5)) % fresh.length] : null;
  if (pickD) put($("#detBrew"), h("p", h("b", pickD.title)), h("p.muted.small", `${pickD.srcName} · ${pickD.lang.toUpperCase()} · ${pickD.level}`), h("p.small", pickD.desc), h("a.btn.sm", { href: "#detect" }, "Open in the lab"));
  else { const d0 = pickDay(DETECTIONS); put($("#detBrew"), h("p", h("b", d0.t)), h("p.small", d0.why), h("a.btn.sm", { href: "#detect" }, "Open in the lab")); }

}
function mdiff(md, now) { if (!md) return 999; const [m, d] = md.split("-").map(Number); let diff = (new Date(now.getFullYear(), m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5; if (diff > 182) diff -= 365; if (diff < -182) diff += 365; return diff; }

// ---------- right-hand live panels ----------
async function sidePanels(list, n) {
  const now = Date.now();
  const due = list.filter((c) => c.kev && c.due && !c.snapshot).map((c) => [c, Math.ceil((Date.parse(c.due + "T23:59:59Z") - now) / 864e5)])
    .filter(([, d]) => d >= -3 && d <= 10).sort((a, b) => a[1] - b[1]).slice(0, 6);
  put($("#dueList"), due.length ? due.map(([c, d]) => h("li" + (d < 0 ? ".over" : d <= 2 ? ".soon" : ""), h("button.linkbtn", { type: "button", onclick: () => detail(c) }, productName(c)),
    h("span.due-d", d < 0 ? `${-d} d overdue` : d === 0 ? "today" : `${d} d`))) : [h("li.muted.small", "No federal deadlines in the next ten days.")]);
  const bars = (box, pairs) => { const max = Math.max(1, ...pairs.map((p) => p[1]));
    put(box, pairs.length ? pairs.map(([k, v], i) => { const f = h("span.bar-fill.anim"); f.style.setProperty("--w", Math.max(4, (v / max) * 100) + "%"); f.style.animationDelay = `${i * 70}ms`; return h("li", h("span.bar-k", k), h("span.bar", f), h("span.bar-v", String(v))); })
      : [h("li.muted.small", "Appears after the next data refresh.")]); };
  const [m, r] = await Promise.all([load("malware"), load("ransomware")]);
  let mal = (m?.trending || []).filter((x) => x.iocs).slice(0, 5).map((x) => [x.name, x.iocs]);
  if (!mal.length && m?.families) mal = Object.entries(m.families).map(([id, f]) => [id.split(".").pop().replace(/_/g, " "), (f.iocs7 || 0) + (f.mentions || 0)]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  bars($("#brewMal"), mal);
  bars($("#brewSec"), (r?.sectors30 || []).slice(0, 5));
  put($("#brewSoc"), (n?.soc || []).slice(0, 4).map((x) => h("li", ext(x.u, x.t), h("span.hm", `${x.s} · ${ago(x.d)}`))));
}
