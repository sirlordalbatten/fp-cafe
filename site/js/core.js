// Shared helpers. Security rule for the whole site:
//   anything that came from the network or the user goes into the page
//   through textContent (h()) or esc(). Never raw innerHTML.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Build DOM safely: h("a.btn", {href, onclick}, "text", child) */
export function h(sel, attrs, ...kids) {
  const [tag, ...cls] = sel.split(".");
  const el = document.createElement(tag || "div");
  if (cls.length) el.className = cls.join(" ");
  if (attrs && (typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className += (el.className ? " " : "") + v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k === "href") { if (safeHref(v)) el.setAttribute("href", v); }
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}
export function safeHref(u) {
  return typeof u === "string" && (/^https:\/\/[^\s"'<>\\]+$/.test(u) || /^#[a-z0-9-]*$/i.test(u));
}
/** External link that can't touch our page or leak where the click came from. */
export const ext = (u, text, cls = "link") => safeHref(u) ? h("a", { class: cls, href: u, target: "_blank", rel: "noopener noreferrer", referrerpolicy: "no-referrer" }, text) : h("span", text);
export const icon = (name, cls = "ic") => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("class", cls); s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", "#i-" + name); s.append(u); return s;
};
/** Trusted, static markup written in this repo (never data). */
export function html(el, markup) { el.innerHTML = markup; widths(el); return el; }
/** Width/height for bars without inline style attributes (CSP style-src 'self'). */
export function widths(root = document) {
  for (const el of root.querySelectorAll("[data-w]")) el.style.width = Math.max(0, Math.min(100, +el.dataset.w || 0)) + "%";
  for (const el of root.querySelectorAll("[data-c]")) el.style.setProperty("--c", el.dataset.c);
}
export function clear(el) { while (el.firstChild) el.firstChild.remove(); return el; }
export function put(el, ...kids) { clear(el).append(...kids.flat(Infinity).filter(Boolean)); widths(el); return el; }

// ---------- storage (all keys prefixed, all reads validated by callers) ----------
export const store = {
  get(k, d) { try { const v = localStorage.getItem("fpc2_" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("fpc2_" + k, JSON.stringify(v)); } catch { /* full or blocked */ } },
  del(k) { try { localStorage.removeItem("fpc2_" + k); } catch { /* ignore */ } },
  keys() { try { return Object.keys(localStorage).filter((k) => k.startsWith("fpc2_")).map((k) => k.slice(5)); } catch { return []; } },
};
export const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const arr = (v) => (Array.isArray(v) ? v : []);
export const num = (v, d = 0, lo = -Infinity, hi = Infinity) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);
export const str = (v, n = 200, d = "") => (typeof v === "string" ? v.slice(0, n) : d);

// ---------- events ----------
const bus = new EventTarget();
export const on = (ev, fn) => bus.addEventListener(ev, (e) => fn(e.detail));
export const emit = (ev, detail) => bus.dispatchEvent(new CustomEvent(ev, { detail }));

// ---------- time ----------
export const pad = (n) => String(n).padStart(2, "0");
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dayNum = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5);
export function ago(iso) {
  const t = Date.parse(iso); if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400); return d === 1 ? "yesterday" : `${d} days ago`;
}
export const daysSince = (iso) => { const t = Date.parse(iso); return t ? Math.floor((Date.now() - t) / 864e5) : null; };
export function fmtDur(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; }
export function nextPatchTuesday(now = new Date()) {
  for (let add = 0; add < 3; add++) {
    const y = now.getUTCFullYear(), m = now.getUTCMonth() + add;
    const first = new Date(Date.UTC(y, m, 1)); const off = (2 - first.getUTCDay() + 7) % 7;
    const pt = new Date(Date.UTC(y, m, 1 + off + 7, 17, 0, 0)); if (pt > now) return pt;
  }
}

// ---------- randomness ----------
export function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function seedFrom(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export const rnd = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; };
export const pick = (a, r = rnd) => a[Math.floor(r() * a.length)];
export const pickDay = (a, salt = 0) => a[(((dayNum() * 7 + salt) % a.length) + a.length) % a.length];
export function shuffle(a, r = rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/**
 * "No repeats" picker: remembers the last N choices per pool in localStorage
 * and only picks something you haven't seen recently.
 */
export function fresh(poolName, items, keyOf = (x) => x, memory = 0.7) {
  if (!items.length) return null;
  const seen = arr(store.get("seen_" + poolName, []));
  const cap = Math.max(1, Math.floor(items.length * memory));
  const avail = items.filter((x) => !seen.includes(keyOf(x)));
  const choice = pick(avail.length ? avail : items);
  store.set("seen_" + poolName, [keyOf(choice), ...seen.filter((k) => k !== keyOf(choice))].slice(0, cap));
  return choice;
}

// ---------- UI feedback ----------
export function toast(msg, kind = "") {
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.className = "toast show " + kind;
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 4200);
}
export async function copyText(t, label = "Copied") {
  try { await navigator.clipboard.writeText(t); toast(label); } catch { toast("Copy blocked here. Select the text and copy it manually."); }
}
export function typeText(el, text) {
  if (!el) return; clearInterval(el._tt); text = String(text).replace(/\s{2,}/g, " ").trim();
  if (RM) { el.textContent = text; return; }
  let i = 0; el.textContent = ""; el.classList.add("typing");
  el._tt = setInterval(() => { i += 1 + (text[i] === " " ? 1 : 0); el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(el._tt); el.classList.remove("typing"); } }, 24);
}
export function bumpEl(el) { if (!el || RM) return; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
export function countUp(el, to, ms = 700) {
  if (!el) return; const from = +el.dataset.v || 0; el.dataset.v = to;
  if (RM || from === to) { el.textContent = fmtNum(to); return; }
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); el.textContent = fmtNum(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
export function fmtNum(n) {
  n = +n || 0; const a = Math.abs(n);
  if (a >= 1e15) return (n / 1e15).toFixed(2) + "Q"; if (a >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (a >= 1e9) return (n / 1e9).toFixed(2) + "B"; if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (a >= 1e4) return (n / 1e3).toFixed(1) + "k"; return String(Math.round(n));
}
export const plural = (n, w, p = w + "s") => `${n} ${n === 1 ? w : p}`;

/** Modal with focus handling. Returns close(). */
export function modal(content, { label = "Dialog", wide = false, onClose } = {}) {
  const prev = document.activeElement;
  const box = h("div.box" + (wide ? ".wide" : ""), { role: "document" });
  const close = () => { wrap.remove(); document.removeEventListener("keydown", key); if (prev && prev.focus) prev.focus(); onClose && onClose(); };
  const x = h("button.xbtn", { "aria-label": "Close", onclick: close }, icon("x"));
  box.append(x, ...[content].flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false && c !== ""));
  const wrap = h("div.modal.on", { role: "dialog", "aria-modal": "true", "aria-label": label, onclick: (e) => { if (e.target === wrap) close(); } }, box);
  const key = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", key);
  document.body.append(wrap); widths(wrap);
  setTimeout(() => (box.querySelector("button:not(.xbtn),input,textarea,a") || x).focus(), 30);
  return close;
}
export const visible = () => document.visibilityState === "visible";
