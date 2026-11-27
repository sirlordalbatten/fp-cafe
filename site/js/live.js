// Fast lane for data: polls /api/live (refreshed server-side every few minutes) and merges what it gets
// into the data the pages already use. Every value is validated again here before anything renders it.
import { arr, obj, num, str, safeHref, emit } from "./core.js";
import { patch } from "./data.js";

const CC = /^[A-Z]{2}$/;
const CVE = /^CVE-\d{4}-\d{4,7}$/;
const GHSA = /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/;
const CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g;
const t = (v, n = 200) => str(v, n).replace(CTRL, "");
const url = (v) => (typeof v === "string" && safeHref(v) && v.startsWith("https://") ? v : null);
const isoOk = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : "");
const pairs3 = (v, n = 20) => arr(v).filter((p) => Array.isArray(p) && p.length === 3 && CC.test(p[0]) && CC.test(p[1])).slice(0, n).map((p) => [p[0], p[1], num(p[2], 0, 0, 100)]);
const ccv = (v, n = 40) => arr(v).filter((p) => Array.isArray(p) && p.length === 2 && CC.test(p[0])).slice(0, n).map((p) => [p[0], num(p[1], 0, 0)]);
const named = (v, n = 8) => arr(v).filter((p) => Array.isArray(p) && p.length === 2).slice(0, n).map((p) => [t(p[0], 50), num(p[1], 0, 0, 100)]).filter((p) => p[0]);
const news = (i) => ({ t: t(i?.t, 200), u: url(i?.u), s: t(i?.s, 60), d: isoOk(i?.d), x: "", g: arr(i?.g).map((g) => t(g, 20)).slice(0, 3) });
const EV_KINDS = ["ransom", "c2", "url", "sample"];

const CLEAN = {
  map(d) {
    d = obj(d); const p = obj(d.pairs); const isc = obj(d.isc); const em = obj(d.email);
    return {
      radar: d.radar === true, pairs: { waf: pairs3(p.waf), ddos: pairs3(p.ddos), bot: pairs3(p.bot), l3: pairs3(p.l3) },
      origins: ccv(d.origins, 10), targets: ccv(d.targets, 10),
      series: arr(d.series).filter((x) => Array.isArray(x) && isoOk(x[0])).slice(-96).map((x) => [x[0], num(x[1], 0, 0)]),
      industries: named(d.industries), mitigation: named(d.mitigation), rules: named(d.rules),
      email: d.email ? { cats: named(em.cats), malicious: em.malicious === null ? null : num(em.malicious, 0, 0, 100) } : null,
      c2: d.c2 ? { countries: ccv(obj(d.c2).countries), malware: arr(obj(d.c2).malware).filter((x) => Array.isArray(x) && x.length === 2).slice(0, 10).map((x) => [t(x[0], 40), num(x[1], 0, 0)]) } : null,
      isc: d.isc ? { infocon: ["green", "yellow", "orange", "red"].includes(isc.infocon) ? isc.infocon : "", day: t(isc.day, 10), today: num(isc.today, 0, 0),
        ports: arr(isc.ports).filter((x) => Array.isArray(x) && x.length === 2).slice(0, 10).map((x) => [num(x[0], 0, 0, 65535), num(x[1], 0, 0)]) } : null,
    };
  },
  events(d) {
    return arr(d).filter((e) => EV_KINDS.includes(e?.k) && isoOk(e?.t)).slice(0, 120).map((e) => ({
      k: e.k, t: e.t, cc: CC.test(e.cc) ? e.cc : "", g: t(e.g, 40), s: t(e.s, 40), x: t(e.x, 90), h: /^[a-f0-9]{64}$/.test(e.h || "") ? e.h : "" }));
  },
  cves(d) {
    d = obj(d);
    return {
      kev: arr(d.kev).filter((k) => CVE.test(k?.id)).slice(0, 60).map((k) => ({ id: k.id, vendor: t(k.vendor, 60), product: t(k.product, 80), title: t(k.title, 140), desc: t(k.desc, 420),
        action: t(k.action, 260), added: t(k.added, 10), due: t(k.due, 10), ransomware: false, cwe: arr(k.cwe).map((c) => t(c, 16)).slice(0, 3), refs: [],
        cvss: k.cvss === null ? null : num(k.cvss, null, 0, 10), sev: t(k.sev, 10) })),
      nvd: arr(d.nvd).filter((k) => CVE.test(k?.id)).slice(0, 80).map((k) => ({ id: k.id, published: t(k.published, 10), desc: t(k.desc, 420), cvss: k.cvss === null ? null : num(k.cvss, null, 0, 10),
        sev: t(k.sev, 10), vector: t(k.vector, 160), vendor: t(k.vendor, 60), product: t(k.product, 80), cwe: arr(k.cwe).map((c) => t(c, 16)).slice(0, 3) })),
    };
  },
  news(d) { d = obj(d); return { security: arr(d.security).map(news).filter((i) => i.t && i.u && i.d), gov: arr(d.gov).map(news).filter((i) => i.t && i.u && i.d) }; },
  soc(d) { return arr(d).map(news).filter((i) => i.t && i.u && i.d); },
  ai(d) {
    d = obj(d); const SEV = ["critical", "high", "medium", "low", "unknown"];
    return {
      adv: arr(d.adv).filter((a) => GHSA.test(a?.id) && url(a?.u)?.startsWith("https://github.com/")).slice(0, 30).map((a) => ({ id: a.id, cve: CVE.test(a.cve) ? a.cve : "", t: t(a.t, 200),
        sev: SEV.includes(a.sev) ? a.sev : "unknown", pkg: t(a.pkg, 60), eco: t(a.eco, 10), d: isoOk(a.d), u: a.u })),
      mcp: arr(d.mcp).map((m) => ({ t: t(m?.t, 120), x: t(m?.x, 220), v: t(m?.v, 30), u: url(m?.u), d: isoOk(m?.d), remote: m?.remote === true, pkg: "" })).filter((m) => m.t && m.d).slice(0, 20),
      news: arr(d.news).map(news).filter((i) => i.t && i.u && i.d),
    };
  },
  detect(d) { return arr(d).map((c) => ({ s: t(c?.s, 30), t: t(c?.t, 160), u: url(c?.u), d: isoOk(c?.d) })).filter((c) => c.t && c.u?.startsWith("https://github.com/") && c.d).slice(0, 24); },
};

// newest first, no duplicates by URL (or id), capped
function mergeBy(a, b, key = (x) => x.u, cap = 60) {
  const seen = new Set(); const out = [];
  for (const x of [...arr(b), ...arr(a)].sort((p, q) => (q.d || "").localeCompare(p.d || ""))) { const k = key(x); if (!k || seen.has(k)) continue; seen.add(k); out.push(x); }
  return out.slice(0, cap);
}
const MERGE = {
  cves(v) {
    return patch("cves", (c) => {
      c = c || { generated: null, status: {}, kev: [], nvd: [], scores: {}, epss: {}, stats: { kevTotal: 0, kevAdded7: 0, kevAdded30: 0, ransomware30: 0, lastKev: "", lastEdge: "", lastEdgeId: "", criticalNew7: 0, topVendors30: [] } };
      const have = new Map(c.kev.map((k) => [k.id, k])); const scores = { ...c.scores };
      for (const k of v.kev) {
        if (!have.has(k.id)) { const { cvss, sev, ...rest } = k; have.set(k.id, rest); }
        if (k.cvss != null && !scores[k.id]) scores[k.id] = { cvss: k.cvss, sev: k.sev };
      }
      const kev = [...have.values()].sort((a, b) => b.added.localeCompare(a.added));
      const nvd = new Map(c.nvd.map((n) => [n.id, n])); for (const n of v.nvd) nvd.set(n.id, n);
      const week = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
      const stats = { ...c.stats, kevAdded7: Math.max(c.stats.kevAdded7, kev.filter((k) => k.added >= week).length), lastKev: kev[0]?.added || c.stats.lastKev };
      return { ...c, kev, nvd: [...nvd.values()].sort((a, b) => (b.published || "").localeCompare(a.published || "")), scores, stats };
    });
  },
  news(v) { return patch("news", (n) => n && { ...n, security: mergeBy(n.security, v.security), gov: mergeBy(n.gov, v.gov, undefined, 40) }); },
  soc(v) { return patch("news", (n) => n && { ...n, soc: mergeBy(n.soc, v, undefined, 40) }); },
  async ai(v) {
    await patch("news", (n) => n && { ...n, ai: mergeBy(n.ai, v.news), mcp: mergeBy(n.mcp, v.mcp, (m) => m.t, 40) });
    return patch("advisories", (a) => ({ ...(a || { generated: null, status: {} }), items: mergeBy(a?.items, v.adv, (x) => x.id, 30) }));
  },
};

const state = { at: 0, data: {}, src: {} };
export const live = (f) => state.data[f];
export const liveAt = () => state.at;
export const liveSources = () => state.src;

/** Fetch the given feeds once. Resolves true if anything arrived. */
export async function pull(feeds) {
  try {
    const r = await fetch(`/api/live?f=${feeds.map(encodeURIComponent).join(",")}`, { credentials: "omit", redirect: "error" });
    if (!r.ok || !(r.headers.get("Content-Type") || "").includes("json")) return false;
    const text = await r.text(); if (text.length > 2_000_000) return false;
    const d = JSON.parse(text);
    for (const f of feeds) {
      if (!(f in obj(d.feeds)) || !CLEAN[f]) continue;
      const v = CLEAN[f](d.feeds[f]); state.data[f] = v;
      await MERGE[f]?.(v); emit("live:" + f, v);
    }
    for (const [k, s] of Object.entries(obj(d.src))) if (/^[a-z0-9:]{1,20}$/.test(k)) state.src[k] = { age: num(s?.age, null, 0), ok: s?.ok === true };
    state.at = Date.now(); emit("live", feeds);
    return true;
  } catch (e) { console.info("[live]", String(e.message || e)); return false; }
}
