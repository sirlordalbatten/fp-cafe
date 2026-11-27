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

GOV_FEEDS = [
    ("CISA", "https://www.cisa.gov/cybersecurity-advisories/all.xml", ["cisa.gov"]),
    ("NCSC UK", "https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml", ["ncsc.gov.uk"]),
]
GOV_TAGS = [("ransomware", re.compile(r"(?i)ransom|#stopransomware")), ("ics", re.compile(r"(?i)\bics\b|industrial|scada|\bot\b")),
            ("exploited", re.compile(r"(?i)exploit|zero-day|0-day|actively")), ("advisory", re.compile(r"(?i)advisory|alert|guidance"))]
SOC_FEEDS = [
    ("Red Canary", "https://redcanary.com/feed/", ["redcanary.com"]),
    ("Expel", "https://expel.com/feed/", ["expel.com"]),
    ("Huntress", "https://www.huntress.com/blog/rss.xml", ["huntress.com"]),
    ("Elastic Security Labs", "https://www.elastic.co/security-labs/rss/feed.xml", ["elastic.co"]),
    ("The DFIR Report", "https://thedfirreport.com/feed/", ["thedfirreport.com"]),
    ("Microsoft Security", "https://www.microsoft.com/en-us/security/blog/feed/", ["microsoft.com"]),
    ("Google Security Blog", "https://security.googleblog.com/feeds/posts/default", ["security.googleblog.com", "googleblog.com"]),
    ("SANS Blog", "https://www.sans.org/blog/feed.xml", ["sans.org"]),
]
SOC_TAGS = [
    ("detection", re.compile(r"detect|hunt|rule|sigma|query|telemetry", re.I)),
    ("ir", re.compile(r"incident|respon|intrusion|ransom|breach|forensic", re.I)),
    ("practice", re.compile(r"soc\b|analyst|team|metric|automation|playbook|triage|burnout|on-?call", re.I)),
    ("threat", re.compile(r"actor|apt|campaign|malware|exploit", re.I)),
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


def kev_refs(notes) -> list[str]:
    """Vendor advisory links from KEV's notes field (https only, NVD link dropped as we add our own)."""
    out = []
    for u in re.findall(r"https://[^\s;,]+", str(notes or ""))[:8]:
        u = u.rstrip(").")
        if "nvd.nist.gov" in u:
            continue
        ok = safe_url(u, "*")
        if ok and ok not in out:
            out.append(ok)
    return out[:3]


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
            "refs": kev_refs(v.get("notes")),
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
# Ransomware activity (ransomware.live, free public API). Aggregates only:
# we never store or publish victim names.
# --------------------------------------------------------------------------
RL = "https://api.ransomware.live/v2"
GROUP_RE = re.compile(r"^[a-z0-9][a-z0-9 ._-]{0,40}$")


def _victim_fields(v) -> tuple[str, str | None, str, str]:
    g = str(v.get("group") or v.get("group_name") or "").strip().lower()
    d = day(v.get("attackdate") or v.get("discovered") or v.get("published") or v.get("date"))
    sec = clean(v.get("activity") or v.get("sector") or "", 40)
    cc = str(v.get("country") or "").strip().upper()
    return g, d, sec, cc if re.match(r"^[A-Z]{2}$", cc) else ""


def build_ransomware(prev: dict) -> dict:
    victims, ok = [], 0
    months = {(NOW.year, NOW.month), ((NOW - dt.timedelta(days=31)).year, (NOW - dt.timedelta(days=31)).month)}
    for y, m in sorted(months):
        try:
            raw = get_json(f"{RL}/victims/{y}/{m:02d}", max_bytes=30_000_000, timeout=90)
            items = raw if isinstance(raw, list) else raw.get("victims") or raw.get("data") or []
            victims += [x for x in items if isinstance(x, dict)]
            ok += 1
        except Exception as e:  # noqa: BLE001
            log(f"[ransomware] {y}-{m:02d}: {type(e).__name__}: {str(e)[:120]}")
        time.sleep(1.5)
    if not ok or not victims:
        keep = {k: v for k, v in prev.items() if k != "generated"}
        return {"generated": iso(NOW), **keep, "status": {"ransomware.live": "stale" if keep.get("groups7") else "failed"}}
    today = NOW.date()
    g7, g30, sec30, cc30, daily = {}, {}, {}, {}, {}
    for v in victims:
        g, d, sec, cc = _victim_fields(v)
        if not d or not GROUP_RE.match(g):
            continue
        age = (today - dt.date.fromisoformat(d)).days
        if age < 0 or age > 30:
            continue
        g30[g] = g30.get(g, 0) + 1
        if age <= 7:
            g7[g] = g7.get(g, 0) + 1
        if sec:
            sec30[sec] = sec30.get(sec, 0) + 1
        if cc:
            cc30[cc] = cc30.get(cc, 0) + 1
        daily[d] = daily.get(d, 0) + 1
    top = lambda m, n: [[k, v] for k, v in sorted(m.items(), key=lambda x: -x[1])[:n]]
    days = [(today - dt.timedelta(days=i)).isoformat() for i in range(29, -1, -1)]
    return {"generated": iso(NOW), "status": {"ransomware.live": "ok"},
            "total7": sum(g7.values()), "total30": sum(g30.values()), "groups7": top(g7, 15), "groups30": top(g30, 20),
            "sectors30": top(sec30, 10), "countries30": top(cc30, 40), "daily": [[d, daily.get(d, 0)] for d in days]}


# --------------------------------------------------------------------------
# Threat map: botnet C2 servers (abuse.ch Feodo Tracker), most-scanned ports and Infocon (SANS ISC),
# and, if a token is set, Cloudflare Radar's top application-layer attack origin->target pairs.
# --------------------------------------------------------------------------
FEODO = "https://feodotracker.abuse.ch/downloads/ipblocklist.json"
ISC = "https://isc.sans.edu/api"
RADAR = "https://api.cloudflare.com/client/v4/radar"
CC_RE = re.compile(r"^[A-Z]{2}$")
NAME_RE = re.compile(r"^[A-Za-z0-9_ &,./()'+-]{1,50}$")
MAL_RE = re.compile(r"^[A-Za-z0-9 ._-]{1,40}$")


def _top(m: dict, n: int) -> list:
    return [[k, v] for k, v in sorted(m.items(), key=lambda x: -x[1])[:n]]


def build_threatmap(prev: dict) -> dict:
    out = {"generated": iso(NOW), "status": {}}
    # Feodo Tracker C2 blocklist (counts only)
    try:
        hdr = {"Auth-Key": os.environ["ABUSECH_AUTH_KEY"]} if os.environ.get("ABUSECH_AUTH_KEY") else {}
        rows = get_json(FEODO, headers=hdr, max_bytes=20_000_000)
        rows = [r for r in rows if isinstance(r, dict)] if isinstance(rows, list) else []
        if not rows:
            raise ValueError("empty")
        byc, bym, online = {}, {}, 0
        for r in rows:
            cc = str(r.get("country") or "").upper()
            if CC_RE.match(cc):
                byc[cc] = byc.get(cc, 0) + 1
            m = clean(r.get("malware"), 40)
            if MAL_RE.match(m):
                bym[m] = bym.get(m, 0) + 1
            if str(r.get("status") or "").lower() == "online":
                online += 1
        out["c2"] = {"total": len(rows), "online": online, "countries": _top(byc, 40), "malware": _top(bym, 8)}
        out["status"]["Feodo Tracker"] = "ok"
    except Exception as e:  # noqa: BLE001
        log(f"[threatmap] feodo: {type(e).__name__}: {str(e)[:120]}")
        if prev.get("c2"):
            out["c2"] = prev["c2"]
        out["status"]["Feodo Tracker"] = "stale" if prev.get("c2") else "failed"
    # SANS ISC: top attacked ports and Infocon
    try:
        raw = get_json(f"{ISC}/topports/records/10?json")
        rows = raw.values() if isinstance(raw, dict) else raw
        ports = []
        for r in rows:
            if not isinstance(r, dict) or "targetport" not in r:
                continue
            try:
                ports.append([int(r["targetport"]), int(r.get("records") or 0), int(r.get("targets") or 0), int(r.get("sources") or 0)])
            except (TypeError, ValueError):
                continue
        if not ports:
            raise ValueError("no ports")
        out["ports"] = sorted(ports, key=lambda x: -x[1])[:10]
        out["status"]["SANS ISC"] = "ok"
    except Exception as e:  # noqa: BLE001
        log(f"[threatmap] isc ports: {type(e).__name__}: {str(e)[:120]}")
        if prev.get("ports"):
            out["ports"] = prev["ports"]
        out["status"]["SANS ISC"] = "stale" if prev.get("ports") else "failed"
    # Daily attack reports (sum of the top-10 port records) for the last 14 complete days; only missing days are fetched.
    have = {d: n for d, n in (prev.get("daily") or []) if isinstance(d, str) and isinstance(n, int)}
    days = [(NOW - dt.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(14, 0, -1)]
    for d in days:
        if d in have:
            continue
        try:
            raw = get_json(f"{ISC}/topports/records/10/{d}?json")
            rows = raw.values() if isinstance(raw, dict) else raw
            tot = sum(int(r.get("records") or 0) for r in rows if isinstance(r, dict) and "targetport" in r)
            if tot:
                have[d] = tot
        except Exception as e:  # noqa: BLE001
            log(f"[threatmap] isc daily {d}: {type(e).__name__}")
        time.sleep(1)                                      # be gentle with ISC: one request per second at most
    out["daily"] = [[d, have[d]] for d in days if d in have]
    try:
        ic = str(get_json(f"{ISC}/infocon?json").get("status") or "").lower()
        out["infocon"] = ic if ic in ("green", "yellow", "orange", "red") else prev.get("infocon", "")
    except Exception as e:  # noqa: BLE001
        log(f"[threatmap] infocon: {type(e).__name__}")
        out["infocon"] = prev.get("infocon", "")
    # Cloudflare Radar (optional, free API token with Radar read permission)
    tok = os.environ.get("CLOUDFLARE_RADAR_TOKEN")
    if tok:
        try:
            h = {"Authorization": "Bearer " + tok}
            f = lambda v: round(float(v), 3)
            ok_cc = lambda x: bool(CC_RE.match(str(x)))
            q = "format=json&dateRange=1d"
            pairs = get_json(f"{RADAR}/attacks/layer7/top/attacks?limit=24&limitDirection=ORIGIN&limitPerLocation=3&{q}", headers=h)["result"]["top_0"]
            org = get_json(f"{RADAR}/attacks/layer7/top/locations/origin?limit=10&{q}", headers=h)["result"]["top_0"]
            tgt = get_json(f"{RADAR}/attacks/layer7/top/locations/target?limit=10&{q}", headers=h)["result"]["top_0"]
            radar = {
                "pairs": [[p["originCountryAlpha2"], p["targetCountryAlpha2"], f(p["value"])] for p in pairs if ok_cc(p.get("originCountryAlpha2")) and ok_cc(p.get("targetCountryAlpha2"))],
                "origins": [[p["originCountryAlpha2"], f(p["value"])] for p in org if ok_cc(p.get("originCountryAlpha2"))],
                "targets": [[p["targetCountryAlpha2"], f(p["value"])] for p in tgt if ok_cc(p.get("targetCountryAlpha2"))]}
            # extras: each is optional, a failure only drops that layer
            try:
                p3 = get_json(f"{RADAR}/attacks/layer3/top/attacks?limit=16&limitDirection=ORIGIN&limitPerLocation=3&{q}", headers=h)["result"]["top_0"]
                radar["pairs3"] = [[p["originCountryAlpha2"], p["targetCountryAlpha2"], f(p["value"])] for p in p3 if ok_cc(p.get("originCountryAlpha2")) and ok_cc(p.get("targetCountryAlpha2"))]
            except Exception as e:  # noqa: BLE001
                log(f"[threatmap] radar l3: {type(e).__name__}: {str(e)[:100]}")
            try:
                ser = get_json(f"{RADAR}/attacks/layer7/timeseries?dateRange=7d&aggInterval=1h&format=json", headers=h)["result"]["serie_0"]
                ts, vs = ser.get("timestamps", []), ser.get("values", [])
                pts = [[str(t)[:16], f(v)] for t, v in zip(ts, vs)]
                radar["series"] = pts[-168:][::4]          # 7 days, one point every 4 h
            except Exception as e:  # noqa: BLE001
                log(f"[threatmap] radar series: {type(e).__name__}: {str(e)[:100]}")
            out["radar"] = radar
            out["status"]["Cloudflare Radar"] = "ok"
            for dim, key in (("industry", "industries"), ("mitigation_product", "mitigation")):
                try:
                    summ = get_json(f"{RADAR}/attacks/layer7/summary/{dim}?dateRange=1d&format=json", headers=h)["result"]["summary_0"]
                    rows = [[clean(k, 50), f(v)] for k, v in summ.items() if isinstance(k, str) and NAME_RE.match(k) and k.lower() != "other"]
                    out["radar"][key] = sorted(rows, key=lambda x: -x[1])[:8]
                except Exception as e2:  # noqa: BLE001
                    log(f"[threatmap] radar {dim}: {type(e2).__name__}: {str(e2)[:100]}")
                    out["radar"][key] = (prev.get("radar") or {}).get(key, [])
        except Exception as e:  # noqa: BLE001
            log(f"[threatmap] radar: {type(e).__name__}: {str(e)[:120]}")
            if prev.get("radar"):
                out["radar"] = prev["radar"]
            out["status"]["Cloudflare Radar"] = "stale" if prev.get("radar") else "failed"
    return out


# --------------------------------------------------------------------------
# AI library advisories: GitHub's reviewed security advisories for popular AI/ML and agent packages.
# --------------------------------------------------------------------------
AI_PKGS = [("pip", "langchain"), ("pip", "langchain-core"), ("pip", "langchain-community"), ("pip", "llama-index"), ("pip", "transformers"),
           ("pip", "vllm"), ("pip", "mlflow"), ("pip", "gradio"), ("pip", "litellm"), ("pip", "langflow"), ("pip", "open-webui"),
           ("pip", "torch"), ("pip", "keras"), ("pip", "ray"), ("pip", "jupyter-server"), ("pip", "mcp"),
           ("npm", "@modelcontextprotocol/sdk"), ("npm", "ai"), ("npm", "langchain"), ("npm", "@langchain/core"),
           ("go", "github.com/ollama/ollama")]
GHSA_RE = re.compile(r"^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$")


def build_advisories(prev: dict) -> dict:
    hdr = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if os.environ.get("GITHUB_TOKEN"):
        hdr["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    seen, items, fails = set(), [], 0
    for eco, pkg in AI_PKGS:
        try:
            rows = get_json(f"https://api.github.com/advisories?type=reviewed&ecosystem={eco}&affects={urllib.parse.quote(pkg, safe='')}&per_page=10&sort=published&direction=desc", headers=hdr)
        except Exception as e:  # noqa: BLE001
            fails += 1
            log(f"[advisories] {pkg}: {type(e).__name__}: {str(e)[:80]}")
            continue
        for a in rows if isinstance(rows, list) else []:
            gid = str(a.get("ghsa_id", ""))
            if not GHSA_RE.match(gid) or gid in seen:
                continue
            d = parse_date(a.get("published_at"))
            if not d or (NOW - d).days > 180:
                continue
            u = safe_url(a.get("html_url"), "*")
            if not u or not u.startswith("https://github.com/"):
                continue
            seen.add(gid)
            cve = str(a.get("cve_id") or "")
            sev = str(a.get("severity") or "").lower()
            items.append({"id": gid, "cve": cve if CVE_RE.match(cve) else "", "t": clean(a.get("summary"), 200), "sev": sev if sev in ("low", "medium", "high", "critical") else "unknown",
                          "pkg": clean(pkg, 60), "eco": eco, "d": iso(d), "u": u})
    if fails == len(AI_PKGS):
        log("[advisories] all requests failed; keeping previous")
        return {**prev, "status": {"GitHub advisories": "stale" if prev.get("items") else "failed"}} if prev else {"generated": iso(NOW), "items": [], "status": {"GitHub advisories": "failed"}}
    items.sort(key=lambda x: x["d"], reverse=True)
    return {"generated": iso(NOW), "items": items[:30], "status": {"GitHub advisories": "ok" if not fails else f"{len(AI_PKGS) - fails}/{len(AI_PKGS)} packages"}}


# --------------------------------------------------------------------------
# Certifications: curated evergreen list (pipeline/certs.yaml), links re-checked weekly,
# plus any certification news from the feeds.
# --------------------------------------------------------------------------
CERT_PATHS, CERT_LEVELS, CERT_FMTS = {"blue", "red", "cloud", "dfir", "grc", "start"}, {"entry", "mid", "adv"}, {"lab", "mcq", "mixed"}


def link_ok(url: str) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Range": "bytes=0-2047"})
        with _OPENER.open(req, timeout=25) as r:
            r.read(2048)
            return 200 <= r.status < 400
    except urllib.error.HTTPError as e:
        return e.code in (401, 403, 405, 429)   # alive but unfriendly to bots
    except Exception:  # noqa: BLE001
        return False


def build_certs(prev: dict, news_items: list) -> dict:
    if yaml is None:
        raise RuntimeError("PyYAML is required for certs")
    with open(os.path.join(HERE, "certs.yaml"), encoding="utf-8") as f:
        raw = yaml.safe_load(f) or []
    old = {c.get("id"): c for c in prev.get("certs", []) if isinstance(c, dict)}
    last = parse_date(prev.get("checked"))
    recheck = not last or (NOW - last).days >= 7
    certs = []
    for c in raw:
        cid = str(c.get("id", ""))
        if not re.match(r"^[a-z0-9_]{2,20}$", cid) or c.get("path") not in CERT_PATHS or c.get("level") not in CERT_LEVELS or c.get("fmt") not in CERT_FMTS:
            log(f"[certs] skipping bad entry {cid!r}")
            continue
        u, home = safe_url(c.get("u"), "*"), safe_url(c.get("home"), "*")
        if not u or not home:
            continue
        ok = link_ok(u) if recheck else old.get(cid, {}).get("ok", True)
        certs.append({"id": cid, "n": clean(c.get("n"), 80), "by": clean(c.get("by"), 40), "path": c["path"], "level": c["level"], "fmt": c["fmt"],
                      "focus": clean(c.get("focus"), 200), "tips": [clean(t, 160) for t in (c.get("tips") or [])][:4], "u": u if ok else home, "ok": bool(ok)})
    names = [re.escape(x) for x in ("OSCP", "OSCP+", "CISSP", "Security+", "CySA+", "GIAC", "SAL1", "BTL1", "PNPT", "CPTS", "CRTO", "SC-200", "AZ-500", "CISM", "CCSK", "OffSec", "certification", "certified")]
    rx = re.compile(r"(?i)\b(" + "|".join(names) + r")")
    news = [i for i in news_items if rx.search(i.get("t", "") + " " + i.get("x", ""))][:12]
    return {"generated": iso(NOW), "checked": iso(NOW) if recheck else prev.get("checked"), "certs": certs, "news": news,
            "status": {"links": f"{sum(c['ok'] for c in certs)}/{len(certs)} official pages reachable"}}


# --------------------------------------------------------------------------
# Under attack: who to contact, per country, links re-checked weekly.
# --------------------------------------------------------------------------
CONTACT_KINDS = {"cert", "police", "reg", "help"}


def build_contacts(prev: dict) -> dict:
    if yaml is None:
        raise RuntimeError("PyYAML is required for contacts")
    with open(os.path.join(HERE, "contacts.yaml"), encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}
    last = parse_date(prev.get("checked"))
    recheck = not last or (NOW - last).days >= 7
    old = {(c.get("n"), c.get("home")): c.get("ok", True) for grp in [prev.get("global", []), prev.get("guides", [])] + [v.get("items", []) for v in (prev.get("countries") or {}).values()] for c in grp if isinstance(c, dict)}

    def item(c):
        if c.get("kind") not in CONTACT_KINDS:
            return None
        u, home = safe_url(c.get("u"), "*"), safe_url(c.get("home"), "*")
        if not u or not home:
            return None
        ok = link_ok(u) if recheck else old.get((clean(c.get("n"), 60), home), True)
        return {"kind": c["kind"], "n": clean(c.get("n"), 60), "what": clean(c.get("what"), 200), "u": u if ok else home, "home": home, "ok": bool(ok)}

    countries = {}
    for cc, v in (raw.get("countries") or {}).items():
        if not re.match(r"^[A-Z]{2}$", str(cc)):
            continue
        items = [x for x in (item(c) for c in v.get("items", [])) if x]
        if items:
            countries[cc] = {"name": clean(v.get("name"), 60), "items": items}
    glob = [x for x in (item(c) for c in raw.get("global", [])) if x]
    guides = [x for x in (item(c) for c in raw.get("guides", [])) if x]
    return {"generated": iso(NOW), "checked": iso(NOW) if recheck else prev.get("checked"), "countries": countries, "global": glob, "guides": guides}


# --------------------------------------------------------------------------
# MCP registry: newest published servers (official registry, no key)
# --------------------------------------------------------------------------
MCP_REG = "https://registry.modelcontextprotocol.io/v0/servers"


def build_mcp(prev_items: list) -> tuple[list, str]:
    found, cursor = [], None
    try:
        for _ in range(4):
            q = {"limit": 100}
            if cursor:
                q["cursor"] = cursor
            raw = get_json(f"{MCP_REG}?{urllib.parse.urlencode(q)}", timeout=60)
            for entry in raw.get("servers") or []:
                srv = entry.get("server") if isinstance(entry.get("server"), dict) else entry
                meta = (entry.get("_meta") or srv.get("_meta") or {})
                off = meta.get("io.modelcontextprotocol.registry/official") or meta.get("io.modelcontextprotocol.registry") or {}
                when = off.get("updatedAt") or off.get("updated_at") or off.get("publishedAt") or off.get("published_at")
                if off.get("isLatest") is False or str(off.get("status", "active")).lower() not in ("active", ""):
                    continue
                name = clean(srv.get("name"), 120)
                repo = srv.get("repository") or {}
                url = safe_url(repo.get("url") if isinstance(repo, dict) else None, ["github.com", "gitlab.com"]) or None
                if not name or not when:
                    continue
                found.append({"t": name, "x": clean(srv.get("description"), 220), "v": clean(srv.get("version"), 30),
                              "u": url, "d": iso(parse_date(when)) or iso(NOW), "remote": bool(srv.get("remotes")),
                              "pkg": clean(",".join(sorted({str(p.get("registryType") or p.get("registry_type") or "")
                                                             for p in (srv.get("packages") or []) if isinstance(p, dict)} - {""})), 40)})
            cursor = (raw.get("metadata") or {}).get("nextCursor") or (raw.get("metadata") or {}).get("next_cursor")
            if not cursor:
                break
            time.sleep(0.5)
        if not found:
            raise ValueError("no servers parsed")
    except Exception as e:  # noqa: BLE001
        log(f"[mcp] registry: {type(e).__name__}: {str(e)[:150]}")
        return prev_items, ("stale" if prev_items else "failed")
    seen, out = set(), []
    for it in sorted(found, key=lambda x: x["d"], reverse=True):
        if it["t"] in seen:
            continue
        seen.add(it["t"])
        out.append(it)
    return out[:40], "ok"


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
            for u in k.get("refs", []):
                _check_url(u, "kev.refs")
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
        for grp in ("security", "ai", "soc", "gov"):
            for i in data.get(grp, []):
                _check_item(i, grp)
                _check_str(i.get("x", ""), 260, grp + ".x")
        for m in data.get("mcp", []):
            _check_str(m.get("t"), 120, "mcp.t", False)
            _check_str(m.get("x", ""), 220, "mcp.x")
            _check_url(m.get("u"), "mcp.u")
    elif kind == "ransomware":
        for k in ("groups7", "groups30", "sectors30", "countries30", "daily"):
            for pair in data.get(k, []):
                if not (isinstance(pair, list) and len(pair) == 2 and isinstance(pair[0], str) and isinstance(pair[1], int)):
                    raise Invalid("ransomware." + k)
                _check_str(pair[0], 60, "ransomware." + k)
    elif kind == "threatmap":
        c2 = data.get("c2") or {}
        for k in ("countries", "malware"):
            for pair in c2.get(k, []):
                if not (isinstance(pair, list) and len(pair) == 2 and isinstance(pair[1], int)):
                    raise Invalid("threatmap.c2." + k)
                if k == "countries" and not CC_RE.match(pair[0]):
                    raise Invalid("threatmap.cc")
                _check_str(pair[0], 40, "threatmap.c2")
        for p in data.get("ports", []):
            if not (isinstance(p, list) and len(p) == 4 and all(isinstance(x, int) for x in p) and 0 <= p[0] <= 65535):
                raise Invalid("threatmap.ports")
        if data.get("infocon", "") not in ("", "green", "yellow", "orange", "red"):
            raise Invalid("threatmap.infocon")
        r = data.get("radar") or {}
        for p in r.get("pairs", []):
            if not (len(p) == 3 and CC_RE.match(p[0]) and CC_RE.match(p[1]) and isinstance(p[2], (int, float))):
                raise Invalid("threatmap.radar.pairs")
        for p in r.get("pairs3", []):
            if not (len(p) == 3 and CC_RE.match(p[0]) and CC_RE.match(p[1]) and isinstance(p[2], (int, float))):
                raise Invalid("threatmap.radar.pairs3")
        for k in ("origins", "targets"):
            for p in r.get(k, []):
                if not (len(p) == 2 and CC_RE.match(p[0]) and isinstance(p[1], (int, float))):
                    raise Invalid("threatmap.radar." + k)
        for k in ("industries", "mitigation"):
            for p in r.get(k, []):
                if not (len(p) == 2 and isinstance(p[0], str) and NAME_RE.match(p[0]) and isinstance(p[1], (int, float))):
                    raise Invalid("threatmap.radar." + k)
        for p in data.get("daily", []):
            if not (len(p) == 2 and re.match(r"^\d{4}-\d{2}-\d{2}$", p[0]) and isinstance(p[1], int)):
                raise Invalid("threatmap.daily")
        for p in r.get("series", []):
            if not (len(p) == 2 and re.match(r"^\d{4}-\d\d-\d\dT\d\d:\d\d$", p[0]) and isinstance(p[1], (int, float))):
                raise Invalid("threatmap.radar.series")
        for p in r.get("industries", []):
            if not (len(p) == 2 and isinstance(p[1], (int, float))):
                raise Invalid("threatmap.radar.industries")
            _check_str(p[0], 50, "threatmap.industry", False)
    elif kind == "advisories":
        for a in data.get("items", []):
            if not GHSA_RE.match(a["id"]) or (a["cve"] and not CVE_RE.match(a["cve"])) or a["eco"] not in ("pip", "npm", "go") or a["sev"] not in ("low", "medium", "high", "critical", "unknown"):
                raise Invalid("advisories.item")
            _check_str(a["t"], 200, "advisories.t", False)
            _check_str(a["pkg"], 60, "advisories.pkg", False)
            _check_url(a["u"], "advisories.u")
    elif kind == "contacts":
        groups = [data.get("global", []), data.get("guides", [])] + [v["items"] for v in data.get("countries", {}).values()]
        for cc, v in data.get("countries", {}).items():
            if not CC_RE.match(cc):
                raise Invalid("contacts.cc")
            _check_str(v["name"], 60, "contacts.name", False)
        for g in groups:
            for c in g:
                if c["kind"] not in CONTACT_KINDS:
                    raise Invalid("contacts.kind")
                _check_str(c["n"], 60, "contacts.n", False)
                _check_str(c["what"], 200, "contacts.what")
                _check_url(c["u"], "contacts.u")
                _check_url(c["home"], "contacts.home")
    elif kind == "certs":
        for c in data["certs"]:
            for f, n in (("n", 80), ("by", 40), ("focus", 200)):
                _check_str(c[f], n, "certs." + f, False)
            for t in c["tips"]:
                _check_str(t, 160, "certs.tip")
            _check_url(c["u"], "certs.u")
            if c["path"] not in CERT_PATHS or c["level"] not in CERT_LEVELS or c["fmt"] not in CERT_FMTS:
                raise Invalid("certs.enum")
        for i in data.get("news", []):
            _check_item(i, "certs.news")
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
    ap.add_argument("--only", choices=["cves", "news", "malware", "detections", "ransomware", "threatmap", "certs", "advisories", "contacts"], action="append")
    ap.add_argument("--validate", action="store_true", help="only validate existing files")
    a = ap.parse_args(argv)
    out = os.path.abspath(a.out)
    os.makedirs(out, exist_ok=True)
    kinds = a.only or ["news", "cves", "malware", "detections", "ransomware", "threatmap", "certs", "advisories", "contacts"]

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
    if "news" in kinds or "malware" in kinds or "certs" in kinds:
        sec, s1 = fetch_feeds(NEWS_FEEDS, news_prev.get("security", []), SEC_TAGS, "news")
        ai, s2 = fetch_feeds(AI_FEEDS, news_prev.get("ai", []), AI_TAGS, "ai")
        soc, s3 = fetch_feeds(SOC_FEEDS, news_prev.get("soc", []), SOC_TAGS, "soc")
        mcp, s4 = build_mcp(news_prev.get("mcp", []))
        gov, s5 = fetch_feeds(GOV_FEEDS, news_prev.get("gov", []), GOV_TAGS, "gov")
        news = {"generated": iso(NOW), "status": {**s1, **s2, **s3, **s5, "MCP registry": s4}, "security": sec, "ai": ai, "soc": soc, "mcp": mcp, "gov": gov[:40]}
        if "news" in kinds:
            results["news"] = news
    if "cves" in kinds:
        results["cves"] = build_cves(load_prev(out, "cves"))
    if "malware" in kinds:
        results["malware"] = build_malware(load_prev(out, "malware"), (news or {}).get("security", []))
    if "detections" in kinds:
        results["detections"] = build_detections(load_prev(out, "detections"))
    if "ransomware" in kinds:
        results["ransomware"] = build_ransomware(load_prev(out, "ransomware"))
    if "threatmap" in kinds:
        results["threatmap"] = build_threatmap(load_prev(out, "threatmap"))
    if "advisories" in kinds:
        results["advisories"] = build_advisories(load_prev(out, "advisories"))
    if "contacts" in kinds:
        results["contacts"] = build_contacts(load_prev(out, "contacts"))
    if "certs" in kinds:
        n = news or {}
        results["certs"] = build_certs(load_prev(out, "certs"), n.get("security", []) + n.get("soc", []))

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
