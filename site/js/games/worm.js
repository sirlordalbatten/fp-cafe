// Contain the worm: a network graph where an infection spreads each tick.
// Isolate hosts to cut it off. Protect the domain controller and the database.
import { h, RM } from "../core.js";

const TYPES = { ws: { r: 9, label: "" }, srv: { r: 11, label: "SRV" }, dc: { r: 15, label: "DC" }, db: { r: 14, label: "DB" } };

export const WORM = {
  id: "worm", label: "Contain the worm",
  how: "A worm is spreading host to host. Click hosts to isolate them before it reaches them. You have a limited number of isolations per round. Saving the DC and the database is worth extra. Lose more than 60% of the network and it's over.",
  keys: "click or tap hosts",
  start(ctx) {
    const { stage, r } = ctx;
    stage.classList.add("wormstage");
    const cv = h("canvas.wormcv", { "aria-label": "Network map" }); const info = h("p.why", { "aria-live": "polite" });
    stage.append(cv, info);
    const g = cv.getContext("2d"); const cs = getComputedStyle(document.body);
    const C = { edge: cs.getPropertyValue("--rule").trim(), node: cs.getPropertyValue("--sky").trim(), bad: cs.getPropertyValue("--alarm").trim(), iso: cs.getPropertyValue("--phos").trim(), gold: cs.getPropertyValue("--sodium").trim(), text: cs.getPropertyValue("--text").trim() };
    let W = 0, H = 0, level = 0, nodes = [], edges = [], budget = 0, tickT = 0, tickEvery = 1.3, alive = true, raf = 0, last = performance.now(), roundOver = false, pulses = [];
    const fit = () => { const b = cv.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); W = b.width; H = b.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv);

    function build() {
      level++; roundOver = false; pulses = [];
      const n = Math.min(32, 12 + level * 3); nodes = []; edges = [];
      let tries = 0;
      while (nodes.length < n && tries++ < 3000) {
        const x = 0.06 + r() * 0.88, y = 0.08 + r() * 0.84;
        if (nodes.every((p) => Math.hypot(p.x - x, (p.y - y) * 0.6) > 0.11)) nodes.push({ x, y, t: "ws", inf: false, iso: false, glow: 0 });
      }
      nodes[0].t = "dc"; nodes[1].t = "db"; for (let i = 2; i < 2 + Math.floor(n / 6); i++) nodes[i].t = "srv";
      const has = new Set();
      nodes.forEach((a, i) => {
        const near = nodes.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2 + (r() < 0.4 ? 1 : 0));
        for (const [j] of near) { const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (!has.has(k)) { has.add(k); edges.push([i, j]); } }
      });
      // join any islands so the worm can reach every part of the network
      const comp = nodes.map((_, i) => i); const find = (x) => (comp[x] === x ? x : (comp[x] = find(comp[x])));
      for (const [a, b] of edges) comp[find(a)] = find(b);
      for (;;) {
        const root = find(0); let best = null;
        nodes.forEach((a, i) => { if (find(i) !== root) return; nodes.forEach((b, j) => { if (find(j) === root) return; const d = Math.hypot(a.x - b.x, a.y - b.y); if (!best || d < best[2]) best = [i, j, d]; }); });
        if (!best) break; edges.push([best[0], best[1]]); comp[find(best[1])] = root;
      }
      const ws = nodes.map((p, i) => [p, i]).filter(([p]) => p.t === "ws");
      const start = ws[Math.floor(r() * ws.length)][1]; nodes[start].inf = true;
      budget = 3 + Math.floor(level / 2) + (ctx.diff === "easy" ? 1 : 0) - (ctx.diff === "hard" && level > 1 ? 1 : 0); tickEvery = Math.max(0.6, 1.5 - level * 0.1) / ctx.speed; tickT = tickEvery * 1.8;
      info.textContent = `Round ${level}. ${budget} isolations. The infection starts at the red host.`;
      ctx.lives(0);
    }
    const nb = (i) => edges.filter((e) => e[0] === i || e[1] === i).map((e) => (e[0] === i ? e[1] : e[0]));
    function spread() {
      const newly = [];
      nodes.forEach((p, i) => { if (!p.inf || p.iso) return; for (const j of nb(i)) { const q = nodes[j]; if (!q.inf && !q.iso && r() < 0.55) { newly.push(j); pulses.push({ a: i, b: j, t: 0 }); } } });
      newly.forEach((j) => { nodes[j].inf = true; nodes[j].glow = 1; });
      if (newly.length) ctx.sfx("tick");
      const canSpread = nodes.some((p, i) => p.inf && !p.iso && nb(i).some((j) => !nodes[j].inf && !nodes[j].iso));
      if (!canSpread) finishRound();
    }
    function finishRound() {
      if (roundOver) return; roundOver = true;
      const lost = nodes.filter((p) => p.inf).length, saved = nodes.length - lost;
      const jewels = nodes.filter((p) => (p.t === "dc" || p.t === "db") && !p.inf).length;
      if (lost / nodes.length > 0.6) { info.textContent = `Round ${level}: the worm took ${lost} of ${nodes.length} hosts. Game over.`; ctx.sting("fail"); setTimeout(() => ctx.end(), 1400); return; }
      ctx.add(saved * 40 * level + jewels * 300 * level, W / 2, H / 2, "round");
      ctx.sting("win"); info.textContent = `Contained. Saved ${saved} of ${nodes.length} hosts${jewels ? `, including ${jewels === 2 ? "the DC and the database" : nodes[0].inf ? "the database" : "the DC"}` : ""}. Next round…`;
      setTimeout(() => { if (alive) build(); }, 1800);
    }
    cv.addEventListener("click", (e) => {
      if (roundOver) return;
      const b = cv.getBoundingClientRect(); const x = e.clientX - b.left, y = e.clientY - b.top;
      let best = -1, bd = 26;
      nodes.forEach((p, i) => { const d = Math.hypot(p.x * W - x, p.y * H - y); if (d < bd) { bd = d; best = i; } });
      if (best < 0) return; const p = nodes[best];
      if (p.iso) return;
      if (budget <= 0) { info.textContent = "No isolations left this round. Watch and learn."; ctx.sfx("thud"); return; }
      p.iso = true; budget--; ctx.sfx(p.inf ? "thud" : "coin"); ctx.burst(p.x * W, p.y * H, C.iso, 10);
      ctx.add(p.inf ? 10 : 25, p.x * W, p.y * H - 16);
      info.textContent = `${budget} isolation${budget === 1 ? "" : "s"} left.`;
    });
    const draw = (now) => {
      if (!alive) return; raf = requestAnimationFrame(draw);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!roundOver) { tickT -= dt; if (tickT <= 0) { tickT = tickEvery; spread(); } }
      if (W < 50 || H < 50) return;
      g.clearRect(0, 0, W, H);
      g.lineWidth = 1.5;
      for (const [a, b] of edges) {
        const A = nodes[a], B = nodes[b]; const hot = A.inf && B.inf; const cut = A.iso || B.iso;
        g.strokeStyle = hot ? C.bad + "AA" : cut ? C.edge + "55" : C.edge; g.setLineDash(cut ? [4, 4] : []);
        g.beginPath(); g.moveTo(A.x * W, A.y * H); g.lineTo(B.x * W, B.y * H); g.stroke();
      }
      g.setLineDash([]);
      pulses = pulses.filter((p) => (p.t += dt * 2.2) < 1);
      for (const p of pulses) { const A = nodes[p.a], B = nodes[p.b]; g.fillStyle = C.bad; g.beginPath(); g.arc((A.x + (B.x - A.x) * p.t) * W, (A.y + (B.y - A.y) * p.t) * H, 4, 0, Math.PI * 2); g.fill(); }
      for (const p of nodes) {
        const T = TYPES[p.t]; const x = p.x * W, y = p.y * H; p.glow = Math.max(0, p.glow - dt);
        const pulse = p.inf && !RM ? 1 + Math.sin(now / 180) * 0.12 : 1;
        g.shadowBlur = p.inf ? 16 : p.t === "dc" || p.t === "db" ? 10 : 0; g.shadowColor = p.inf ? C.bad : C.gold;
        g.fillStyle = p.inf ? C.bad : p.t === "dc" || p.t === "db" ? C.gold : C.node;
        g.beginPath(); g.arc(x, y, T.r * pulse, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
        if (p.iso) { g.strokeStyle = C.iso; g.lineWidth = 3; g.beginPath(); g.arc(x, y, T.r + 5, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.5; }
        if (T.label) { g.fillStyle = "#10162A"; g.font = "700 9px JetBrains, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(T.label, x, y + 0.5); }
      }
      g.fillStyle = C.text; g.font = "600 13px Atkinson, sans-serif"; g.textAlign = "left"; g.textBaseline = "top";
      g.fillText(`Round ${level} · isolations left: ${budget} · infected: ${nodes.filter((p) => p.inf).length}/${nodes.length}`, 10, 8);
    };
    build(); raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
  },
};
