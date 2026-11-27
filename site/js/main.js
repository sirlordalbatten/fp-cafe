// Entry point: router, top strip, radio, background, onboarding.
// Each section lives in js/views/<name>.js and is loaded the first time it's opened.
import { $, $$, h, icon, store, on, emit, toast, pad, nextPatchTuesday, ago, RM, countUp, fmtNum, num } from "./core.js";
import { Snd, sfx, setChannel, setVolume, setSfx } from "./audio.js";
import { load, statusLine, refresh } from "./data.js";
import { pull, liveAt } from "./live.js";
import { profile, beans, level, visit, tidy, inv } from "./state.js";
import { initBuddy, setLiveLines } from "./buddy.js";
import { startIncidents } from "./incidents.js";
import { startNudges } from "./views/shift.js";
import { startDesk } from "./views/desk.js";
import { applyTheme } from "./views/shop.js";
import { openOnboarding, meetTheTeam } from "./onboarding.js";

const VIEWS = ["lounge", "underattack", "desk", "brew", "menu", "malware", "ai", "detect", "toolbox", "playbook", "phishsim", "arcade", "boards", "socdle", "tycoon", "pwlab", "breakroom", "shift", "learn", "certs", "shop", "me"];
const mods = {};
let current = null;

async function route() {
  let v = (location.hash || "#lounge").slice(1).split("?")[0];
  if (!VIEWS.includes(v)) v = "lounge";
  if (current && current !== v && mods[current]?.hide) mods[current].hide();
  if (current && current !== v && leaveRebuild.delete(current)) { delete mods[current]; $("#v-" + current).textContent = ""; }
  $$(".view").forEach((x) => x.classList.toggle("on", x.id === "v-" + v));
  $$("#nav a[data-v]").forEach((a) => a.toggleAttribute("aria-current", a.dataset.v === v));
  $$("#nav a[data-v]").forEach((a) => a.classList.toggle("on", a.dataset.v === v));
  document.body.classList.remove("nav-open"); $("#navToggle")?.setAttribute("aria-expanded", "false");
  current = v;
  const sec = $("#v-" + v);
  try {
    if (!mods[v]) {
      sec.append(h("p.loading", "Loading…"));
      mods[v] = await import(`./views/${v}.js`);
      sec.textContent = "";
      await mods[v].mount(sec);
    }
    if (stale.has(v) && mods[v].refresh) { stale.delete(v); mods[v].refresh(); }
    if (current === v && mods[v].show) mods[v].show(sec);
  } catch (e) {
    console.error(e);
    sec.textContent = ""; sec.append(h("div.panel", h("h3", "This section hit a snag."), h("p.muted", "Reload the page. If it keeps happening, the data feed may be updating.")));
  }
  window.scrollTo(0, 0);
  emit("route", v);
}

// ---------- top strip ----------
function tick() {
  const now = new Date(); const ms = nextPatchTuesday(now) - now; const d = Math.floor(ms / 864e5), hr = Math.floor(ms / 36e5) % 24;
  $("#pt").textContent = d > 0 ? `in ${d}d ${hr}h` : `in ${hr}h, brace`;
  const hh = now.getHours(); const night = hh >= 22 || hh < 6;
  document.body.classList.toggle("night", night);
  $("#clock").replaceChildren(h("b", `${pad(hh)}:${pad(now.getMinutes())}`), night ? " night shift" : " day shift");
}
function strip() {
  const p = profile();
  $("#hello").textContent = p.name ? `Hi, ${p.name}` : "Hi there";
  const b = $("#beansChip"); b.textContent = `${fmtNum(beans)} beans`;
  $("#lvlNav").textContent = level().n;
}
on("beans", (x) => { $("#beansChip").textContent = `${fmtNum(x.beans)} beans`; });
on("xp", () => { $("#lvlNav").textContent = level().n; });
on("profile", strip);

async function liveData() {
  const chip = $("#liveChip");
  const c = await load("cves");
  if (liveAt()) {
    const s = Math.round((Date.now() - liveAt()) / 1000);
    chip.textContent = s < 60 ? "live · just now" : `live · ${Math.round(s / 60)} min ago`; chip.classList.add("ok", "pulse");
    chip.title = "Live feeds are checked every few minutes while this tab is open.";
  }
  if (c && c.generated) {
    if (!liveAt()) { chip.textContent = `live · ${ago(c.generated)}`; chip.classList.add("ok"); }
    chip.title = (statusLine(c) || "All sources refreshed normally.") + ` Last refresh ${new Date(c.generated).toLocaleString()}.`;
    const n = c.stats.kevAdded7;
    const wx = n >= 10 ? "Patch storm" : n >= 5 ? "Scattered exploits" : n >= 1 ? "Cloudy, chance of PoC" : "Suspiciously calm";
    $("#weather").replaceChildren(h("b", wx)); $("#weather").title = `${n} new known-exploited CVEs in the last 7 days (CISA KEV)`;
    const top = c.kev[0];
    setLiveLines([
      n ? `CISA added ${n} known-exploited CVEs this week. Patch the edge first.` : "",
      top ? `Newest in KEV: ${top.id} in ${top.vendor} ${top.product}. Do we have that?` : "",
      c.stats.ransomware30 ? `${c.stats.ransomware30} recent KEV entries are tied to ransomware. Backups tested lately?` : "",
    ]);
  } else {
    chip.textContent = "snapshot"; chip.title = "Live data hasn't been generated yet. Run the refresh-data workflow on GitHub.";
    $("#weather").replaceChildren(h("b", "Forecast loading"));
  }
}

// Fast lane: each page names the live feeds it shows. While the tab is visible they are polled every
// one to five minutes; the server caches upstream sources, so this never hammers the original sites.
const VIEW_FEEDS = { lounge: ["map", "events", "cves"], underattack: ["events", "news", "cves"], desk: ["cves"], brew: ["news", "events", "cves"], menu: ["cves"],
  malware: ["events", "news"], phishsim: ["news"], ai: ["ai"], detect: ["detect", "soc"], playbook: ["soc", "cves"], shift: ["cves", "news"], toolbox: ["cves"], me: ["news"] };
const EVERY = { map: 90e3, events: 90e3, cves: 150e3, news: 150e3, soc: 300e3, ai: 240e3, detect: 300e3 };
const lastPull = {};
let pulling = false;
async function livePoll() {
  if (document.visibilityState !== "visible" || pulling) return;
  const view = current;
  const want = (VIEW_FEEDS[view] || ["cves"]).filter((f) => Date.now() - (lastPull[f] || 0) >= EVERY[f]);
  if (!want.length) return;
  pulling = true; want.forEach((f) => { lastPull[f] = Date.now(); });
  const ok = await pull(want); pulling = false;
  if (!ok) return;
  liveData();
  const m = mods[view]; if (!m || view !== current) return;
  if (m.onLive) m.onLive(want); else if (m.refresh) m.refresh();
}

// Keep an all-day tab current: every 15 minutes re-fetch the data files. The view on screen redraws
// itself (if it knows how); data-only views that are mounted but hidden are rebuilt next time they're opened.
let lastRefresh = Date.now();
const REBUILD = new Set(["brew", "menu", "malware", "ai", "detect", "playbook", "phishsim", "certs"]);
async function liveRefresh() {
  if (document.visibilityState !== "visible") return;
  lastRefresh = Date.now();
  const changed = await refresh(); if (!changed.length) return;
  for (const k of Object.keys(lastPull)) lastPull[k] = 0;   // fresh files replaced the cache: lay the live data on top again
  livePoll();
  liveData();
  for (const v of Object.keys(mods)) {
    if (v === current) { if (mods[v].refresh) mods[v].refresh(); else if (REBUILD.has(v)) leaveRebuild.add(v); continue; }
    if (mods[v].refresh) { stale.add(v); continue; }
    if (REBUILD.has(v)) { mods[v].hide?.(); delete mods[v]; $("#v-" + v).textContent = ""; }
  }
}
const stale = new Set(), leaveRebuild = new Set();

// ---------- radio ----------
function radio() {
  const btn = $("#radioBtn"), r = $("#radio");
  btn.addEventListener("click", () => { const open = r.hidden; r.hidden = !open; btn.setAttribute("aria-expanded", String(open)); if (open) sfx("tick"); });
  document.addEventListener("click", (e) => { if (!r.hidden && !r.contains(e.target) && !btn.contains(e.target)) { r.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !r.hidden) { r.hidden = true; btn.focus(); } });
  $$("#radio [data-ch]").forEach((b) => b.addEventListener("change", () => {
    if (!setChannel(b.dataset.ch, b.checked)) b.checked = false;
    btn.classList.toggle("on", Object.values(Snd.on).some(Boolean));
  }));
  $("#sfxOn").checked = Snd.sfx; $("#sfxOn").addEventListener("change", () => { setSfx($("#sfxOn").checked); if (Snd.sfx) sfx("chime"); });
  $("#vol").value = Math.round(Snd.vol * 100); $("#vol").addEventListener("input", () => setVolume($("#vol").value / 100));
  $("#skyOn").checked = store.get("sky", true) !== false && !RM;
  $("#skyOn").addEventListener("change", () => { store.set("sky", $("#skyOn").checked); sky(); });
  document.addEventListener("click", (e) => { if (e.target.closest("#nav a, .seg button, .tabs button")) sfx("tick"); }, true);
}

// ---------- background: slow city lights with occasional rain ----------
let skyRaf = 0;
function sky() {
  const c = $("#sky"); const ctx = c.getContext("2d"); cancelAnimationFrame(skyRaf);
  const onSky = store.get("sky", true) !== false && !RM;
  c.classList.toggle("on", onSky); if (!onSky) { ctx.clearRect(0, 0, c.width, c.height); return; }
  const fit = () => { c.width = innerWidth; c.height = innerHeight; }; fit(); addEventListener("resize", fit);
  const cols = () => { const s = getComputedStyle(document.body); return ["--sodium", "--phos", "--alarm", "--hof", "--sky"].map((v) => s.getPropertyValue(v).trim() || "#F5B841"); };
  let palette = cols(); on("inv", () => { palette = cols(); });
  const lights = Array.from({ length: 26 }, () => ({ x: Math.random(), y: 0.55 + Math.random() * 0.45, r: 20 + Math.random() * 60, c: Math.floor(Math.random() * 5), p: Math.random() * 6 }));
  const drops = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: 0.15 + Math.random() * 0.25, l: 8 + Math.random() * 14 }));
  let last = 0;
  const loop = (t) => {
    skyRaf = requestAnimationFrame(loop);
    if (document.visibilityState !== "visible" || t - last < 66) return; const dt = (t - last) / 1000; last = t;
    const W = c.width, H = c.height; ctx.clearRect(0, 0, W, H);
    for (const L of lights) {
      const a = 0.05 + 0.04 * Math.sin(t / 1600 + L.p);
      const g = ctx.createRadialGradient(L.x * W, L.y * H, 0, L.x * W, L.y * H, L.r);
      g.addColorStop(0, palette[L.c] + Math.round(a * 255).toString(16).padStart(2, "0")); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(L.x * W - L.r, L.y * H - L.r, L.r * 2, L.r * 2);
    }
    if (Snd.on.rain || document.body.classList.contains("night")) {
      ctx.strokeStyle = "rgba(160,180,220,.10)"; ctx.lineWidth = 1; ctx.beginPath();
      for (const d of drops) { d.y += d.v * dt; if (d.y > 1) { d.y = -0.05; d.x = Math.random(); } ctx.moveTo(d.x * W, d.y * H); ctx.lineTo(d.x * W - 2, d.y * H + d.l); }
      ctx.stroke();
    }
  };
  skyRaf = requestAnimationFrame(loop);
}

// ---------- boot ----------
function boot() {
  tidy();
  const v = visit();
  applyTheme(inv().theme);
  strip(); tick(); setInterval(tick, 15000);
  radio(); sky();
  $("main").addEventListener("click", (e) => { if (document.body.classList.contains("nav-open") && !e.target.closest("#navToggle")) { document.body.classList.remove("nav-open"); $("#navToggle").setAttribute("aria-expanded", "false"); } });
  $("#navToggle").addEventListener("click", () => { const open = !document.body.classList.contains("nav-open"); document.body.classList.toggle("nav-open", open); $("#navToggle").setAttribute("aria-expanded", String(open)); });
  initBuddy();
  liveData(); setInterval(() => { if (document.visibilityState === "visible") liveData(); }, 30e3);
  setInterval(livePoll, 15e3); setTimeout(livePoll, 1200);
  setInterval(liveRefresh, 15 * 60e3);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "visible") return; livePoll(); if (Date.now() - lastRefresh > 15 * 60e3) liveRefresh(); });
  load("news").then((n) => { if (n && n.ai[0] && store.get("aiSeen", "") !== n.ai[0].u) $("#aiNew").hidden = false; });
  window.addEventListener("hashchange", () => { route(); setTimeout(livePoll, 400); });
  route();
  startIncidents();
  startNudges();
  load("cves").then(startDesk);
  if (!profile().onboarded) setTimeout(openOnboarding, 700);
  else if (!store.get("teamSeen", false)) setTimeout(meetTheTeam, 900);
  if (v.streak >= 2 && store.get("streakToast", "") !== new Date().toDateString()) { store.set("streakToast", new Date().toDateString()); toast(`${v.streak}-day visit streak. The coffee's on us.`); }
}
boot();
