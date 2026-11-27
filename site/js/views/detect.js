// Detection lab: fresh rules from public repos, live rule changes within minutes, plus curated playbooks.
import { $, h, html, put, ext, ago, copyText, daysSince } from "../core.js";
import { load, statusLine } from "../data.js";
import { live } from "../live.js";
import { liveStamp } from "../livepanel.js";
import { profile, bump, xp } from "../state.js";
import { DETECTIONS } from "../content/legacy.js";

const LANGS = [["all", "All languages"], ["kql", "KQL · Sentinel/Defender"], ["spl", "SPL · Splunk"], ["yaral", "YARA-L · Google SecOps"], ["sigma", "Sigma · any SIEM"]];
const SIEM_LANG = { "Sentinel / Defender": "kql", Splunk: "spl", "Google SecOps": "yaral" };
const LV = ["critical", "high", "medium", "low", "informational"];
let rules = [], lang = "all", src = "live", q = "", level = "all";

export async function mount(sec) {
  lang = SIEM_LANG[profile().siem] || "all";
  html(sec, `<div class="vh"><h1>Detection lab</h1><p>The newest detections from SigmaHQ, Splunk, Microsoft Sentinel and Google SecOps, with rule changes shown live as they merge upstream, plus curated playbooks with triage and tuning notes. Test on historical data before you enable anything.</p></div>
  <p class="muted small" id="detStatus"></p>
  <section class="panel livep"><div class="ph"><h3>Just merged upstream</h3><span class="muted small" id="detLiveUpd"></span></div><ol class="evlist" id="detLive"></ol></section>
  <div class="seg tabs" id="dsrc"><button data-s="live" class="on">Fresh from upstream</button><button data-s="curated">Curated playbooks</button></div>
  <div class="filters"><input class="search" id="dlq" type="search" placeholder="Search: lsass, kerberos, T1053, okta" aria-label="Search detections">
    <div class="seg" id="dlf"></div><label class="sortl">Level <select id="dll"><option value="all">Any</option><option value="critical">Critical</option><option value="high">High+</option><option value="medium">Medium+</option></select></label></div>
  <div id="dlList"></div>
  <p class="muted small">Upstream rules keep their original licences (shown on each rule) and link back to the source. Map field names to your own parsers: tables, add-ons and UDM mappings differ between environments.</p>`);
  put($("#dlf"), LANGS.map(([k, l]) => h("button" + (k === lang ? ".on" : ""), { dataset: { l: k } }, l)));
  $("#dlf").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; lang = b.dataset.l; [...$("#dlf").children].forEach((x) => x.classList.toggle("on", x === b)); render(); });
  $("#dsrc").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; src = b.dataset.s; [...$("#dsrc").children].forEach((x) => x.classList.toggle("on", x === b)); render(); });
  $("#dlq").addEventListener("input", () => { q = $("#dlq").value.trim().toLowerCase(); render(); });
  $("#dll").addEventListener("change", () => { level = $("#dll").value; render(); });
  const d = await load("detections");
  rules = d?.rules || [];
  $("#detStatus").textContent = d?.generated ? `${rules.length} fresh rules · refreshed ${ago(d.generated)}. ${statusLine(d)}` : "Fresh rules appear after the first data refresh. Curated playbooks are always here.";
  if (!rules.length) { src = "curated"; [...$("#dsrc").children].forEach((x) => x.classList.toggle("on", x.dataset.s === "curated")); }
  render(); merged();
}

export function onLive() { merged(); }
function merged() {
  const box = $("#detLive"); if (!box) return;
  const rows = live("detect") || [];
  $("#detLiveUpd").textContent = liveStamp();
  put(box, rows.length ? rows.slice(0, 8).map((c) => h("li.evi", h("span.evk", c.s), h("span.evx", ext(c.u, c.t)), h("time", { title: new Date(c.d).toLocaleString() }, ago(c.d))))
    : [h("li.muted.small", "Waiting for the live feed. New and changed rules from SigmaHQ, Elastic and Splunk appear here as they merge.")]);
}
function lvOk(l) { if (level === "all") return true; return LV.indexOf(l) <= LV.indexOf(level); }
function render() {
  const box = $("#dlList");
  if (src === "live") {
    const items = rules.filter((r) => (lang === "all" || r.lang === lang) && lvOk(r.level) &&
      (!q || `${r.title} ${r.desc} ${r.tech.join(" ")} ${r.tactics.join(" ")} ${r.logsource} ${r.srcName}`.toLowerCase().includes(q)));
    put(box, items.length ? items.slice(0, 60).map(liveCard) : [h("p.empty", rules.length ? "No fresh rules match. Try All languages." : "No fresh rules yet. Switch to Curated playbooks.")]);
  } else {
    const items = DETECTIONS.filter((d) => !q || `${d.t} ${d.tech} ${d.tactic} ${d.why}`.toLowerCase().includes(q));
    put(box, items.map(curatedCard));
  }
}
const LANG_NAME = { kql: "KQL", spl: "SPL", yaral: "YARA-L", sigma: "Sigma" };
function codeBlock(text, label) {
  const pre = h("pre.codebox", h("code", text));
  return [h("div.codehead", h("span.muted.small", label), h("button.btn.sm", { onclick: () => { copyText(text, "Query copied"); bump("copies"); xp(3, "copy"); } }, "Copy")), pre];
}
function liveCard(r) {
  const isNew = r.date && daysSince(r.date + "T00:00:00Z") <= 7;
  return h("details.det.live",
    h("summary",
      h("div.dethead", h("span.pill.lang", LANG_NAME[r.lang]), h("span.pill.lv-" + r.level, r.level), isNew ? h("span.pill.p-new", "new this week") : null, h("span.grow"), h("span.muted.small", `${r.srcName} · ${r.date || ""}`)),
      h("h3", r.title), r.desc ? h("p.small", r.desc) : null, h("span.openhint", "Show the rule"),
      h("div.pills", r.tech.map((t) => { const a = ext(`https://attack.mitre.org/techniques/${t.replace(".", "/")}/`, t, "pill p-unk"); a.title = `Open ${t} in MITRE ATT&CK (new tab)`; a.addEventListener("click", (e) => e.stopPropagation()); return a; }), r.tactics.map((t) => h("span.pill.p-lav", t)))),
    h("div.detbody",
      r.logsource ? h("p.small", h("b", "Data: "), r.logsource) : null,
      r.how ? h("p.small", h("b", "How to implement: "), r.how) : null,
      r.fp.length ? h("p.small", h("b", "False positives: "), r.fp.join(" · ")) : null,
      codeBlock(r.query, `${LANG_NAME[r.lang]} · ${r.license}${r.author ? " · by " + r.author : ""}`),
      h("p.links", r.url ? ext(r.url, "View the original rule") : null)));
}
function curatedCard(d) {
  const langs = ["kql", "spl", "yaral", "sigma"].filter((k) => d[k]);
  let cur = langs.includes(lang) ? lang : langs[0];
  const codeWrap = h("div");
  const tabs = h("div.seg.small", langs.map((k) => h("button" + (k === cur ? ".on" : ""), { onclick: (e) => { cur = k; [...tabs.children].forEach((x) => x.classList.toggle("on", x === e.currentTarget)); put(codeWrap, codeBlock(d[k], LANG_NAME[k])); } }, LANG_NAME[k])));
  put(codeWrap, codeBlock(d[cur], LANG_NAME[cur]));
  return h("details.det",
    h("summary", h("div.dethead", h("span.pill.lv-" + (d.sev || "medium"), d.sev || "medium"), h("span.pill.p-unk", d.tech), h("span.pill.p-lav", d.tactic), h("span.grow"), h("span.muted.small", "curated playbook")),
      h("h3", d.t), h("p.small", d.why), h("span.openhint", "Show the playbook")),
    h("div.detbody",
      h("p.small", h("b", "Data you need: "), d.data),
      h("div.detgrid", h("div", h("b", "Triage"), h("ul.tight", [].concat(d.triage).map((x) => h("li", x)))), h("div", h("b", "Respond"), h("ul.tight", [].concat(d.respond).map((x) => h("li", x))))),
      h("p.small", h("b", "False positives: "), [].concat(d.fp).join(" · ")), h("p.small", h("b", "Tuning tip: "), d.tune),
      tabs, codeWrap));
}
