// Small shared pieces for "happening now" panels fed by /api/live.
import { h, ago } from "./core.js";
import { live, liveAt } from "./live.js";

const KIND = { ransom: "Ransomware claim", c2: "New C2 server", url: "Malware URL", sample: "Malware sample" };
let regions = null;
export function country(cc) {
  if (!cc) return "";
  try { regions = regions || new Intl.DisplayNames(["en"], { type: "region" }); return regions.of(cc) || cc; } catch { return cc; }
}
function text(e) {
  const where = e.cc ? ` in ${country(e.cc)}` : "";
  if (e.k === "ransom") return [h("b", e.g), ` claimed a victim${where}`, e.s ? ` · ${e.s}` : ""];
  if (e.k === "c2") return [h("b", e.g), ` C2 server online${where}`];
  if (e.k === "url") return [h("b", e.g || "Malware"), " download URL", e.x ? [" ", h("code", e.x)] : ""];
  return [h("b", e.g || "Unknown family"), " sample", e.s ? ` (${e.s})` : ""];
}
/** List items for the newest live events of the given kinds. */
export function eventItems(kinds, n = 8) {
  const ev = (live("events") || []).filter((e) => kinds.includes(e.k)).slice(0, n);
  return ev.map((e) => h("li.evi.k-" + e.k, h("span.evk", KIND[e.k]), h("span.evx", text(e)), h("time", { title: new Date(e.t).toLocaleString() }, ago(e.t))));
}
export function liveStamp() {
  return liveAt() ? `live · checked ${ago(new Date(liveAt()).toISOString())}` : "connecting to the live feed";
}
