// Firewall frenzy: traffic streams toward the server. Click the bad packets, let the good ones through.
import { h, RM } from "../core.js";
import { PD_BAD, PD_GOOD } from "../content/legacy.js";

const MORE_BAD = ["RDP from Tor", "Telnet brute force", "SMB from internet", "Kerberoast", "Web shell POST", "XMRig miner", "AnyDesk from VPS", "LDAP to 4444"];
const MORE_GOOD = ["Patch download", "Teams media", "OCSP check", "Git pull", "Slack websocket", "Office 365 sync", "Defender update", "Zoom call"];

export const FIREWALL = {
  id: "firewall", label: "Firewall frenzy", duration: 60,
  how: "Packets fly toward your server. Click the malicious ones to drop them. Let the business traffic through, or the users riot. Bad packets that get through damage the server.",
  keys: "click packets",
  start(ctx) {
    const { stage, r } = ctx;
    stage.classList.add("fwstage");
    const cv = h("canvas.fwcv", { "aria-label": "Incoming traffic" }); const why = h("p.why", { "aria-live": "polite" });
    stage.append(cv, why);
    const g = cv.getContext("2d"); const cs = getComputedStyle(document.body);
    const C = { good: cs.getPropertyValue("--sky").trim(), bad: cs.getPropertyValue("--sky").trim(), text: "#10162A", srv: cs.getPropertyValue("--phos").trim(), hit: cs.getPropertyValue("--alarm").trim(), lane: cs.getPropertyValue("--rule").trim() };
    const bad = PD_BAD.filter((x) => !/[<$]/.test(x)).concat(MORE_BAD), good = PD_GOOD.map((x) => x.trim()).concat(MORE_GOOD);
    let W = 0, H = 0, pk = [], hp = 100, alive = true, raf = 0, last = performance.now(), t = 0, spawnIn = 0.4, flash = 0, users = 100;
    const fit = () => { const b = cv.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); W = b.width; H = b.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv);
    const spawn = () => {
      const isBad = r() < 0.45; const label = isBad ? bad[Math.floor(r() * bad.length)] : good[Math.floor(r() * good.length)];
      g.font = "700 12px Atkinson, sans-serif"; const w = g.measureText(label).width + 22;
      pk.push({ x: -w, y: 40 + r() * (H - 90), w, label, bad: isBad, v: 60 + r() * 50 + t * 2.2, dead: false });
    };
    cv.addEventListener("pointerdown", (e) => {
      const b = cv.getBoundingClientRect(); const x = e.clientX - b.left, y = e.clientY - b.top;
      const p = pk.find((q) => !q.dead && x >= q.x - 6 && x <= q.x + q.w + 6 && Math.abs(y - q.y) < 18); if (!p) return;
      p.dead = true;
      if (p.bad) { ctx.add(90, x, y - 10); ctx.sfx("pop"); ctx.burst(x, y, C.hit, 14); why.textContent = `Dropped: ${p.label}.`; }
      else { users = Math.max(0, users - 15); ctx.add(-60, x, y - 10); ctx.sting("fail"); why.textContent = `That was ${p.label}. Users are filing tickets.`; }
    });
    const loop = (now) => {
      if (!alive) return; raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt; flash = Math.max(0, flash - dt * 2);
      spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.28, 1.1 - t / 70) * (0.6 + r() * 0.8); }
      const srvX = W - 70;
      if (W < 50 || H < 50) return;
      g.clearRect(0, 0, W, H);
      g.strokeStyle = C.lane; g.setLineDash([3, 9]); for (let y = 40; y < H - 30; y += 46) { g.beginPath(); g.moveTo(0, y); g.lineTo(srvX, y); g.stroke(); } g.setLineDash([]);
      g.fillStyle = flash > 0 ? C.hit : C.srv; g.globalAlpha = 0.18 + flash * 0.5; g.fillRect(srvX, 20, 56, H - 40); g.globalAlpha = 1;
      g.strokeStyle = flash > 0 ? C.hit : C.srv; g.lineWidth = 2; g.strokeRect(srvX, 20, 56, H - 40);
      g.fillStyle = C.srv; g.font = "800 13px 'Big Shoulders', sans-serif"; g.textAlign = "center"; g.fillText("SERVER", srvX + 28, H / 2);
      g.font = "600 11px JetBrains, monospace"; g.fillText(`${Math.round(hp)}%`, srvX + 28, H / 2 + 16);
      g.textAlign = "left"; g.textBaseline = "middle"; g.font = "700 12px Atkinson, sans-serif";
      for (const p of pk) {
        if (p.dead) continue; p.x += p.v * dt;
        if (p.x + p.w >= srvX) {
          p.dead = true;
          if (p.bad) { hp -= 12; flash = 1; ctx.add(-40); ctx.sfx("thud"); why.textContent = `${p.label} hit the server.`; if (hp <= 0) { alive = false; ctx.end(); return; } }
          else ctx.add(5);
          continue;
        }
        g.fillStyle = C.good; g.beginPath(); g.roundRect ? g.roundRect(p.x, p.y - 13, p.w, 26, 13) : g.rect(p.x, p.y - 13, p.w, 26); g.fill();
        g.fillStyle = C.text; g.fillText(p.label, p.x + 11, p.y + 1);
      }
      pk = pk.filter((p) => !p.dead);
      g.fillStyle = cs.getPropertyValue("--text").trim(); g.font = "600 12px Atkinson, sans-serif"; g.textBaseline = "top";
      g.fillText(`Server ${Math.max(0, Math.round(hp))}% · user happiness ${users}%`, 10, 6);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
  },
};
