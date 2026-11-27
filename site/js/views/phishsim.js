// Phish sim: plan awareness campaigns your users will thank you for. Briefs, a calendar, live lure
// themes from this week's news, ethics rules and a results calculator. No send-ready kits.
import { $, h, html, put, ext, ago, store, obj, num, copyText, rnd } from "../core.js";
import { load } from "../data.js";
import { bump, xp } from "../state.js";
import { sfx } from "../audio.js";
import { THEMES, CHANNELS, LEVELS, ETHICS, METRICS, MONTHS, brief } from "../content/phishsim.js";
import { sampleMessage } from "../content/phishbody.js";

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
  const msg = sampleMessage(rnd, { themeKey: cur.themeKey, pretext: cur.pretext, channel: cur.channelKey, level: cur.levelKey });
  cur.flags = msg.flags.map(([, t]) => t); cur.msg = msg;
  cur.landing = `Oops, this was a practice ${cur.channel.toLowerCase()} from the security team. Nothing bad happened, and nothing you typed was kept. Here's what gave it away: ${cur.flags.slice(0, 2).map((x) => x.toLowerCase()).join("; ")}. Next time, use the Report button. It takes two seconds and it's exactly what we want.`;
  const preview = h("div.ps-prev", preview_(msg));
  const toggle = h("button.btn.sm", { type: "button", "aria-pressed": "false", onclick: () => { const on = preview.classList.toggle("reveal"); toggle.setAttribute("aria-pressed", String(on)); toggle.textContent = on ? "Hide red flags" : "Show red flags"; } }, "Show red flags");
  put($("#psOut"), h("div.brief",
    h("h4", cur.name), h("p.muted.small", `${cur.theme} · ${cur.channel} · ${cur.level}`),
    h("p", h("b", "Pretext: "), cur.pretext),
    h("div.ps-bar", h("p.l", "Sample message"), toggle),
    preview,
    h("p.muted.small", "Sample organisation, people and numbers are made up. Swap in your own names and your simulation platform's tracked link before you use it."),
    h("p.l", "Red flags planted, and to teach"), h("ol.tight.ps-flags", cur.flags.map((x) => h("li", x))),
    h("details", h("summary.small", "Message outline"), h("ul.tight", cur.outline.map((x) => h("li", x)))),
    h("p.note", cur.channelTip),
    h("p.l", "Teachable-moment page"), h("p.quote", cur.landing),
    h("p.l", "Follow-up"), h("p", cur.followup),
    h("p.muted.small", "Before sending: check every ethics rule on the right, and make sure the SOC knows the campaign dates so real reports aren't lost in the noise.")));
}
// ---------- message preview ----------
function preview_(m) {
  const num = Object.fromEntries(m.flags.map(([k], i) => [k, i + 1]));
  const mark = (key, ...kids) => (key && num[key] ? h("mark.pf", { dataset: { n: String(num[key]) }, title: m.flags[num[key] - 1][1] }, ...kids) : kids);
  const seg = (x) => {
    if (typeof x === "string") return x;
    if (x.f !== undefined && "t" in x) return mark(x.f, x.t);
    if (x.br) return h("br");
    if (x.card) return h("div.pm-card", h("span.pm-file", x.card.split(".").pop().toUpperCase()), h("div", h("b", x.card), h("span.muted.small", x.sub)));
    if (x.list) return h("ul.pm-list", x.list.map((li) => h("li", li)));
    if (x.quote) return h("blockquote.pm-quote", x.quote);
    if (x.qr) return mark("qr", h("div.pm-qr", { role: "img", "aria-label": "QR code placeholder" }, ...Array.from({ length: 49 }, (_, i) => h("i" + ((i * 7 + (i % 5) * 3) % 3 === 0 || [0, 1, 7, 8, 5, 6, 12, 13, 35, 36, 42, 43].includes(i) ? ".on" : "")))));
    return "";
  };
  const para = (p) => (p.some((x) => x && typeof x === "object" && (x.list || x.card || x.quote || x.qr)) ? h("div.pm-p", p.map(seg)) : h("p", p.map(seg)));
  if (m.channel === "sms") return h("div.phone", h("div.phone-top", h("b", "+44 7700 900" + String(100 + Math.floor(Math.random() * 800))), h("span.muted.small", "Text message · Today 08:42")),
    h("div.bubble", mark("hover", m.sms)), h("p.muted.small", "Texts can't prove who sent them, and the short link hides where it goes."));
  if (m.channel === "chat") return h("div.chatwin", h("div.chat-ext", "External · this person is outside your organisation"), h("div.chat-msg", h("span.chat-av", m.chat[0][0]), h("div", h("b", m.chat[0]), ...m.chat.slice(1).map((l) => h("p", l)))));
  if (m.channel === "voice") return h("div.voice", h("p.l", "Call script for the vishing drill"), h("ol.tight", m.voice.map((l) => h("li", l))));
  if (m.channel === "qr") return h("div.poster", h("h4", m.subject), ...m.body.filter((p) => !p.some((x) => x?.qr)).slice(1, 2).map(para), seg({ qr: true }), h("p.muted.small", m.sig.join(" · ")));
  const initials = m.from.split(/[\s|]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const addrKey = m.flags.find(([k]) => ["sender", "look", "newdom"].includes(k))?.[0];
  return h("div.pm",
    h("div.pm-bar", h("i"), h("i"), h("i"), h("span", "Inbox · simulation preview")),
    h("div.pm-head", h("h4", m.subject),
      h("div.pm-from", h("span.pm-av", initials), h("div", h("b", m.from), " ", mark(addrKey, h("span.pm-addr", `<${m.addr}>`)),
        h("div.muted.small", "To: ", m.to, m.replyTo ? [" · Reply-To: ", mark("reply", m.replyTo)] : "")), h("span.muted.small.mail-time", "Today 08:42"))),
    m.external ? mark(num.external ? "external" : null, h("div.pm-ext", "[EXTERNAL] This email came from outside Northwind Traders. Be careful with links and attachments.")) : null,
    h("div.pm-body", m.body.map(para),
      m.btn ? h("p", mark(m.btn.f, h("span.pm-btn", { title: m.btn.real ? `Hover shows: https://${m.btn.real}/auth/session?id=…` : "Hover shows the simulation link" }, m.btn.btn))) : null,
      m.attach ? mark(num.attach ? "attach" : null, h("div.pm-att", h("span.pm-file", m.attach.split(".").pop().toUpperCase()), m.attach)) : null,
      m.sig.length ? h("p.pm-sig", m.sig.map((l, i) => [i ? h("br") : null, l])) : null,
      m.footer ? h("p.pm-foot", m.footer) : null));
}
function text(b) {
  const m = b.msg; const plain = (p) => p.map((x) => (typeof x === "string" ? x : x?.t ?? (x?.list ? x.list.map((l) => "- " + l).join("\n") : x?.card ? `[${x.card}] ${x.sub}` : x?.quote || (x?.qr ? "[QR code]" : "")))).join("");
  const sample = m && m.channel === "email" ? ["Sample message:", `From: ${m.from} <${m.addr}>`, m.replyTo ? `Reply-To: ${m.replyTo}` : "", `Subject: ${m.subject}`, "", ...m.body.map(plain), m.btn ? `[${m.btn.btn}]` : "", m.attach ? `Attachment: ${m.attach}` : "", "", ...m.sig, m.footer, ""].filter((x) => x !== null) : [];
  return [`${b.name}`, `${b.theme} · ${b.channel} · ${b.level}`, "", `Pretext: ${b.pretext}`, "", ...sample, "Message outline:", ...b.outline.map((x) => `- ${x}`), "", "Red flags:", ...b.flags.map((x, i) => `${i + 1}. ${x}`), "", `Channel tip: ${b.channelTip}`, "", "Teachable-moment page:", b.landing, "", "Follow-up:", b.followup].join("\n");
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
