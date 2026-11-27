import { test } from "node:test";
import assert from "node:assert/strict";
import { clean, safeUrl, iso, parseFeed, parseFeeds, serveLive, memoryStore, SOURCES, FEEDS, radarWindow, BUDGET } from "../live.mjs";

const NOW = Date.UTC(2026, 10, 28, 10, 7, 0);

test("clean strips markup, double-escaped tags and control characters", () => {
  assert.equal(clean("<b>Hi</b> &amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt; \u202e x"), "Hi alert(1) x");
  assert.equal(clean({ a: 1 }), "");
  assert.equal(clean("a".repeat(500), 10).length, 10);
});

test("safeUrl only allows https on listed hosts", () => {
  assert.equal(safeUrl("https://www.cisa.gov/x", ["cisa.gov"]), "https://www.cisa.gov/x");
  assert.equal(safeUrl("https://cisa.gov.evil.example/x", ["cisa.gov"]), "");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("http://cisa.gov/"), "");
  assert.equal(safeUrl("https://user:pw@cisa.gov/", ["cisa.gov"]), "");
});

test("iso understands the formats the feeds use", () => {
  assert.equal(iso("2026-11-26 00:00:00.000000"), "2026-11-26T00:00:00.000Z");
  assert.equal(iso("2026-11-26 10:00:00 UTC"), "2026-11-26T10:00:00.000Z");
  assert.equal(iso("Wed, 25 Nov 2026 10:00:00 GMT"), "2026-11-25T10:00:00.000Z");
  assert.equal(iso("nonsense"), "");
});

test("parseFeed reads RSS and Atom and drops off-site links", () => {
  const rss = `<rss><channel><item><title><![CDATA[Patch now: <b>bug</b>]]></title><link>https://www.bleepingcomputer.com/a</link><pubDate>Wed, 25 Nov 2026 10:00:00 GMT</pubDate></item>
  <item><title>Bad</title><link>https://evil.example/</link><pubDate>Wed, 25 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  const a = parseFeed(rss, "BC", ["bleepingcomputer.com"]);
  assert.deepEqual(a, [{ t: "Patch now: bug", u: "https://www.bleepingcomputer.com/a", s: "BC", d: "2026-11-25T10:00:00.000Z" }]);
  const atom = `<feed><entry><title>Hello</title><link rel="alternate" href="https://simonwillison.net/x"/><updated>2026-11-27T08:00:00Z</updated></entry></feed>`;
  assert.equal(parseFeed(atom, "S", ["simonwillison.net"])[0].u, "https://simonwillison.net/x");
});

test("parseFeeds accepts only known feeds, at most four", () => {
  assert.deepEqual(parseFeeds("map,events,../../etc,map,__proto__,cves,news,ai"), ["map", "events", "cves", "news"]);
  assert.deepEqual(parseFeeds(""), []);
});

test("radar window is the last two hours on 15-minute marks", () => {
  assert.equal(radarWindow(NOW), "dateStart=2026-11-28T08:00:00Z&dateEnd=2026-11-28T10:00:00Z");
});

test("ransomware events never carry victim names, domains or descriptions", async () => {
  const rows = [{ victim: "Acme Corp", domain: "acme.example", description: "secret", group: "Akira", country: "us", activity: "Manufacturing", discovered: "2026-11-28 09:00:00.000000" },
    { victim: "X", group: "<script>", country: "DE", discovered: "2026-11-28T08:00:00Z" }];
  const out = await SOURCES.rw.run(async () => rows, {}, NOW);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0], { k: "ransom", t: "2026-11-28T09:00:00.000Z", cc: "US", g: "akira", s: "Manufacturing" });
  assert.ok(!JSON.stringify(out).includes("Acme"));
});

test("serveLive refreshes within budget, caches, and backs off on failure", async () => {
  const calls = [];
  const fx = async (url) => {
    calls.push(url);
    if (url.includes("feodotracker")) return [{ country: "NL", malware: "QakBot", first_seen: "2026-11-27 10:00:00" }, { country: "US", malware: "Emotet", first_seen: "2025-01-01 00:00:00" }];
    if (url.includes("ransomware.live")) throw new Error("down");
    throw new Error("unexpected " + url);
  };
  const store = memoryStore(new Map());
  const a = await serveLive({ feeds: ["events"], env: {}, store, fx, now: NOW });
  // without an abuse.ch key only rw and c2 are eligible; rw costs 2 and c2 costs 1 = budget 3
  assert.equal(BUDGET, 3);
  assert.equal(calls.length, 2);
  assert.deepEqual(a.feeds.events, [{ k: "c2", t: "2026-11-27T10:00:00.000Z", cc: "NL", g: "QakBot" }]);
  assert.equal(a.src.rw.ok, false);
  calls.length = 0;
  const b = await serveLive({ feeds: ["events"], env: {}, store, fx, now: NOW + 60e3 });
  assert.equal(calls.length, 0, "fresh cache and failure back-off mean no upstream calls a minute later");
  assert.deepEqual(b.feeds.events, a.feeds.events);
  await serveLive({ feeds: ["events"], env: {}, store, fx, now: NOW + 6 * 60e3 });
  assert.ok(calls.some((u) => u.includes("ransomware.live")), "failed source is retried after 5 minutes");
});

test("radar sources only run with a token, and fall back to dateRange=1d", async () => {
  const seen = [];
  const fx = async (url, opts) => {
    seen.push(url); assert.equal(opts.headers.Authorization, "Bearer t");
    if (url.includes("dateStart")) throw new Error("HTTP 400");
    return { result: { top_0: [{ originCountryAlpha2: "CN", targetCountryAlpha2: "US", value: "12.5" }, { originCountryAlpha2: "<x>", targetCountryAlpha2: "US", value: "1" }] } };
  };
  const out = await SOURCES["radar:pairs"].run(fx, { CLOUDFLARE_RADAR_TOKEN: "t" }, NOW);
  assert.deepEqual(out.ddos, [["CN", "US", 12.5]]);
  assert.deepEqual(out.waf, []);
  assert.ok(seen.some((u) => u.includes("dateRange=1d")));
  const keys = FEEDS.map.sources.filter((k) => !SOURCES[k].need || ({})[SOURCES[k].need]);
  assert.deepEqual(keys, ["c2", "isc"]);
});

test("NVD fetch asks for the count, then the newest page", async () => {
  const urls = [];
  const item = (id) => ({ cve: { id, published: "2026-11-27T10:00:00.000", descriptions: [{ lang: "en", value: "RCE <b>bad</b>" }], metrics: { cvssMetricV31: [{ type: "Primary", cvssData: { baseScore: 9.8, baseSeverity: "CRITICAL", vectorString: "CVSS:3.1/AV:N" } }] },
    cisaExploitAdd: "2026-11-27", cisaActionDue: "2026-12-18", cisaVulnerabilityName: "Example RCE", cisaRequiredAction: "Apply updates" } });
  const fx = async (url) => { urls.push(url); return url.includes("resultsPerPage=1&") || url.endsWith("resultsPerPage=1") ? { totalResults: 90, vulnerabilities: [item("CVE-2026-0001")] } : { totalResults: 90, vulnerabilities: [item("CVE-2026-1234"), { cve: { id: "bad" } }] }; };
  const out = await SOURCES["nvd:kev"].run(fx, {}, NOW);
  assert.ok(urls[1].includes("startIndex=50"));
  assert.equal(out.length, 1);
  assert.equal(out[0].desc, "RCE bad");
  const feed = FEEDS.cves.build({ "nvd:kev": { body: out } });
  assert.equal(feed.kev[0].added, "2026-11-27");
  assert.equal(feed.kev[0].title, "Example RCE");
});

test("every source has a sane ttl and cost", () => {
  for (const [k, s] of Object.entries(SOURCES)) {
    assert.ok(s.ttl >= 5 * 60e3, k + " ttl"); assert.ok([1, 2].includes(s.cost), k + " cost"); assert.equal(typeof s.run, "function");
  }
});

test("SANS ISC: latest ports and infocon, and a clear failure when both are empty", async () => {
  const fx = async (url) => (url.includes("infocon") ? { status: "Yellow" } : { 0: { rank: 1, targetport: 23, records: 5000, date: "2026-11-27" }, 1: { rank: 2, targetport: 22, records: 2000 } });
  const out = await SOURCES.isc.run(fx, {}, NOW);
  assert.deepEqual(out, { infocon: "yellow", day: "2026-11-27", today: 7000, ports: [[23, 5000], [22, 2000]] });
  await assert.rejects(SOURCES.isc.run(async () => "<html>blocked</html>", {}, NOW));
});
