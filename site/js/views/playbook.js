// SOC playbook: what well-run SOCs do, each with its public source and a first-week version,
// a quick self-check, and a live feed of writing from SOC and detection teams around the world.
import { $, h, html, put, ext, ago, store, obj } from "../core.js";
import { load } from "../data.js";
import { bump, xp } from "../state.js";
import { sfx } from "../audio.js";
import { PRACTICES, SELFCHECK } from "../content/playbook.js";

let tag = "All", soc = [];

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>SOC playbook</h1><p>What the best-run security teams do, where they wrote it down, and how to try each idea in your own SOC this week. Plus fresh writing from SOC and detection teams, refreshed every few hours.</p></div>
  <div class="two wide-left">
    <div>
      <div class="seg wraptabs" id="pbTags"></div>
      <div class="pbgrid" id="pbList"></div>
    </div>
    <aside class="stack">
      <div class="panel"><div class="ph"><h3>Quick self-check</h3><span class="muted small" id="scScore"></span></div>
        <p class="muted small">Tick what's true today. Each gap links to the practice that fixes it. Saved in this browser only.</p><div id="selfcheck"></div></div>
      <div class="panel"><div class="ph"><h3>From SOC teams this week</h3><span class="muted small" id="socUpd"></span></div><div class="seg wraptabs small" id="socTags"></div><ul class="wire" id="socFeed"></ul></div>
    </aside>
  </div>`);
  const tags = ["All", ...new Set(PRACTICES.map((p) => p.tag))];
  put($("#pbTags"), tags.map((t) => h("button" + (t === tag ? ".on" : ""), { onclick: (e) => { tag = t; [...$("#pbTags").children].forEach((x) => x.classList.toggle("on", x === e.currentTarget)); list(); } }, t)));
  list(); selfcheck();
  await refresh();
}
export async function refresh() {
  const n = await load("news"); soc = n?.soc || [];
  $("#socUpd").textContent = n?.generated ? `refreshed ${ago(n.generated)}` : "";
  const T = [["all", "All"], ["detection", "Detection"], ["ir", "Incidents"], ["practice", "How teams work"], ["threat", "Threats"]];
  let cur = "all";
  const draw = () => put($("#socFeed"), (soc.filter((x) => cur === "all" || x.g.includes(cur)).slice(0, 14).map((x) => h("li", ext(x.u, x.t), h("span.muted", ` · ${x.s} · ${ago(x.d)}`), x.x ? h("p.small.muted", x.x) : null)))
    .concat(soc.length ? [] : [h("li.muted", "The SOC feed appears after the first data refresh.")]));
  put($("#socTags"), T.map(([k, l]) => h("button" + (k === cur ? ".on" : ""), { onclick: (e) => { cur = k; [...$("#socTags").children].forEach((x) => x.classList.toggle("on", x === e.currentTarget)); draw(); } }, l)));
  draw();
}

function tried() { return obj(store.get("pbTried", {})); }
function list() {
  const t = tried();
  put($("#pbList"), PRACTICES.filter((p) => tag === "All" || p.tag === tag).map((p) => {
    const btn = h("button.btn.sm" + (t[p.id] ? ".on" : ".ghost"), { type: "button", "aria-pressed": String(!!t[p.id]) }, t[p.id] ? "Trying it" : "We'll try this");
    btn.addEventListener("click", () => { const x = tried(); x[p.id] = !x[p.id]; store.set("pbTried", x); if (x[p.id]) { sfx("pop"); bump("ai"); xp(5, "playbook"); } list(); });
    return h("article.pb" + (t[p.id] ? ".tried" : ""), { id: "pb-" + p.id },
      h("div.mc-top", h("span.pill.p-lav", p.tag), h("span.grow"), btn),
      h("h3", p.t), h("p.small.muted", "From: ", ext(p.u, p.from)), h("p", p.why),
      h("details", h("summary", "Try it this week"), h("ol.tight", p.week.map((s) => h("li", s)))));
  }));
}
function selfcheck() {
  const st = obj(store.get("pbCheck", {}));
  const box = $("#selfcheck"); const yes = SELFCHECK.filter(([, id]) => st[id]).length;
  $("#scScore").textContent = `${yes} of ${SELFCHECK.length}`;
  put(box, SELFCHECK.map(([q, id]) => h("div.scrow", h("label.chk", h("input", { type: "checkbox", checked: st[id] ? true : null, onchange: (e) => { const s = obj(store.get("pbCheck", {})); s[id] = e.target.checked; store.set("pbCheck", s); selfcheck(); } }), h("span", q)),
    st[id] ? null : h("button.linkbtn.small", { type: "button", onclick: () => { tag = "All"; list(); [...$("#pbTags").children].forEach((x) => x.classList.toggle("on", x.textContent === "All")); const el = $("#pb-" + id); el?.scrollIntoView({ block: "center" }); el?.classList.add("flash"); setTimeout(() => el?.classList.remove("flash"), 1600); } }, "how"))),
    h("p.small", yes >= 9 ? "Strong. Pick the gap that hurts most and close it this quarter." : yes >= 5 ? "Solid base. The unticked ones are your roadmap." : "Lots of room to grow. Start with one practice, not all of them."));
}
