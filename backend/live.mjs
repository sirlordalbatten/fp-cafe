// FP Café live data: small, cached snapshots of public threat feeds, served at GET /api/live?f=map,events.
//
// Why this exists: the 3-hourly pipeline commits data files, and every commit is a Pages build (500 a month on
// the free plan). This endpoint keeps the fast-moving parts fresh in minutes without any builds.
//
// Safety in short:
//  * Upstream URLs are fixed in this file. Nothing from the request ever becomes part of an upstream URL.
//  * Every value is re-validated and trimmed before it is cached or returned (strings, country codes, CVE IDs,
//    https URLs on an allow-listed host). Ransomware victim names, domains and descriptions are never read out.
//  * Each request refreshes at most a few stale sources (Workers free plan: 10 ms CPU per request), everything
//    else comes from the cache (D1 if bound, otherwise memory). Failed sources back off and keep their last data.

const CTRL = /[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g;
const CC = /^[A-Z]{2}$/;
const CVE = /^CVE-\d{4}-\d{4,7}$/;
const GHSA = /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/;
const GROUP = /^[a-z0-9][a-z0-9 ._-]{0,40}$/;
const FAMILY = /^[A-Za-z0-9][A-Za-z0-9 ._()-]{0,40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_BODY = 4_000_000;
const MIN = 60e3;

// ---------- cleaning ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
export function decode(s) {
  return String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d{1,7});/g, (_, d) => safeChar(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
const safeChar = (c) => (c > 31 && c < 0x110000 && !(c >= 0xd800 && c < 0xe000) ? String.fromCodePoint(c) : " ");
export function clean(v, n = 200) {
  if (typeof v !== "string" && typeof v !== "number") return "";
  // decode twice: feeds often double-escape (&amp;lt;b&amp;gt;); tags are removed after each decode
  let s = String(v);
  for (let i = 0; i < 2; i++) s = decode(s).replace(/<[^>]*>/g, " ");
  return s.replace(/[<>]/g, " ").replace(CTRL, " ").replace(/\s+/g, " ").trim().slice(0, n);
}
export function safeUrl(u, hosts) {
  try {
    const x = new URL(String(u).trim());
    if (x.protocol !== "https:" || x.username || x.password) return "";
    const h = x.hostname.toLowerCase();
    if (hosts && !hosts.some((d) => h === d || h.endsWith("." + d))) return "";
    return x.href.length <= 500 ? x.href : "";
  } catch { return ""; }
}
export function iso(v) {
  if (v === null || v === undefined || v === "") return "";
  let s = String(v).trim().replace(" UTC", "Z");
  if (/^\d{4}-\d{2}-\d{2} \d/.test(s)) s = s.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(s)) s += "Z";               // no zone given: the feeds mean UTC
  const t = Date.parse(s);
  return Number.isFinite(t) && t > Date.UTC(2000, 0, 1) && t < Date.now() + 2 * 864e5 ? new Date(t).toISOString() : "";
}
const num = (v, lo = 0, hi = 1e12) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n * 1000) / 1000 : null; };
const cc = (v) => { const s = String(v || "").trim().toUpperCase(); return CC.test(s) && s !== "XX" ? s : ""; };
const defang = (h) => String(h).replace(/\./g, "[.]");
const byDate = (a, b) => (b.d || b.t || "").localeCompare(a.d || a.t || "");
const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);

// ---------- fetching ----------
// fx(url, opts) -> parsed JSON or text; injected so tests never touch the network.
export function makeFetcher(fetchImpl = fetch) {
  const go = async (url, { headers = {}, method = "GET", body, as = "json", timeout = 12000 } = {}) => {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetchImpl(url, { method, body, headers: { "User-Agent": "fp-cafe-live/1.0 (+https://fp-cafe.pages.dev)", Accept: as === "json" ? "application/json" : "*/*", ...headers }, redirect: "follow", signal: ctl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const len = +(r.headers?.get?.("content-length") || 0); if (len > MAX_BODY) throw new Error("too big");
      const text = await r.text(); if (text.length > MAX_BODY) throw new Error("too big");
      return as === "json" ? JSON.parse(text) : text;
    } finally { clearTimeout(tm); }
  };
  return go;
}

// ---------- RSS / Atom ----------
export function parseFeed(xml, source, hosts, max = 12) {
  const out = [];
  for (const m of String(xml).matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)) {
    const it = m[0];
    const title = clean((it.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 220);
    let link = (it.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || it.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?![^<]*<\/link>)/i) || [])[1];
    if (!link) link = (it.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1];
    const u = safeUrl(decode(link || "").trim(), hosts);
    const d = iso(decode((it.match(/<(pubDate|published|updated|dc:date)[^>]*>([\s\S]*?)<\/\1>/i) || [])[2] || ""));
    if (title && u && d) out.push({ t: title, u, s: source, d });
    if (out.length >= max) break;
  }
  return out;
}
const SEC_TAGS = [["exploited", /exploit|zero[- ]day|0-day|in the wild|actively/i], ["ransomware", /ransom/i], ["breach", /breach|leak|stolen|exposed/i],
  ["patch", /patch|update|fix(es|ed)?\b|advisory/i], ["phishing", /phish|lure|scam|clickfix/i]];
const GOV_TAGS = [["ransomware", /ransom|#stopransomware/i], ["ics", /\bics\b|industrial|scada|\bot\b/i], ["exploited", /exploit|zero-day|0-day|actively/i], ["advisory", /advisory|alert|guidance/i]];
const tag = (items, rules) => items.map((i) => ({ ...i, g: rules.filter(([, rx]) => rx.test(i.t)).map(([k]) => k) }));

// [key, source name, url, allowed link hosts, group, ttl minutes]
export const FEEDS_RSS = [
  ["news:isc", "SANS ISC", "https://isc.sans.edu/rssfeed_full.xml", ["isc.sans.edu", "sans.edu"], "security", 15],
  ["news:bleeping", "BleepingComputer", "https://www.bleepingcomputer.com/feed/", ["bleepingcomputer.com"], "security", 10],
  ["news:thn", "The Hacker News", "https://feeds.feedburner.com/TheHackersNews", ["thehackernews.com"], "security", 10],
  ["news:record", "The Record", "https://therecord.media/feed", ["therecord.media"], "security", 15],
  ["news:krebs", "Krebs on Security", "https://krebsonsecurity.com/feed/", ["krebsonsecurity.com"], "security", 30],
  ["news:dark", "Dark Reading", "https://www.darkreading.com/rss.xml", ["darkreading.com"], "security", 15],
  ["news:cisa", "CISA", "https://www.cisa.gov/cybersecurity-advisories/all.xml", ["cisa.gov"], "gov", 15],
  ["news:ncsc", "NCSC UK", "https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml", ["ncsc.gov.uk"], "gov", 30],
  ["news:simon", "Simon Willison", "https://simonwillison.net/atom/everything/", ["simonwillison.net"], "ai", 30],
  ["news:etr", "Embrace The Red", "https://embracethered.com/blog/index.xml", ["embracethered.com"], "ai", 60],
  ["news:hf", "Hugging Face", "https://huggingface.co/blog/feed.xml", ["huggingface.co"], "ai", 60],
  ["news:redcanary", "Red Canary", "https://redcanary.com/feed/", ["redcanary.com"], "soc", 60],
  ["news:huntress", "Huntress", "https://www.huntress.com/blog/rss.xml", ["huntress.com"], "soc", 60],
  ["news:dfir", "The DFIR Report", "https://thedfirreport.com/feed/", ["thedfirreport.com"], "soc", 60],
];

// ---------- Cloudflare Radar ----------
const RADAR = "https://api.cloudflare.com/client/v4/radar";
export function radarWindow(now) {
  const end = Math.floor(now / (15 * MIN)) * 15 * MIN; const start = end - 2 * 60 * MIN;
  const f = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z");
  return `dateStart=${f(start)}&dateEnd=${f(end)}`;
}
async function radar(fx, env, path, now, windowed = true) {
  const headers = { Authorization: "Bearer " + env.CLOUDFLARE_RADAR_TOKEN };
  const sep = path.includes("?") ? "&" : "?";
  try {
    return (await fx(`${RADAR}/${path}${sep}format=json&${windowed ? radarWindow(now) : "dateRange=1d"}`, { headers })).result;
  } catch (e) {
    if (!windowed) throw e;
    return (await fx(`${RADAR}/${path}${sep}format=json&dateRange=1d`, { headers })).result;  // older data beats none
  }
}
const pairs = (rows, n) => (Array.isArray(rows) ? rows : []).map((p) => [cc(p.originCountryAlpha2), cc(p.targetCountryAlpha2), num(p.value, 0, 100)])
  .filter(([o, t, v]) => o && t && v !== null).slice(0, n);
const locs = (rows, key) => (Array.isArray(rows) ? rows : []).map((p) => [cc(p[key]), num(p.value, 0, 100)]).filter(([c, v]) => c && v !== null).slice(0, 10);
const NAME = /^[A-Za-z0-9_ &,./()'+-]{1,50}$/;
const summ = (o) => Object.entries(o || {}).map(([k, v]) => [clean(k, 50), num(v, 0, 100)]).filter(([k, v]) => NAME.test(k) && v !== null && k.toLowerCase() !== "other").sort((a, b) => b[1] - a[1]).slice(0, 8);
async function radarDim(fx, env, base, dim, now) {
  try { return (await radar(fx, env, `${base}/${dim.toUpperCase()}`, now, false)).summary_0; }
  catch { return (await radar(fx, env, `${base}/${dim.toLowerCase()}`, now, false)).summary_0; }
}

// ---------- NVD ----------
const NVD = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const nvdDate = (t) => new Date(t).toISOString().replace("Z", "");
function nvdItem(v) {
  const c = v?.cve || {}; const id = String(c.id || "");
  if (!CVE.test(id) || /rejected/i.test(c.vulnStatus || "")) return null;
  const desc = (c.descriptions || []).find((d) => d.lang === "en")?.value || "";
  let cvss = null, sev = "", vector = "";
  for (const k of ["cvssMetricV40", "cvssMetricV31", "cvssMetricV30"]) {
    const arr = [...(c.metrics?.[k] || [])].sort((a, b) => (a.type === "Primary" ? 0 : 1) - (b.type === "Primary" ? 0 : 1));
    if (arr.length) { const d = arr[0].cvssData || {}; cvss = num(d.baseScore, 0, 10); sev = String(d.baseSeverity || "").toLowerCase(); vector = clean(d.vectorString, 160); break; }
  }
  let vendor = "", product = "";
  outer: for (const cfg of c.configurations || []) for (const node of cfg.nodes || []) for (const m of node.cpeMatch || []) {
    const p = String(m.criteria || "").split(":"); if (p.length > 5 && p[3] !== "*" && p[3] !== "-") { vendor = p[3]; product = p[4]; break outer; }
  }
  const cwe = [...new Set((c.weaknesses || []).flatMap((w) => (w.description || []).map((d) => String(d.value))).filter((x) => /^CWE-\d+$/.test(x)))].slice(0, 3);
  return { id, published: iso(c.published).slice(0, 10), desc: clean(desc, 420), cvss, sev: ["critical", "high", "medium", "low", "none"].includes(sev) ? sev : "", vector,
    vendor: clean(vendor.replace(/_/g, " "), 60), product: clean(product.replace(/_/g, " "), 80), cwe,
    kev: c.cisaExploitAdd ? { added: iso(c.cisaExploitAdd).slice(0, 10), due: iso(c.cisaActionDue).slice(0, 10), title: clean(c.cisaVulnerabilityName, 140), action: clean(c.cisaRequiredAction, 260) } : null };
}
// NVD lists oldest first, so ask for the count, then the newest page.
async function nvdNewest(fx, env, query, n) {
  const headers = env.NVD_API_KEY ? { apiKey: env.NVD_API_KEY } : {};
  const first = await fx(`${NVD}?${query}&resultsPerPage=1`, { headers, timeout: 20000 });
  const total = +first.totalResults || 0; if (!total) return [];
  const raw = total <= 1 ? first : await fx(`${NVD}?${query}&resultsPerPage=${n}&startIndex=${Math.max(0, total - n)}`, { headers, timeout: 20000 });
  return (raw.vulnerabilities || []).map(nvdItem).filter(Boolean);
}

// ---------- GitHub ----------
const GH = "https://api.github.com";
const ghHeaders = (env) => ({ Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(env.GITHUB_TOKEN ? { Authorization: "Bearer " + env.GITHUB_TOKEN } : {}) });
export const AI_PKGS = { pip: ["langchain", "langchain-core", "langchain-community", "llama-index", "transformers", "vllm", "mlflow", "gradio", "litellm", "langflow", "open-webui", "torch", "keras", "ray", "jupyter-server", "mcp"],
  npm: ["@modelcontextprotocol/sdk", "ai", "langchain", "@langchain/core"], go: ["github.com/ollama/ollama"] };
const DET_REPOS = [["SigmaHQ", "SigmaHQ/sigma", "rules"], ["Elastic", "elastic/detection-rules", "rules"], ["Splunk", "splunk/security_content", "detections"]];

// ---------- sources ----------
// cost: 1 = small JSON, 2 = big parse. ttl in ms. need: env var that must be set.
export const SOURCES = {
  // Radar only breaks origin -> target pairs down for DDoS (layer 7 and layer 3). WAF and bot filters return
  // empty lists, so exploit and bot activity is shown as totals (radar:mix), not as arcs.
  "radar:pairs": { ttl: 5 * MIN, cost: 1, need: "CLOUDFLARE_RADAR_TOKEN", async run(fx, env, now) {
    const q = "limit=20&limitDirection=ORIGIN&limitPerLocation=3";
    const ddos = await radar(fx, env, `attacks/layer7/top/attacks?${q}`, now).catch(() => null);
    const l3 = await radar(fx, env, `attacks/layer3/top/attacks?limit=16&limitDirection=ORIGIN&limitPerLocation=3`, now).catch(() => null);
    const out = { waf: [], ddos: pairs(ddos?.top_0, 20), bot: [], l3: pairs(l3?.top_0, 20) };
    if (!out.ddos.length && !out.l3.length) throw new Error("no radar pairs");
    return out;
  } },
  "radar:loc": { ttl: 5 * MIN, cost: 1, need: "CLOUDFLARE_RADAR_TOKEN", async run(fx, env, now) {
    const [o, t] = await Promise.all([radar(fx, env, "attacks/layer7/top/locations/origin?limit=10", now), radar(fx, env, "attacks/layer7/top/locations/target?limit=10", now)]);
    return { origins: locs(o?.top_0, "originCountryAlpha2"), targets: locs(t?.top_0, "targetCountryAlpha2") };
  } },
  "radar:series": { ttl: 10 * MIN, cost: 1, need: "CLOUDFLARE_RADAR_TOKEN", async run(fx, env, now) {
    const s = (await radar(fx, env, "attacks/layer7/timeseries?aggInterval=15m", now, false)).serie_0 || {};
    const ts = Array.isArray(s.timestamps) ? s.timestamps : []; const vs = Array.isArray(s.values) ? s.values : [];
    return ts.map((x, i) => [iso(x), num(vs[i], 0, 1e9)]).filter(([x, v]) => x && v !== null).slice(-96);
  } },
  "radar:mix": { ttl: 20 * MIN, cost: 1, need: "CLOUDFLARE_RADAR_TOKEN", async run(fx, env, now) {
    const [ind, mit, rules, cat, mal] = await Promise.allSettled([radarDim(fx, env, "attacks/layer7/summary", "industry", now), radarDim(fx, env, "attacks/layer7/summary", "mitigation_product", now),
      radarDim(fx, env, "attacks/layer7/summary", "managed_rules", now), radarDim(fx, env, "email/security/summary", "threat_category", now), radarDim(fx, env, "email/security/summary", "malicious", now)]);
    const v = (r) => (r.status === "fulfilled" ? r.value : null);
    const m = v(mal) || {};
    return { industries: summ(v(ind)), mitigation: summ(v(mit)), rules: summ(v(rules)), email: { cats: summ(v(cat)), malicious: num(m.MALICIOUS ?? m.malicious, 0, 100) } };
  } },
  c2: { ttl: 30 * MIN, cost: 1, async run(fx, env, now) {
    const rows = await fx("https://feodotracker.abuse.ch/downloads/ipblocklist.json", { headers: env.ABUSECH_AUTH_KEY ? { "Auth-Key": env.ABUSECH_AUTH_KEY } : {} });
    if (!Array.isArray(rows) || !rows.length) throw new Error("empty");
    const byc = {}, bym = {}, recent = [];
    for (const r of rows) {
      const c = cc(r.country), m = clean(r.malware, 40); if (c) byc[c] = (byc[c] || 0) + 1; if (FAMILY.test(m)) bym[m] = (bym[m] || 0) + 1;
      const t = iso(r.first_seen); if (t && now - Date.parse(t) < 7 * 864e5 && FAMILY.test(m)) recent.push({ k: "c2", t, cc: c, g: m });
    }
    return { countries: top(byc, 40), malware: top(bym, 10), recent: recent.sort(byDate).slice(0, 25) };
  } },
  rw: { ttl: 10 * MIN, cost: 2, async run(fx) {
    const rows = await fx("https://api.ransomware.live/v2/recentvictims", { timeout: 15000 });
    if (!Array.isArray(rows)) throw new Error("not a list");
    // Only the group, country, sector and time are read. Victim names, domains and descriptions never are.
    return rows.map((r) => ({ k: "ransom", t: iso(r.discovered || r.attackdate), cc: cc(r.country), g: String(r.group || "").trim().toLowerCase(), s: clean(r.activity, 40) }))
      .filter((e) => e.t && GROUP.test(e.g)).sort(byDate).slice(0, 80);
  } },
  urlhaus: { ttl: 5 * MIN, cost: 1, need: "ABUSECH_AUTH_KEY", async run(fx, env) {
    const raw = await fx("https://urlhaus-api.abuse.ch/v1/urls/recent/limit/60/", { headers: { "Auth-Key": env.ABUSECH_AUTH_KEY } });
    return (raw.urls || []).map((u) => {
      const tags = (Array.isArray(u.tags) ? u.tags : []).map((x) => clean(x, 30)).filter((x) => FAMILY.test(x));
      let host = ""; try { host = new URL(String(u.url)).hostname; } catch { /* skip */ }
      return { k: "url", t: iso(u.date_added), g: tags[0] || "", s: clean(u.threat, 30).replace(/_/g, " "), x: host && /^[a-z0-9.-]{3,80}$/i.test(host) ? defang(host) : "" };
    }).filter((e) => e.t).sort(byDate).slice(0, 40);
  } },
  bazaar: { ttl: 5 * MIN, cost: 2, need: "ABUSECH_AUTH_KEY", async run(fx, env) {
    const raw = await fx("https://mb-api.abuse.ch/api/v1/", { method: "POST", body: "query=get_recent&selector=time", headers: { "Auth-Key": env.ABUSECH_AUTH_KEY, "Content-Type": "application/x-www-form-urlencoded" } });
    return (Array.isArray(raw.data) ? raw.data : []).map((s) => ({ k: "sample", t: iso(s.first_seen), g: FAMILY.test(clean(s.signature, 40)) ? clean(s.signature, 40) : "", s: clean(s.file_type, 12),
      h: SHA256.test(String(s.sha256_hash || "").toLowerCase()) ? String(s.sha256_hash).toLowerCase() : "" })).filter((e) => e.t && e.h).sort(byDate).slice(0, 40);
  } },
  isc: { ttl: 60 * MIN, cost: 1, async run(fx, env, now) {          // SANS asks for no more than one call an hour
    const [inf, ports] = await Promise.allSettled([fx("https://isc.sans.edu/api/infocon?json"), fx("https://isc.sans.edu/api/topports/records/10?json")]);
    const iv = inf.status === "fulfilled" ? inf.value : null;
    const level = String((Array.isArray(iv) ? iv[0]?.status : iv?.status) || "").toLowerCase();
    const pv = ports.status === "fulfilled" ? ports.value : null;
    const rows = (Array.isArray(pv) ? pv : Object.values(pv || {})).filter((r) => r && typeof r === "object" && "targetport" in r);
    const list = rows.map((r) => [num(r.targetport, 0, 65535), num(r.records, 0)]).filter(([p, n]) => p !== null && n !== null).slice(0, 10);
    const day = String((!Array.isArray(pv) && pv?.date) || rows[0]?.date || "").slice(0, 10);
    const infocon = ["green", "yellow", "orange", "red"].includes(level) ? level : "";
    if (!infocon && !list.length) throw new Error("SANS ISC returned nothing usable");
    return { infocon, day: /^\d{4}-\d\d-\d\d$/.test(day) ? day : "", today: list.reduce((s, r) => s + r[1], 0), ports: list };
  } },
  "nvd:crit": { ttl: 20 * MIN, cost: 2, async run(fx, env, now) {
    return nvdNewest(fx, env, `pubStartDate=${nvdDate(now - 3 * 864e5)}&pubEndDate=${nvdDate(now)}&cvssV3Severity=CRITICAL`, 40);
  } },
  "nvd:high": { ttl: 20 * MIN, cost: 2, async run(fx, env, now) {
    return nvdNewest(fx, env, `pubStartDate=${nvdDate(now - 1.5 * 864e5)}&pubEndDate=${nvdDate(now)}&cvssV3Severity=HIGH`, 40);
  } },
  "nvd:kev": { ttl: 30 * MIN, cost: 2, async run(fx, env, now) {
    return nvdNewest(fx, env, `hasKev&kevStartDate=${nvdDate(now - 30 * 864e5)}&kevEndDate=${nvdDate(now)}`, 40);
  } },
  "gh:adv": { ttl: 20 * MIN, cost: 2, async run(fx, env) {
    const out = [];
    await Promise.all(Object.entries(AI_PKGS).map(async ([eco, pkgs]) => {
      const rows = await fx(`${GH}/advisories?type=reviewed&ecosystem=${eco}&affects=${encodeURIComponent(pkgs.join(","))}&per_page=15&sort=published&direction=desc`, { headers: ghHeaders(env) });
      for (const a of Array.isArray(rows) ? rows : []) {
        if (!GHSA.test(a.ghsa_id || "")) continue;
        const v = (a.vulnerabilities || []).map((x) => x.package?.name).find((n) => pkgs.includes(n)) || (a.vulnerabilities?.[0]?.package?.name ?? "");
        const sev = String(a.severity || "unknown").toLowerCase();
        out.push({ id: a.ghsa_id, cve: CVE.test(a.cve_id || "") ? a.cve_id : "", t: clean(a.summary, 200), sev: ["critical", "high", "medium", "low"].includes(sev) ? sev : "unknown",
          pkg: clean(v, 60), eco, d: iso(a.published_at), u: safeUrl(a.html_url, ["github.com"]) });
      }
    }));
    return out.filter((a) => a.u && a.d).sort(byDate).slice(0, 30);
  } },
  "gh:det": { ttl: 20 * MIN, cost: 1, async run(fx, env) {
    const out = [];
    await Promise.all(DET_REPOS.map(async ([name, repo, path]) => {
      const rows = await fx(`${GH}/repos/${repo}/commits?path=${path}&per_page=8`, { headers: ghHeaders(env) });
      for (const c of Array.isArray(rows) ? rows : []) {
        const msg = clean(String(c.commit?.message || "").split("\n")[0], 160);
        const u = safeUrl(c.html_url, ["github.com"]); const d = iso(c.commit?.committer?.date || c.commit?.author?.date);
        if (msg && u && d) out.push({ s: name, t: msg, u, d });
      }
    }));
    return out.sort(byDate).slice(0, 24);
  } },
  mcp: { ttl: 30 * MIN, cost: 1, async run(fx, env, now) {
    const since = new Date(now - 3 * 864e5).toISOString();
    const raw = await fx(`https://registry.modelcontextprotocol.io/v0/servers?limit=40&updated_since=${encodeURIComponent(since)}`);
    const out = [];
    for (const e of raw.servers || []) {
      const s = e.server && typeof e.server === "object" ? e.server : e; const meta = e._meta || s._meta || {};
      const off = meta["io.modelcontextprotocol.registry/official"] || meta["io.modelcontextprotocol.registry"] || {};
      const d = iso(off.updatedAt || off.publishedAt); const t = clean(s.name, 120);
      if (!t || !d || off.isLatest === false) continue;
      out.push({ t, x: clean(s.description, 220), v: clean(s.version, 30), u: safeUrl(s.repository?.url, ["github.com", "gitlab.com"]), d, remote: Array.isArray(s.remotes) && s.remotes.length > 0 });
    }
    return out.sort(byDate).slice(0, 20);
  } },
};
for (const [key, name, url, hosts, , ttl] of FEEDS_RSS) SOURCES[key] = { ttl: ttl * MIN, cost: 2, async run(fx) { const items = parseFeed(await fx(url, { as: "text" }), name, hosts); if (!items.length) throw new Error("no items"); return items; } };

// ---------- feeds (what the site asks for) ----------
const rss = (group) => FEEDS_RSS.filter((f) => f[4] === group).map((f) => f[0]);
const body = (have, k) => have[k]?.body ?? null;
export const FEEDS = {
  map: { sources: ["radar:pairs", "radar:loc", "radar:series", "radar:mix", "c2", "isc"], build(have) {
    const p = body(have, "radar:pairs"), l = body(have, "radar:loc"), m = body(have, "radar:mix"), c = body(have, "c2");
    return { radar: !!(p || l), pairs: p || { waf: [], ddos: [], bot: [], l3: [] }, origins: l?.origins || [], targets: l?.targets || [], series: body(have, "radar:series") || [],
      industries: m?.industries || [], mitigation: m?.mitigation || [], rules: m?.rules || [], email: m?.email || null,
      c2: c ? { countries: c.countries, malware: c.malware } : null, isc: body(have, "isc") };
  } },
  events: { sources: ["rw", "c2", "urlhaus", "bazaar"], build(have) {
    return [...(body(have, "rw") || []), ...(body(have, "c2")?.recent || []), ...(body(have, "urlhaus") || []), ...(body(have, "bazaar") || [])].sort(byDate).slice(0, 120);
  } },
  cves: { sources: ["nvd:crit", "nvd:high", "nvd:kev"], build(have) {
    const nvd = new Map();
    for (const it of [...(body(have, "nvd:crit") || []), ...(body(have, "nvd:high") || [])]) nvd.set(it.id, it);
    const kev = (body(have, "nvd:kev") || []).filter((x) => x.kev).map((x) => ({ id: x.id, vendor: x.vendor, product: x.product, title: x.kev.title, desc: x.desc, action: x.kev.action,
      added: x.kev.added, due: x.kev.due, cwe: x.cwe, cvss: x.cvss, sev: x.sev })).sort((a, b) => b.added.localeCompare(a.added));
    return { nvd: [...nvd.values()].map(({ kev: _k, ...rest }) => rest).sort((a, b) => b.published.localeCompare(a.published)).slice(0, 80), kev };
  } },
  news: { sources: [...rss("security"), ...rss("gov")], build(have) {
    const g = (grp, rules) => tag(rss(grp).flatMap((k) => body(have, k) || []), rules).sort(byDate).slice(0, 60);
    return { security: g("security", SEC_TAGS), gov: g("gov", GOV_TAGS) };
  } },
  soc: { sources: rss("soc"), build(have) { return rss("soc").flatMap((k) => body(have, k) || []).sort(byDate).slice(0, 30); } },
  ai: { sources: ["gh:adv", "mcp", ...rss("ai")], build(have) {
    return { adv: body(have, "gh:adv") || [], mcp: body(have, "mcp") || [], news: rss("ai").flatMap((k) => body(have, k) || []).sort(byDate).slice(0, 30) };
  } },
  detect: { sources: ["gh:det"], build(have) { return body(have, "gh:det") || []; } },
};

// ---------- cache stores ----------
const mem = new Map();
export function memoryStore(m = mem) {
  return { async get(keys) { return Object.fromEntries(keys.filter((k) => m.has(k)).map((k) => [k, m.get(k)])); }, async put(k, row) { m.set(k, row); } };
}
export function d1Store(db, fallback = memoryStore()) {
  return {
    async get(keys) {
      try {
        const q = await db.prepare(`SELECT k, ts, ok, body FROM live_cache WHERE k IN (${keys.map(() => "?").join(",")})`).bind(...keys).all();
        const out = {}; for (const r of q.results || []) { try { out[r.k] = { ts: r.ts, ok: !!r.ok, body: JSON.parse(r.body) }; } catch { /* corrupt row: refetch */ } }
        return { ...(await fallback.get(keys)), ...out };
      } catch { return fallback.get(keys); }                    // table not created yet: still works per isolate
    },
    async put(k, row) {
      await fallback.put(k, row);
      const s = JSON.stringify(row.body); if (s.length > 250_000) return;
      try { await db.prepare("INSERT INTO live_cache (k, ts, ok, body) VALUES (?, ?, ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts, ok = excluded.ok, body = excluded.body").bind(k, row.ts, row.ok ? 1 : 0, s).run(); } catch { /* best effort */ }
    },
  };
}

// ---------- the request ----------
export const BUDGET = 3;
export function parseFeeds(q) {
  return [...new Set(String(q || "").split(",").map((s) => s.trim()).filter((s) => Object.hasOwn(FEEDS, s)))].slice(0, 4);
}
export async function serveLive({ feeds, env = {}, store = memoryStore(), fx = makeFetcher(), now = Date.now() }) {
  const keys = [...new Set(feeds.flatMap((f) => FEEDS[f].sources))].filter((k) => !SOURCES[k].need || env[SOURCES[k].need]);
  const have = keys.length ? await store.get(keys) : {};
  const age = (k) => (have[k] ? now - have[k].ts : Infinity);
  const due = (k) => { const s = SOURCES[k]; const ttl = have[k] && !have[k].ok ? Math.min(s.ttl, 5 * MIN) : s.ttl; return age(k) >= ttl; };
  const stale = keys.filter(due).sort((a, b) => age(b) - age(a));
  const pick = []; let spent = 0;
  for (const k of stale) { const c = SOURCES[k].cost; if (spent + c > BUDGET) continue; pick.push(k); spent += c; if (spent >= BUDGET) break; }
  await Promise.all(pick.map(async (k) => {
    let row;
    try { row = { ts: now, ok: true, body: await SOURCES[k].run(fx, env, now) }; }
    catch { row = { ts: now, ok: false, body: have[k]?.body ?? null }; }     // back off, keep the last good data
    have[k] = row; await store.put(k, row);
  }));
  const out = {}; for (const f of feeds) out[f] = FEEDS[f].build(have, now);
  const src = Object.fromEntries(keys.map((k) => [k, have[k] ? { age: Math.round(age(k) / 1000), ok: have[k].ok && have[k].body !== null } : { age: null, ok: false }]));
  return { generated: new Date(now).toISOString(), feeds: out, src };
}
