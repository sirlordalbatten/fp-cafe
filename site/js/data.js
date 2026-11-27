// Loads the JSON the refresh pipeline writes to /data/, validates it again
// (defence in depth: the pipeline already validated it), and exposes helpers.
import { arr, obj, num, str, store, safeHref, emit } from "./core.js";
import { FP_DATA } from "./content/legacy.js";

const CVE = /^CVE-\d{4}-\d{4,7}$/;
const CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g;
const t = (v, n = 300) => str(v, n).replace(CTRL, "");
const url = (v) => (safeHref(v) && v.startsWith("https://") ? v : null);
const isoOk = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);

const cache = {};
const pending = {};

async function fetchJson(name) {
  const r = await fetch(`/data/${name}.json`, { cache: "no-cache", credentials: "omit", redirect: "error" });
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  const ct = r.headers.get("Content-Type") || "";
  if (!ct.includes("json")) throw new Error(`${name}: not JSON`);
  const text = await r.text();
  if (text.length > 3_500_000) throw new Error(`${name}: too big`);
  return JSON.parse(text);
}

const CLEAN = {
  cves(d) {
    const kev = arr(d.kev).filter((k) => CVE.test(k?.id)).map((k) => ({
      id: k.id, vendor: t(k.vendor, 60), product: t(k.product, 80), title: t(k.title, 140), desc: t(k.desc, 420),
      action: t(k.action, 260), added: t(k.added, 10), due: t(k.due, 10), ransomware: k.ransomware === true,
      cwe: arr(k.cwe).map((c) => t(c, 16)).slice(0, 3), refs: arr(k.refs).map(url).filter(Boolean).slice(0, 3),
    }));
    const nvd = arr(d.nvd).filter((k) => CVE.test(k?.id)).map((k) => ({
      id: k.id, published: t(k.published, 10), desc: t(k.desc, 420), cvss: k.cvss === null ? null : num(k.cvss, null, 0, 10),
      sev: t(k.sev, 10), vector: t(k.vector, 160), vendor: t(k.vendor, 60), product: t(k.product, 80), cwe: arr(k.cwe).map((c) => t(c, 16)).slice(0, 3),
    }));
    const scores = {}; for (const [id, s] of Object.entries(obj(d.scores))) if (CVE.test(id)) scores[id] = { cvss: s?.cvss === null ? null : num(s?.cvss, null, 0, 10), sev: t(s?.sev, 10) };
    const epss = {}; for (const [id, e] of Object.entries(obj(d.epss))) if (CVE.test(id) && Array.isArray(e)) epss[id] = [num(e[0], 0, 0, 1), num(e[1], 0, 0, 1)];
    const s = obj(d.stats);
    const stats = {
      kevTotal: num(s.kevTotal, 0), kevAdded7: num(s.kevAdded7, 0), kevAdded30: num(s.kevAdded30, 0), ransomware30: num(s.ransomware30, 0),
      lastKev: t(s.lastKev, 10), lastEdge: t(s.lastEdge, 10), lastEdgeId: CVE.test(s.lastEdgeId) ? s.lastEdgeId : "", criticalNew7: num(s.criticalNew7, 0),
      topVendors30: arr(s.topVendors30).slice(0, 5).map((v) => [t(v?.[0], 60), num(v?.[1], 0)]),
    };
    return { generated: isoOk(d.generated), status: cleanStatus(d.status), kev, nvd, scores, epss, stats };
  },
  news(d) {
    const item = (i) => ({ t: t(i?.t, 200), u: url(i?.u), s: t(i?.s, 60), d: isoOk(i?.d) || "", x: t(i?.x, 260), g: arr(i?.g).map((g) => t(g, 20)).slice(0, 3) });
    const mcp = arr(d.mcp).map((m) => ({ t: t(m?.t, 120), x: t(m?.x, 220), v: t(m?.v, 30), u: url(m?.u), d: isoOk(m?.d) || "", remote: m?.remote === true, pkg: t(m?.pkg, 40) })).filter((m) => m.t);
    return { generated: isoOk(d.generated), status: cleanStatus(d.status), security: arr(d.security).map(item).filter((i) => i.t && i.u), ai: arr(d.ai).map(item).filter((i) => i.t && i.u),
      soc: arr(d.soc).map(item).filter((i) => i.t && i.u), gov: arr(d.gov).map(item).filter((i) => i.t && i.u), mcp };
  },
  malware(d) {
    const fams = {};
    for (const [id, f] of Object.entries(obj(d.families))) {
      if (!/^[a-z]{2,6}\.[a-z0-9_]{2,60}$/.test(id)) continue;
      fams[id] = { updated: t(f?.updated, 10), aliases: arr(f?.aliases).map((a) => t(a, 40)).slice(0, 8), desc: t(f?.desc, 600),
        attribution: arr(f?.attribution).map((a) => t(a, 40)).slice(0, 4), refs: num(f?.refs, 0), mentions: num(f?.mentions, 0), iocs7: num(f?.iocs7, 0),
        news: arr(f?.news).map((n) => ({ t: t(n?.t, 200), u: url(n?.u), s: t(n?.s, 60), d: isoOk(n?.d) || "" })).filter((n) => n.u).slice(0, 3) };
    }
    return { generated: isoOk(d.generated), status: cleanStatus(d.status), families: fams,
      trending: arr(d.trending).filter((x) => /^[a-z]{2,6}\.[a-z0-9_]{2,60}$/.test(x?.id)).map((x) => ({ id: x.id, name: t(x.name, 50), iocs: num(x.iocs, 0) })).slice(0, 20),
      samples: Object.fromEntries(Object.entries(obj(d.samples)).slice(0, 15).map(([k, v]) => [t(k, 50), num(v, 0)])),
      research: arr(d.research).map((i) => ({ t: t(i?.t, 200), u: url(i?.u), s: t(i?.s, 60), d: isoOk(i?.d) || "" })).filter((i) => i.u).slice(0, 30) };
  },
  ransomware(d) {
    const pairs = (v, n) => arr(v).filter((p) => Array.isArray(p) && p.length === 2).slice(0, n).map((p) => [t(p[0], 60), num(p[1], 0, 0)]);
    return { generated: isoOk(d.generated), status: cleanStatus(d.status), total7: num(d.total7, 0), total30: num(d.total30, 0),
      groups7: pairs(d.groups7, 15), groups30: pairs(d.groups30, 20), sectors30: pairs(d.sectors30, 10), countries30: pairs(d.countries30, 40), daily: pairs(d.daily, 31) };
  },
  threatmap(d) {
    const CC = /^[A-Z]{2}$/;
    const c2 = obj(d.c2); const r = obj(d.radar);
    const named = (v) => arr(v).filter((p) => Array.isArray(p) && p.length === 2).slice(0, 8).map((p) => [t(p[0], 50), num(p[1], 0, 0, 100)]).filter((p) => p[0]);
    const ccPairs = (v, n) => arr(v).filter((p) => Array.isArray(p) && p.length === 2 && CC.test(p[0])).slice(0, n).map((p) => [p[0], num(p[1], 0, 0)]);
    return { generated: isoOk(d.generated), status: cleanStatus(d.status), infocon: ["green", "yellow", "orange", "red"].includes(d.infocon) ? d.infocon : "",
      c2: { total: num(c2.total, 0, 0), online: num(c2.online, 0, 0), countries: ccPairs(c2.countries, 40),
        malware: arr(c2.malware).filter((p) => Array.isArray(p) && p.length === 2).slice(0, 8).map((p) => [t(p[0], 40), num(p[1], 0, 0)]) },
      ports: arr(d.ports).filter((p) => Array.isArray(p) && p.length === 4).slice(0, 10).map((p) => p.map((x) => num(x, 0, 0))),
      radar: d.radar ? { pairs: arr(r.pairs).filter((p) => Array.isArray(p) && p.length === 3 && CC.test(p[0]) && CC.test(p[1])).slice(0, 30).map((p) => [p[0], p[1], num(p[2], 0, 0)]),
        pairs3: arr(r.pairs3).filter((p) => Array.isArray(p) && p.length === 3 && CC.test(p[0]) && CC.test(p[1])).slice(0, 20).map((p) => [p[0], p[1], num(p[2], 0, 0)]),
        origins: ccPairs(r.origins, 10), targets: ccPairs(r.targets, 10),
        industries: named(r.industries), mitigation: named(r.mitigation),
        series: arr(r.series).filter((p) => Array.isArray(p) && p.length === 2 && isoOk(p[0] + ":00Z")).slice(-60).map((p) => [p[0], num(p[1], 0, 0)]) } : null,
      daily: arr(d.daily).filter((p) => Array.isArray(p) && p.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(p[0])).slice(-14).map((p) => [p[0], num(p[1], 0, 0)]) };
  },
  certs(d) {
    const P = ["blue", "red", "cloud", "dfir", "grc", "start"], L = ["entry", "mid", "adv"], F = ["lab", "mcq", "mixed"];
    return { generated: isoOk(d.generated), checked: isoOk(d.checked), status: cleanStatus(d.status),
      certs: arr(d.certs).filter((c) => P.includes(c?.path) && L.includes(c.level) && F.includes(c.fmt) && url(c.u)).map((c) => ({
        id: t(c.id, 20), n: t(c.n, 80), by: t(c.by, 40), path: c.path, level: c.level, fmt: c.fmt, focus: t(c.focus, 200),
        tips: arr(c.tips).map((x) => t(x, 160)).slice(0, 4), u: c.u, ok: c.ok !== false })).slice(0, 80),
      news: arr(d.news).map((i) => ({ t: t(i?.t, 200), u: url(i?.u), s: t(i?.s, 60), d: isoOk(i?.d) || "" })).filter((i) => i.u).slice(0, 12) };
  },
  advisories(d) {
    const SEV = ["critical", "high", "medium", "low", "unknown"];
    return { generated: isoOk(d.generated), status: cleanStatus(d.status),
      items: arr(d.items).filter((a) => /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/.test(a?.id) && url(a.u)?.startsWith("https://github.com/")).map((a) => ({
        id: a.id, cve: CVE.test(a.cve) ? a.cve : "", t: t(a.t, 200), sev: SEV.includes(a.sev) ? a.sev : "unknown", pkg: t(a.pkg, 60), eco: t(a.eco, 10), d: isoOk(a.d) || "", u: a.u })).slice(0, 30) };
  },
  contacts(d) {
    const K = ["cert", "police", "reg", "help"];
    const item = (c) => (K.includes(c?.kind) && url(c.u) ? { kind: c.kind, n: t(c.n, 60), what: t(c.what, 200), u: c.u, ok: c.ok !== false } : null);
    const countries = {};
    for (const [cc, v] of Object.entries(obj(d.countries))) {
      if (!/^[A-Z]{2}$/.test(cc)) continue;
      const items = arr(v?.items).map(item).filter(Boolean).slice(0, 6);
      if (items.length) countries[cc] = { name: t(v.name, 60), items };
    }
    return { generated: isoOk(d.generated), checked: isoOk(d.checked), countries, global: arr(d.global).map(item).filter(Boolean).slice(0, 12), guides: arr(d.guides).map(item).filter(Boolean).slice(0, 8) };
  },
  detections(d) {
    const LV = ["informational", "low", "medium", "high", "critical"];
    return { generated: isoOk(d.generated), status: cleanStatus(d.status),
      rules: arr(d.rules).filter((r) => ["sigma", "spl", "kql", "yaral"].includes(r?.lang) && typeof r.query === "string").map((r) => ({
        id: t(r.id, 20), src: t(r.src, 20), srcName: t(r.srcName, 60), lang: r.lang, license: t(r.license, 30), date: t(r.date, 10),
        title: t(r.title, 140), desc: t(r.desc, 500), level: LV.includes(r.level) ? r.level : "medium",
        tech: arr(r.tech).filter((x) => /^T\d{4}(\.\d{3})?$/.test(x)).slice(0, 6), tactics: arr(r.tactics).map((x) => t(x, 30)).slice(0, 4),
        logsource: t(r.logsource, 80), author: t(r.author, 120), fp: arr(r.fp).map((x) => t(x, 220)).slice(0, 3), how: t(r.how, 300),
        query: str(r.query, 4700).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ""),
        url: url(r.url)?.startsWith("https://github.com/") ? r.url : null,
      })) };
  },
};
function cleanStatus(s) { const o = {}; for (const [k, v] of Object.entries(obj(s))) o[t(k, 40)] = t(v, 12); return o; }

/** load("cves") -> cleaned data, or null if the file isn't there yet. Cached per page load. */
export function load(name) {
  if (cache[name] !== undefined) return Promise.resolve(cache[name]);
  if (!pending[name]) {
    pending[name] = fetchJson(name).then(CLEAN[name]).catch((e) => { console.info("[data]", String(e.message || e)); return null; })
      .then((d) => { cache[name] = d; emit("data:" + name, d); return d; });
  }
  return pending[name];
}
export const loaded = (name) => cache[name];

/** Re-fetch everything already loaded. Returns the names whose "generated" time moved on. */
export async function refresh() {
  const names = Object.keys(cache); const changed = [];
  await Promise.all(names.map(async (name) => {
    try {
      const d = CLEAN[name](await fetchJson(name));
      if (d && d.generated && d.generated !== cache[name]?.generated) { cache[name] = d; changed.push(name); emit("data:" + name, d); }
    } catch (e) { console.info("[data refresh]", String(e.message || e)); }
  }));
  return changed;
}

// ---------- CVE helpers ----------
/** One merged list of recent CVEs with a "heat" score. */
export function cveList(c) {
  if (!c) return snapshotCves();
  const map = new Map();
  for (const n of c.nvd) map.set(n.id, { ...n, kev: false, date: n.published });
  for (const k of c.kev) {
    const n = map.get(k.id) || {}; const s = c.scores[k.id] || {};
    map.set(k.id, { ...n, ...k, desc: k.desc || n.desc, kev: true, date: k.added, cvss: n.cvss ?? s.cvss ?? null, sev: n.sev || s.sev || "" });
  }
  const list = [...map.values()];
  for (const v of list) {
    const e = c.epss[v.id]; v.epss = e ? e[0] : null; v.epssPct = e ? e[1] : null;
    if (!v.sev && v.cvss != null) v.sev = v.cvss >= 9 ? "critical" : v.cvss >= 7 ? "high" : v.cvss >= 4 ? "medium" : "low";
    const age = Math.max(0, (Date.now() - Date.parse(v.date || 0)) / 864e5);
    v.heat = Math.round(((v.kev ? 45 : 0) + (v.ransomware ? 15 : 0) + (v.cvss || 6) * 3 + (v.epss || 0) * 30) * Math.exp(-age / 30));
  }
  return list.sort((a, b) => b.heat - a.heat);
}
function snapshotCves() {
  return FP_DATA.trending.map((x) => ({ id: x.id, vendor: "", product: x.product, title: x.nick + ": " + x.type, desc: x.why, action: x.action,
    kev: !!x.kev, sev: x.sev, cvss: null, epss: null, date: "", heat: 50, snapshot: true }));
}
export const classics = () => FP_DATA.hof;

/** Remember what the user has already seen so "new" badges mean something. */
export function newSince(key, ids) {
  const seen = new Set(arr(store.get("seenIds_" + key, [])));
  const fresh = ids.filter((i) => !seen.has(i));
  return { fresh: new Set(fresh), mark: () => store.set("seenIds_" + key, ids.slice(0, 400)) };
}
export function statusLine(d) {
  if (!d || !d.generated) return "Live data hasn't arrived yet. Showing the built-in snapshot.";
  const bad = Object.entries(d.status || {}).filter(([, v]) => v !== "ok" && v !== "no key").map(([k]) => k);
  return bad.length ? `Some sources are catching up: ${bad.slice(0, 4).join(", ")}.` : "";
}
