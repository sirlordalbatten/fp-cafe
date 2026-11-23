// CVE menu: every exploited and critical CVE from the last few months, refreshed every 3 hours.
import { $, h, html, put, ago, store, on } from "../core.js";
import { load, cveList, classics, newSince, statusLine } from "../data.js";
import { card, isEdge, watchlist } from "../cvecard.js";
import { profile } from "../state.js";

const FILTERS = [["all", "All"], ["kev", "Exploited"], ["ran", "Ransomware"], ["crit", "Critical"], ["edge", "Edge devices"], ["mine", "My stack"], ["watch", "Watchlist"]];
const SORTS = [["heat", "Hottest"], ["new", "Newest"], ["epss", "Most likely exploited"], ["cvss", "Highest CVSS"]];
let list = [], filter = "all", sort = "heat", query = "", shown = 24, fresh = new Set(), mark = () => {};

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>The CVE menu</h1><p>Every known-exploited and critical CVE from the last few months, refreshed every three hours. Each dish comes with a roast and the grown-up advice.</p></div>
  <p class="muted small" id="menuStatus"></p>
  <div class="filters"><input class="search" id="mq" type="search" placeholder="Search CVE, vendor or product" aria-label="Search the menu">
    <div class="seg" id="mf" role="group" aria-label="Filter"></div><label class="sortl">Sort <select id="ms"></select></label></div>
  <div class="cards" id="menuList"></div>
  <div class="row center"><button class="btn" id="menuMore" hidden>Show more</button></div>
  <h2 class="sub">Aged classics</h2><p class="muted">The bugs that cancelled our weekends. Still worth knowing cold.</p>
  <div class="cards" id="menuOld"></div>`);
  put($("#mf"), FILTERS.map(([k, l]) => h("button" + (k === filter ? ".on" : ""), { dataset: { f: k }, "aria-pressed": String(k === filter) }, l)));
  put($("#ms"), SORTS.map(([k, l]) => h("option", { value: k }, l)));
  $("#mf").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; filter = b.dataset.f; shown = 24;
    [...$("#mf").children].forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); }); render(); });
  $("#ms").addEventListener("change", () => { sort = $("#ms").value; render(); });
  $("#mq").addEventListener("input", () => { query = $("#mq").value.trim().toLowerCase(); shown = 24; render(); });
  $("#menuMore").addEventListener("click", () => { shown += 24; render(); });
  const c = await load("cves");
  list = cveList(c);
  $("#menuStatus").textContent = c?.generated ? `${list.length} CVEs · refreshed ${ago(c.generated)} · sources: CISA KEV, NVD, FIRST EPSS. ${statusLine(c)}` : statusLine(c);
  const ns = newSince("menu", list.map((x) => x.id)); fresh = ns.fresh; mark = ns.mark;
  render(); classicsUI();
}
export function show() { render(); }
export function hide() { mark(); const b = $("#menuNew"); if (b) b.hidden = true; }

function match(c) {
  if (query && !`${c.id} ${c.vendor} ${c.product} ${c.title} ${c.desc}`.toLowerCase().includes(query)) return false;
  const stack = profile().stack.map((s) => s.toLowerCase());
  switch (filter) {
    case "kev": return c.kev; case "ran": return c.ransomware; case "crit": return c.sev === "critical"; case "edge": return isEdge(c);
    case "mine": return stack.some((s) => `${c.vendor} ${c.product}`.toLowerCase().includes(s.split(" ")[0]));
    case "watch": return watchlist().includes(c.id);
  }
  return true;
}
function render() {
  const box = $("#menuList"); if (!box) return;
  const by = { heat: (a, b) => b.heat - a.heat, new: (a, b) => (b.date || "").localeCompare(a.date || ""), epss: (a, b) => (b.epss || 0) - (a.epss || 0), cvss: (a, b) => (b.cvss || 0) - (a.cvss || 0) }[sort];
  const items = list.filter(match).sort(by);
  if (!items.length) {
    const msg = filter === "mine" ? (profile().stack.length ? "Nothing matching your stack right now. Enjoy it." : "Tell us what's in your stack (My corner, Profile) and this filter will show only what affects you.")
      : filter === "watch" ? "Star a card to add it to your watchlist." : "Nothing matches that. Try a different search.";
    put(box, h("p.empty", msg)); $("#menuMore").hidden = true; return;
  }
  put(box, items.slice(0, shown).map((c) => card(c, { fresh: fresh.has(c.id) && fresh.size < list.length })));
  $("#menuMore").hidden = items.length <= shown;
  const b = $("#menuNew"); if (b && fresh.size && fresh.size < list.length) { b.hidden = false; b.textContent = fresh.size; }
}
function classicsUI() {
  put($("#menuOld"), classics().slice().sort((a, b) => b.year - a.year).map((c) => h("article.mcard.classic",
    h("div.mc-top", h("span.mono.cid", c.id), h("span.grow"), h("span.pill.p-unk", String(c.year))),
    h("h3", `${c.nick}`), h("p.mc-prod.muted", c.product), h("p.roast", c.roast), h("p.small", c.lesson), h("p.hug", c.hug))));
}
