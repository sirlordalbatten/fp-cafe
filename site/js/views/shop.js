// Café shop: hats for your shift partner, themes, snacks and a sticker capsule machine. Beans can't be bought.
import { $, h, html, put, esc, toast, fmtNum, on } from "../core.js";
import { sfx, sting } from "../audio.js";
import { beans, spend, inv, saveInv, profile } from "../state.js";
import { mascot, hatArt } from "../art.js";
import { SHOP, STICKERS, RARITY } from "../content/legacy.js";

const THEMES = ["matrix", "synth", "amber", "sakura"];
export function applyTheme(t) { document.body.classList.remove(...THEMES.map((x) => "theme-" + x)); if (THEMES.includes(t)) document.body.classList.add("theme-" + t); }

export function stickerSVG(s, locked) {
  const fill = locked ? "#2A3350" : s.c; const words = locked ? ["???"] : s.n.split(" "); const lines = []; let cur = "";
  words.forEach((w) => { if ((cur + " " + w).trim().length > 14) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }); lines.push(cur.trim());
  return `<svg viewBox="0 0 100 100" class="sticker ${locked ? "locked" : ""} r-${s.r}" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#F7F3EA"/><circle cx="50" cy="50" r="41" fill="${fill}"/>
    ${s.r === "l" && !locked ? `<circle cx="50" cy="50" r="41" fill="url(#holo)" opacity=".45"/>` : ""}
    <svg x="35" y="14" width="30" height="30" viewBox="0 0 24 24" class="st-ic">${locked ? "" : `<use href="#i-${esc(s.i)}"/>`}</svg>
    ${lines.slice(0, 3).map((l, i) => `<text x="50" y="${58 + i * 11 - (lines.length - 1) * 3}" text-anchor="middle">${esc(l)}</text>`).join("")}</svg>`;
}
function roll() { const a = new Uint32Array(2); crypto.getRandomValues(a); const r = a[0] % 100; const tier = r < 5 ? "l" : r < 30 ? "r" : "c"; const pool = STICKERS.filter((s) => s.r === tier); return pool[a[1] % pool.length]; }

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Café shop</h1><p>Spend beans on hats for your shift partner, themes, snacks and stickers. Beans can't be bought. Most of them come from taking care of yourself and your queue.</p></div>
  <div class="two">
    <div class="panel wallet"><svg class="ic big"><use href="#i-bean"/></svg><div><span class="muted">your beans</span><div class="bignum" id="shopBeans">0</div></div><div class="buddyprev" id="buddyPrev"></div></div>
    <div class="panel machine"><div class="ph"><h3>Sticker capsule machine</h3><span class="muted small">15 beans · 5% legendary</span></div><div class="mach" id="machine"></div></div>
  </div>
  <div id="shopList"></div>`);
  on("beans", () => { if ($("#shopBeans")) $("#shopBeans").textContent = fmtNum(beans); });
  render(); machine();
}
export function show() { render(); }

function render() {
  if (!$("#shopList")) return;
  $("#shopBeans").textContent = fmtNum(beans);
  const I = inv(); $("#buddyPrev").innerHTML = mascot(profile().buddy, I.hat, "happy", false);
  const cats = [["hat", "Hats for your shift partner"], ["theme", "Themes"], ["snack", "Snacks"]];
  put($("#shopList"), cats.map(([cat, title]) => h("div.panel", h("div.ph", h("h3", title)), h("div.shopgrid", SHOP.filter((s) => s.cat === cat).map((s) => {
    const owned = I.owned.includes(s.id); const active = I.hat === s.id || I.theme === s.id;
    const art = h("span.shopart"); if (cat === "hat") art.innerHTML = `<svg viewBox="0 0 80 80" aria-hidden="true">${hatArt(s.id)}</svg>`; else if (cat === "theme") art.classList.add("sw-" + s.id); else art.append(h("span.snackic", s.n[0]));
    const btn = h("button.btn.sm" + (active ? ".on" : ""), { onclick: () => buy(s) }, cat === "snack" ? `Buy · ${s.c}` : owned ? (active ? "Take off" : "Use") : `Buy · ${s.c}`);
    return h("div.shopitem" + (owned ? ".owned" : ""), art, h("b", s.n), s.d ? h("span.muted.small", s.d) : null, btn);
  })))));
}
function buy(s) {
  const I = inv();
  if (s.cat === "snack") { if (!spend(s.c)) return toast("Not enough beans. Finish a quest or two."); saveInv({ snacks: I.snacks + 1 }); sfx("coin"); toast(`${s.n} served. Your shift partner is delighted.`); render(); return; }
  if (!I.owned.includes(s.id)) { if (!spend(s.c)) return toast("Not enough beans. Finish a quest or two."); I.owned.push(s.id); sting("win"); }
  if (s.cat === "hat") I.hat = I.hat === s.id ? "" : s.id;
  if (s.cat === "theme") { I.theme = I.theme === s.id ? "" : s.id; applyTheme(I.theme); }
  saveInv(I); sfx("pop"); render();
}
let busy = false;
function machine() {
  const out = h("div.mach-out", { "aria-live": "polite" });
  const btn = h("button.btn.primary", { onclick: () => {
    if (busy) return; if (!spend(15)) return toast("You need 15 beans for a capsule.");
    busy = true; sfx("whoosh"); out.textContent = "Rattle rattle…";
    setTimeout(() => { const s = roll(); const I = inv(); const st = { ...I.stickers }; const dupe = !!st[s.id]; st[s.id] = (st[s.id] || 0) + 1; saveInv({ stickers: st });
      out.innerHTML = stickerSVG(s, false); out.append(h("p", h("b", s.n), ` · ${RARITY[s.r][0]}${dupe ? " (duplicate)" : ""}`)); sting(s.r === "l" ? "level" : "win"); busy = false; $("#shopBeans").textContent = fmtNum(beans); }, 900);
  } }, "Insert 15 beans");
  put($("#machine"), btn, out);
}
