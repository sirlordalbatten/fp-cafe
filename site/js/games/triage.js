// Alert rush: alerts slide down the queue. Close, escalate or contain each before it hits the bottom.
import { h } from "../core.js";
import { TR_POOL } from "../content/legacy.js";

const ACT = ["Close", "Escalate", "Contain"];
const GEN = [
  [() => `4625 x ${200 + Math.floor(Math.random() * 3000)} in 5 min · svc_${["backup", "sql", "print", "scan"][Math.floor(Math.random() * 4)]} · password rotated yesterday`, 0, "Service account with a stale password. Fix and close."],
  [() => `Defender: EICAR test file in C:\\Users\\${["sam", "dan", "intern"][Math.floor(Math.random() * 3)]}\\Downloads · user is on the security team`, 0, "The test file is a test. Close."],
  [() => `DNS: 4,000 TXT queries to ${["x7f3a", "q9k2", "zz81"][Math.floor(Math.random() * 3)]}.cdn-sync.io from one host in 10 min`, 1, "High-volume TXT queries to a random subdomain look like DNS tunnelling. Escalate."],
  [() => `Okta: admin role granted to ${["contractor_04", "temp.user", "svc_helpdesk"][Math.floor(Math.random() * 3)]} at 03:12 by an account that never does that`, 1, "Unexpected privilege grant at night. Escalate for investigation."],
  [() => `EDR: vssadmin delete shadows /all on ${["FILESRV-02", "SQL-PROD-1", "HR-LT-007"][Math.floor(Math.random() * 3)]}`, 2, "Shadow copies deleted is ransomware prep. Contain now."],
  [() => `EDR: rundll32.exe with no arguments connecting out on 443 from ${["FIN-LT-042", "DEV-LT-113"][Math.floor(Math.random() * 2)]}`, 2, "Classic Cobalt Strike beacon pattern. Contain."],
  [() => `Proxy: user visited ${["chatgpt.com", "github.com", "stackoverflow.com"][Math.floor(Math.random() * 3)]} 40 times`, 0, "That's just a developer. Close."],
  [() => `Mail: 1 user reported a phish · 0 others received it · link already blocked`, 0, "Handled and contained. Close with thanks."],
  [() => `CloudTrail: ${["DeleteTrail", "StopLogging", "PutBucketPolicy (public)"][Math.floor(Math.random() * 3)]} by an access key unused for 200 days`, 1, "Old key, defence-evasion API call. Escalate."],
  [() => `EDR: ${["certutil -urlcache -f", "bitsadmin /transfer", "curl -o"][Math.floor(Math.random() * 3)]} http://198.51.100.${Math.floor(Math.random() * 250)}/a.exe then execution`, 2, "Download and run of an unknown binary. Contain."],
  [() => `UEBA: ${["Kevin", "Helen", "Marco"][Math.floor(Math.random() * 3)]} logged in at 08:58 instead of 09:02`, 0, "Four minutes early is not an incident. Close."],
  [() => `Firewall: SMB 445 inbound from the internet to ${["WEB-DMZ-3", "EXCH-01"][Math.floor(Math.random() * 2)]} · allowed`, 1, "SMB exposed to the internet is a big problem. Escalate."],
];

export const TRIAGE = {
  id: "triage", label: "Alert rush", duration: 120,
  how: "Alerts slide down the queue. Pick Close, Escalate or Contain for each before it reaches the bottom. Keys 1, 2, 3 act on the lowest alert. Three misses and the queue wins.",
  keys: "1 close · 2 escalate · 3 contain",
  start(ctx) {
    const { stage, r } = ctx;
    stage.classList.add("triagestage");
    const lane = h("div.lane"); const floor = h("div.floorline", "SLA breach line");
    const why = h("p.why", { "aria-live": "polite" });
    stage.append(lane, floor, why);
    let items = [], lives = 3, t = 0, spawnIn = 0.5, last = performance.now(), alive = true, raf = 0;
    ctx.lives(lives);
    const pool = () => {
      if (r() < 0.5) { const x = TR_POOL[Math.floor(r() * TR_POOL.length)]; return { text: x.a, k: x.k, w: x.w }; }
      const g = GEN[Math.floor(r() * GEN.length)]; return { text: g[0](), k: g[1], w: g[2] };
    };
    const spawn = () => {
      const a = pool();
      const el = h("div.alertcard", h("p.a-t", a.text), h("div.a-acts", ACT.map((l, i) => h("button.btn.sm.act" + i, { onclick: () => act(item, i) }, `${i + 1} ${l}`))));
      const item = { ...a, el, y: -0.15, v: (0.04 + Math.min(0.07, t / 1600) + r() * 0.012) * ctx.speed };
      lane.append(el); items.push(item);
    };
    const act = (item, k) => {
      if (!alive || !items.includes(item)) return;
      items = items.filter((x) => x !== item);
      const sr = stage.getBoundingClientRect(), rr = item.el.getBoundingClientRect();
      const x = rr.left - sr.left + rr.width / 2, y = rr.top - sr.top;
      const ok = k === item.k;
      ctx.add(ok ? 120 + Math.round((1 - item.y) * 80) : -60, x, y);
      if (ok) { ctx.sfx(k === 2 ? "thud" : "coin"); ctx.burst(x, y + 20, ["var(--phos)", "var(--sodium)", "var(--alarm)"][k]); }
      else { ctx.sting("fail"); }
      why.textContent = (ok ? "" : `It was ${ACT[item.k]}. `) + item.w;
      item.el.classList.add(ok ? "done" : "wrongx"); setTimeout(() => item.el.remove(), 300);
    };
    const loop = (now) => {
      if (!alive) return; const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
      const travel = Math.max(120, lane.clientHeight - 72); const gapOf = (it) => ((it.el.offsetHeight || 78) + 10) / travel;
      const topY = items.length ? Math.min(...items.map((x) => x.y)) : 1;
      spawnIn -= dt; const topItem = items.length ? items.reduce((a, b) => (a.y < b.y ? a : b)) : null;
      if (spawnIn <= 0 && (!topItem || topY > -0.15 + gapOf(topItem))) { spawn(); spawnIn = (Math.max(1.1, 2.7 - t / 55) * (0.7 + r() * 0.6)) / ctx.speed; }
      // a real queue: each alert stops above the one below it, so cards never overlap
      const order = items.slice().sort((a, b) => b.y - a.y);
      order.forEach((it, i) => { it.y += it.v * dt * 1.6; if (i > 0) it.y = Math.min(it.y, order[i - 1].y - gapOf(it)); });
      for (const it of items.slice()) {
        it.el.style.transform = `translateY(${it.y * travel}px)`;
        if (it.y >= 1) {
          items = items.filter((x) => x !== it); it.el.classList.add("missed"); setTimeout(() => it.el.remove(), 400);
          lives--; ctx.lives(lives); ctx.add(-100); ctx.sting("fail"); why.textContent = `Missed: it should have been ${ACT[it.k]}. ${it.w}`;
          if (lives <= 0) { alive = false; ctx.end(); return; }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    const key = (e) => { const k = { 1: 0, 2: 1, 3: 2 }[e.key]; if (k === undefined) return; e.preventDefault(); const low = items.slice().sort((a, b) => b.y - a.y)[0]; if (low) act(low, k); };
    window.addEventListener("keydown", key);
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); };
  },
};
