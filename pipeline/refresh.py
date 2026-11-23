#!/usr/bin/env python3
"""FP Café data refresh.

Runs on GitHub Actions every few hours (see .github/workflows/refresh-data.yml).
It pulls public security data, treats every byte as untrusted, validates it,
and writes small JSON files into site/data/ for the static site to read.

Design rules
  * Standard library only (plus PyYAML from Ubuntu's signed apt repo for rules).
  * HTTPS only. Redirects to anything that isn't HTTPS are refused.
  * Every download has a size cap and a timeout.
  * XML with a DOCTYPE or ENTITY declaration is rejected before parsing.
  * All text is stripped of markup and control characters and length-capped.
  * Links are kept only when they are https and on an allow-listed host.
  * A failing source never wipes good data: the previous section is reused
    and marked "stale" so the site can say so.
  * Files cloned from rule repositories are read only if they are regular
    files inside the clone (symlinks are skipped).
"""
from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import gzip
import hashlib
import html
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

try:
    import yaml  # PyYAML, only needed for detection rules
except ImportError:  # pragma: no cover
    yaml = None

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "FP-Cafe-data-pipeline/1.0 (+https://github.com/sirlordalbatten/fp-cafe)"
NOW = dt.datetime.now(dt.timezone.utc)
LOG: list[str] = []


def log(msg: str) -> None:
    LOG.append(msg)
    print(msg, flush=True)


# --------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------
class HttpsOnlyRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not newurl.lower().startswith("https://"):
            raise urllib.error.HTTPError(newurl, code, "refused non-https redirect", headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_OPENER = urllib.request.build_opener(HttpsOnlyRedirect)


def http_get(url: str, headers: dict | None = None, data: bytes | None = None,
             max_bytes: int = 8_000_000, timeout: int = 45, retries: int = 2) -> bytes:
    if not url.startswith("https://"):
        raise ValueError("https only: " + url)
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            h = {"User-Agent": UA, "Accept-Encoding": "gzip"}
            h.update(headers or {})
            req = urllib.request.Request(url, headers=h, data=data)
            with _OPENER.open(req, timeout=timeout) as r:
                body = r.read(max_bytes + 1)
                if len(body) > max_bytes:
                    raise IOError(f"response over {max_bytes} bytes")
                if (r.headers.get("Content-Encoding") or "").lower() == "gzip":
                    with gzip.GzipFile(fileobj=io.BytesIO(body)) as g:
                        body = g.read(max_bytes * 4 + 1)
                    if len(body) > max_bytes * 4:
                        raise IOError("decompressed response too large")
                return body
        except Exception as e:  # noqa: BLE001 - we log and retry
            last = e
            if attempt < retries:
                time.sleep(3 * (attempt + 1))
    assert last is not None
    raise last


def get_json(url: str, **kw):
    return json.loads(http_get(url, **kw).decode("utf-8", "replace"))


# --------------------------------------------------------------------------
# Sanitising
# --------------------------------------------------------------------------
_CTRL = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]")
_TAG = re.compile(r"<[^>]{0,4000}>")
_WS = re.compile(r"\s+")


def clean(s, n: int = 300) -> str:
    """Plain text: no markup, no control chars, single spaces, max n chars."""
    if s is None:
        return ""
    s = str(s)
    s = _TAG.sub(" ", s)
    s = html.unescape(s)
    s = _TAG.sub(" ", s)            # markup that was entity-encoded
    s = _CTRL.sub("", s)
    s = _WS.sub(" ", s).strip()
    if len(s) > n:
        s = s[: n - 1].rstrip() + "…"
    return s


def clean_code(s, n: int = 4000) -> str:
    """Query text: keep newlines/indentation, drop other control chars."""
    if s is None:
        return ""
    s = str(s).replace("\r\n", "\n").replace("\r", "\n").replace("\t", "  ")
    s = _CTRL.sub("", s)
    s = "\n".join(line.rstrip() for line in s.split("\n")).strip("\n")
    if len(s) > n:
        s = s[:n].rstrip() + "\n…(truncated, open the source for the full rule)"
    return s


def safe_url(u, hosts) -> str | None:
    """Return u only if it is https and its host is (a subdomain of) an allowed host."""
    if not u or not isinstance(u, str) or len(u) > 600:
        return None
    u = u.strip()
    try:
        p = urllib.parse.urlsplit(u)
    except ValueError:
        return None
    if p.scheme != "https" or not p.hostname or p.username or p.password:
        return None
    host = p.hostname.lower().rstrip(".")
    if hosts != "*" and not any(host == h or host.endswith("." + h) for h in hosts):
        return None
    if any(c in u for c in "\"'<> \\`"):
        return None
    return u


CVE_RE = re.compile(r"^CVE-\d{4}-\d{4,7}$")
TECH_RE = re.compile(r"^T\d{4}(\.\d{3})?$")


def iso(d: dt.datetime | None) -> str | None:
    if not d:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_date(s) -> dt.datetime | None:
    if not s:
        return None
    s = str(s).strip()
    try:
        d = email.utils.parsedate_to_datetime(s)
        if d:
            return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)
    except (TypeError, ValueError, IndexError):
        pass
    try:
        d = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)
    except ValueError:
        pass
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return dt.datetime(int(m[1]), int(m[2]), int(m[3]), tzinfo=dt.timezone.utc)
    return None


def day(s) -> str | None:
    d = parse_date(s)
    return d.strftime("%Y-%m-%d") if d else None


# --------------------------------------------------------------------------
# Feeds (RSS 2.0 and Atom)
# --------------------------------------------------------------------------
def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def parse_feed(raw: bytes, source: str, hosts, limit: int = 25) -> list[dict]:
    head = raw[:4096].lower()
    if b"<!doctype" in head or b"<!entity" in raw.lower():
        raise ValueError("feed declares a DOCTYPE/ENTITY; refused")
    root = ET.fromstring(raw)
    items = []
    for el in root.iter():
        if _local(el.tag) not in ("item", "entry"):
            continue
        title = link = date = summary = None
        for c in el:
            t = _local(c.tag)
            if t == "title":
                title = "".join(c.itertext())
            elif t == "link":
                href = c.get("href")
                rel = (c.get("rel") or "alternate").lower()
                if href and rel == "alternate":
                    link = link or href
                elif not href and (c.text or "").strip():
                    link = link or c.text.strip()
            elif t in ("pubdate", "published", "updated", "date") and not date:
                date = c.text
            elif t in ("description", "summary", "content") and not summary:
                summary = "".join(c.itertext())
        t = clean(title, 180)
        u = safe_url(link, hosts)
        d = parse_date(date)
        if not t or not u:
            continue
        items.append({"t": t, "u": u, "s": source, "d": iso(d) or iso(NOW),
                      "x": clean(summary, 260)})
        if len(items) >= limit:
            break
    return items


NEWS_FEEDS = [
    ("SANS ISC", "https://isc.sans.edu/rssfeed_full.xml", ["isc.sans.edu", "sans.edu"]),
    ("CISA", "https://www.cisa.gov/cybersecurity-advisories/all.xml", ["cisa.gov"]),
    ("BleepingComputer", "https://www.bleepingcomputer.com/feed/", ["bleepingcomputer.com"]),
    ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews", ["thehackernews.com"]),
    ("Krebs on Security", "https://krebsonsecurity.com/feed/", ["krebsonsecurity.com"]),
    ("The Record", "https://therecord.media/feed", ["therecord.media"]),
    ("Dark Reading", "https://www.darkreading.com/rss.xml", ["darkreading.com"]),
]

AI_FEEDS = [
    ("OpenAI", "https://openai.com/news/rss.xml", ["openai.com"]),
    ("Google AI", "https://blog.google/technology/ai/rss/", ["blog.google"]),
    ("Google DeepMind", "https://deepmind.google/blog/rss.xml", ["deepmind.google"]),
    ("Hugging Face", "https://huggingface.co/blog/feed.xml", ["huggingface.co"]),
    ("Simon Willison", "https://simonwillison.net/atom/everything/", ["simonwillison.net"]),
    ("Embrace The Red", "https://embracethered.com/blog/index.xml", ["embracethered.com"]),
    ("OWASP GenAI", "https://genai.owasp.org/feed/", ["genai.owasp.org", "owasp.org"]),
    ("MCP spec", "https://github.com/modelcontextprotocol/modelcontextprotocol/releases.atom", ["github.com"]),
    ("MCP Python SDK", "https://github.com/modelcontextprotocol/python-sdk/releases.atom", ["github.com"]),
    ("MCP TypeScript SDK", "https://github.com/modelcontextprotocol/typescript-sdk/releases.atom", ["github.com"]),
    ("Ollama", "https://github.com/ollama/ollama/releases.atom", ["github.com"]),
]

AI_TAGS = [
    ("mcp", re.compile(r"\bmcp\b|model context protocol", re.I)),
    ("agents", re.compile(r"\bagent(s|ic)?\b|computer use|tool use", re.I)),
    ("security", re.compile(r"prompt injection|jailbreak|exfiltrat|secur|vulnerab|red team|safety", re.I)),
    ("release", re.compile(r"\b(v?\d+\.\d+(\.\d+)?|release|launch|introduc|available|now in)\b", re.I)),
    ("models", re.compile(r"\b(model|llm|gpt|gemini|claude|llama|mistral|qwen|deepseek|weights)\b", re.I)),
]

SEC_TAGS = [
    ("exploited", re.compile(r"exploit|zero[- ]day|0-day|in the wild|actively", re.I)),
    ("ransomware", re.compile(r"ransom", re.I)),
    ("breach", re.compile(r"breach|leak|stolen|exposed", re.I)),
    ("patch", re.compile(r"patch|update|fix(es|ed)?\b|advisory", re.I)),
    ("phishing", re.compile(r"phish|lure|scam|clickfix", re.I)),
]


def tag_items(items, rules):
    for it in items:
        text = it["t"] + " " + it.get("x", "")
        it["g"] = [name for name, rx in rules if rx.search(text)][:3]
    return items


def fetch_feeds(feeds, prev_items, rules, label):
    status, out = {}, []
    for name, url, hosts in feeds:
        try:
            items = parse_feed(http_get(url, max_bytes=6_000_000), name, hosts)
            if not items:
                raise ValueError("no usable items")
            out += items
            status[name] = "ok"
        except Exception as e:  # noqa: BLE001
            keep = [i for i in prev_items if i.get("s") == name]
            out += keep
            status[name] = "stale" if keep else "failed"
            log(f"[{label}] {name}: {type(e).__name__}: {str(e)[:160]}")
    seen, uniq = set(), []
    for it in sorted(out, key=lambda i: i["d"], reverse=True):
        k = it["u"].split("?")[0]
        if k in seen:
            continue
        seen.add(k)
        uniq.append(it)
    cutoff = iso(NOW - dt.timedelta(days=45))
    uniq = [i for i in uniq if i["d"] >= cutoff][:120]
    return tag_items(uniq, rules), status


# --------------------------------------------------------------------------
# CVEs: CISA KEV + NVD + FIRST EPSS
# --------------------------------------------------------------------------
KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
EPSS_URL = "https://api.first.org/data/v1/epss"
EDGE_RX = re.compile(
    r"vpn|firewall|gateway|netscaler|citrix adc|fortios|fortigate|fortiweb|fortimanager|pan-os|globalprotect|"
    r"ivanti|pulse|sonicos|sonicwall|asa\b|ftd\b|secure firewall|big-ip|f5|edge|router|ios xe|sd-wan|"
    r"zyxel|draytek|juniper|junos|cyberoam|sophos firewall|check point|connect secure|policy secure", re.I)


def build_kev(raw) -> list[dict]:
    vulns = raw.get("vulnerabilities") if isinstance(raw, dict) else None
    if not isinstance(vulns, list) or len(vulns) < 100:
        raise ValueError("KEV catalog looks wrong")
    out = []
    for v in vulns:
        cid = str(v.get("cveID", "")).strip()
        if not CVE_RE.match(cid):
            continue
        added = day(v.get("dateAdded"))
        if not added:
            continue
        out.append({
            "id": cid,
            "vendor": clean(v.get("vendorProject"), 60),
            "product": clean(v.get("product"), 80),
            "title": clean(v.get("vulnerabilityName"), 140),
            "desc": clean(v.get("shortDescription"), 420),
            "action": clean(v.get("requiredAction"), 260),
            "added": added,
            "due": day(v.get("dueDate")),
            "ransomware": str(v.get("knownRansomwareCampaignUse", "")).lower() == "known",
            "cwe": [clean(c, 16) for c in (v.get("cwes") or [])[:3] if re.match(r"^CWE-\d+$", str(c))],
        })
    out.sort(key=lambda x: x["added"], reverse=True)
    return out


def kev_stats(kev: list[dict]) -> dict:
    today = NOW.date()

    def within(d, days):
        return (today - dt.date.fromisoformat(d)).days <= days

    last30 = [k for k in kev if within(k["added"], 30)]
    vendors: dict[str, int] = {}
    for k in last30:
        vendors[k["vendor"]] = vendors.get(k["vendor"], 0) + 1
    edge = [k for k in kev if EDGE_RX.search(k["vendor"] + " " + k["product"] + " " + k["title"])]
    return {
        "kevTotal": len(kev),
        "kevAdded7": sum(1 for k in kev if within(k["added"], 7)),
        "kevAdded30": len(last30),
        "ransomware30": sum(1 for k in last30 if k["ransomware"]),
        "lastKev": kev[0]["added"] if kev else None,
        "lastEdge": edge[0]["added"] if edge else None,
        "lastEdgeId": edge[0]["id"] if edge else None,
        "topVendors30": sorted(vendors.items(), key=lambda x: -x[1])[:5],
    }


def _nvd_item(v) -> dict | None:
    c = v.get("cve") or {}
    cid = str(c.get("id", ""))
    if not CVE_RE.match(cid):
        return None
    if str(c.get("vulnStatus", "")).lower() in ("rejected",):
        return None
    desc = next((d.get("value") for d in c.get("descriptions", []) if d.get("lang") == "en"), "")
    score = sev = vector = None
    m = c.get("metrics") or {}
    for key in ("cvssMetricV40", "cvssMetricV31", "cvssMetricV30"):
        arr = m.get(key) or []
        arr = sorted(arr, key=lambda x: 0 if x.get("type") == "Primary" else 1)
        if arr:
            d = arr[0].get("cvssData") or {}
            try:
                score = float(d.get("baseScore"))
            except (TypeError, ValueError):
                score = None
            sev = str(d.get("baseSeverity", "")).lower() or None
            vector = clean(d.get("vectorString"), 160)
            break
    vendor = product = ""
    for cfg in c.get("configurations") or []:
        for node in cfg.get("nodes") or []:
            for cm in node.get("cpeMatch") or []:
                parts = str(cm.get("criteria", "")).split(":")
                if len(parts) > 5 and parts[3] not in ("*", "-"):
                    vendor, product = parts[3], parts[4]
                    break
            if vendor:
                break
        if vendor:
            break
    cwe = []
    for w in c.get("weaknesses") or []:
        for d in w.get("description") or []:
            val = str(d.get("value", ""))
            if re.match(r"^CWE-\d+$", val) and val not in cwe:
                cwe.append(val)
    return {
        "id": cid,
        "published": day(c.get("published")),
        "desc": clean(desc, 420),
        "cvss": score if score is not None and 0 <= score <= 10 else None,
        "sev": sev if sev in ("critical", "high", "medium", "low", "none") else None,
        "vector": vector,
        "vendor": clean(vendor.replace("_", " "), 60),
        "product": clean(product.replace("_", " "), 80),
        "cwe": cwe[:3],
    }


def fetch_nvd_recent(days: int = 10) -> list[dict]:
    key = os.environ.get("NVD_API_KEY", "").strip()
    headers = {"apiKey": key} if key else {}
    end = NOW
    start = NOW - dt.timedelta(days=days)
    fmt = "%Y-%m-%dT%H:%M:%S.000"
    out: dict[str, dict] = {}
    for sev_param in ("cvssV3Severity", "cvssV4Severity"):
        q = urllib.parse.urlencode({"pubStartDate": start.strftime(fmt), "pubEndDate": end.strftime(fmt),
                                    sev_param: "CRITICAL", "resultsPerPage": 300})
        raw = get_json(f"{NVD_URL}?{q}", headers=headers, max_bytes=30_000_000, timeout=90)
        for v in raw.get("vulnerabilities") or []:
            it = _nvd_item(v)
            if it:
                out[it["id"]] = it
        time.sleep(1 if key else 7)
    items = sorted(out.values(), key=lambda x: x["published"] or "", reverse=True)
    return items[:200]


def fetch_nvd_scores(ids: list[str], cache: dict) -> dict:
    """CVSS for recent KEV entries (KEV itself has no scores). Cached between runs."""
    key = os.environ.get("NVD_API_KEY", "").strip()
    headers = {"apiKey": key} if key else {}
    out = {i: cache[i] for i in ids if i in cache}
    todo = [i for i in ids if i not in out][: (40 if key else 15)]
    for cid in todo:
        try:
            raw = get_json(f"{NVD_URL}?cveId={cid}", headers=headers, timeout=60, retries=1)
            vs = raw.get("vulnerabilities") or []
            it = _nvd_item(vs[0]) if vs else None
            if it:
                out[cid] = {"cvss": it["cvss"], "sev": it["sev"], "vector": it["vector"]}
        except Exception as e:  # noqa: BLE001
            log(f"[cves] NVD score {cid}: {type(e).__name__}")
        time.sleep(1 if key else 6.5)
    return out


def fetch_epss(ids: list[str]) -> dict:
    out = {}
    for i in range(0, len(ids), 90):
        chunk = [c for c in ids[i:i + 90] if CVE_RE.match(c)]
        if not chunk:
            continue
        raw = get_json(f"{EPSS_URL}?cve={','.join(chunk)}&limit=100", timeout=60)
        for row in raw.get("data") or []:
            cid = str(row.get("cve", ""))
            try:
                e, p = float(row.get("epss")), float(row.get("percentile"))
            except (TypeError, ValueError):
                continue
            if CVE_RE.match(cid) and 0 <= e <= 1 and 0 <= p <= 1:
                out[cid] = [round(e, 5), round(p, 4)]
        time.sleep(1)
    return out


def build_cves(prev: dict) -> dict:
    status = {}
    try:
        kev_all = build_kev(get_json(KEV_URL, max_bytes=20_000_000))
        status["kev"] = "ok"
    except Exception as e:  # noqa: BLE001
        log(f"[cves] KEV: {type(e).__name__}: {str(e)[:160]}")
        kev_all = None
        status["kev"] = "stale" if prev.get("kev") else "failed"
    if kev_all is not None:
        stats = kev_stats(kev_all)
        cutoff = (NOW - dt.timedelta(days=120)).strftime("%Y-%m-%d")
        kev = [k for k in kev_all if k["added"] >= cutoff]
        if len(kev) < 60:
            kev = kev_all[:60]
    else:
        kev, stats = prev.get("kev", []), prev.get("stats", {})

    try:
        nvd = fetch_nvd_recent()
        status["nvd"] = "ok"
    except Exception as e:  # noqa: BLE001
        log(f"[cves] NVD recent: {type(e).__name__}: {str(e)[:160]}")
        nvd = prev.get("nvd", [])
        status["nvd"] = "stale" if nvd else "failed"

    scores = fetch_nvd_scores([k["id"] for k in kev[:40]], prev.get("scores", {}))
    status["scores"] = "ok"

    ids = list(dict.fromkeys([k["id"] for k in kev] + [n["id"] for n in nvd]))
    try:
        epss = fetch_epss(ids)
        status["epss"] = "ok"
    except Exception as e:  # noqa: BLE001
        log(f"[cves] EPSS: {type(e).__name__}: {str(e)[:160]}")
        epss = prev.get("epss", {})
        status["epss"] = "stale" if epss else "failed"

    stats["criticalNew7"] = sum(1 for n in nvd if n["published"] and
                                n["published"] >= (NOW - dt.timedelta(days=7)).strftime("%Y-%m-%d"))
    return {"generated": iso(NOW), "status": status, "stats": stats,
            "kev": kev, "nvd": nvd, "scores": scores, "epss": epss}


# --------------------------------------------------------------------------
# Malware families: Malpedia (no key) + abuse.ch (optional key) + news mentions
# --------------------------------------------------------------------------
MALPEDIA = "https://malpedia.caad.fkie.fraunhofer.de"
FAMILY_ID = re.compile(r"^[a-z]{2,6}\.[a-z0-9_]{2,60}$")


def load_families() -> list[dict]:
    with open(os.path.join(HERE, "families.json"), encoding="utf-8") as f:
        fams = json.load(f)
    return [x for x in fams if FAMILY_ID.match(x["id"])]


def mention_counts(fams, news_items) -> dict:
    out = {}
    for f in fams:
        names = [f["name"]] + f.get("aliases", [])
        rx = re.compile(r"\b(" + "|".join(re.escape(n) for n in names if len(n) >= 4) + r")\b", re.I)
        hits = [i for i in news_items if rx.search(i["t"] + " " + i.get("x", ""))]
        if hits:
            out[f["id"]] = {"n": len(hits), "news": [{k: h[k] for k in ("t", "u", "s", "d")} for h in hits[:3]]}
    return out


def build_malware(prev: dict, news_items: list[dict]) -> dict:
    fams = load_families()
    status = {}
    families = {}
    prev_f = prev.get("families", {})
    ok = 0
    for f in fams:
        fid = f["id"]
        try:
            raw = get_json(f"{MALPEDIA}/api/get/family/{fid}", timeout=40, retries=1)
            alt = [clean(a, 40) for a in (raw.get("alt_names") or [])[:8]]
            attr = [clean(a, 40) for a in (raw.get("attribution") or [])[:4]]
            families[fid] = {
                "updated": day(raw.get("updated")),
                "aliases": [a for a in alt if a],
                "desc": clean(raw.get("description"), 600),
                "attribution": [a for a in attr if a],
                "refs": len(raw.get("urls") or []),
            }
            ok += 1
        except Exception as e:  # noqa: BLE001
            if fid in prev_f:
                families[fid] = {k: v for k, v in prev_f[fid].items() if k in ("updated", "aliases", "desc", "attribution", "refs")}
            log(f"[malware] malpedia {fid}: {type(e).__name__}")
        time.sleep(0.6)
    status["malpedia"] = "ok" if ok else ("stale" if prev_f else "failed")

    for fid, m in mention_counts(fams, news_items).items():
        families.setdefault(fid, {}).update({"mentions": m["n"], "news": m["news"]})

    trending, samples = [], {}
    key = os.environ.get("ABUSECH_AUTH_KEY", "").strip()
    if key:
        try:
            raw = get_json("https://threatfox-api.abuse.ch/api/v1/", headers={"Auth-Key": key},
                           data=json.dumps({"query": "get_iocs", "days": 7}).encode(), max_bytes=40_000_000, timeout=90)
            counts: dict[str, list] = {}
            for ioc in raw.get("data") or []:
                mid = str(ioc.get("malware", ""))
                if not FAMILY_ID.match(mid):
                    continue
                c = counts.setdefault(mid, [clean(ioc.get("malware_printable"), 50), 0])
                c[1] += 1
            trending = [{"id": k, "name": v[0] or k, "iocs": v[1]} for k, v in
                        sorted(counts.items(), key=lambda x: -x[1][1])[:20]]
            for t in trending:
                families.setdefault(t["id"], {})["iocs7"] = t["iocs"]
            status["threatfox"] = "ok"
        except Exception as e:  # noqa: BLE001
            log(f"[malware] threatfox: {type(e).__name__}: {str(e)[:120]}")
            trending = prev.get("trending", [])
            status["threatfox"] = "stale" if trending else "failed"
        try:
            raw = get_json("https://mb-api.abuse.ch/api/v1/", headers={"Auth-Key": key},
                           data=urllib.parse.urlencode({"query": "get_recent", "selector": "100"}).encode(),
                           timeout=60)
            for s in raw.get("data") or []:
                sig = clean(s.get("signature"), 50)
                if sig:
                    samples[sig] = samples.get(sig, 0) + 1
            status["malwarebazaar"] = "ok"
        except Exception as e:  # noqa: BLE001
            log(f"[malware] malwarebazaar: {type(e).__name__}")
            samples = prev.get("samples", {})
            status["malwarebazaar"] = "stale" if samples else "failed"
    else:
        status["threatfox"] = status["malwarebazaar"] = "no key"

    research = []
    try:
        research = parse_feed(http_get(f"{MALPEDIA}/feeds/rss/latest", max_bytes=4_000_000),
                              "Malpedia", "*", limit=30)
        status["research"] = "ok"
    except Exception as e:  # noqa: BLE001
        log(f"[malware] malpedia rss: {type(e).__name__}: {str(e)[:120]}")
        research = prev.get("research", [])
        status["research"] = "stale" if research else "failed"

    top_samples = dict(sorted(samples.items(), key=lambda x: -x[1])[:15])
    return {"generated": iso(NOW), "status": status, "families": families,
            "trending": trending, "samples": top_samples, "research": research[:30]}


# --------------------------------------------------------------------------
# Detection rules from public repositories
# --------------------------------------------------------------------------
DET_SOURCES = [
    {"key": "sigma", "name": "SigmaHQ", "lang": "sigma", "license": "DRL 1.1",
     "git": "https://github.com/SigmaHQ/sigma.git", "branch": "master", "depth": 250,
     "paths": ["rules", "rules-emerging-threats", "rules-threat-hunting"], "ext": (".yml",)},
    {"key": "splunk", "name": "Splunk Security Content", "lang": "spl", "license": "Apache-2.0",
     "git": "https://github.com/splunk/security_content.git", "branch": "develop", "depth": 250,
     "paths": ["detections"], "ext": (".yml",)},
    {"key": "sentinel", "name": "Microsoft Sentinel", "lang": "kql", "license": "MIT",
     "git": "https://github.com/Azure/Azure-Sentinel.git", "branch": "master", "depth": 300,
     "paths": ["Solutions", "Detections"], "ext": (".yaml", ".yml"),
     "path_rx": re.compile(r"(^|/)(Analytic Rules|Detections)/")},
    {"key": "secops", "name": "Google SecOps community rules", "lang": "yaral", "license": "Apache-2.0",
     "git": "https://github.com/chronicle/detection-rules.git", "branch": "main", "depth": 200,
     "paths": ["rules"], "ext": (".yaral",)},
]
PER_SOURCE = 30
LEVELS = {"informational", "low", "medium", "high", "critical"}


def _git(args, cwd=None, timeout=600):
    env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GIT_LFS_SKIP_SMUDGE="1")
    r = subprocess.run(["git", "-c", "core.symlinks=true", "-c", "protocol.file.allow=user", *args],
                       cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(f"git {args[0]} failed: {r.stderr.strip()[:200]}")
    return r.stdout


def recent_rule_files(src: dict, workdir: str) -> list[tuple[str, str, str]]:
    """Return [(path, commit_date, text)] for the newest rule files in a repo."""
    dest = os.path.join(workdir, src["key"])
    _git(["clone", "--quiet", "--filter=blob:none", "--no-checkout", f"--depth={src['depth']}",
          "--single-branch", "--branch", src["branch"], src["git"], dest], timeout=900)
    out = _git(["log", "--format=%x01%cI", "--name-only", "--diff-filter=AM", "--no-renames", "--",
                *src["paths"]], cwd=dest)
    newest: dict[str, str] = {}
    cur = None
    for line in out.splitlines():
        if line.startswith("\x01"):
            cur = line[1:].strip()
            continue
        p = line.strip()
        if not p or cur is None or p in newest:
            continue
        if not p.endswith(src["ext"]):
            continue
        if src.get("path_rx") and not src["path_rx"].search(p):
            continue
        newest[p] = cur
    candidates = sorted(newest.items(), key=lambda x: x[1], reverse=True)[: PER_SOURCE * 3]
    if not candidates:
        return []
    _git(["sparse-checkout", "init", "--no-cone"], cwd=dest)
    patterns = ["/" + re.sub(r"([\\*?\[!#])", r"\\\1", p) for p, _ in candidates]
    with open(os.path.join(dest, ".git", "info", "sparse-checkout"), "w", encoding="utf-8") as f:
        f.write("\n".join(patterns) + "\n")
    _git(["checkout", "--quiet", src["branch"]], cwd=dest, timeout=900)
    root = os.path.realpath(dest)
    files = []
    for p, when in candidates:
        full = os.path.join(dest, p)
        real = os.path.realpath(full)
        if os.path.islink(full) or not real.startswith(root + os.sep) or not os.path.isfile(real):
            continue
        if os.path.getsize(real) > 200_000:
            continue
        with open(real, encoding="utf-8", errors="replace") as f:
            files.append((p, when, f.read()))
    return files


def _techs(values) -> list[str]:
    out = []
    for v in values or []:
        v = str(v).strip()
        m = re.match(r"^(?:attack\.)?(t\d{4}(?:\.\d{3})?)$", v, re.I)
        if m:
            t = m[1].upper()
            if TECH_RE.match(t) and t not in out:
                out.append(t)
    return out[:6]


def _tactics(values) -> list[str]:
    out = []
    for v in values or []:
        v = str(v).strip()
        if re.match(r"^attack\.t\d", v, re.I) or re.match(r"^attack\.(g|s)\d", v, re.I):
            continue
        v = re.sub(r"^attack\.", "", v, flags=re.I)
        v = clean(v.replace("_", " ").replace("-", " "), 30).lower()
        if re.match(r"^[a-z ]{4,30}$", v) and v not in out:
            out.append(v)
    return out[:4]


def _yaml(text: str):
    if yaml is None:
        raise RuntimeError("PyYAML missing")
    doc = yaml.safe_load(text)
    if not isinstance(doc, dict):
        raise ValueError("not a mapping")
    return doc


def parse_rule(src: dict, path: str, when: str, text: str) -> dict | None:
    base = {"src": src["key"], "srcName": src["name"], "lang": src["lang"], "license": src["license"],
            "date": day(when), "path": clean(path, 200),
            "url": safe_url(src["git"][:-4] + "/blob/" + src["branch"] + "/" +
                            urllib.parse.quote(path), ["github.com"])}
    lang = src["lang"]
    if lang == "sigma":
        d = _yaml(text)
        if str(d.get("status", "")).lower() in ("deprecated", "unsupported"):
            return None
        if not d.get("title") or not d.get("detection"):
            return None
        tags = d.get("tags") or []
        ls = d.get("logsource") or {}
        r = {"title": clean(d.get("title"), 140), "desc": clean(d.get("description"), 500),
             "level": str(d.get("level", "medium")).lower(), "tech": _techs(tags), "tactics": _tactics(tags),
             "logsource": clean(" / ".join(str(ls[k]) for k in ("product", "category", "service") if ls.get(k)), 80),
             "author": clean(d.get("author"), 120), "fp": [clean(x, 140) for x in (d.get("falsepositives") or [])[:3]],
             "query": clean_code(text, 4500)}
    elif lang == "spl":
        d = _yaml(text)
        if str(d.get("status", "production")).lower() not in ("production", "experimental"):
            return None
        q = d.get("search")
        if not d.get("name") or not q:
            return None
        tags = d.get("tags") or {}
        fps = d.get("known_false_positives")
        r = {"title": clean(d.get("name"), 140), "desc": clean(d.get("description"), 500),
             "level": {"ttp": "high", "anomaly": "medium", "hunting": "low"}.get(str(d.get("type", "")).lower(), "medium"),
             "tech": _techs(tags.get("mitre_attack_id") if isinstance(tags, dict) else []),
             "tactics": [], "logsource": clean(", ".join(map(str, (d.get("data_source") or [])[:2])), 80),
             "author": clean(d.get("author"), 120), "fp": [clean(fps, 220)] if fps else [],
             "how": clean(d.get("how_to_implement"), 300), "query": clean_code(q, 4500)}
    elif lang == "kql":
        d = _yaml(text)
        q = d.get("query")
        if not d.get("name") or not q:
            return None
        sev = str(d.get("severity", "medium")).lower()
        r = {"title": clean(d.get("name"), 140), "desc": clean(d.get("description"), 500),
             "level": sev if sev in LEVELS else "medium",
             "tech": _techs(d.get("relevantTechniques")), "tactics": _tactics(d.get("tactics")),
             "logsource": clean(", ".join(str(c.get("connectorId", "")) for c in (d.get("requiredDataConnectors") or [])[:2]
                                         if isinstance(c, dict)), 80),
             "author": "", "fp": [], "query": clean_code(q, 4500)}
    elif lang == "yaral":
        m = re.search(r"\brule\s+([A-Za-z0-9_]+)\s*\{", text)
        if not m or "events:" not in text or "condition:" not in text:
            return None
        meta = dict(re.findall(r'^\s*([a-z_]+)\s*=\s*"([^"\n]{0,600})"', text.split("events:")[0], re.M))
        sev = str(meta.get("severity", "medium")).lower()
        tech = _techs(re.split(r"[,\s]+", meta.get("mitre_attack_technique", "") + " " + meta.get("technique", "")))
        r = {"title": clean(meta.get("rule_name") or m[1].replace("_", " "), 140),
             "desc": clean(meta.get("description"), 500), "level": sev if sev in LEVELS else "medium",
             "tech": tech, "tactics": _tactics([meta.get("mitre_attack_tactic", "")]),
             "logsource": "", "author": clean(meta.get("author"), 120), "fp": [], "query": clean_code(text, 4500)}
    else:
        return None
    if r["level"] not in LEVELS:
        r["level"] = "medium"
    r["fp"] = [x for x in r["fp"] if x]
    r.update(base)
    r["id"] = hashlib.sha256((src["key"] + ":" + path).encode()).hexdigest()[:14]
    return r


def build_detections(prev: dict) -> dict:
    status, rules = {}, []
    prev_rules = prev.get("rules", [])
    work = tempfile.mkdtemp(prefix="fpc-rules-")
    try:
        for src in DET_SOURCES:
            got = []
            try:
                for path, when, text in recent_rule_files(src, work):
                    try:
                        r = parse_rule(src, path, when, text)
                    except Exception:  # noqa: BLE001 - one bad file never stops the run
                        r = None
                    if r:
                        got.append(r)
                    if len(got) >= PER_SOURCE:
                        break
                if not got:
                    raise ValueError("no rules parsed")
                status[src["key"]] = "ok"
            except Exception as e:  # noqa: BLE001
                log(f"[detections] {src['key']}: {type(e).__name__}: {str(e)[:200]}")
                got = [r for r in prev_rules if r.get("src") == src["key"]]
                status[src["key"]] = "stale" if got else "failed"
            rules += got
    finally:
        shutil.rmtree(work, ignore_errors=True)
    rules.sort(key=lambda r: r.get("date") or "", reverse=True)
    return {"generated": iso(NOW), "status": status, "rules": rules}


# --------------------------------------------------------------------------
# Validation (a light schema check before anything is written)
# --------------------------------------------------------------------------
class Invalid(ValueError):
    pass


def _check_str(v, n, name, allow_empty=True):
    if not isinstance(v, str) or len(v) > n or (not allow_empty and not v):
        raise Invalid(f"{name}: bad string")
    if _CTRL.search(v.replace("\n", "")):
        raise Invalid(f"{name}: control characters")


def _check_url(v, name):
    if v is None:
        return
    if not isinstance(v, str) or safe_url(v, "*") != v:
        raise Invalid(f"{name}: bad url")


def _check_item(i, name):
    if not isinstance(i, dict):
        raise Invalid(name)
    _check_str(i.get("t"), 200, name + ".t", False)
    _check_url(i.get("u"), name + ".u")
    _check_str(i.get("s"), 60, name + ".s")
    _check_str(i.get("d"), 25, name + ".d")


def validate(kind: str, data: dict) -> None:
    if not isinstance(data, dict) or not isinstance(data.get("generated"), str):
        raise Invalid(kind + ": missing generated")
    if kind == "cves":
        for k in data["kev"]:
            if not CVE_RE.match(k["id"]):
                raise Invalid("kev id")
            for f, n in (("vendor", 60), ("product", 80), ("title", 140), ("desc", 420), ("action", 260)):
                _check_str(k[f], n, "kev." + f)
            if not isinstance(k["ransomware"], bool):
                raise Invalid("kev.ransomware")
        for k in data["nvd"]:
            if not CVE_RE.match(k["id"]):
                raise Invalid("nvd id")
            _check_str(k["desc"], 420, "nvd.desc")
            if k["cvss"] is not None and not (0 <= k["cvss"] <= 10):
                raise Invalid("nvd.cvss")
        for cid, v in data["epss"].items():
            if not CVE_RE.match(cid) or not (isinstance(v, list) and len(v) == 2):
                raise Invalid("epss")
    elif kind == "news":
        for grp in ("security", "ai"):
            for i in data[grp]:
                _check_item(i, grp)
                _check_str(i.get("x", ""), 260, grp + ".x")
    elif kind == "malware":
        for fid, f in data["families"].items():
            if not FAMILY_ID.match(fid):
                raise Invalid("family id")
            _check_str(f.get("desc", ""), 600, "family.desc")
            for n in f.get("news", []):
                _check_item(n, "family.news")
        for i in data["research"]:
            _check_item(i, "research")
    elif kind == "detections":
        for r in data["rules"]:
            _check_str(r["title"], 140, "rule.title", False)
            _check_str(r["desc"], 500, "rule.desc")
            if r["lang"] not in ("sigma", "spl", "kql", "yaral") or r["level"] not in LEVELS:
                raise Invalid("rule.lang/level")
            if not isinstance(r["query"], str) or len(r["query"]) > 4700:
                raise Invalid("rule.query")
            _check_url(r.get("url"), "rule.url")
            if not str(r.get("url") or "").startswith("https://github.com/"):
                raise Invalid("rule.url host")
            for t in r["tech"]:
                if not TECH_RE.match(t):
                    raise Invalid("rule.tech")
    size = len(json.dumps(data, separators=(",", ":")))
    if size > 3_000_000:
        raise Invalid(f"{kind}: {size} bytes is too big")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def load_prev(out_dir: str, name: str) -> dict:
    try:
        with open(os.path.join(out_dir, name + ".json"), encoding="utf-8") as f:
            d = json.load(f)
        return d if isinstance(d, dict) else {}
    except (OSError, ValueError):
        return {}


def write(out_dir: str, name: str, data: dict) -> None:
    validate(name, data)
    path = os.path.join(out_dir, name + ".json")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"), sort_keys=False)
    os.replace(tmp, path)
    log(f"wrote {name}.json ({os.path.getsize(path):,} bytes)")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "..", "site", "data"))
    ap.add_argument("--only", choices=["cves", "news", "malware", "detections"], action="append")
    ap.add_argument("--validate", action="store_true", help="only validate existing files")
    a = ap.parse_args(argv)
    out = os.path.abspath(a.out)
    os.makedirs(out, exist_ok=True)
    kinds = a.only or ["news", "cves", "malware", "detections"]

    if a.validate:
        bad = 0
        for k in kinds:
            d = load_prev(out, k)
            if not d:
                continue
            try:
                validate(k, d)
                log(f"{k}.json valid")
            except Invalid as e:
                bad += 1
                log(f"{k}.json INVALID: {e}")
        return 1 if bad else 0

    results = {}
    news_prev = load_prev(out, "news")
    news = None
    if "news" in kinds or "malware" in kinds:
        sec, s1 = fetch_feeds(NEWS_FEEDS, news_prev.get("security", []), SEC_TAGS, "news")
        ai, s2 = fetch_feeds(AI_FEEDS, news_prev.get("ai", []), AI_TAGS, "ai")
        news = {"generated": iso(NOW), "status": {**s1, **s2}, "security": sec, "ai": ai}
        if "news" in kinds:
            results["news"] = news
    if "cves" in kinds:
        results["cves"] = build_cves(load_prev(out, "cves"))
    if "malware" in kinds:
        results["malware"] = build_malware(load_prev(out, "malware"), (news or {}).get("security", []))
    if "detections" in kinds:
        results["detections"] = build_detections(load_prev(out, "detections"))

    failed = 0
    for name, data in results.items():
        try:
            write(out, name, data)
        except Invalid as e:
            failed += 1
            log(f"NOT writing {name}.json, validation failed: {e}")
    statuses = {n: d.get("status", {}) for n, d in results.items()}
    all_bad = all(v != "ok" for s in statuses.values() for v in s.values()) if statuses else False
    print(json.dumps(statuses, indent=1))
    return 1 if failed or all_bad else 0


if __name__ == "__main__":
    sys.exit(main())
