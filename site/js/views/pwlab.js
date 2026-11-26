// Password lab: strength checker that explains why, a passphrase generator, and a daily "crack a colleague".
import { $, h, html, put, store, todayKey, dayNum, rnd, copyText } from "../core.js";
import { sfx, sting } from "../audio.js";
import { bump, earn, xp } from "../state.js";
import { avatar } from "../art.js";
import { COMMON_PW, WALKS, PW_VERDICTS, PP_WORDS, CRACK, CAST } from "../content/legacy.js";

const leet = (s) => s.toLowerCase().replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/[$5]/g, "s").replace(/7/g, "t");
function analyse(pw) {
  const out = { found: [], bits: 0 }; if (!pw) return out;
  let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/[0-9]/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  let bits = pw.length * Math.log2(Math.max(pool, 1)); const low = pw.toLowerCase(), base = leet(pw).replace(/[^a-z]/g, "");
  if (COMMON_PW.includes(low) || COMMON_PW.includes(leet(pw))) { out.found.push("It's on every common-password list. Attackers try it first."); bits = Math.min(bits, 6); }
  else if (COMMON_PW.some((w) => w.length >= 5 && base.includes(leet(w).replace(/[^a-z]/g, "")))) { out.found.push("Built around a common word. Swaps like @ for a don't fool cracking tools."); bits = Math.min(bits, 22); }
  if (WALKS.some((w) => low.includes(w))) { out.found.push("Contains a keyboard pattern."); bits -= 12; }
  if (/(19|20)\d{2}/.test(pw)) { out.found.push("Contains a year. Attackers append years automatically."); bits -= 8; }
  if (/(summer|winter|spring|autumn|fall)/i.test(pw)) { out.found.push("Season plus year is a password-spraying classic."); bits = Math.min(bits, 18); }
  if (/(january|february|march|april|june|july|august|september|october|november|december)/i.test(pw)) { out.found.push("A month name. Month plus year is in every spraying list."); bits = Math.min(bits, 18); }
  const co = String(store.get("pwCompany", "") || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (co.length >= 3 && leet(pw).replace(/[^a-z0-9]/g, "").includes(co)) { out.found.push("Contains your company name. It's the first word an attacker tries against your staff."); bits = Math.min(bits, 16); }
  if (/(.)\1\1/.test(pw)) { out.found.push("Repeated characters add almost nothing."); bits -= 6; }
  if (/^[A-Z][a-z]+\d+[!@#$%^&*]?$/.test(pw)) { out.found.push("Capital, word, digits, symbol: the exact shape every policy produces and every cracker expects."); bits = Math.min(bits, 26); }
  if (pw.length < 10) out.found.push("Short. Length matters more than anything else.");
  if (pw.split(/[\s\-_.]+/).filter((w) => w.length >= 3).length >= 4 && pw.length >= 20) out.found.push("Looks like a passphrase. Nice.");
  out.bits = Math.max(0, bits); return out;
}
function fmtTime(sec) {
  if (sec < 1) return "instantly"; const u = [["second", 60], ["minute", 60], ["hour", 24], ["day", 365], ["year", 100], ["century", 1e4]]; let v = sec, i = 0;
  while (i < u.length && v >= u[i][1]) { v /= u[i][1]; i++; }
  if (i >= u.length) return "longer than the universe will exist"; const n = Math.floor(v); return `${n} ${u[i][0]}${n === 1 ? "" : "s"}`.replace("centurys", "centuries");
}

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Password lab</h1><p>See how long a password would survive, then crack a colleague's. Everything runs in your browser. Nothing is stored or sent.</p></div>
  <div class="two">
    <div class="panel"><div class="ph"><h3>How long would it survive?</h3></div>
      <p class="warn">Don't type a password you actually use. Type one like it.</p>
      <div class="row"><input class="search grow" type="password" id="pwIn" placeholder="Try a password" autocomplete="off" spellcheck="false" aria-label="Password to test"><button class="btn sm" id="pwShow">Show</button></div>
      <label class="sortl">Block my company name <input class="search" id="pwCo" type="text" maxlength="40" placeholder="e.g. Contoso" autocomplete="off" spellcheck="false" aria-label="Company name to block"></label>
      <div class="bar pwbar"><i id="pwMeter"></i></div><div id="pwOut"></div>
      <div class="pp"><p class="lbl">Want a strong one?</p><p class="muted small">Four random words beat most "complex" passwords, and you can actually remember them. Generated with your browser's secure random numbers.</p>
        <div class="row"><button class="btn" id="ppGen">Generate a passphrase</button><code class="ppout" id="ppOut"></code><button class="btn ghost sm" id="ppCopy" hidden>Copy</button></div></div></div>
    <div class="panel"><div class="ph"><h3>Crack a colleague</h3><span class="muted">a new victim every day</span></div><div id="crack"></div></div>
  </div>`);
  const inp = $("#pwIn");
  inp.addEventListener("input", check);
  const co = $("#pwCo"); co.value = String(store.get("pwCompany", "") || ""); co.addEventListener("input", () => { store.set("pwCompany", co.value.slice(0, 40)); check(); });
  check();
  $("#pwShow").addEventListener("click", () => { const show = inp.type === "password"; inp.type = show ? "text" : "password"; $("#pwShow").textContent = show ? "Hide" : "Show"; });
  $("#ppGen").addEventListener("click", () => {
    const a = new Uint32Array(5); crypto.getRandomValues(a);
    const w = [...a.slice(0, 4)].map((x) => PP_WORDS[x % PP_WORDS.length]); const p = `${w.join("-")}-${a[4] % 100}`;
    $("#ppOut").textContent = p; $("#ppCopy").hidden = false; sfx("pop");
  });
  $("#ppCopy").addEventListener("click", () => copyText($("#ppOut").textContent, "Passphrase copied"));
  crack();
}
function check() {
  const pw = $("#pwIn").value, a = analyse(pw), box = $("#pwOut"); const meter = $("#pwMeter");
  if (!pw) { put(box, h("p.muted", "Type something to see how long it would survive.")); meter.style.width = "0"; return; }
  const v = [...PW_VERDICTS].reverse().find((x) => a.bits >= x[0]) || PW_VERDICTS[0]; const g = Math.pow(2, a.bits) / 2;
  meter.style.width = Math.min(100, (a.bits / 90) * 100) + "%"; meter.className = "pw-" + PW_VERDICTS.indexOf(v);
  put(box, h("p.pw-verdict", v[1]), h("p", v[2]),
    h("div.pw-times", [[g / 10, "Guessing at a login page, 10 a second"], [g / 1e4, "Stolen hash, slow algorithm like bcrypt"], [g / 1e10, "Stolen hash, fast algorithm, one GPU rig"]].map(([s, l]) => h("div", h("b", fmtTime(s)), h("span", l)))),
    a.found.length ? h("ul.tight", a.found.map((f) => h("li", f))) : null);
}
// Structure of a password in plain words: "6 letters, 4 digits, 1 symbol".
function shape(pw) {
  const runs = []; for (const ch of pw) { const k = /[a-z]/.test(ch) ? "lowercase letter" : /[A-Z]/.test(ch) ? "capital letter" : /\d/.test(ch) ? "digit" : "symbol";
    if (runs.length && runs[runs.length - 1][0] === k) runs[runs.length - 1][1]++; else runs.push([k, 1]); }
  return runs.map(([k, n]) => `${n} ${k}${n > 1 ? "s" : ""}`).join(", then ");
}
const mask = (pw, show) => [...pw].map((ch, i) => (show.has(i) ? ch : /[a-zA-Z]/.test(ch) ? "_" : /\d/.test(ch) ? "#" : "?"));
function crack() {
  const c = CRACK[((dayNum() * 5) % CRACK.length + CRACK.length) % CRACK.length]; const person = CAST[c.who] || CAST.kevin;
  const key = "crack_" + todayKey(); const solved = store.get(key, false) === true; let tries = Number(store.get(key + "_n", 0)) || 0;
  const av = h("span.av"); av.innerHTML = avatar(person.a, 56);
  const inp = h("input.search", { type: "text", placeholder: "Your guess", autocomplete: "off", spellcheck: "false", "aria-label": "Password guess" });
  const out = h("p", { "aria-live": "polite" }); const clues = h("ol.clues"); const maskEl = h("div.pwmask", { "aria-label": "Password shape" });
  const known = () => { const s = new Set(); if (tries >= 2 || solved) s.add(0); if (tries >= 4 || solved) s.add(c.pw.length - 1); if (solved) [...c.pw].forEach((_, i) => s.add(i)); return s; };
  const showClues = () => {
    put(clues, c.c.slice(0, Math.min(c.c.length, 1 + tries)).map((x) => h("li", x)));
    put(maskEl, mask(c.pw, known()).map((ch) => h("span.pm" + (ch === "_" || ch === "#" || ch === "?" ? "" : ".on"), ch)));
  };
  const go = () => {
    const g = inp.value.trim(); if (!g) return; tries++; store.set(key + "_n", tries);
    if (g === c.pw) { out.textContent = `Cracked! ${c.l}`; if (!store.get(key, false)) { store.set(key, true); bump("crack"); earn(6, "crack"); xp(12, "crack"); } sting("win"); }
    else if (g.toLowerCase() === c.pw.toLowerCase()) { out.textContent = "So close: the letters are right, check the capitals."; sfx("thud"); }
    else {
      const same = [...g].filter((ch, i) => c.pw[i] === ch).length;
      const len = g.length === c.pw.length ? "Right length." : g.length < c.pw.length ? `Too short by ${c.pw.length - g.length}.` : `Too long by ${g.length - c.pw.length}.`;
      const un = []; if (tries < c.c.length) un.push("new clue below"); if (tries === 2) un.push("first character revealed"); if (tries === 4) un.push("last character revealed");
      const unlock = un.length ? " Unlocked: " + un.join(", ") + "." : "";
      out.textContent = `Not it. ${len} ${same} of ${c.pw.length} characters are in the right place.${unlock}`; sfx("thud");
    }
    showClues();
  };
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  showClues();
  put($("#crack"), h("div.crack-who", av, h("div", h("b", person.n), h("span.muted", " · " + person.t), h("p.muted.small", person.q))),
    h("p.small", "You're the red team. Everything you need is in what they overshare. Every wrong guess tells you how close you are."),
    h("p.small", h("b", `${c.pw.length} characters: `), shape(c.pw) + "."), maskEl,
    h("p.muted.small", "_ is a letter, # is a digit, ? is a symbol."), clues,
    h("div.row", inp, h("button.btn.sm", { onclick: go }, "Guess")), out,
    solved ? h("p.muted.small", `Solved today. Lesson: ${c.l}`) : null);
}
