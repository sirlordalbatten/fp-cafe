// Certifications: blue, red, cloud, DFIR and leadership paths as a roadmap. Official links are re-checked
// weekly by the data pipeline; prices and exam details live on the official pages, so nothing here goes stale.
import { $, h, html, put, ext, ago, store, arr, modal, toast } from "../core.js";
import { load } from "../data.js";
import { bump } from "../state.js";

const PATHS = [["all", "All"], ["start", "Starting out"], ["blue", "Blue team"], ["red", "Red team"], ["cloud", "Cloud"], ["dfir", "DFIR"], ["grc", "Leadership & GRC"]];
const LEVELS = [["entry", "Entry"], ["mid", "Intermediate"], ["adv", "Advanced"]];
const FMT = { lab: "Hands-on exam", mcq: "Multiple choice", mixed: "Questions + practical" };
const TIPS = [
  "Book the exam date first. A deadline turns 'studying' into studying.",
  "Labs beat videos. Do the thing, then read about it.",
  "Keep one notes file per topic. You'll reuse it at work.",
  "Write it up like a real ticket or report. Most practical exams grade the write-up.",
  "Practise under time pressure at least twice before the real exam.",
];
let data = null, path = "all", q = "", issuer = "";
const plan = () => arr(store.get("certPlan", [])).filter((x) => typeof x === "string").slice(0, 30);

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Certifications</h1><p>Which cert next, and how to pass it. Official links are checked every week.</p></div>
  <div class="seg wraptabs" id="cpaths"></div>
  <div class="cfilter"><input type="search" id="cq" placeholder="Search certs, e.g. GIAC, forensics, AWS" aria-label="Search certifications" maxlength="60" autocomplete="off"><select id="cby" aria-label="Issuer"></select><span class="muted small" id="ccount"></span></div>
  <div class="two wide-left">
    <div class="roadmap" id="roadmap"></div>
    <aside class="stack">
      <div class="panel"><div class="ph"><h3>My plan</h3><span class="muted small" id="planN"></span></div><ol class="cplan" id="cplan"></ol></div>
      <div class="panel"><div class="ph"><h3>Pass any exam</h3></div><ul class="tight small" id="ctips"></ul></div>
      <div class="panel"><div class="ph"><h3>Cert news</h3><span class="muted small" id="cupd"></span></div><ul class="hl" id="cnews"></ul></div>
    </aside>
  </div>`);
  put($("#ctips"), TIPS.map((t) => h("li", t)));
  put($("#cpaths"), PATHS.map(([k, l]) => h("button" + (k === path ? ".on" : ""), { type: "button", onclick: (e) => { path = k; [...$("#cpaths").children].forEach((x) => x.classList.toggle("on", x === e.currentTarget)); roadmap(); } }, l)));
  $("#cq").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); roadmap(); });
  $("#cby").addEventListener("change", (e) => { issuer = e.target.value; roadmap(); });
  await refresh();
}
export async function refresh() {
  data = await load("certs");
  $("#cupd").textContent = data?.checked ? `links checked ${ago(data.checked)}` : "";
  put($("#cnews"), data?.news?.length ? data.news.map((n) => h("li", ext(n.u, n.t), h("span.hm", `${n.s} · ${ago(n.d)}`))) : [h("li.muted", "No certification news this week.")]);
  const by = [...new Set((data?.certs || []).map((c) => c.by))].sort((a, b) => a.localeCompare(b));
  put($("#cby"), h("option", { value: "" }, "All issuers"), by.map((b) => h("option", { value: b, selected: b === issuer }, b)));
  roadmap(); planUI();
}

function roadmap() {
  const box = $("#roadmap");
  const certs = (data?.certs || []).filter((c) => (path === "all" || c.path === path) && (!issuer || c.by === issuer)
    && (!q || `${c.n} ${c.by} ${c.focus} ${c.path}`.toLowerCase().includes(q)));
  const cc = $("#ccount"); if (cc) cc.textContent = data?.certs?.length ? `${certs.length} of ${data.certs.length}` : "";
  if (!certs.length) { put(box, h("p.muted", data?.certs?.length ? "No certs match. Try another word or clear the filters." : "The certification list appears after the first data refresh.")); return; }
  const mine = new Set(plan());
  put(box, LEVELS.map(([lv, label], i) => {
    const list = certs.filter((c) => c.level === lv);
    return h("section.rm-col", h("h3.rm-h", h("span.rm-step", String(i + 1)), label),
      list.length ? list.map((c) => h("button.cert.p-" + c.path + (mine.has(c.id) ? ".planned" : ""), { type: "button", onclick: () => open(c) },
        h("span.cert-by", c.by), h("b", c.n), h("span.cert-f", FMT[c.fmt]))) : [h("p.muted.small", "Nothing at this level in this path.")]);
  }));
}
function open(c) {
  bump("certs");
  const inPlan = () => plan().includes(c.id);
  const btn = h("button.btn" + (inPlan() ? ".on" : ".primary"), { type: "button" }, inPlan() ? "In my plan" : "Add to my plan");
  btn.addEventListener("click", () => { const p = plan(); const next = inPlan() ? p.filter((x) => x !== c.id) : [...p, c.id]; store.set("certPlan", next);
    btn.textContent = inPlan() ? "In my plan" : "Add to my plan"; btn.classList.toggle("on", inPlan()); btn.classList.toggle("primary", !inPlan()); planUI(); roadmap(); toast(inPlan() ? "Added to your plan" : "Removed from your plan"); });
  modal([h("p.cert-by", `${c.by} · ${FMT[c.fmt]} · ${LEVELS.find((l) => l[0] === c.level)[1]}`), h("h2", c.n), h("p", c.focus),
    h("h3.sub3", "How to pass"), h("ul.tight", c.tips.map((t) => h("li", t))),
    h("div.row", btn, ext(c.u, c.ok ? "Official page (price, exam details)" : "Issuer's site")),
    c.ok ? null : h("p.muted.small", "The exam page moved recently, so this links to the issuer's home page.")], { label: c.n });
}
function planUI() {
  const ids = plan(); const by = Object.fromEntries((data?.certs || []).map((c) => [c.id, c]));
  const list = ids.map((id) => by[id]).filter(Boolean);
  $("#planN").textContent = list.length ? `${list.length} cert${list.length === 1 ? "" : "s"}` : "";
  put($("#cplan"), list.length ? list.map((c) => h("li", h("button.linkbtn", { type: "button", onclick: () => open(c) }, c.n), h("span.hm", c.by))) : [h("li.muted.small", "Open a cert and add it to build your path. Saved in this browser.")]);
}
