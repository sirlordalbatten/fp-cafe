// Swipe the phish: drag emails left (legit) or right (phish). Combos for streaks.
import { h, RM } from "../core.js";

const BRANDS = [["Microsoft 365", "microsoft.com"], ["Okta", "okta.com"], ["DocuSign", "docusign.net"], ["PayPal", "paypal.com"], ["GitHub", "github.com"],
  ["Zoom", "zoom.us"], ["Dropbox", "dropbox.com"], ["Slack", "slack.com"], ["Adobe", "adobe.com"], ["LinkedIn", "linkedin.com"], ["DHL", "dhl.com"], ["Workday", "workday.com"]];
const PEOPLE = ["Helen (HR)", "Kevin Fisher", "IT Service Desk", "Payroll", "The CEO", "Facilities", "Priya (Network)", "Accounts Payable"];
const CORP = "corp.example";
function lookalike(d, r) {
  const [name, tld] = [d.slice(0, d.indexOf(".")), d.slice(d.indexOf("."))];
  const f = [() => name.replace("m", "rn") + tld, () => name.replace("o", "0") + tld, () => name.replace("l", "1") + tld, () => name + "-secure" + tld, () => name + "-support.com",
    () => `${name}${tld}.verify-account.io`, () => name + ".co", () => `login-${name}.net`, () => name.slice(0, -1) + tld][Math.floor(r() * 9)];
  const out = f(); return out === d ? name + "-auth.com" : out;
}
function email(r) {
  const p = (a) => a[Math.floor(r() * a.length)];
  const [brand, dom] = p(BRANDS);
  const legit = r() < 0.5;
  const kinds = legit ? [
    () => ({ from: `${brand} <no-reply@${dom}>`, subj: p(["Your monthly statement is ready", "New sign-in from Chrome on Windows", "Weekly digest", "Your receipt"]), body: "If this was you, no action is needed.", link: `https://${dom}/account`, why: "Real domain, no urgency, and it tells you to do nothing." }),
    () => ({ from: `${p(PEOPLE)} <${p(["helen", "kevin", "itdesk", "payroll"])}@${CORP}>`, subj: p(["Team lunch on Thursday?", "Updated rota attached", "Notes from today's standup", "Office closed Monday"]), body: "See you there.", link: `https://intranet.${CORP}/news`, why: "Internal sender, internal link, nothing asked of you." }),
    () => ({ from: `IT Service Desk <itdesk@${CORP}>`, subj: "Planned maintenance Saturday 02:00", body: "No action needed. Systems may be slow.", link: `https://status.${CORP}`, why: "Informational, internal, no credentials or payment asked." }),
    () => ({ from: `${brand} <security@${dom}>`, subj: "You added a new device", body: "Review it in your account settings if this wasn't you.", link: `https://${dom}/security`, why: "Points you to settings on the real domain, no direct login link." }),
  ] : [
    () => { const fake = lookalike(dom, r); return { from: `${brand} <alerts@${fake}>`, subj: p(["Password expires in 2 hours", "Unusual sign-in blocked: verify now", "Your account will be suspended", "Mailbox full: action required"]), body: "Click below within 24 hours to keep access.", link: `https://${fake}/login`, why: `${fake} isn't ${dom}. Urgency plus a lookalike domain.` }; },
    () => ({ from: `The CEO <ceo.office@${p(["gmail.com", "outlook.com", "proton.me"])}>`, subj: p(["Quick favour, are you at your desk?", "Urgent wire before 3pm", "Need gift cards for a client"]), body: "Keep this between us for now.", link: "", why: "CEO on a personal address, secrecy, money: business email compromise." }),
    () => ({ from: `${brand} <no-reply@${dom}>`, subj: "Shared document: Q4_Salaries.pdf", body: "Open the document to view.", link: `https://${p(["bit.ly", "tinyurl.com", "storage.googleapis.com", "r2.dev"])}/x${Math.floor(r() * 9e4)}`, why: "Display name and sender look right, but the link goes somewhere else entirely." }),
    () => ({ from: `Payroll <payroll@${CORP.replace("corp", "c0rp")}>`, subj: "Update your bank details for this month", body: "Failure to update will delay your salary.", link: `https://payroll-${CORP.replace(".", "-")}.com/update`, why: "c0rp vs corp: a zero for an o. And payroll never asks this by email." }),
    () => ({ from: `${p(PEOPLE)} <${p(["helen", "kevin"])}@${CORP}>`, subj: "RE: invoice", body: "Please see attached, password 2024.", link: "Invoice_8821.zip", why: "Password-protected zip from a colleague out of the blue: a hijacked thread or account." }),
    () => ({ from: `IT Support <helpdesk@${p(["teams-support.net", "it-helpdesk.co", CORP + ".support"])}>`, subj: "Install the security update", body: "Run the attached tool to stay protected.", link: "SecurityUpdate.exe", why: "IT doesn't email you executables from a lookalike domain." }),
  ];
  return { ...p(kinds)(), legit };
}

export const PHISH = {
  id: "phish", label: "Swipe the phish", duration: 60,
  how: "Drag each email left if it's legit, right if it's phish. Arrow keys or the buttons work too. Streaks build a combo multiplier, mistakes reset it.",
  keys: "← legit · → phish",
  start(ctx) {
    const { stage, r } = ctx;
    stage.classList.add("phishstage");
    const deck = h("div.deck"); const btnL = h("button.btn.swipe-l", "← Legit"); const btnR = h("button.btn.primary.swipe-r", "Phish →");
    const why = h("p.why", { "aria-live": "polite" });
    stage.append(deck, h("div.row.center", btnL, btnR), why);
    let cur = null, alive = true;
    const next = () => {
      const e = email(r);
      const c = h("article.mail", h("p.m-from", e.from), h("p.m-subj", e.subj), h("p.m-body", e.body), e.link ? h("p.m-link.mono", e.link.startsWith("https") ? "link: " + e.link : "attachment: " + e.link) : null,
        h("span.stamp.l", "LEGIT"), h("span.stamp.r", "PHISH"));
      c._e = e; deck.append(c); cur = c; drag(c);
    };
    const decide = (phish) => {
      if (!cur || !alive) return; const c = cur; cur = null; const ok = phish === !c._e.legit;
      const rect = c.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      ctx.add(ok ? 100 : -50, rect.left - sr.left + rect.width / 2, rect.top - sr.top + 20);
      if (ok) { ctx.sfx("coin"); ctx.burst(rect.left - sr.left + rect.width / 2, rect.top - sr.top + rect.height / 2, phish ? "var(--alarm)" : "var(--phos)"); }
      else ctx.sting("fail");
      why.textContent = (ok ? "Right. " : "Missed: ") + c._e.why;
      c.classList.add(phish ? "fly-r" : "fly-l"); setTimeout(() => c.remove(), 350);
      next();
    };
    function drag(c) {
      let x0 = null, dx = 0;
      c.addEventListener("pointerdown", (e) => { x0 = e.clientX; c.setPointerCapture(e.pointerId); c.classList.add("dragging"); });
      c.addEventListener("pointermove", (e) => { if (x0 === null) return; dx = e.clientX - x0; c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; c.classList.toggle("lean-l", dx < -40); c.classList.toggle("lean-r", dx > 40); });
      const up = () => { if (x0 === null) return; x0 = null; c.classList.remove("dragging"); if (Math.abs(dx) > 90) decide(dx > 0); else { c.style.transform = ""; c.classList.remove("lean-l", "lean-r"); } dx = 0; };
      c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    }
    btnL.addEventListener("click", () => decide(false)); btnR.addEventListener("click", () => decide(true));
    const key = (e) => { if (e.key === "ArrowLeft") { e.preventDefault(); decide(false); } if (e.key === "ArrowRight") { e.preventDefault(); decide(true); } };
    window.addEventListener("keydown", key);
    next();
    return () => { alive = false; window.removeEventListener("keydown", key); };
  },
};
