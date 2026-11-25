// Break room: 60-second resets. Bubble wrap, handshake breathing, smash the printer, FP or TP.
import { $, h, html, put, fresh, pick, RM, store, arr, str, toast, copyText } from "../core.js";
import { sfx, sting } from "../audio.js";
import { bump, earn, stats } from "../state.js";
import { FPL, SMASH, FF } from "../content/legacy.js";

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>The 60-second break room</h1><p>Pick one. Your queue will still be there. Unfortunately.</p></div>
  <div class="seg tabs wraptabs" id="tabs"><button data-p="wrap" class="on">Alert bubble wrap</button><button data-p="breath">Handshake breathing</button><button data-p="stretch">Desk stretch</button><button data-p="eyes">Eye break</button><button data-p="ground">After a bad incident</button><button data-p="shred">Rant shredder</button><button data-p="wins">Wins jar</button><button data-p="smash">Smash the printer alert</button><button data-p="ff">False or true positive</button><button data-p="name">Name that incident</button></div>
  <div class="panel" id="brPane"></div>
  <div class="panel statsrow" id="brStats"></div>`);
  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; [...$("#tabs").children].forEach((x) => x.classList.toggle("on", x === b)); pane(b.dataset.p); });
  pane("wrap"); statsUI();
}
function statsUI() { put($("#brStats"), [["pop", "false positives popped"], ["smash", "printers smashed"], ["breath", "handshakes"], ["ffok", "correct calls"]].map(([k, l]) => h("div", h("b", String(stats[k])), h("span", l)))); }
let breathT = 0, tickT = 0;
const STRETCH = [
  ["Neck release", "Drop your right ear towards your right shoulder. Breathe. Swap sides halfway.", 30],
  ["Shoulder rolls", "Roll both shoulders up, back and down, slowly. Ten times.", 20],
  ["Chest opener", "Hands behind your head, elbows wide, gently squeeze your shoulder blades together.", 20],
  ["Wrist and forearm", "Arm out, palm up, gently pull your fingers back with the other hand. Swap halfway. Typing hands need this.", 30],
  ["Seated twist", "Sit tall, turn your upper body to the right, hand on the chair back. Swap halfway.", 30],
  ["Ankle circles", "Lift one foot and draw circles. Swap halfway. Good for long seated shifts.", 20],
  ["Stand up", "Stand, reach up tall, then let your arms drop. Have a sip of water while you're up.", 20],
];
const GROUND = [
  "Feet flat on the floor. Notice the chair holding you up.",
  "Name 5 things you can see. Slowly.",
  "Name 4 things you can feel: your sleeves, the desk, the air.",
  "Name 3 things you can hear.",
  "Name 2 things you can smell, or two smells you like.",
  "Name 1 thing that went right today, however small.",
  "Long breath out. The incident is handled or handed over. You are not the incident.",
];
const OP_A = ["Midnight", "Velvet", "Silent", "Crimson", "Paper", "Lazy", "Rusty", "Polite", "Frozen", "Sleepy", "Tiny", "Haunted", "Turbo", "Grumpy", "Beige", "Cosmic", "Loud", "Spicy"];
const OP_B = ["Printer", "Walrus", "Macro", "Toaster", "Badger", "Spreadsheet", "Pigeon", "Kettle", "Lanyard", "Router", "Stapler", "Llama", "Firewall", "Beacon", "Teapot", "Dongle", "Invoice", "Otter"];
const ROOT = ["a password on a sticky note", "a test server nobody owned", "'temporary' firewall rule from 2019", "a shared admin account", "an unpatched VPN", "a very convincing invoice", "an intern with admin rights", "a forgotten DNS record", "a vendor's remote access tool", "MFA fatigue at 2 AM", "a public S3 bucket", "the printer (again)"];
function pane(p) {
  clearTimeout(breathT); clearInterval(tickT); const box = $("#brPane");
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
  } else if (p === "stretch") {
    const title = h("h3.sub3", "Two minutes, seven moves, no equipment"), what = h("p.big"), timer = h("p.mono.big.timer"), btn = h("button.btn.primary", "Start");
    const list = h("ol.tight.small", STRETCH.map(([n, , s]) => h("li", `${n} (${s}s)`)));
    let i = -1, left = 0;
    const show = () => { const [n, d] = STRETCH[i]; what.textContent = `${n}: ${d}`; [...list.children].forEach((li, k) => li.classList.toggle("on", k === i)); };
    btn.addEventListener("click", () => { btn.disabled = true; i = 0; left = STRETCH[0][2]; show(); sfx("chime");
      tickT = setInterval(() => { left--; timer.textContent = `${left}s`; if (left <= 0) { i++; if (i >= STRETCH.length) { clearInterval(tickT); what.textContent = "Done. Your back says thanks."; timer.textContent = ""; bump("breath"); earn(5, "stretch"); statsUI(); sting("win"); btn.disabled = false; return; } left = STRETCH[i][2]; show(); sfx("chime"); } }, 1000);
      timer.textContent = `${left}s`; });
    put(box, title, what, timer, btn, list, h("p.muted.small", "Move gently and stop if anything hurts. If something hurts every shift, that's one for a physio or your occupational health team, not a website."));
  } else if (p === "eyes") {
    const t = h("p.mono.big.timer", "20"), btn = h("button.btn.primary", "Start the 20-second break");
    btn.addEventListener("click", () => { btn.disabled = true; let n = 20; t.textContent = n; sfx("chime");
      tickT = setInterval(() => { n--; t.textContent = n; if (n <= 0) { clearInterval(tickT); t.textContent = "Done"; sting("win"); earn(1, "eyes"); btn.disabled = false; } }, 1000); });
    put(box, h("p.big", "Every 20 minutes, look at something about 20 feet (6 metres) away for 20 seconds."), h("p.muted", "Out of a window is best. Blink a few times. Screens make us forget to."), t, btn,
      h("p.muted.small", "Shift buddy can remind you every 20 minutes: turn on the eye-break nudge there."));
  } else if (p === "ground") {
    let i = 0; const line = h("p.big.ground"), btn = h("button.btn.primary", "Next"), back = h("button.btn.ghost", "Back");
    const show = () => { line.textContent = GROUND[i]; btn.textContent = i === GROUND.length - 1 ? "Start again" : "Next"; back.disabled = i === 0; };
    btn.addEventListener("click", () => { i = (i + 1) % GROUND.length; show(); sfx("tick"); if (i === 0) bump("breath"); });
    back.addEventListener("click", () => { if (i > 0) { i--; show(); } });
    show();
    put(box, h("p.muted", "For after the 3 AM incident, the angry call, or the one that got through. A grounding exercise, one step at a time."), line, h("div.row", back, btn),
      h("p.muted.small", "If it's more than a bad shift, talk to someone: your lead, a colleague, your employee assistance programme, or a doctor."));
  } else if (p === "shred") {
    const ta = h("textarea.inp", { placeholder: "Type it out. The vendor, the 4 AM page, the person who reply-all'd the phishing email. Nobody will see this.", "aria-label": "Your rant", maxlength: "3000" });
    const bin = h("div.shredbin", { "aria-hidden": "true" }); const msg = h("p.muted.small", { "aria-live": "polite" });
    const go = () => {
      const t = ta.value.trim(); if (!t) { msg.textContent = "Nothing to shred. Lucky you."; return; }
      put(bin, Array.from({ length: 14 }, (_, k) => { const s = h("span.strip", t.slice(k * 9, k * 9 + 9) || "·"); s.style.left = `${k * 7}%`; s.style.animationDelay = `${k * 40}ms`; return s; }));
      ta.value = ""; sfx("smash"); msg.textContent = pick(["Shredded. It's gone. It was never stored anywhere.", "Into the bin. The bin has seen worse.", "Shredded and recycled into a slightly better mood.", "Gone. Breathe out. Back to the queue when you're ready."]);
      bump("smash"); statsUI(); setTimeout(() => put(bin), RM ? 200 : 1600);
    };
    put(box, h("p.muted", "Write the rant. Press shred. It isn't saved, sent or logged. Even we don't see it."), ta, h("div.row", h("button.btn.danger", { onclick: go }, "Shred it")), bin, msg);
  } else if (p === "wins") {
    const wins = () => arr(store.get("wins", [])).map((w) => ({ t: str(w?.t, 140), d: str(w?.d, 10) })).filter((w) => w.t).slice(0, 200);
    const inp = h("input.search.grow", { type: "text", maxlength: "140", placeholder: "Caught a phish? Closed a ticket nicely? Ate lunch away from the desk? It counts.", "aria-label": "Add a win" });
    const list = h("ul.wins"); const jar = h("div.jar"); const draw = h("p.big.drawwin", { "aria-live": "polite" });
    const render = () => { const w = wins(); jar.textContent = `${w.length} win${w.length === 1 ? "" : "s"} in the jar`; put(list, w.slice(0, 8).map((x) => h("li", h("span.muted.small", x.d + " "), x.t))); };
    const add = () => { const t = inp.value.replace(/[<>]/g, "").trim(); if (!t) return; store.set("wins", [{ t, d: new Date().toISOString().slice(0, 10) }, ...wins()]); inp.value = ""; sfx("pop"); earn(1, "win"); render(); };
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
    render();
    put(box, h("p.muted", "SOC work is mostly invisible when it goes well. Keep the receipts. Stored only in this browser."), h("div.row", inp, h("button.btn", { onclick: add }, "Add to the jar")), jar,
      h("button.btn.ghost", { onclick: () => { const w = wins(); draw.textContent = w.length ? `"${pick(w).t}"` : "The jar is empty. Add one small thing."; } }, "Pull one out on a bad day"), draw, list);
  } else if (p === "name") {
    const out = h("p.big.opname"), why = h("p.muted");
    const go = () => { out.textContent = `Operation ${pick(OP_A)} ${pick(OP_B)}`; why.textContent = `Root cause, as it will be written in the report: ${pick(ROOT)}.`; sfx("pop"); };
    go();
    put(box, h("p.muted", "Every incident deserves a code name. Generate yours for the bridge call."), out, why, h("div.row", h("button.btn.primary", { onclick: go }, "Another one"), h("button.btn.ghost", { onclick: () => copyText(out.textContent, "Copied. Use it wisely.") }, "Copy")));
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
