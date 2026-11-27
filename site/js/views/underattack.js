// Under attack: pick what is happening, work the checklist against an incident clock, keep timestamped
// notes, see who to call in your country, and what is active right now. Everything stays in this browser.
import { $, h, put, ext, ago, store, obj, arr, toast, copyText, fmtDur, modal } from "../core.js";
import { load, cveList } from "../data.js";
import { live as liveFeed } from "../live.js";
import { PHASES, CALL_TREE, PLAYBOOKS } from "../content/underattack.js";

const KIND = { cert: "National CERT", police: "Police and fraud", reg: "Data protection regulator", help: "Help and tools" };
let sel = PLAYBOOKS[0].id, clockTimer = 0, contacts = null, live = {};

const inc = () => { const v = obj(store.get("incident", null)); return v.pb && PLAYBOOKS.some((p) => p.id === v.pb) ? { pb: v.pb, start: +v.start || Date.now(), done: obj(v.done), called: obj(v.called), notes: arr(v.notes).slice(-200) } : null; };
const save = (v) => store.set("incident", v);
const pb = () => PLAYBOOKS.find((p) => p.id === sel);

export async function mount(sec) {
  const cur = inc(); if (cur) sel = cur.pb;
  put(sec,
    h("div.vh", h("h1", "Under attack"), h("p", "Pick what is happening. Work the steps in order, keep notes as you go, and call the right people early.")),
    h("div.ua-pick", { id: "uaPick", role: "list" }),
    h("div.ua-main",
      h("div.ua-left", { id: "uaBook" }),
      h("aside.ua-side",
        h("section.ua-clock", { id: "uaClock" }),
        h("section.panel", h("div.ph", h("h3", "Notes"), h("span.muted.small", "kept in this browser only")),
          h("form.ua-note", { id: "uaNoteF" }, h("input", { id: "uaNote", type: "text", maxlength: "300", placeholder: "What did you see or do?", "aria-label": "Add a note", autocomplete: "off" }), h("button.btn.sm", { type: "submit" }, "Add")),
          h("ol.ua-notes", { id: "uaNotes" })),
        h("section.panel", h("div.ph", h("h3", "Who to call")), h("ol.ua-tree", { id: "uaTree" }),
          h("label.ua-cc", "Your country ", h("select", { id: "uaCC" })), h("div", { id: "uaContacts" })),
        h("section.panel", h("div.ph", h("h3", "Active right now"), h("span.muted.small", { id: "uaLiveUpd" })), h("div", { id: "uaLive" })),
        h("section.panel", h("div.ph", h("h3", "Official guides")), h("ul.hl", { id: "uaGuides" })))));
  $("#uaNoteF").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#uaNote").value.trim(); if (!v) return; note(v); $("#uaNote").value = ""; });
  $("#uaCC").addEventListener("change", (e) => { store.set("uaCC", e.target.value); contactsUI(); });
  picker(); book(); clock(); notesUI(); tree();
  clearInterval(clockTimer); clockTimer = setInterval(tick, 1000);
  await refresh();
}
export function onLive() { return refresh(); }
export function hide() { /* the clock keeps its start time in storage; nothing to stop but the display timer */ }
export async function refresh() {
  const [c, n, r, m, t, cv] = await Promise.all([load("contacts"), load("news"), load("ransomware"), load("malware"), load("threatmap"), load("cves")]);
  contacts = c; live = { news: n, rw: r, mal: m, tm: t, cves: cv };
  countries(); contactsUI(); liveUI();
  put($("#uaGuides"), (c?.guides || []).map((g) => h("li", ext(g.u, g.n), h("span.hm", g.what))));
}

// ---------- picker ----------
function picker() {
  const cur = inc();
  put($("#uaPick"), PLAYBOOKS.map((p) => h("button.ua-p.t-" + p.tone + (p.id === sel ? ".on" : "") + (cur?.pb === p.id ? ".active" : ""), { type: "button", role: "listitem", "aria-pressed": String(p.id === sel), onclick: () => { if (sel === p.id) return; sel = p.id; picker(); book(true); clock(); tree(); liveUI();
      const r = $("#uaBook").getBoundingClientRect(); if (r.top > innerHeight * 0.75) $("#uaBook").scrollIntoView({ behavior: "smooth", block: "start" }); } },
    h("span.ua-pn", p.n), cur?.pb === p.id ? h("span.ua-live", "In progress") : null)));
}

// ---------- the playbook ----------
function book(swap) {
  const p = pb(); const cur = inc(); const mine = cur?.pb === p.id ? cur : null;
  const done = mine ? mine.done : {};
  const total = PHASES.reduce((n, [k]) => n + (p.steps[k] || []).length, 0); const ticked = Object.keys(done).filter((k) => k.startsWith(p.id + ":")).length;
  const ring = progress(ticked, total);
  put($("#uaBook"),
    h("header.ua-head.t-" + p.tone, ring, h("div", h("h2", p.n), h("p.ua-sign", h("b", "Signs: "), p.sign),
      p.attack.length ? h("p.ua-attack", "MITRE ATT&CK ", p.attack.map((t) => ext(`https://attack.mitre.org/techniques/${t.replace(".", "/")}/`, t, "chip"))) : null)),
    h("div.ua-two",
      h("section.ua-dont", h("h3", "Do not"), h("ul", p.dont.map((x) => h("li", x)))),
      h("section.ua-ev", h("h3", "Keep this evidence"), h("ul", p.evidence.map((x) => h("li", x))))),
    mine ? null : h("p.ua-hint", "Ticking steps and adding notes is easier with the clock running. Press ", h("b", "Start incident"), " on the incident clock."),
    PHASES.map(([k, label], i) => {
      const steps = p.steps[k] || []; if (!steps.length) return null;
      const n = steps.filter((_, j) => done[`${p.id}:${k}:${j}`]).length;
      return h("section.ua-phase", h("h3", h("span.ua-num", String(i + 1)), label, h("span.ua-pc", `${n}/${steps.length}`)),
        h("ol.ua-steps", steps.map((s, j) => {
          const key = `${p.id}:${k}:${j}`; const at = done[key];
          return h("li", h("button.ua-step" + (at ? ".done" : ""), { type: "button", role: "checkbox", "aria-checked": String(!!at), onclick: () => toggle(key, s) },
            h("span.ua-box", { "aria-hidden": "true" }), h("span.ua-st", s), at ? h("span.ua-at", new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })) : null));
        })));
    }));
  if (swap) { const b = $("#uaBook"); b.classList.remove("swap"); void b.offsetWidth; b.classList.add("swap"); }
}
function progress(n, total) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 44 44"); svg.setAttribute("class", "ua-ring"); svg.setAttribute("aria-hidden", "true");
  const c = (cls, extra = {}) => { const e = document.createElementNS(svg.namespaceURI, "circle"); for (const [k, v] of Object.entries({ cx: 22, cy: 22, r: 18, class: cls, ...extra })) e.setAttribute(k, v); return e; };
  const pct = total ? n / total : 0;
  svg.append(...[c("bg"), pct ? c("fg", { pathLength: 100, "stroke-dasharray": `${(pct * 100).toFixed(1)} 100`, transform: "rotate(-90 22 22)" }) : null].filter(Boolean));
  const t = document.createElementNS(svg.namespaceURI, "text"); t.setAttribute("x", 22); t.setAttribute("y", 26); t.setAttribute("text-anchor", "middle"); t.textContent = Math.round(pct * 100) + "%"; svg.append(t);
  return h("div.ua-ringw", { title: `${n} of ${total} steps done` }, svg);
}
function toggle(key, text) {
  let cur = inc();
  if (!cur || cur.pb !== sel) { if (cur) { toast("Another incident is running. End it first, or switch back to it."); return; } cur = start(); }
  if (cur.done[key]) delete cur.done[key]; else { cur.done[key] = Date.now(); cur.notes.push({ ts: Date.now(), t: "Done: " + text, auto: true }); }
  save(cur); book(); notesUI();
}

// ---------- incident clock ----------
function start() { const v = { pb: sel, start: Date.now(), done: {}, called: {}, notes: [{ ts: Date.now(), t: `Incident started: ${pb().n}`, auto: true }] }; save(v); picker(); return v; }
function clock() {
  const cur = inc(); const box = $("#uaClock"); if (!box) return;
  if (!cur) {
    put(box, h("div.uc-idle", h("span.uc-l", "Incident clock"), h("span.uc-t", "00:00:00"), h("p.muted.small", "Starts a timer and a log. Steps you tick are timestamped for the report."),
      h("button.btn.danger", { type: "button", onclick: () => { start(); clock(); book(); notesUI(); } }, "Start incident")));
    return;
  }
  const p = PLAYBOOKS.find((x) => x.id === cur.pb);
  put(box, h("div.uc-run", h("span.uc-l", h("i.uc-dot"), "Incident running: ", h("b", p.n)), h("span.uc-t", { id: "ucT" }, fmtDur(Date.now() - cur.start)),
    h("span.muted.small", "Started " + new Date(cur.start).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })),
    h("div.row", h("button.btn.sm", { type: "button", onclick: report }, "Copy report"), h("button.btn.sm.ghost", { type: "button", onclick: download }, "Download"),
      h("button.btn.sm.ghost", { type: "button", onclick: end }, "End incident"))));
}
function tick() { const t = $("#ucT"); const cur = inc(); if (t && cur) t.textContent = fmtDur(Date.now() - cur.start); }
function end() {
  const ok = h("button.btn.danger", { type: "button" }, "End and clear");
  const close = modal([h("h2", "End this incident?"), h("p", "The checklist, notes and clock are cleared from this browser. Copy or download the report first if you need it."),
    h("div.row", h("button.btn", { type: "button", onclick: report }, "Copy report"), ok)], { label: "End incident" });
  ok.addEventListener("click", () => { store.set("incident", null); close(); picker(); clock(); book(); notesUI(); tree(); toast("Incident closed"); });
}
function reportText() {
  const cur = inc(); if (!cur) return "";
  const p = PLAYBOOKS.find((x) => x.id === cur.pb); const t = (ts) => new Date(ts).toLocaleString();
  const lines = [`Incident report: ${p.n}`, `Started: ${t(cur.start)}`, `Duration so far: ${fmtDur(Date.now() - cur.start)}`, ""];
  for (const [k, label] of PHASES) {
    const steps = p.steps[k] || []; if (!steps.length) continue;
    lines.push(label + ":"); steps.forEach((s, j) => { const at = cur.done[`${p.id}:${k}:${j}`]; lines.push(`  [${at ? "x" : " "}] ${s}${at ? ` (${t(at)})` : ""}`); }); lines.push("");
  }
  const called = Object.entries(cur.called); if (called.length) { lines.push("Contacted:"); called.forEach(([n, ts]) => lines.push(`  ${n} (${t(ts)})`)); lines.push(""); }
  lines.push("Timeline:"); cur.notes.forEach((n) => lines.push(`  ${t(n.ts)}  ${n.t}`));
  return lines.join("\n");
}
function report() { const r = reportText(); if (r) copyText(r, "Report copied"); }
function download() {
  const r = reportText(); if (!r) return;
  const a = h("a", { download: `incident-${new Date().toISOString().slice(0, 16).replace(/[:T-]/g, "")}.txt` });
  a.setAttribute("href", URL.createObjectURL(new Blob([r], { type: "text/plain" })));   // blob: URL we just made ourselves
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// ---------- notes ----------
function note(text) { let cur = inc(); if (!cur) cur = start(); cur.notes.push({ ts: Date.now(), t: text.slice(0, 300) }); save(cur); notesUI(); clock(); }
function notesUI() {
  const cur = inc(); const list = (cur?.notes || []).slice().reverse();
  put($("#uaNotes"), list.length ? list.slice(0, 40).map((n) => h("li" + (n.auto ? ".auto" : ""), h("time", new Date(n.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })), h("span", n.t)))
    : [h("li.muted.small", "Write down what you see and do, with times. It becomes your incident timeline.")]);
}

// ---------- who to call ----------
function tree() {
  const cur = inc(); const p = pb(); const called = cur?.pb === p.id ? cur.called : {};
  put($("#uaTree"), [...CALL_TREE, ...p.extra].map((who) => h("li", h("button.ua-call" + (called[who] ? ".done" : ""), { type: "button", role: "checkbox", "aria-checked": String(!!called[who]),
    onclick: () => { let c = inc(); if (!c || c.pb !== sel) { if (c) { toast("Another incident is running."); return; } c = start(); }
      if (c.called[who]) delete c.called[who]; else { c.called[who] = Date.now(); c.notes.push({ ts: Date.now(), t: "Contacted: " + who, auto: true }); }
      save(c); tree(); notesUI(); clock(); } }, h("span.ua-box", { "aria-hidden": "true" }), who))));
}
function guessCC() {
  const saved = store.get("uaCC", ""); if (typeof saved === "string" && /^[A-Z]{2}$/.test(saved)) return saved;
  const m = (navigator.language || "").match(/-([A-Z]{2})$/i); return m ? m[1].toUpperCase() : "";
}
function countries() {
  const s = $("#uaCC"); const list = Object.entries(contacts?.countries || {}).sort((a, b) => a[1].name.localeCompare(b[1].name));
  const want = guessCC();
  put(s, h("option", { value: "" }, "Other or not listed"), list.map(([cc, v]) => h("option", { value: cc, selected: cc === want }, v.name)));
}
function contactsUI() {
  const box = $("#uaContacts"); if (!contacts) { put(box, h("p.muted.small", "The contact list appears after the next data refresh.")); return; }
  const cc = $("#uaCC").value; const c = contacts.countries[cc];
  const list = (items) => h("ul.ua-cl", items.map((x) => h("li.k-" + x.kind, h("span.ua-ck", KIND[x.kind]), ext(x.u, x.n), h("span.hm", x.what))));
  put(box, c ? list(c.items) : h("p.muted.small", "Not listed? Your national CERT is in the FIRST directory below, and EU countries are covered by the CSIRTs Network."),
    !c && contacts.countries.EU ? list(contacts.countries.EU.items) : null,
    h("h4.ua-sub", "Anywhere"), list(contacts.global),
    h("p.muted.small", "Emergency or threat to life: call your local emergency number first.", contacts.checked ? ` Links checked ${ago(contacts.checked)}.` : ""));
}

// ---------- live context ----------
function liveUI() {
  const box = $("#uaLive"); if (!box) return;
  const p = pb(); const { news, rw, mal, tm, cves } = live; const out = [];
  const items = (arr2, label) => arr2.length ? h("div.ua-lv", h("h4.ua-sub", label), h("ul.hl", arr2.map((n) => h("li", ext(n.u, n.t), h("span.hm", `${n.s} · ${ago(n.d)}`))))) : null;
  const gov = news?.gov || [];
  const tagged = (g) => (news?.security || []).filter((n) => n.g?.includes(g)).slice(0, 4);
  const ev = liveFeed("events") || []; const day = (e) => Date.now() - Date.parse(e.t) < 864e5;
  if (p.live === "ransomware") { const by = {}; for (const e of ev) if (e.k === "ransom" && day(e)) by[e.g] = (by[e.g] || 0) + 1; const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (top.length) out.push(h("div.ua-lv", h("h4.ua-sub", "Leak-site claims, last 24 hours"), h("p.ua-tags", top.map(([g, n]) => h("span.chip", `${g} · ${n}`))))); }
  if (p.live === "malware") { const fresh = ev.filter((e) => (e.k === "sample" || e.k === "c2") && e.g).slice(0, 6);
    if (fresh.length) out.push(h("div.ua-lv", h("h4.ua-sub", "Just seen in the wild"), h("ul.hl", fresh.map((e) => h("li", h("b", e.g), h("span.hm", `${e.k === "c2" ? "new C2 server" : "new sample" + (e.s ? " (" + e.s + ")" : "")} · ${ago(e.t)}`)))))); }
  if (p.live === "ransomware" && rw?.groups7?.length) out.push(h("div.ua-lv", h("h4.ua-sub", "Most active gangs this week"), h("p.ua-tags", rw.groups7.slice(0, 6).map(([g, n]) => h("span.chip", `${g} · ${n}`))),
    h("p.muted.small", "Ransom notes usually name the gang. Check its known tools and tactics in the Malware bar.")));
  if (p.live === "phishing") out.push(items(tagged("phishing"), "Phishing campaigns in the news"));
  if (p.live === "breach") out.push(items(tagged("breach"), "Breaches in the news"));
  if (p.live === "security") out.push(items(tagged("exploited"), "Exploited in the wild"));
  if (p.live === "malware" && mal?.trending?.length) out.push(h("div.ua-lv", h("h4.ua-sub", "Trending malware"), h("p.ua-tags", mal.trending.slice(0, 8).map((m) => h("a.chip", { href: "#malware" }, m.name)))));
  if (p.live === "ddos" && tm?.radar?.targets?.length) out.push(h("div.ua-lv", h("h4.ua-sub", "Most attacked countries, last 24 h"), h("p.ua-tags", tm.radar.targets.slice(0, 6).map(([cc, v]) => h("span.chip", `${cc} · ${v}%`))),
    h("p.muted.small", "Full picture on the Lounge threat map.")));
  if (p.live === "kev") { const k = cveList(cves).filter((c) => c.kev).sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
    if (k.length) out.push(h("div.ua-lv", h("h4.ua-sub", "Newly known-exploited (CISA KEV)"), h("ul.hl", k.map((c) => h("li", h("a", { href: "#menu" }, c.id), h("span.hm", `${c.vendor || ""} ${c.product || ""}`.trim())))))); }
  const govFirst = p.live === "ransomware" ? [...gov.filter((n) => n.g?.includes("ransomware")), ...gov.filter((n) => !n.g?.includes("ransomware"))] : gov;
  out.push(items(govFirst.slice(0, 5), "Latest government advisories (CISA, NCSC UK)"));
  const real = out.filter(Boolean);
  put(box, real.length ? real : h("p.muted.small", "Live advisories appear after the next data refresh."));
  $("#uaLiveUpd").textContent = news?.generated ? `updated ${ago(news.generated)}` : "";
}
