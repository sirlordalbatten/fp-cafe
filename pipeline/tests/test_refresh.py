"""Tests for the data pipeline. Run: python3 -m unittest discover -s pipeline/tests"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import refresh as R  # noqa: E402

FX = os.path.join(HERE, "fixtures")


def fx(name, mode="rb"):
    with open(os.path.join(FX, name), mode) as f:
        data = f.read()
    if name == "kev.json":
        # Re-date the sample catalogue relative to today, so date-based counts never go stale.
        import datetime as dt
        doc = json.loads(data)
        today = R.NOW.date()
        for i, v in enumerate(doc["vulnerabilities"]):
            if "dateAdded" in v:
                v["dateAdded"] = (today - dt.timedelta(days=i)).isoformat()
                v["dueDate"] = (today - dt.timedelta(days=i - 21)).isoformat()
        data = json.dumps(doc).encode()
    return data


class Sanitising(unittest.TestCase):
    def test_clean_strips_markup_entities_and_bidi(self):
        s = R.clean("Hi <script>alert(1)</script> &lt;img src=x onerror=1&gt; evil\u202etxt.exe", 200)
        self.assertNotIn("<", s)
        self.assertNotIn("\u202e", s)
        self.assertTrue(s.startswith("Hi"))

    def test_clean_caps_length(self):
        self.assertLessEqual(len(R.clean("a" * 500, 50)), 50)

    def test_safe_url(self):
        self.assertEqual(R.safe_url("https://cisa.gov/x", ["cisa.gov"]), "https://cisa.gov/x")
        self.assertEqual(R.safe_url("https://www.cisa.gov/x", ["cisa.gov"]), "https://www.cisa.gov/x")
        for bad in ("javascript:alert(1)", "http://cisa.gov/x", "https://evilcisa.gov/x",
                    "https://cisa.gov.evil.com/x", "https://user:pw@cisa.gov/", "https://cisa.gov/\"onload=1",
                    "data:text/html,hi", "//cisa.gov/x"):
            self.assertIsNone(R.safe_url(bad, ["cisa.gov"]), bad)

    def test_clean_code_keeps_lines(self):
        self.assertEqual(R.clean_code("a\r\n\tb\x00"), "a\n  b")


class Feeds(unittest.TestCase):
    def test_rss_filters_bad_links_and_markup(self):
        items = R.parse_feed(fx("rss.xml"), "BleepingComputer", ["bleepingcomputer.com"])
        self.assertEqual(len(items), 2)
        self.assertNotIn("<", items[0]["t"])
        self.assertNotIn("onerror", items[0]["x"].replace("onerror", "") + "")  # no tags survive
        self.assertNotIn("<img", items[0]["x"])
        self.assertTrue(all(i["u"].startswith("https://www.bleepingcomputer.com/") for i in items))

    def test_atom(self):
        items = R.parse_feed(fx("atom.xml"), "MCP Python SDK", ["github.com"])
        self.assertEqual(items[0]["t"], "v1.24.0")
        self.assertEqual(items[0]["d"], "2026-11-20T10:00:00Z")

    def test_entity_bomb_refused(self):
        with self.assertRaises(ValueError):
            R.parse_feed(fx("evil.xml"), "x", ["isc.sans.edu"])

    def test_fetch_feeds_keeps_previous_on_failure(self):
        prev = [{"t": "old", "u": "https://isc.sans.edu/old", "s": "SANS ISC", "d": R.iso(R.NOW), "x": ""}]
        with mock.patch.object(R, "http_get", side_effect=IOError("down")):
            items, status = R.fetch_feeds([("SANS ISC", "https://isc.sans.edu/rss", ["isc.sans.edu"])],
                                          prev, R.SEC_TAGS, "t")
        self.assertEqual(status["SANS ISC"], "stale")
        self.assertEqual(items[0]["t"], "old")


class Cves(unittest.TestCase):
    def test_kev(self):
        kev = R.build_kev(json.loads(fx("kev.json")))
        self.assertEqual(len(kev), 150)
        self.assertNotIn("<", kev[0]["desc"])
        self.assertEqual(kev[0]["cwe"], ["CWE-78"])
        st = R.kev_stats(kev)
        self.assertEqual(st["kevAdded7"], 8)
        self.assertEqual(st["lastEdge"], kev[0]["added"])

    def test_kev_rejects_garbage(self):
        with self.assertRaises(ValueError):
            R.build_kev({"vulnerabilities": []})

    def test_nvd_item(self):
        raw = json.loads(fx("nvd.json"))
        items = [R._nvd_item(v) for v in raw["vulnerabilities"]]
        self.assertEqual(items[0]["cvss"], 9.8)
        self.assertEqual(items[0]["vendor"], "php")
        self.assertIsNone(items[1])

    def test_build_cves_end_to_end(self):
        def fake(url, **kw):
            if "known_exploited" in url:
                return fx("kev.json")
            if "nvd.nist.gov" in url:
                return fx("nvd.json")
            if "epss" in url:
                return fx("epss.json")
            raise IOError(url)
        with mock.patch.object(R, "http_get", side_effect=fake), mock.patch.object(R.time, "sleep"):
            d = R.build_cves({})
        R.validate("cves", d)
        self.assertEqual(d["status"]["kev"], "ok")
        self.assertEqual(d["epss"]["CVE-2026-10000"], [0.93, 0.999])
        self.assertNotIn("CVE-2026-99001", d["epss"])  # bad number dropped

    def test_build_cves_all_down_keeps_previous(self):
        prev = {"kev": [{"id": "CVE-2020-1472", "vendor": "M", "product": "N", "title": "t", "desc": "d",
                         "action": "a", "added": "2020-09-18", "due": None, "ransomware": True, "cwe": []}],
                "nvd": [], "epss": {}, "stats": {"kevTotal": 1}}
        with mock.patch.object(R, "http_get", side_effect=IOError("down")), mock.patch.object(R.time, "sleep"):
            d = R.build_cves(prev)
        self.assertEqual(d["status"]["kev"], "stale")
        self.assertEqual(d["kev"][0]["id"], "CVE-2020-1472")


class Rules(unittest.TestCase):
    SIGMA = """title: Suspicious Certutil Download
id: 11111111-2222-3333-4444-555555555555
status: test
description: Detects certutil used to download a file
author: Someone
date: 2026-11-01
tags:
  - attack.command-and-control
  - attack.t1105
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\certutil.exe'
    CommandLine|contains: 'urlcache'
  condition: selection
falsepositives:
  - Admin scripts
level: high
"""
    SPLUNK = """name: Windows LSASS Access
id: x
date: '2026-11-02'
author: Splunk
status: production
type: TTP
description: Finds <b>LSASS</b> access
data_source:
  - Sysmon EventID 10
search: '`sysmon` EventCode=10 TargetImage=*lsass.exe | stats count by host'
how_to_implement: Needs Sysmon
known_false_positives: Backup agents
tags:
  mitre_attack_id:
    - T1003.001
"""
    SENTINEL = """id: 1
name: Mass file deletion
description: |
  Many deletes
severity: Medium
tactics:
  - Impact
relevantTechniques:
  - T1485
query: |
  OfficeActivity
  | where Operation == "FileDeleted"
  | summarize count() by UserId
"""
    YARAL = """rule suspicious_powershell_download {
  meta:
    author = "Google"
    description = "PowerShell downloading a file"
    severity = "High"
    mitre_attack_tactic = "Execution"
    mitre_attack_technique = "T1059.001"
  events:
    $e.metadata.event_type = "PROCESS_LAUNCH"
    re.regex($e.target.process.command_line, `(?i)downloadstring`)
  condition:
    $e
}
"""

    def src(self, key):
        return next(s for s in R.DET_SOURCES if s["key"] == key)

    def test_parsers(self):
        r = R.parse_rule(self.src("sigma"), "rules/windows/a.yml", "2026-11-01T00:00:00Z", self.SIGMA)
        self.assertEqual((r["level"], r["tech"], r["tactics"]), ("high", ["T1105"], ["command and control"]))
        r = R.parse_rule(self.src("splunk"), "detections/a.yml", "2026-11-02T00:00:00Z", self.SPLUNK)
        self.assertEqual((r["level"], r["tech"]), ("high", ["T1003.001"]))
        self.assertNotIn("<b>", r["desc"])
        r = R.parse_rule(self.src("sentinel"), "Solutions/X/Analytic Rules/a.yaml", "2026-11-03T00:00:00Z", self.SENTINEL)
        self.assertEqual((r["level"], r["tactics"]), ("medium", ["impact"]))
        self.assertIn("%20", r["url"])
        r = R.parse_rule(self.src("secops"), "rules/community/a.yaral", "2026-11-04T00:00:00Z", self.YARAL)
        self.assertEqual((r["level"], r["tech"]), ("high", ["T1059.001"]))
        R.validate("detections", {"generated": "x", "rules": [r]})

    def test_yaml_is_safe_loaded(self):
        with self.assertRaises(Exception):
            R.parse_rule(self.src("sigma"), "a.yml", "2026-01-01", "!!python/object/apply:os.system ['id']")

    def test_git_collection_skips_symlinks(self):
        tmp = tempfile.mkdtemp()
        try:
            repo = os.path.join(tmp, "repo")
            os.makedirs(os.path.join(repo, "rules", "windows"))
            with open(os.path.join(repo, "rules", "windows", "good.yml"), "w") as f:
                f.write(self.SIGMA)
            os.symlink("/etc/passwd", os.path.join(repo, "rules", "windows", "leak.yml"))
            git = ["git", "-C", repo, "-c", "user.email=t@t", "-c", "user.name=t"]
            subprocess.run(["git", "init", "-q", "-b", "master", repo], check=True)
            subprocess.run(git + ["add", "-A"], check=True)
            subprocess.run(git + ["commit", "-qm", "x"], check=True)
            src = dict(self.src("sigma"), git="file://" + repo, depth=5)
            files = R.recent_rule_files(src, os.path.join(tmp, "work"))
            self.assertEqual([p for p, _, _ in files], ["rules/windows/good.yml"])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class Validation(unittest.TestCase):
    def test_rejects_javascript_url(self):
        bad = {"generated": "x", "security": [{"t": "a", "u": "javascript:alert(1)", "s": "x", "d": "y"}], "ai": []}
        with self.assertRaises(R.Invalid):
            R.validate("news", bad)

    def test_rejects_control_chars(self):
        bad = {"generated": "x", "security": [{"t": "a\u202eb", "u": "https://a.b/", "s": "x", "d": "y"}], "ai": []}
        with self.assertRaises(R.Invalid):
            R.validate("news", bad)

    def test_mentions(self):
        news = R.parse_feed(fx("rss.xml"), "BleepingComputer", ["bleepingcomputer.com"])
        m = R.mention_counts(R.load_families(), news)
        self.assertIn("win.lumma", m)


if __name__ == "__main__":
    unittest.main()
