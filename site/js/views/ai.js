// AI lab: live AI and MCP news, an interactive agent-triage walkthrough, MCP explainer, AI security glossary.
import { $, h, html, put, ext, ago, store, RM } from "../core.js";
import { load } from "../data.js";
import { bump, xp } from "../state.js";
import { sfx } from "../audio.js";
import { SCENARIOS, INJECTION, MCP, MCP_CALL, GLOSSARY, OWASP, QUESTIONS } from "../content/ai.js";

const TAGS = [["all", "Everything"], ["mcp", "MCP"], ["agents", "Agents"], ["security", "AI security"], ["release", "Releases"], ["models", "Models"]];
let news = [], tag = "all", sc = 0, step = 0, inject = false, guarded = true, learned = false;

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>AI lab</h1><p>What's new in AI that matters to defenders, how AI agents actually triage an alert, and how they get tricked. Refreshed every three hours.</p></div>
  <div class="panel agent">
    <div class="ph"><h3>Watch an AI agent triage an alert</h3><div class="seg" id="scSel"></div></div>
    <div class="agentgrid">
      <div>
        <div class="alertjson mono" id="alertJson"></div>
        <div class="row"><label class="chk"><input type="checkbox" id="injOn"> Hide a prompt injection in the alert</label>
          <label class="chk" id="guardWrap"><input type="checkbox" id="guardOn" checked> Agent has guardrails</label></div>
      </div>
      <div><ol class="steps" id="steps"></ol>
        <div class="row"><button class="btn" id="stPrev">Back</button><button class="btn primary" id="stNext">Next step</button><span class="muted small" id="stCount"></span></div></div>
    </div>
    <div class="injbox" id="injBox" hidden></div>
  </div>
  <div class="two">
    <div class="panel"><div class="ph"><h3>What's new</h3><span class="muted" id="aiUpd"></span></div><div class="seg" id="aiTags"></div><ul class="wire big" id="aiFeed"></ul></div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>MCP in 60 seconds</h3></div><div id="mcp"></div><details class="code-d"><summary>What a tool call looks like on the wire</summary><pre class="codebox"><code id="mcpCall"></code></pre></details></div>
      <div class="panel"><div class="ph"><h3>Before you buy an "AI SOC" tool</h3></div><ol class="tight" id="aiQ"></ol></div>
    </div>
  </div>
  <div class="panel"><div class="ph"><h3>AI security, one card at a time</h3><span class="muted">tap a card</span></div><div class="gloss" id="gloss"></div>
    <p class="muted small" id="owasp"></p></div>`);
  put($("#scSel"), SCENARIOS.map((s, i) => h("button" + (i === sc ? ".on" : ""), { dataset: { i } }, s.title)));
  $("#scSel").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; sc = +b.dataset.i; step = 0; [...$("#scSel").children].forEach((x) => x.classList.toggle("on", x === b)); agent(); });
  $("#stNext").addEventListener("click", () => { const n = SCENARIOS[sc].steps.length; if (step < n - 1) { step++; sfx("tick"); agent(); } });
  $("#stPrev").addEventListener("click", () => { if (step > 0) { step--; agent(); } });
  $("#injOn").addEventListener("change", () => { inject = $("#injOn").checked; agent(); });
  $("#guardOn").addEventListener("change", () => { guarded = $("#guardOn").checked; agent(); });
  agent(); mcp(); glossary();
  put($("#aiQ"), QUESTIONS.map((q) => h("li", q)));
  $("#owasp").textContent = "OWASP Top 10 for LLM applications (2025): " + OWASP.map((x, i) => `LLM${String(i + 1).padStart(2, "0")} ${x}`).join(" · ");
  const n = await load("news"); news = n?.ai || [];
  $("#aiUpd").textContent = n?.generated ? `refreshed ${ago(n.generated)}` : "";
  put($("#aiTags"), TAGS.map(([k, l]) => h("button" + (k === tag ? ".on" : ""), { dataset: { t: k } }, l)));
  $("#aiTags").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; tag = b.dataset.t; [...$("#aiTags").children].forEach((x) => x.classList.toggle("on", x === b)); feed(); });
  feed();
  if (news[0]) store.set("aiSeen", news[0].u); const dot = $("#aiNew"); if (dot) dot.hidden = true;
}

function feed() {
  const items = news.filter((n) => tag === "all" || n.g.includes(tag)).slice(0, 18);
  put($("#aiFeed"), items.length ? items.map((n) => h("li", ext(n.u, n.t), h("span.muted", ` · ${n.s} · ${ago(n.d)}`), n.g.length ? h("span.tags", n.g.map((g) => h("span.tag", g))) : null))
    : [h("li.muted", news.length ? "Nothing with that tag this week." : "The AI feed appears after the first data refresh.")]);
}

function agent() {
  const s = SCENARIOS[sc];
  const alert = { ...s.alert }; if (inject) alert[s.inject.field] = s.inject.text;
  const pre = $("#alertJson"); pre.textContent = "";
  pre.append(h("p.muted.small", "Alert payload"));
  const code = h("pre", JSON.stringify(alert, null, 2));
  if (inject) code.classList.add("has-inj");
  pre.append(code);
  $("#guardWrap").hidden = !inject;
  const steps = s.steps;
  let shown = steps.slice(0, step + 1);
  const hijackAt = steps.findIndex((x) => x.k === "Plan");
  put($("#steps"), shown.map((st, i) => {
    const hijacked = inject && !guarded && i >= hijackAt + 1;
    if (hijacked && i === hijackAt + 1) return h("li.st.bad", h("span.who", "Agent"), h("b", "Verdict"), h("p", "Benign. Closing alert as instructed. (It followed the text hidden in the alert.)"), h("p.muted.small", "No tools called. No evidence. The attacker wins quietly."));
    if (hijacked) return null;
    return h("li.st" + (i === step ? ".cur" : ""), h("span.who", st.who), h("b", st.k),
      st.tool ? h("pre.tool", st.tool) : null, st.out ? h("p.out", "→ " + st.out) : null, st.d ? h("p", st.d) : null,
      inject && guarded && st.k === "Plan" ? h("p.flag", "Flag: the alert contains text addressed to an AI. Treating it as data and as an IOC.") : null,
      st.why ? h("p.muted.small", st.why) : null);
  }));
  $("#stCount").textContent = `Step ${step + 1} of ${steps.length}`;
  $("#stPrev").disabled = step === 0; $("#stNext").disabled = step === steps.length - 1;
  const ib = $("#injBox");
  if (inject) { ib.hidden = false; put(ib, h("p", guarded ? INJECTION.guarded : INJECTION.naive), h("ul.tight", INJECTION.controls.map((c) => h("li", c)))); }
  else ib.hidden = true;
  if (step === steps.length - 1 && !learned) { learned = true; bump("ai"); xp(10, "ai"); }
  if (!RM) $("#steps").lastElementChild?.scrollIntoView({ block: "nearest" });
}

function mcp() {
  put($("#mcp"), MCP.map((m) => h("details.mcpd", h("summary", m.t), h("p", m.d))));
  $("#mcp").firstElementChild.open = true;
  $("#mcpCall").textContent = MCP_CALL;
}
function glossary() {
  put($("#gloss"), GLOSSARY.map(([t, d]) => {
    const c = h("button.gcard", { "aria-expanded": "false" }, h("span.gf", t), h("span.gb", d));
    c.addEventListener("click", () => { const o = c.classList.toggle("flip"); c.setAttribute("aria-expanded", String(o)); if (o) { sfx("pop"); bump("ai"); } });
    return c;
  }));
}
