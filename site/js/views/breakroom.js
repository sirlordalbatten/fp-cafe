// Break room: 60-second resets. Bubble wrap, handshake breathing, smash the printer, FP or TP.
import { $, h, html, put, fresh, pick, RM } from "../core.js";
import { sfx, sting } from "../audio.js";
import { bump, earn, stats } from "../state.js";
import { FPL, SMASH, FF } from "../content/legacy.js";

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>The 60-second break room</h1><p>Pick one. Your queue will still be there. Unfortunately.</p></div>
  <div class="seg tabs" id="tabs"><button data-p="wrap" class="on">Alert bubble wrap</button><button data-p="breath">Handshake breathing</button><button data-p="smash">Smash the printer alert</button><button data-p="ff">False or true positive</button></div>
  <div class="panel" id="brPane"></div>
  <div class="panel statsrow" id="brStats"></div>`);
  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; [...$("#tabs").children].forEach((x) => x.classList.toggle("on", x === b)); pane(b.dataset.p); });
  pane("wrap"); statsUI();
}
function statsUI() { put($("#brStats"), [["pop", "false positives popped"], ["smash", "printers smashed"], ["breath", "handshakes"], ["ffok", "correct calls"]].map(([k, l]) => h("div", h("b", String(stats[k])), h("span", l)))); }
let breathT = 0;
function pane(p) {
  clearTimeout(breathT); const box = $("#brPane");
  if (p === "wrap") {
    const grid = h("div.wrapgrid");
    const fill = () => put(grid, Array.from({ length: 48 }, () => h("button.bub", { "aria-label": "Pop" }, pick(FPL))));
    grid.addEventListener("click", (e) => { const b = e.target.closest(".bub"); if (!b || b.classList.contains("popped")) return; b.classList.add("popped"); b.textContent = ""; sfx("pop"); bump("pop"); statsUI(); if (![...grid.children].some((x) => !x.classList.contains("popped"))) { sting("win"); earn(2, "wrap"); setTimeout(fill, 600); } });
    fill(); put(box, h("p.muted", "Every bubble is a false positive. Pop them."), grid, h("button.btn", { onclick: fill }, "The SIEM sent more"));
  } else if (p === "breath") {
    const orb = h("div.orb", "ready"); const label = h("p.mono.muted", "Press start"); const btn = h("button.btn.primary", "Start the handshake");
    const seq = [["SYN", "breathe in", 4000, "in"], ["SYN-ACK", "hold", 4000, "hold"], ["ACK", "breathe out", 6000, "out"]];
    btn.addEventListener("click", () => { btn.disabled = true; let round = 0, i = 0;
      const step = () => { if (round >= 3) { orb.className = "orb"; orb.textContent = "connected"; label.textContent = "Session established. Welcome back."; bump("breath"); earn(5, "breath"); statsUI(); sting("win"); btn.disabled = false; return; }
        const [k, t, ms, cls] = seq[i]; orb.className = "orb " + cls; orb.textContent = t; label.textContent = `${k} · round ${round + 1} of 3`; sfx("chime");
        i++; if (i === 3) { i = 0; round++; } breathT = setTimeout(step, RM ? 1500 : ms); };
      step(); });
    put(box, h("div.breath", orb, label, btn, h("p.muted.small", "SYN, breathe in for 4. SYN-ACK, hold for 4. ACK, breathe out for 6. Three rounds.")));
  } else if (p === "smash") {
    const txt = h("p.muted", "Suspicious behaviour detected on PRINTER-3F-02. Again.");
    const big = h("button.bigred", { "aria-label": "Smash the printer alert" }); big.append("SMASH");
    big.addEventListener("click", () => { sfx("smash"); bump("smash"); statsUI(); txt.textContent = fresh("smash", SMASH); big.classList.remove("smashed"); void big.offsetWidth; big.classList.add("smashed"); });
    put(box, h("div.smash", big, txt));
  } else {
    const q = h("div.ffq.mono"), res = h("div.ffres", { "aria-live": "polite" }); let cur;
    const next = () => { cur = fresh("ff", FF, (x) => x.q); q.textContent = cur.q; res.textContent = ""; };
    const ans = (a) => { const ok = a === cur.a; res.textContent = (ok ? "Correct. " : `It was a ${cur.a === "FP" ? "false" : "true"} positive. `) + cur.why; if (ok) { bump("ffok"); statsUI(); sting("combo"); } else sting("fail"); };
    put(box, h("div.ff", q, h("div.row", h("button.ffb", { onclick: () => ans("FP") }, "False positive"), h("button.ffb", { onclick: () => ans("TP") }, "True positive")), res, h("button.btn", { onclick: next }, "Next alert")));
    next();
  }
}
