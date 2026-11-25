// Phish sim: plan awareness campaigns your users will thank you for. Briefs, a calendar, live lure
// themes from this week's news, ethics rules and a results calculator. No send-ready kits.
import { $, h, html, put, ext, ago, store, obj, num, copyText, rnd } from "../core.js";
import { load } from "../data.js";
import { bump, xp } from "../state.js";
import { sfx } from "../audio.js";
import { THEMES, CHANNELS, LEVELS, ETHICS, METRICS, MONTHS, brief } from "../content/phishsim.js";

let sel = { theme: "", channel: "email", level: "normal" }, cur = null;
const PHISHY = /phish|smish|vish|quish|qr code|lure|credential|captcha|clickfix|bec|business email|invoice|docusign|lookalike|impersonat|fake .*(login|page|update)|scam|oauth consent|device code|callback|toad/i;

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Phish sim</h1><p>Plan phishing simulations that make people better at reporting, not more afraid of email. Build a brief, check it against the ethics rules, then measure what matters.</p></div>
  <div class="two wide-left">
    <div class="stack">
      <div class="panel"><div class="ph"><h3>Build a campaign brief</h3></div>
        <div class="field"><span class="l">Theme</span><div class="opt" id="psTheme"></div></div>
        <div class="field"><span class="l">Channel</span><div class="opt" id="psChan"></div></div>
        <div class="field"><span class="l">Difficulty</span><div class="opt" id="psLvl"></div><p class="muted small" id="psLvlWhy"></p></div>
        <div class="row"><button class="btn primary" id="psGo">Build the brief</button><button class="btn ghost" id="psCopy" hidden>Copy brief</button></div>
        <div id="psOut" aria-live="polite"></div></div>
      <div class="panel"><div class="ph"><h3>Results calculator</h3><span class="muted small">numbers stay in this browser</span></div>
        <div class="calc"><label>Sent <input type="number" min="0" id="cSent"></label><label>Reported <input type="number" min="0" id="cRep"></label><label>Clicked <input type="number" min="0" id="cClick"></label><label>Typed into the form <input type="number" min="0" id="cSub"></label><label>Minutes to first report <input type="number" min="0" id="cFirst"></label></div>
        <div id="cOut"></div></div>
    </div>
    <aside class="stack">
      <div class="panel"><div class="ph"><h3>Lures attackers used this week</h3><span class="muted small" id="psUpd"></span></div><p class="muted small">Real campaigns from the news. Turn the theme (not the brand) into your next simulation.</p><ul class="wire" id="psLive"></ul></div>
      <div class="panel"><div class="ph"><h3>The ethics rules</h3></div><ol class="tight small">${ETHICS.map((e) => `<li></li>`).join("")}</ol></div>
      <div class="panel"><div class="ph"><h3>A year of themes</h3></div><ul class="months" id="psCal"></ul></div>
      <div class="panel"><div class="ph"><h3>What to measure</h3></div><dl class="metrics" id="psMet"></dl></div>
    </aside>
  </div>`);
  [...sec.querySelectorAll("ol.tight.small li")].forEach((li, i) => { li.textContent = ETHICS[i]; });
  const opt = (box, items, key) => { put($(box), items.map(([k, l]) => h("button" + (sel[key] === k ? ".on" : ""), { type: "button", onclick: () => { sel[key] = k; opt(box, items, key); if (key === "level") $("#psLvlWhy").textContent = LEVELS.find((x) => x[0] === k)[2]; } }, l))); };
  opt("#psTheme", [["", "Surprise me"], ...THEMES.map((t) => [t.k, t.t])], "theme");
  opt("#psChan", CHANNELS, "channel");
  opt("#psLvl", LEVELS.map((l) => [l[0], l[1]]), "level"); $("#psLvlWhy").textContent = LEVELS[1][2];
  $("#psGo").addEventListener("click", build);
  $("#psCopy").addEventListener("click", () => cur && copyText(text(cur), "Brief copied"));
  const m = new Date().getMonth();
  put($("#psCal"), MONTHS.map(([mo, t], i) => h("li" + (i === m ? ".now" : ""), h("b", mo), " ", t)));
  put($("#psMet"), METRICS.map(([k, d, dir]) => [h("dt", k, h("span.muted.small", dir === "up" ? "  higher is better" : "  lower is better")), h("dd", d)]));
  calc();
  await refresh();
}
export async function refresh() {
  const n = await load("news");
  const items = [...(n?.security || []), ...(n?.soc || [])].filter((x) => PHISHY.test(`${x.t} ${x.x}`)).slice(0, 10);
  $("#psUpd").textContent = n?.generated ? `refreshed ${ago(n.generated)}` : "";
  put($("#psLive"), items.length ? items.map((x) => h("li", ext(x.u, x.t), h("span.muted", ` · ${x.s} · ${ago(x.d)}`))) : [h("li.muted", "No phishing stories in the feed right now.")]);
}

function build() {
  cur = brief(rnd, sel); $("#psCopy").hidden = false; sfx("pop"); bump("ai"); xp(5, "phishsim");
  put($("#psOut"), h("div.brief",
    h("h4", cur.name), h("p.muted.small", `${cur.theme} · ${cur.channel} · ${cur.level}`),
    h("p", h("b", "Pretext: "), cur.pretext),
    h("p.l", "Message outline"), h("ul.tight", cur.outline.map((x) => h("li", x))),
    h("p.l", "Red flags to plant, and to teach"), h("ol.tight", cur.flags.map((x) => h("li", x))),
    h("p.note", cur.channelTip),
    h("p.l", "Teachable-moment page"), h("p.quote", cur.landing),
    h("p.l", "Follow-up"), h("p", cur.followup),
    h("p.muted.small", "Before sending: check every ethics rule on the right, and make sure the SOC knows the campaign dates so real reports aren't lost in the noise.")));
}
function text(b) {
  return [`${b.name}`, `${b.theme} · ${b.channel} · ${b.level}`, "", `Pretext: ${b.pretext}`, "", "Message outline:", ...b.outline.map((x) => `- ${x}`), "", "Red flags:", ...b.flags.map((x, i) => `${i + 1}. ${x}`), "", `Channel tip: ${b.channelTip}`, "", "Teachable-moment page:", b.landing, "", "Follow-up:", b.followup].join("\n");
}
function calc() {
  const s = obj(store.get("psCalc", {})); const ids = { cSent: "sent", cRep: "rep", cClick: "click", cSub: "sub", cFirst: "first" };
  for (const [id, k] of Object.entries(ids)) { const el = $("#" + id); el.value = s[k] ?? ""; el.addEventListener("input", () => { const x = obj(store.get("psCalc", {})); x[k] = el.value === "" ? "" : num(+el.value, 0, 0, 1e7); store.set("psCalc", x); draw(); }); }
  const draw = () => {
    const x = obj(store.get("psCalc", {})); const sent = num(+x.sent, 0); const pct = (v) => sent ? Math.round((num(+v, 0) / sent) * 1000) / 10 : 0;
    if (!sent) { put($("#cOut"), h("p.muted.small", "Enter the numbers from your last campaign.")); return; }
    const rep = pct(x.rep), click = pct(x.click), sub = pct(x.sub), first = x.first === "" || x.first === undefined ? null : num(+x.first, 0);
    const verdict = rep > click ? ["ok", "More people reported than clicked. That's the sign of a healthy reporting culture."]
      : rep >= click / 2 ? ["", "Reports are catching up with clicks. Make the Report button easier to find and thank reporters faster."]
      : ["bad", "Clicks are well ahead of reports. Focus the next campaign on reporting, not on catching people out."];
    put($("#cOut"), h("div.calc-res", [["Report rate", rep + "%"], ["Click rate", click + "%"], ["Submission rate", sub + "%"], ["First report", first === null ? "–" : first + " min"]].map(([l, v]) => h("div", h("b", v), h("span", l)))),
      h("p.note" + (verdict[0] ? "." + verdict[0] : ""), verdict[1]),
      first !== null ? h("p.small.muted", first <= 10 ? "First report inside 10 minutes: the SOC could have started blocking before most people even opened it." : "Aim to get the first report inside 10 minutes. Promote the Report button and make it one click.") : null);
  };
  draw();
}
