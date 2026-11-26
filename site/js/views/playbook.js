// SOC playbook: what well-run SOCs do, each with its public source and a first-week version,
// a quick self-check, and a live feed of writing from SOC and detection teams around the world.
import { $, h, html, put, ext, ago, store, obj, arr, str, copyText, toast } from "../core.js";
import { load } from "../data.js";
import { bump, xp } from "../state.js";
import { sfx } from "../audio.js";
import { PRACTICES, SELFCHECK, PLACES, KINDS } from "../content/playbook.js";

let tag = "All", soc = [];

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>SOC playbook</h1><p>What the best-run security teams do, where they wrote it down, and how to try each idea in your own SOC this week. Plus fresh writing from SOC and detection teams, refreshed every few hours.</p></div>
  <div class="seg tabs" id="pbMode"><button data-m="practices" class="on">Practices</button><button data-m="audit">Surface audit</button></div>
  <div class="two wide-left">
    <div>
      <div id="pbPractices"><div class="seg wraptabs" id="pbTags"></div><div class="pbgrid" id="pbList"></div></div>
      <div id="pbAudit" hidden></div>
    </div>
    <aside class="stack">
      <div class="panel"><div class="ph"><h3>Quick self-check</h3><span class="muted small" id="scScore"></span></div>
        <p class="muted small">Tick what's true today. Each gap links to the practice that fixes it. Saved in this browser only.</p><div id="selfcheck"></div></div>
      <div class="panel"><div class="ph"><h3>From SOC teams this week</h3><span class="muted small" id="socUpd"></span></div><div class="seg wraptabs small" id="socTags"></div><ul class="wire" id="socFeed"></ul></div>
    </aside>
  </div>`);
  const tags = ["All", ...new Set(PRACTICES.map((p) => p.tag))];
  put($("#pbTags"), tags.map((t) => h("button" + (t === tag ? ".on" : ""), { onclick: (e) => { tag = t; [...$("#pbTags").children].forEach((x) => x.classList.toggle("on", x === e.currentTarget)); list(); } }, t)));
  list(); selfcheck(); audit();
  $("#pbMode").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; [...$("#pbMode").children].forEach((x) => x.classList.toggle("on", x === b));
    $("#pbPractices").hidden = b.dataset.m !== "practices"; $("#pbAudit").hidden = b.dataset.m !== "audit"; });
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

// ---------- surface audit: defensive minimalism in practice ----------
const items = () => arr(store.get("surface", [])).map((x) => ({ n: str(x?.n, 80), k: KINDS.includes(x?.k) ? x.k : KINDS[0], net: x?.net === true, who: str(x?.who, 120), gain: str(x?.gain, 160), without: ["no", "maybe", "yes"].includes(x?.without) ? x.without : "no" })).filter((x) => x.n).slice(0, 200);
function verdict(x) {
  if (!x.who.trim() || x.without === "yes") return ["Remove", "p-crit", "Nobody clearly needs it, or people could work without it. Switch it off or withdraw it."];
  if (x.without === "maybe" || (x.net && ["Credential or token", "Test or staging system", "API or old endpoint"].includes(x.k))) return ["Narrow", "p-high", "Keep it, but shrink it: put it behind sign-in, scope it down, shorten its life, or move it off the internet."];
  return ["Keep", "p-unk", "It earns its place. Make sure it's patched, monitored and owned."];
}
function audit() {
  const box = $("#pbAudit"); const dom = str(store.get("surfaceDomain", ""), 120);
  const domIn = h("input.inp", { type: "text", placeholder: "yourcompany.com", value: dom, "aria-label": "Your domain", spellcheck: "false" });
  const placeBox = h("ul.places"); const seen = obj(store.get("surfaceSeen", {}));
  const drawPlaces = () => {
    const d = domIn.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/[^a-z0-9.-]/g, "");
    store.set("surfaceDomain", d);
    put(placeBox, PLACES.map(([t, why, u], i) => h("li", h("label.chk", h("input", { type: "checkbox", checked: seen[i] ? true : null, onchange: (e) => { const x = obj(store.get("surfaceSeen", {})); x[i] = e.target.checked; store.set("surfaceSeen", x); } }),
      h("span", h("b", t), " ", u && d ? ext(u.replaceAll("{d}", encodeURIComponent(d)), "open") : null, h("span.muted.small.blk", why))))));
  };
  domIn.addEventListener("input", drawPlaces);
  const f = { n: h("input.inp", { placeholder: "What is it? e.g. old partner API, Jenkins, staging site", maxlength: "80", "aria-label": "Name" }),
    k: h("select", { "aria-label": "Kind" }, KINDS.map((k) => h("option", { value: k }, k))),
    net: h("input", { type: "checkbox", "aria-label": "Reachable from the internet" }),
    who: h("input.inp", { placeholder: "Who needs it? (blank if nobody knows)", maxlength: "120", "aria-label": "Who needs it" }),
    gain: h("input.inp", { placeholder: "What do they gain?", maxlength: "160", "aria-label": "What they gain" }),
    without: h("select", { "aria-label": "Could they work without it" }, [["no", "No, they really need it"], ["maybe", "Maybe, with a narrower version"], ["yes", "Yes, they'd manage"]].map(([v, l]) => h("option", { value: v }, l))) };
  const list = h("div.audit-list"); const sum = h("p.audit-sum");
  const draw = () => {
    const all = items(); const c = { Keep: 0, Narrow: 0, Remove: 0 };
    put(list, all.length ? all.map((x, i) => { const [v, cls, why] = verdict(x); c[v]++;
      return h("div.audit-row", h("div", h("b", x.n), h("span.muted.small", ` · ${x.k}${x.net ? " · internet-facing" : ""}`), h("p.small", x.who ? `Needed by ${x.who}${x.gain ? `, for ${x.gain}` : ""}.` : "Nobody named who needs it."), h("p.muted.small", why)),
        h("div.audit-v", h("span.pill." + cls, v), h("button.xbtn.sm", { "aria-label": `Remove ${x.n} from the list`, onclick: () => { const a = items(); a.splice(i, 1); store.set("surface", a); draw(); } }, "×")));
    }) : [h("p.muted", "Nothing listed yet. Start with five things you expose to the internet.")]);
    sum.textContent = all.length ? `Would we build it again? Keep ${c.Keep}, narrow ${c.Narrow}, remove ${c.Remove}. Every removal is a route nobody has to monitor.` : "";
  };
  const add = () => { const n = f.n.value.replace(/[<>]/g, "").trim(); if (!n) { f.n.focus(); return; }
    store.set("surface", [{ n, k: f.k.value, net: f.net.checked, who: f.who.value.replace(/[<>]/g, "").trim(), gain: f.gain.value.replace(/[<>]/g, "").trim(), without: f.without.value }, ...items()]);
    f.n.value = f.who.value = f.gain.value = ""; f.net.checked = false; sfx("pop"); bump("ai"); draw(); };
  const report = () => copyText(["SURFACE AUDIT", new Date().toLocaleDateString(), "", ...items().map((x) => `[${verdict(x)[0]}] ${x.n} (${x.k}${x.net ? ", internet-facing" : ""}). Who: ${x.who || "nobody named"}. Gain: ${x.gain || "-"}.`), "", sum.textContent].join("\n"), "Audit copied");
  put(box,
    h("div.panel", h("div.ph", h("h3", "Where an agent would look first"), h("span.muted.small", "links open public sources in a new tab")),
      h("p.small", "Enter your domain and walk the list. Tick what you've reviewed. Saved in this browser only."),
      h("div.lk-row", domIn), placeBox,
      h("p.muted.small", "Inspired by Florian Roth's idea of defensive minimalism. Only look at domains you're responsible for.")),
    h("div.panel", h("div.ph", h("h3", "Would we build it again?"), h("span.muted.small", "keep, narrow or remove")),
      h("p.small", "For everything you expose: who needs it, what do they gain, and could they work without it? Anything nobody can justify is attack surface with no upside."),
      h("div.audit-form", f.n, f.k, h("label.chk", f.net, h("span", "Reachable from the internet")), f.who, f.gain, f.without, h("button.btn.primary", { type: "button", onclick: add }, "Add to the audit")),
      sum, list, h("div.row", h("button.btn.ghost.sm", { type: "button", onclick: report }, "Copy as a report"))));
  drawPlaces(); draw();
}
