// SOCdle: one five-letter security word a day, six guesses, a lesson at the end.
import { $, $$, h, html, put, store, obj, arr, num, todayKey, dayNum, copyText, toast, RM } from "../core.js";
import { sfx, sting } from "../audio.js";
import { bump, earn, xp, profile } from "../state.js";
import { startRun, submit, joinBoards } from "../board.js";
import { DLE } from "../content/words.js";
import { DECODE_PHRASES, DECODE_KINDS } from "../content/legacy.js";

const ROWS = 6;
const word = () => DLE[((dayNum() * 37 + 11) % DLE.length + DLE.length) % DLE.length];
let st, run = null, typed = "";

function state() {
  const s = obj(store.get("dle_" + todayKey(), {}));
  return { guesses: arr(s.guesses).filter((g) => /^[A-Z]{5}$/.test(g)).slice(0, ROWS), done: s.done === true, won: s.won === true, hint: true, posted: s.posted === true,
    reveal: arr(s.reveal).filter((i) => Number.isInteger(i) && i >= 0 && i < 5).slice(0, 2), bank: s.bank === true };
}
const save = () => store.set("dle_" + todayKey(), st);
function score(g, w) {
  const res = Array(5).fill("x"); const left = {};
  for (let i = 0; i < 5; i++) { if (g[i] === w[i]) res[i] = "g"; else left[w[i]] = (left[w[i]] || 0) + 1; }
  for (let i = 0; i < 5; i++) if (res[i] !== "g" && left[g[i]]) { res[i] = "y"; left[g[i]]--; }
  return res;
}

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>SOCdle</h1><p>Guess today's five-letter security word in six tries. Everyone gets the same word, so compare at standup.</p></div>
  <div class="two">
    <div class="panel dlepanel">
      <div class="howto" id="dleHow">
        <p><b>How to play.</b> Type any five-letter word and press Enter. The tiles change colour to show how close you are:</p>
        <div class="exrow" aria-label="Example: the word PROXY guessed as PATCH"><span class="tile g">P</span><span class="tile x">A</span><span class="tile x">T</span><span class="tile x">C</span><span class="tile x">H</span></div>
        <ul class="plain small"><li><i class="sw g"></i><b>Green</b>: right letter, right spot</li><li><i class="sw y"></i><b>Amber</b>: in the word, but somewhere else</li><li><i class="sw x"></i><b>Grey</b>: not in the word at all</li></ul>
        <p class="muted small">Use the colours to narrow it down. Stuck? Reveal a letter, or open the word list: every answer comes from it. New word at midnight.</p>
      </div>
      <p class="dlehint" id="dleHint"></p>
      <div class="dlehelp"><div class="pattern" id="dlePat" aria-label="Letters you know so far"></div>
        <button class="btn ghost sm" id="dleReveal">Reveal a letter</button><button class="btn ghost sm" id="dleBankBtn" aria-expanded="false">Word list</button></div>
      <div class="wbank" id="dleBank" hidden></div>
      <div class="dleboard" id="board" role="grid" aria-label="Guesses"></div>
      <p id="dleMsg" class="dlemsg" aria-live="polite"></p>
      <div class="kbd" id="kbd"></div>
    </div>
    <div class="stack">
      <div class="panel"><div class="ph"><h3>Your streak</h3></div><div id="dleStats"></div><button class="btn sm" id="dleShare"><svg class="ic"><use href="#i-copy"/></svg>Copy result for team chat</button></div>
      <div class="panel"><div class="ph"><h3>Decode of the day</h3><span class="muted">bonus round</span></div><div id="decode"></div></div>
    </div>
  </div>`);
  st = state();
  $("#dleHow").hidden = store.get("dleHowSeen", false) && st.guesses.length > 0;
  const rows = "QWERTYUIOP|ASDFGHJKL|>ZXCVBNM<".split("|");
  put($("#kbd"), rows.map((r) => h("div.krow", [...r].map((k) => h("button.key" + (k === ">" || k === "<" ? ".wide" : ""), { dataset: { k }, "aria-label": k === ">" ? "Enter" : k === "<" ? "Delete" : k }, k === ">" ? "Enter" : k === "<" ? "Del" : k)))));
  $("#kbd").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) key(b.dataset.k); });
  window.addEventListener("keydown", (e) => {
    if (location.hash !== "#socdle" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input,textarea,select")) return;
    if (e.key === "Enter") { e.preventDefault(); key(">"); } else if (e.key === "Backspace") { e.preventDefault(); key("<"); } else if (/^[a-z]$/i.test(e.key)) key(e.key.toUpperCase());
  });
  $("#dleShare").addEventListener("click", share);
  $("#dleReveal").addEventListener("click", reveal);
  $("#dleBankBtn").addEventListener("click", () => { st.bank = !st.bank; save(); render(); });
  render(); stats(); decode();
}

function key(k) {
  if (st.done) return;
  if (!run && st.guesses.length === 0 && typed.length === 0) run = startRun("socdle");
  if (k === "<") typed = typed.slice(0, -1);
  else if (k === ">") return guess();
  else if (typed.length < 5) { typed += k; sfx("clack"); }
  render();
}
function guess() {
  if (typed.length < 5) { msg("Five letters, please."); shakeRow(); return; }
  store.set("dleHowSeen", true);
  const w = word()[0]; st.guesses.push(typed); typed = "";
  if (st.guesses[st.guesses.length - 1] === w) { st.done = true; st.won = true; }
  else if (st.guesses.length >= ROWS) st.done = true;
  save(); render(true);
  if (st.done) finish();
  else if (st.guesses.length === 3 && !st.hint) msg("Stuck? A hint is available above the board.");
}
async function finish() {
  const [w, , lesson] = word(); const n = st.guesses.length;
  const s = obj(store.get("dleStats", {})); const dist = arr(s.dist).length === 6 ? s.dist.map((x) => num(x, 0)) : [0, 0, 0, 0, 0, 0];
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const streak = st.won ? (s.last === todayKey(yesterday) ? num(s.streak, 0) + 1 : 1) : 0;
  if (st.won) dist[n - 1]++;
  store.set("dleStats", { played: num(s.played, 0) + 1, wins: num(s.wins, 0) + (st.won ? 1 : 0), streak, best: Math.max(num(s.best, 0), streak), last: st.won ? todayKey() : s.last, dist });
  if (st.won) { sting("win"); bump("dle"); earn(8, "socdle"); xp(20, "socdle"); }
  else sting("fail");
  put($("#dleMsg"), h("b", st.won ? `${["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"][n - 1]}! ` : `The word was ${w}. `), lesson);
  stats();
  if (st.won && !st.posted) {
    const p = profile(); const tok = await run;
    const pts = Math.max(1, 7 - n - st.reveal.length);
    if (tok && p.boards) { const r = await submit(tok, pts); if (r?.ok) { st.posted = true; save(); toast(`SOCdle score posted. Weekly rank #${r.weekRank}.`); } }
    else if (tok && !p.boards) { $("#dleMsg").append(" ", h("button.linkbtn", { onclick: () => joinBoards(async () => { const r = await submit(tok, pts); if (r?.ok) { st.posted = true; save(); toast("Posted to the SOCdle board."); } }) }, "Post to the leaderboard")); }
  }
}
function reveal() {
  if (st.done) return;
  const w = word()[0]; const greens = new Set();
  st.guesses.forEach((g) => [...g].forEach((ch, i) => { if (ch === w[i]) greens.add(i); }));
  const open = [0, 1, 2, 3, 4].filter((i) => !greens.has(i) && !st.reveal.includes(i));
  if (st.reveal.length >= 2 || !open.length) { msg("That's all the help the CISO will approve today."); return; }
  if (!run && !st.guesses.length) run = startRun("socdle");
  st.reveal.push(open[Math.floor(Math.random() * open.length)]); save(); sfx("pop"); render();
  msg(`Revealed. Each reveal costs one point on the leaderboard.`);
}
function msg(t) { $("#dleMsg").textContent = t; }
function shakeRow() { const r = $$("#board .drow")[st.guesses.length]; if (r && !RM) { r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); } }

function render(reveal = false) {
  const [w, cat] = word();
  const hint = $("#dleHint"); hint.textContent = "";
  hint.append(h("span.muted", "Today's word is "), h("b", cat), h("span.muted", "."));
  // pattern: greens from guesses plus revealed letters
  const pat = [0, 1, 2, 3, 4].map((i) => (st.reveal.includes(i) || st.guesses.some((g) => g[i] === w[i]) || st.done) ? w[i] : "");
  put($("#dlePat"), pat.map((ch) => h("span.pt" + (ch ? ".on" : ""), ch || "·")));
  $("#dleReveal").disabled = st.done || st.reveal.length >= 2;
  $("#dleReveal").textContent = st.reveal.length ? `Reveal a letter (${2 - st.reveal.length} left)` : "Reveal a letter";
  $("#dleBankBtn").setAttribute("aria-expanded", String(st.bank)); $("#dleBank").hidden = !st.bank;
  if (st.bank) {
    const ok = (cand) => st.guesses.every((g) => score(g, cand).join("") === score(g, w).join("")) && st.reveal.every((i) => cand[i] === w[i]);
    const words = [...new Set(DLE.map((x) => x[0]))].sort();
    const live = words.filter(ok).length;
    put($("#dleBank"), h("p.muted.small", `${live} of ${words.length} words still possible. Greyed ones are ruled out by your guesses. Tap one to type it.`),
      h("div.wb", words.map((x) => h("button.wb-w" + (ok(x) ? "" : ".out"), { type: "button", disabled: st.done || !ok(x), onclick: () => { typed = x; render(); } }, x))));
  }
  const known = {};
  const rows = [];
  for (let i = 0; i < ROWS; i++) {
    const g = st.guesses[i]; const cur = i === st.guesses.length && !st.done ? typed : "";
    const res = g ? score(g, w) : null;
    if (g) [...g].forEach((ch, j) => { const r = res[j]; if (r === "g" || (r === "y" && known[ch] !== "g") || !known[ch]) known[ch] = r; });
    rows.push(h("div.drow", { role: "row" }, [0, 1, 2, 3, 4].map((j) => {
      const ch = g ? g[j] : cur[j] || "";
      const t = h("span.tile" + (res ? "." + res[j] : ch ? ".typed" : ""), { role: "gridcell", "aria-label": ch ? `${ch}${res ? ", " + { g: "correct", y: "elsewhere", x: "absent" }[res[j]] : ""}` : "empty" }, ch);
      if (reveal && i === st.guesses.length - 1 && !RM) { t.classList.add("flipin"); t.style.animationDelay = j * 110 + "ms"; }
      return t;
    })));
  }
  put($("#board"), rows);
  $$("#kbd button").forEach((b) => { b.classList.remove("g", "y", "x"); const s = known[b.dataset.k]; if (s) b.classList.add(s); });
  if (!st.done && !st.guesses.length && !typed) msg("");
  const dot = $("#dleNew"); if (dot) dot.hidden = st.done;
}
function stats() {
  const s = obj(store.get("dleStats", {})); const dist = arr(s.dist).length === 6 ? s.dist : [0, 0, 0, 0, 0, 0]; const max = Math.max(1, ...dist);
  put($("#dleStats"), h("div.statsrow.small4", [["played", num(s.played, 0)], ["win %", s.played ? Math.round((num(s.wins, 0) / s.played) * 100) : 0], ["streak", num(s.streak, 0)], ["best", num(s.best, 0)]].map(([l, v]) => h("div", h("b", String(v)), h("span", l)))),
    h("div.dist", dist.map((v, i) => h("div.drow2", h("span", String(i + 1)), h("div.bar", h("i", { "data-w": (num(v, 0) / max) * 100 })), h("span.muted", String(num(v, 0)))))));
}
function share() {
  if (!st.done) { toast("Finish today's word first."); return; }
  const w = word()[0];
  const grid = st.guesses.map((g) => score(g, w).map((r) => ({ g: "█", y: "▒", x: "░" }[r])).join("")).join("\n");
  copyText(`SOCdle #${dayNum()} ${st.won ? st.guesses.length : "X"}/6\n${grid}\nfp-cafe.pages.dev/#socdle`, "Result copied. Paste it in team chat.");
}

// ---------- bonus: decode of the day ----------
function decode() {
  const phrase = DECODE_PHRASES[(dayNum() * 13) % DECODE_PHRASES.length]; const kind = DECODE_KINDS[(dayNum() * 7) % DECODE_KINDS.length];
  const enc = kind.enc(phrase); const done = store.get("dec_" + todayKey(), false) === true;
  const inp = h("input.search", { type: "text", placeholder: "Your answer", "aria-label": "Decoded answer", autocomplete: "off", spellcheck: "false" });
  const out = h("p.small", { "aria-live": "polite" });
  const go = () => {
    if (inp.value.trim().toLowerCase().replace(/\s+/g, " ") === phrase) { out.textContent = `Correct. ${kind.how}`; if (!store.get("dec_" + todayKey(), false)) { store.set("dec_" + todayKey(), true); earn(4, "decode"); xp(8, "decode"); sting("win"); } }
    else { out.textContent = "Not quite. " + kind.hint; sfx("thud"); }
  };
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  put($("#decode"), h("p.small", `Encoded with ${kind.k}. What does it say?`), h("code.decode-str", enc), h("div.row", inp, h("button.btn.sm", { onclick: go }, "Check")), out,
    done ? h("p.muted.small", "Already solved today.") : null);
}
