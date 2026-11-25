// AI lab: everything here is built from today's data. Live AI news, AI-product CVEs, newest MCP servers
// with a risk read-out, an agent walkthrough generated from a live alert, and a prompt-injection scanner.
import { $, h, html, put, ext, ago, store, RM, fmtNum } from "../core.js";
import { load, cveList } from "../data.js";
import { detail, status, productName } from "../cvecard.js";
import { bump, xp } from "../state.js";
import { sfx } from "../audio.js";
import { INJECTION, GLOSSARY, OWASP, QUESTIONS } from "../content/ai.js";
import { isAiCve, mcpRisk, fromKev, fromFamily, fromMcp, scanInjection, INJ_SAMPLE } from "../content/aigen.js";
import { FAMILIES } from "../content/malware.js";

const TAGS = [["all", "Everything"], ["security", "AI security"], ["mcp", "MCP"], ["agents", "Agents"], ["release", "Releases"], ["models", "Models"]];
let news = [], mcp = [], aiCves = [], scenarios = [], tag = "all", sc = 0, step = 0, inject = false, guarded = true, learned = false;

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>AI lab</h1><p>What changed in AI this week that a defender should know, built fresh from live feeds every few hours. No canned demos.</p></div>
  <div class="ai-kpis" id="aiKpis"></div>
  <div class="two">
    <div class="panel"><div class="ph"><h3>What's new</h3><span class="muted" id="aiUpd"></span></div><div class="seg" id="aiTags"></div><ul class="wire big" id="aiFeed"></ul></div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>AI products with live CVEs</h3><span class="muted small">from today's CVE feed</span></div><ul class="aicve" id="aiCves"></ul></div>
      <div class="panel"><div class="ph"><h3>Before you buy an "AI SOC" tool</h3></div><ol class="tight" id="aiQ"></ol></div>
    </div>
  </div>
  <div class="panel"><div class="ph"><h3>Fresh on the MCP registry</h3><span class="muted small" id="mcpSub">newest servers people can plug into their AI assistants, with what each one could touch</span></div>
    <div class="mcpgrid" id="mcpList"></div></div>
  <div class="panel agent">
    <div class="ph"><h3>An AI agent works today's alert</h3><div class="seg" id="scSel"></div></div>
    <p class="muted small" id="scSrc"></p>
    <div class="agentgrid">
      <div>
        <div class="alertjson mono" id="alertJson"></div>
        <div class="row"><label class="chk"><input type="checkbox" id="injOn"> Hide a prompt injection in it</label>
          <label class="chk" id="guardWrap"><input type="checkbox" id="guardOn" checked> Agent has guardrails</label></div>
      </div>
      <div><ol class="steps" id="steps"></ol>
        <div class="row"><button class="btn" id="stPrev">Back</button><button class="btn primary" id="stNext">Next step</button><span class="muted small" id="stCount"></span></div></div>
    </div>
    <div class="injbox" id="injBox" hidden></div>
  </div>
  <div class="panel"><div class="ph"><h3>Prompt-injection scanner</h3><span class="muted small">Paste an email, web page, ticket or tool output before an AI reads it. Checked in your browser only.</span></div>
    <textarea class="inp" id="injIn" spellcheck="false" aria-label="Text to scan for prompt injection"></textarea>
    <div class="row"><button class="btn primary" id="injScan">Scan</button><button class="btn ghost" id="injSample">Try a sample</button></div>
    <div id="injOut" aria-live="polite"></div></div>
  <details class="panel gl-d"><summary><h3>AI security words, one card at a time</h3></summary><div class="gloss" id="gloss"></div><p class="muted small" id="owasp"></p></details>`);

  $("#stNext").addEventListener("click", () => { const n = scenarios[sc].steps.length; if (step < n - 1) { step++; sfx("tick"); agent(); } });
  $("#stPrev").addEventListener("click", () => { if (step > 0) { step--; agent(); } });
  $("#injOn").addEventListener("change", () => { inject = $("#injOn").checked; agent(); });
  $("#guardOn").addEventListener("change", () => { guarded = $("#guardOn").checked; agent(); });
  $("#injScan").addEventListener("click", () => scan($("#injIn").value));
  $("#injSample").addEventListener("click", () => { $("#injIn").value = INJ_SAMPLE; scan(INJ_SAMPLE); });
  $("#scSel").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; sc = +b.dataset.i; step = 0; [...$("#scSel").children].forEach((x) => x.classList.toggle("on", x === b)); agent(); });
  put($("#aiTags"), TAGS.map(([k, l]) => h("button" + (k === tag ? ".on" : ""), { dataset: { t: k } }, l)));
  $("#aiTags").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; tag = b.dataset.t; [...$("#aiTags").children].forEach((x) => x.classList.toggle("on", x === b)); feed(); });
  put($("#aiQ"), QUESTIONS.map((q) => h("li", q)));
  glossary();
  $("#owasp").textContent = "OWASP Top 10 for LLM applications (2025): " + OWASP.map((x, i) => `LLM${String(i + 1).padStart(2, "0")} ${x}`).join(" · ");
  await refresh();
  const dot = $("#aiNew"); if (dot) dot.hidden = true;
}

export async function refresh() {
  const [n, c, m] = await Promise.all([load("news"), load("cves"), load("malware")]);
  news = n?.ai || []; mcp = n?.mcp || [];
  const list = cveList(c);
  aiCves = list.filter(isAiCve).slice(0, 8);
  $("#aiUpd").textContent = n?.generated ? `refreshed ${ago(n.generated)}` : "";
  if (news[0]) store.set("aiSeen", news[0].u);
  // scenarios from live data
  scenarios = [];
  const kev = list.find((x) => x.kev && isAiCve(x)) || list.find((x) => x.kev && !x.snapshot);
  if (kev) scenarios.push(fromKev(kev));
  const fam = Object.keys(FAMILIES).map((id) => [id, m?.families?.[id] || {}]).sort((a, b) => ((b[1].iocs7 || 0) + (b[1].mentions || 0) * 25) - ((a[1].iocs7 || 0) + (a[1].mentions || 0) * 25))[0];
  if (fam) scenarios.push(fromFamily(fam[0], FAMILIES[fam[0]], fam[1]));
  const risky = mcp.map((x) => [x, mcpRisk(x)]).sort((a, b) => (b[1].level === "high") - (a[1].level === "high"))[0];
  if (risky) scenarios.push(fromMcp(risky[0]));
  sc = Math.min(sc, Math.max(0, scenarios.length - 1));
  put($("#scSel"), scenarios.map((s, i) => h("button" + (i === sc ? ".on" : ""), { dataset: { i } }, s.title)));
  kpis(); feed(); cvesUI(); mcpUI(); agent();
}

function kpis() {
  const week = (d) => d && Date.now() - Date.parse(d) < 7.5 * 864e5;
  const t = (n, l, href) => h(href ? "a.kpi" : "div.kpi", href ? { href } : {}, h("span.kn", n), h("span.kl", l));
  put($("#aiKpis"),
    t(fmtNum(news.filter((x) => week(x.d)).length), "AI stories this week"),
    t(fmtNum(news.filter((x) => week(x.d) && x.g.includes("security")).length), "of them about AI security"),
    t(fmtNum(aiCves.length), "AI-product CVEs in the feed"),
    t(fmtNum(mcp.filter((x) => week(x.d)).length), "new MCP servers this week"));
}
function feed() {
  const items = news.filter((n) => tag === "all" || n.g.includes(tag)).slice(0, 18);
  put($("#aiFeed"), items.length ? items.map((n) => h("li", ext(n.u, n.t), h("span.muted", ` · ${n.s} · ${ago(n.d)}`), n.x ? h("p.small.muted", n.x) : null, n.g.length ? h("span.tags", n.g.map((g) => h("span.tag", g))) : null))
    : [h("li.muted", news.length ? "Nothing with that tag this week." : "The AI feed appears after the first data refresh.")]);
}
function cvesUI() {
  put($("#aiCves"), aiCves.length ? aiCves.map((c) => { const [st, cls] = status(c); return h("li", h("button.rt", { type: "button", onclick: () => detail(c) }, h("span.rt-id", c.id), h("span.rt-p", productName(c)), h("span.pill.stp." + cls, st))); })
    : [h("li.muted", "No AI products in the current exploited or critical list. Good week. The registry below still needs watching.")]);
}
function mcpUI() {
  const lvl = { high: ["Can do damage", "p-crit"], med: ["Handle with care", "p-high"], low: ["Low reach", "p-unk"] };
  $("#mcpSub").textContent = mcp.length ? `${mcp.length} newest servers on the official MCP registry, with what each one could touch.` : "The registry list appears after the first data refresh.";
  put($("#mcpList"), mcp.slice(0, 12).map((m) => {
    const r = mcpRisk(m); const [ll, lc] = lvl[r.level];
    return h("article.mcp-c",
      h("div.mc-top", h("span.pill." + lc, ll), h("span.muted.small", [m.remote ? "remote" : "local", m.pkg, m.v ? "v" + m.v : ""].filter(Boolean).join(" · ")), h("span.grow"), h("span.muted.small", ago(m.d))),
      h("h4", m.u ? ext(m.u, m.t) : m.t), h("p.small", m.x || "No description."),
      r.caps.length ? h("div.pills", r.caps.map((c) => h("span.pill.p-lav", c.label))) : null,
      h("details", h("summary.small", "Before you connect it"), h("ul.tight.small", r.checks.map((x) => h("li", x)))));
  }));
}

function agent() {
  const s = scenarios[sc]; const box = $("#steps");
  if (!s) { put(box, h("li.muted", "The walkthrough builds itself from live data after the first refresh.")); $("#stNext").disabled = true; $("#stPrev").disabled = true; return; }
  $("#scSrc").textContent = s.src;
  const alert = { ...s.alert }; if (inject) alert[s.inject.field] = s.inject.text;
  const pre = $("#alertJson"); pre.textContent = "";
  pre.append(h("p.muted.small", "What the agent receives"));
  const code = h("pre", JSON.stringify(alert, null, 2)); if (inject) code.classList.add("has-inj"); pre.append(code);
  $("#guardWrap").hidden = !inject;
  const steps = s.steps; const hijackAt = steps.findIndex((x) => x.k === "Plan");
  put(box, steps.slice(0, step + 1).map((st, i) => {
    const hijacked = inject && !guarded && i >= hijackAt + 1;
    if (hijacked && i === hijackAt + 1) return h("li.st.bad", h("span.who", "Agent"), h("b", "Verdict"), h("p", "Done. Closing as instructed. (It obeyed the text hidden in the data.)"), h("p.muted.small", "No tools called, no evidence. The attacker used your own automation to hide."));
    if (hijacked) return null;
    return h("li.st" + (i === step ? ".cur" : ""), h("span.who", st.who), h("b", st.k),
      st.tool ? h("pre.tool", st.tool) : null, st.out ? h("p.out", "→ " + st.out) : null, st.d ? h("p", st.d) : null,
      inject && guarded && st.k === "Plan" ? h("p.flag", "Flag: the input contains text addressed to an AI. Treating it as data, and as an indicator in its own right.") : null,
      st.why ? h("p.muted.small", st.why) : null);
  }));
  $("#stCount").textContent = `Step ${step + 1} of ${steps.length}`;
  $("#stPrev").disabled = step === 0; $("#stNext").disabled = step === steps.length - 1;
  const ib = $("#injBox");
  if (inject) { ib.hidden = false; put(ib, h("p", guarded ? INJECTION.guarded : INJECTION.naive), h("ul.tight", INJECTION.controls.map((c) => h("li", c)))); } else ib.hidden = true;
  if (step === steps.length - 1 && !learned) { learned = true; bump("ai"); xp(10, "ai"); }
  if (!RM && step > 0) box.lastElementChild?.scrollIntoView({ block: "nearest" });
}

function scan(text) {
  const out = $("#injOut");
  if (!text.trim()) { put(out, h("p.muted", "Paste something first.")); return; }
  const r = scanInjection(text);
  const head = { none: ["note.ok", "Nothing that looks like an instruction to an AI. That's not a guarantee, just no known patterns."], low: ["note", "A weak signal. Worth a glance before an AI reads it."], med: ["note", "Suspicious. Read it yourself before letting an assistant act on it."], high: ["note.bad", "Likely prompt injection. Don't let an AI with tools read this unattended."] }[r.level];
  put(out, h("p." + head[0], head[1]), r.hits.length ? h("ul.tight", r.hits.map((x) => h("li", x.why, x.snip ? [" ", h("code", x.snip)] : null))) : null);
  bump("ai");
}
function glossary() {
  put($("#gloss"), GLOSSARY.map(([t, d]) => {
    const c = h("button.gcard", { "aria-expanded": "false" }, h("span.gf", t), h("span.gb", d));
    c.addEventListener("click", () => { const o = c.classList.toggle("flip"); c.setAttribute("aria-expanded", String(o)); if (o) sfx("pop"); });
    return c;
  }));
}
