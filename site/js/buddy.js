// Your shift partner: one of six analyst characters, with their own voice, who reacts to what happens on the site.
import { $, on, typeText, pick, RM, html, bumpEl } from "./core.js";
import { mascot } from "./art.js";
import { profile, inv, todayMood, buddyInfo } from "./state.js";
import { sfx } from "./audio.js";
import { SAY_DAY, SAY_NIGHT, SAY_GENTLE, SAY_ROLE, CHAR_LINES } from "./content/legacy.js";

let reactUntil = 0;
let clicks = [];
let live = [];   // context lines built from live data (set by lounge)

export function setLiveLines(lines) { live = lines.filter(Boolean); }

function moodState() {
  const m = todayMood();
  const h = new Date().getHours();
  if (m !== null && m >= 3) return "sad";
  if (h >= 2 && h < 5) return "sleepy";
  if (m !== null && m <= 1) return "happy";
  return "ok";
}

export function drawBuddy(el = $("#buddy")) {
  if (!el) return;
  html(el, mascot(profile().buddy, inv().hat, moodState(), Date.now() < reactUntil));
  el.setAttribute("aria-label", `Pet ${buddyInfo().n}`);
}

let talkT = 0;
export function say(text, el = $("#say")) {
  if (!el) return; typeText(el, text);
  const b = $("#buddy"); if (!b || !text) return;
  b.classList.add("talking", "typing"); clearTimeout(talkT);
  talkT = setTimeout(() => b.classList.remove("talking", "typing"), Math.min(4200, 600 + text.length * 32));
}

export function chatter() {
  const p = profile(); const night = document.body.classList.contains("night");
  let pool = p.humor === "gentle" ? SAY_GENTLE : night ? SAY_NIGHT : SAY_DAY;
  const mine = CHAR_LINES[p.buddy] || [];
  pool = pool.concat(SAY_ROLE[p.role] || [], live, live, mine, mine, mine);
  if ((todayMood() ?? 0) >= 3) pool = SAY_GENTLE.concat(["Rough day? Take a real break. The queue will still be there, sadly."]);
  say(pick(pool));
}

export function react(kind, text) {
  reactUntil = Date.now() + 1500; drawBuddy();
  const el = $("#buddy");
  if (el && !RM) { el.classList.remove("react-jump", "react-spin"); void el.offsetWidth; el.classList.add(kind === "spin" ? "react-spin" : "react-jump"); }
  if (text) say(text);
  setTimeout(drawBuddy, 1550);
}

export function initBuddy() {
  const el = $("#buddy"); if (!el) return;
  drawBuddy(el);
  el.addEventListener("click", () => {
    const now = Date.now(); clicks = clicks.filter((t) => now - t < 2500); clicks.push(now); sfx("pop");
    if (clicks.length >= 5) { clicks = []; react("spin", "Alright, I'm listening. Want to run a drill from the Lounge?"); }
    else react("jump", clicks.length === 1 ? pick(["Need a second pair of eyes?", "On it.", "Queue's moving. Keep going.", "Shout if something looks off.", "Coffee after this one."]) : "");
  });
  window.addEventListener("pointermove", (e) => {
    if (RM) return; const pu = el.querySelector(".m-pupils"); if (!pu) return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.55), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
    pu.style.transform = `translate(${((dx / d) * 2.6 * k).toFixed(2)}px,${((dy / d) * 2.2 * k).toFixed(2)}px)`;
  }, { passive: true });

  on("levelup", (l) => react("spin", `Level up: ${l.title}. Nice work.`));
  on("game:end", (g) => g.best ? react("spin", `Personal best in ${g.label}: ${g.score}.`) : null);
  on("ciso", (c) => c.angry && say("Psst. The CISO is walking over. Look busy. Or helpful. Ideally helpful."));
  on("inv", () => drawBuddy());
  on("profile", () => drawBuddy());
  on("mood", () => drawBuddy());
  on("beans", (b) => { if (b.delta > 0) bumpEl($("#beansChip")); });
  setInterval(() => { if (document.visibilityState === "visible" && location.hash.replace("#", "") === "lounge") chatter(); }, 90000);
  setInterval(drawBuddy, 5 * 60e3);
  chatter();
}
