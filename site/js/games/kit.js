// Shared game shell: title screen, countdown, HUD, juice (floating scores, particles, shake), results.
import { h, put, store, obj, num, RM, mulberry32, seedFrom, todayKey, rnd, copyText, emit } from "../core.js";
import { sfx, sting, Snd } from "../audio.js";
import { startRun, submit, getBoard, joinBoards } from "../board.js";
import { profile, bump, earn, xp } from "../state.js";

export const DIFFS = {
  easy: { speed: 0.65, mult: 0.6, label: "Easy" },
  normal: { speed: 0.85, mult: 1, label: "Normal" },
  hard: { speed: 1.2, mult: 1.5, label: "Hard" },
};
export const getDiff = () => (DIFFS[store.get("diff", "normal")] ? store.get("diff", "normal") : "normal");
export function bests() { return obj(store.get("best", {})); }
function setBest(id, score, daily) {
  const b = bests(); const k = daily ? `${id}:${todayKey()}` : id;
  const was = num(b[k], 0); if (score > was) { b[k] = score; store.set("best", b); return true; } return false;
}

/**
 * play(area, game, {daily}) runs one game in `area`.
 * game = { id, label, how, keys, duration?, start(ctx) -> stop() }
 */
export async function play(area, game, { daily = false, onDone, onStart } = {}) {
  const diffId = daily ? "normal" : getDiff(); const D = DIFFS[diffId];
  const run = startRun(game.id);  // fetch token in parallel with the countdown
  const seed = daily ? seedFrom(game.id + todayKey()) : seedFrom(game.id + Date.now() + rnd());
  const r = mulberry32(seed);
  document.body.dataset.busy = "1";
  const hudScore = h("b.hs", "0"), hudCombo = h("span.hc"), hudTime = h("span.ht"), lives = h("span.hl");
  const bar = h("i"), timeBar = h("div.tbar", bar);
  const stage = h("div.stage", { tabindex: "0" });
  const fx = h("div.fx", { "aria-hidden": "true" });
  const hud = h("div.hud", h("span.hn", game.label), daily ? h("span.pill.p-lav", "daily") : null, h("span.pill.p-unk", D.label), h("span.grow"), lives, hudCombo, hudTime, h("span.muted", "score "), hudScore);
  put(area, h("div.gamebox", hud, timeBar, h("div.stagewrap", stage, fx)));
  let score = 0, combo = 1, streak = 0, over = false, stop = () => {}, t0 = 0, raf = 0;
  const left = () => Math.max(0, game.duration ? game.duration - (performance.now() - t0) / 1000 : 0);

  const ctx = {
    stage, r, daily, speed: D.speed, diff: diffId,
    get score() { return score; }, get combo() { return combo; },
    add(points, x, y, label) {
      const p = Math.round(points * D.mult * (points > 0 ? combo : 1)); score = Math.max(0, score + p); hudScore.textContent = score.toLocaleString();
      if (points > 0) { streak++; if (streak % 4 === 0 && combo < 8) { combo++; sting("combo"); pop(`x${combo} combo`, null, null, "combo"); } }
      else { streak = 0; combo = 1; shake(); }
      hudCombo.textContent = combo > 1 ? `x${combo}` : "";
      if (x !== undefined) pop((p > 0 ? "+" : "") + p + (label ? " " + label : ""), x, y, p > 0 ? "good" : "bad");
    },
    burst(x, y, color = "var(--phos)", n = 14) { if (RM) return; for (let i = 0; i < n; i++) { const d = h("i.spark"); const a = (Math.PI * 2 * i) / n + rnd(); const v = 40 + rnd() * 70;
      d.style.left = x + "px"; d.style.top = y + "px"; d.style.background = color; d.style.setProperty("--dx", Math.cos(a) * v + "px"); d.style.setProperty("--dy", Math.sin(a) * v + "px"); fx.append(d); setTimeout(() => d.remove(), 650); } },
    lives(n) { lives.textContent = n > 0 ? "♥".repeat(n) : ""; },
    say(t) { pop(t, null, null, "say"); },
    end, sfx, sting,
  };
  function pop(text, x, y, cls) {
    const el = h("span.float." + cls, text);
    if (x === null || x === undefined) { el.classList.add("center"); } else { el.style.left = x + "px"; el.style.top = y + "px"; }
    fx.append(el); setTimeout(() => el.remove(), cls === "say" ? 1800 : 900);
  }
  function shake() { if (RM) return; stage.parentElement.classList.remove("shake"); void stage.offsetWidth; stage.parentElement.classList.add("shake"); }

  let aborted = false;
  function abort() { if (over) return; over = true; aborted = true; cancelAnimationFrame(raf); try { stop(); } catch { /* ignore */ } delete document.body.dataset.busy; }
  const handle = { end: () => end(), abort };
  if (onStart) onStart(handle);
  // countdown
  for (const n of ["3", "2", "1"]) { pop(n, null, null, "count"); sfx("tick"); await new Promise((res) => setTimeout(res, 600)); if (aborted || !area.isConnected) return handle; }
  pop("Go!", null, null, "count"); sting("combo");
  t0 = performance.now(); stop = game.start(ctx) || (() => {}); stage.focus({ preventScroll: true });
  const loop = () => { if (over) return; if (game.duration) { const l = left(); hudTime.textContent = Math.ceil(l) + "s"; bar.style.width = (l / game.duration) * 100 + "%"; if (l <= 0) return end(); } raf = requestAnimationFrame(loop); };
  loop();

  async function end() {
    if (over || aborted) return; over = true; cancelAnimationFrame(raf); try { stop(); } catch { /* ignore */ }
    delete document.body.dataset.busy;
    const final = Math.round(score); const best = setBest(game.id, final, daily);
    bump("arcade"); earn(Math.min(25, 5 + Math.floor(final / 2000)), "arcade"); xp(15, "arcade");
    sting(best ? "level" : "win"); emit("game:end", { id: game.id, label: game.label, score: final, best });
    const status = h("p.muted.small", "");
    const boardBox = h("div.minib");
    put(area, h("div.results",
      h("p.r-k", daily ? "Daily challenge" : `Game over · ${D.label}`), h("h2.r-score", final.toLocaleString()),
      h("p", best ? "New personal best." : `Your best: ${num(bests()[daily ? `${game.id}:${todayKey()}` : game.id], 0).toLocaleString()}`), status,
      h("div.row.center",
        h("button.btn.primary", { onclick: () => play(area, game, { daily, onDone, onStart }) }, "Play again"),
        h("button.btn", { onclick: () => copyText(`FP Café · ${game.label}${daily ? " (daily)" : ` (${D.label})`}: ${final.toLocaleString()} points. Beat that: https://fp-cafe.pages.dev/#arcade`, "Score copied") }, "Share score"),
        h("button.btn.ghost", { onclick: () => onDone && onDone() }, "Back")),
      boardBox));
    const p = profile(); const tok = await run;
    if (!tok) status.textContent = "Leaderboards are offline right now. Your best is saved in this browser.";
    else if (!p.boards) put(status, "Want this on the leaderboard? ", h("button.linkbtn", { onclick: () => joinBoards(async () => { status.textContent = "Submitting…"; const res = await submit(tok, final, { daily }); status.textContent = res?.ok ? `Submitted. Weekly rank #${res.weekRank}.` : `Not submitted: ${res?.error || "offline"}.`; mini(boardBox, game); }) }, "Join with a callsign"));
    else { status.textContent = "Submitting to the leaderboard…"; const res = await submit(tok, final, { daily }); status.textContent = res?.ok ? `On the board as ${p.callsign}. Weekly rank #${res.weekRank}.` : `Not submitted: ${res?.error || "offline"}.`; }
    mini(boardBox, game);
  }
  return handle;
}

export async function mini(box, game) {
  const p = profile(); const d = await getBoard(game.id, "week", "");
  if (!d || !Array.isArray(d.rows)) return;
  put(box, h("p.lbl", "This week"), h("ol.lb", d.rows.slice(0, 5).map((r) => h("li" + (r.name === p.callsign ? ".me" : ""), h("span", String(r.name)), h("b", Number(r.score).toLocaleString())))));
}
