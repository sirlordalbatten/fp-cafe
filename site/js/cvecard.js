// CVE cards and detail view, shared by the lounge, radar and CVE menu.
// Roasts are generated from the bug class and product, picked deterministically per CVE,
// so the same CVE always gets the same joke and different CVEs rarely share one.
import { h, ext, modal, mulberry32, seedFrom, pick, store, arr, daysSince } from "./core.js";
import { bump } from "./state.js";
import { sfx } from "./audio.js";

const ROASTS = {
  cmd: ["{p} will run any command you send it. Very open-minded.", "{p} treats user input as a suggestion box for the shell.", "Somewhere, a {p} developer concatenated a string and went to lunch.",
    "Shell metacharacters walked into {p}. Nobody checked their ID.", "{p}: now with a free remote terminal, no licence required."],
  path: ["{p} lets you wander the filesystem with ../ like it's a museum tour.", "Dot-dot-slash, the oldest key in the book, still opens {p}.", "{p} was asked for one file and handed over the filing cabinet."],
  sqli: ["{p} met Bobby Tables. It did not go well.", "A single quote broke {p}. Somewhere a DBA is sighing.", "{p} trusted the input and the database trusted {p}. Sweet, and fatal."],
  xss: ["{p} renders whatever you give it. Including the attacker's opinions.", "Script tags in {p} are back like it's 2005."],
  deser: ["{p} unpacks untrusted objects with the enthusiasm of a kid at Christmas.", "Deserialisation in {p}: the gift that executes itself."],
  auth: ["{p} checks your password politely, then lets you in anyway.", "The front door of {p} has a lock. It's decorative.", "Authentication in {p} is more of a vibe than a requirement.",
    "{p} asked 'who are you?' and accepted 'admin, trust me' as an answer."],
  mem: ["{p} wrote past the end of the buffer and into everyone's weekend.", "Memory safety called. {p} let it go to voicemail.", "Somewhere in {p}, a C pointer is living its best life."],
  uaf: ["{p} used memory after freeing it. Like reheating takeaway from last week.", "Use-after-free in {p}: the memory moved out, the attacker moved in."],
  code: ["{p} will evaluate your code for you. How helpful.", "The eval call in {p} is doing exactly what it says on the tin."],
  upload: ["{p} accepts any upload, including ones that become web shells.", "{p}'s upload form doesn't ask questions. Attackers love that about it."],
  ssrf: ["{p} will fetch any URL you ask. Even the cloud metadata one.", "SSRF in {p}: the server makes requests so attackers don't have to."],
  priv: ["{p} promotes anyone who asks nicely. HR is concerned.", "In {p}, every user is admin if they believe hard enough."],
  creds: ["{p} ships with a password. The same one. For everyone.", "Hardcoded credentials in {p}: the password is in the manual."],
  generic: ["{p} had a bad day. Attackers had a great one.", "Another day, another {p} advisory. Coffee first.", "{p} joined the KEV club. Membership is not optional.",
    "If you have {p}, this is your sign to check it before lunch.", "{p} is trending, and not in the fun way."],
};
const EDGE = /vpn|firewall|gateway|netscaler|citrix|fortios|fortigate|forti|pan-os|globalprotect|ivanti|connect secure|sonicwall|sonicos|asa|big-ip|f5|router|sd-wan|zyxel|draytek|juniper|check point/i;
const EDGE_TAGS = ["Edge device again. The internet's favourite front door.", "Internet-facing, unauthenticated, exploited: the trifecta.", "The box meant to keep attackers out is letting them in."];
const HUGS = ["Patching this counts as cardio.", "You don't have to fix the whole internet today. Just this bit.", "Check, patch, hunt, hydrate. In that order.",
  "If it's not in your estate, enjoy the schadenfreude responsibly.", "Write the ticket, then take a breath. Both matter."];

function kind(c) {
  const t = `${c.title} ${c.desc} ${(c.cwe || []).join(" ")}`.toLowerCase();
  if (/cwe-(78|77)\b|command injection|os command/.test(t)) return "cmd";
  if (/cwe-22\b|path traversal|directory traversal/.test(t)) return "path";
  if (/cwe-89\b|sql injection/.test(t)) return "sqli";
  if (/cwe-79\b|cross-site scripting|\bxss\b/.test(t)) return "xss";
  if (/cwe-502\b|deserial/.test(t)) return "deser";
  if (/cwe-416\b|use[- ]after[- ]free/.test(t)) return "uaf";
  if (/cwe-(787|119|120|121|122|125|190)\b|out-of-bounds|buffer overflow|heap overflow|memory corruption/.test(t)) return "mem";
  if (/cwe-94\b|code injection|remote code/.test(t) && !/command/.test(t)) return "code";
  if (/cwe-434\b|file upload/.test(t)) return "upload";
  if (/cwe-918\b|server-side request|ssrf/.test(t)) return "ssrf";
  if (/cwe-798\b|hard-?coded/.test(t)) return "creds";
  if (/cwe-(287|306|288|290|863|862)\b|authentication bypass|missing authentication|improper authentication|authorization/.test(t)) return "auth";
  if (/cwe-(269|250|266)\b|privilege escalation|elevation of privilege/.test(t)) return "priv";
  return "generic";
}
export function productName(c) { return (c.product || c.vendor || "This product").replace(/\s+/g, " ").trim(); }
export function roast(c) {
  const r = mulberry32(seedFrom(c.id)); const p = productName(c);
  return pick(ROASTS[kind(c)], r).replaceAll("{p}", p);
}
export function hug(c) { return pick(HUGS, mulberry32(seedFrom(c.id + "hug"))); }
export function isEdge(c) { return EDGE.test(`${c.vendor} ${c.product} ${c.title}`); }

export function status(c) {
  if (c.snapshot) return ["SNAPSHOT", "st-amber"];
  if (c.kev && c.ransomware) return ["RANSOMWARE", "st-red"];
  if (c.kev) return ["EXPLOITED", "st-red"];
  if (c.sev === "critical") return ["CRITICAL", "st-amber"];
  return ["WATCH", "st-teal"];
}
export const sevPill = (c) => h("span.pill." + (c.sev === "critical" ? "p-crit" : c.sev === "high" ? "p-high" : "p-unk"), c.cvss != null ? `CVSS ${c.cvss.toFixed(1)}` : (c.sev || "unscored"));
const epssPill = (c) => c.epss != null ? h("span.pill.p-lav", { title: "FIRST EPSS: estimated chance of exploitation in the next 30 days" }, `EPSS ${(c.epss * 100).toFixed(c.epss < 0.1 ? 1 : 0)}%`) : null;

export function watchlist() { return arr(store.get("watch", [])).filter((x) => /^CVE-\d{4}-\d{4,7}$/.test(x)).slice(0, 100); }
export function toggleWatch(id) { const w = watchlist(); const i = w.indexOf(id); if (i >= 0) w.splice(i, 1); else w.unshift(id); store.set("watch", w); return i < 0; }

export function card(c, { fresh = false } = {}) {
  const [st, cls] = status(c);
  const starred = watchlist().includes(c.id);
  const star = h("button.star" + (starred ? ".on" : ""), { "aria-pressed": String(starred), "aria-label": `Watch ${c.id}`, title: "Add to your watchlist" }, starred ? "★" : "☆");
  star.addEventListener("click", (e) => { e.stopPropagation(); const on = toggleWatch(c.id); star.classList.toggle("on", on); star.textContent = on ? "★" : "☆"; star.setAttribute("aria-pressed", String(on)); sfx(on ? "coin" : "tick"); });
  const el = h("article.mcard.cve", { tabindex: "0", role: "button", "aria-label": `${c.id}: ${c.title || productName(c)}` },
    h("div.mc-top", h("span.mono.cid", c.id), fresh ? h("span.pill.p-new", "new") : null, h("span.grow"), star),
    h("h3", c.title || `${productName(c)} vulnerability`),
    h("p.mc-prod.muted", [c.vendor, c.product].filter(Boolean).join(" · ")),
    h("p.roast", roast(c)),
    h("div.pills", h("span.pill.stp." + cls, st), sevPill(c), epssPill(c), isEdge(c) ? h("span.pill.p-high", "edge") : null,
      c.date ? h("span.pill.p-unk", c.kev ? `KEV ${c.date}` : `published ${c.date}`) : null));
  const open = () => detail(c);
  el.addEventListener("click", open); el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  return el;
}

export function detail(c) {
  if (c.kev) bump("kevRead");
  const due = c.due ? daysSince(c.due) : null;
  const [st, cls] = status(c);
  modal([
    h("p.mono.muted", c.id),
    h("h2", c.title || productName(c)),
    h("div.pills", h("span.pill.stp." + cls, st), sevPill(c), epssPill(c), c.ransomware ? h("span.pill.p-crit", "used by ransomware") : null, isEdge(c) ? h("span.pill.p-high", "internet-facing edge device") : null),
    h("p.roast.big", roast(c)), isEdge(c) ? h("p.muted", pick(EDGE_TAGS, mulberry32(seedFrom(c.id + "e")))) : null,
    h("h3.sub3", "What it is"), h("p", c.desc || "No description yet. NVD analysis may still be pending."),
    h("h3.sub3", "What to do"),
    h("ul.tight",
      c.action ? h("li", c.action) : h("li", "Check whether you run it. If you do, apply the vendor fix or mitigation."),
      c.due ? h("li", due > 0 ? `CISA's federal deadline (${c.due}) passed ${due} days ago.` : `CISA's federal deadline: ${c.due}${due !== null ? ` (in ${-due} days)` : ""}.`) : null,
      isEdge(c) ? h("li", "For edge devices: patch, then look for signs of compromise. Exploitation often starts before the advisory.") : null,
      h("li", "Hunt for it: search your asset inventory and EDR for the product name, then check logs around the device."),
    ),
    h("p.hug", hug(c)),
    c.refs?.length ? h("div", h("h3.sub3", "Vendor advisory"), h("ul.tight", c.refs.map((u) => { let host = u; try { host = new URL(u).hostname.replace(/^www\./, ""); } catch { /* keep */ } return h("li", ext(u, host), h("span.muted.small", " (opens the vendor's page)")); }))) : null,
    h("p.links", ext(`https://nvd.nist.gov/vuln/detail/${c.id}`, "NVD entry"), c.kev ? ext("https://www.cisa.gov/known-exploited-vulnerabilities-catalog", "CISA KEV catalog") : null,
      ext(`https://www.first.org/epss/`, "About EPSS")),
  ], { label: c.id });
}
