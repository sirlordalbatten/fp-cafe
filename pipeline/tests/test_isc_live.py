import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import isc_live  # noqa: E402


class IscLive(unittest.TestCase):
    def _fake(self, url, **kw):
        if "infocon" in url:
            return {"status": "Yellow"}
        return {"0": {"rank": 1, "targetport": 23, "records": 5000, "date": "2026-11-28"}, "1": {"rank": 2, "targetport": "22", "records": "2000"}, "2": {"x": 1}}

    def test_collect(self):
        with mock.patch.object(isc_live.R, "get_json", side_effect=self._fake):
            d = isc_live.collect()
        self.assertEqual(d, {"infocon": "yellow", "day": "2026-11-28", "ports": [[23, 5000], [22, 2000]]})

    def test_skips_without_secret_and_never_prints_it(self):
        with mock.patch.dict(os.environ, {"LIVE_INGEST_SECRET": ""}, clear=False), mock.patch.object(isc_live.R, "http_get") as hg:
            self.assertEqual(isc_live.main(), 0)
            hg.assert_not_called()

    def test_posts_to_ingest(self):
        secret = "k" * 40
        with mock.patch.dict(os.environ, {"LIVE_INGEST_SECRET": secret, "SITE_URL": "https://example.pages.dev/"}), \
             mock.patch.object(isc_live.R, "get_json", side_effect=self._fake), \
             mock.patch.object(isc_live.R, "http_get", return_value=b'{"ok":true}') as hg, \
             mock.patch("builtins.print") as pr:
            isc_live.main()
        url = hg.call_args.args[0]; kw = hg.call_args.kwargs
        self.assertEqual(url, "https://example.pages.dev/api/ingest")
        self.assertEqual(json.loads(kw["data"])["source"], "isc")
        self.assertEqual(kw["headers"]["Authorization"], "Bearer " + secret)
        self.assertNotIn(secret, " ".join(str(c) for c in pr.call_args_list))

    def test_refuses_plain_http(self):
        with mock.patch.dict(os.environ, {"LIVE_INGEST_SECRET": "k" * 40, "SITE_URL": "http://example.pages.dev"}):
            with self.assertRaises(SystemExit):
                isc_live.main()


if __name__ == "__main__":
    unittest.main()
