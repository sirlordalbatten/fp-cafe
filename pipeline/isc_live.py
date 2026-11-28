#!/usr/bin/env python3
"""Push SANS ISC data to the live API once an hour.

SANS ISC refuses requests from Cloudflare's servers, so the site's live API can't fetch it itself.
GitHub's servers can, so this job fetches ISC (once an hour, the rate SANS asks for) and POSTs it to
/api/ingest with a shared secret. It never commits anything, so it costs no Cloudflare builds.

Environment:
  LIVE_INGEST_SECRET  required, the same value as the Cloudflare secret (32+ characters)
  SITE_URL            optional, defaults to https://fp-cafe.pages.dev
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import refresh as R  # noqa: E402  same HTTPS-only, size-capped client as the main pipeline

ISC = "https://isc.sans.edu/api"


def collect() -> dict:
    raw = R.get_json(f"{ISC}/topports/records/10?json")
    rows = list(raw.values()) if isinstance(raw, dict) else list(raw or [])
    ports, day = [], ""
    for r in rows:
        if not isinstance(r, dict) or "targetport" not in r:
            continue
        try:
            ports.append([int(r["targetport"]), int(r.get("records") or 0)])
        except (TypeError, ValueError):
            continue
        day = day or str(r.get("date") or "")[:10]
    if isinstance(raw, dict) and not day:
        day = str(raw.get("date") or "")[:10]
    ports.sort(key=lambda p: -p[1])
    infocon = ""
    try:
        ic = R.get_json(f"{ISC}/infocon?json")
        ic = ic[0] if isinstance(ic, list) and ic else ic
        infocon = str((ic or {}).get("status") or "").lower()
    except Exception as e:  # noqa: BLE001
        print(f"infocon: {type(e).__name__}")
    if infocon not in ("green", "yellow", "orange", "red"):
        infocon = ""
    if not ports and not infocon:
        raise SystemExit("SANS ISC returned nothing usable")
    return {"infocon": infocon, "day": day, "ports": ports[:10]}


def main() -> int:
    secret = os.environ.get("LIVE_INGEST_SECRET", "")
    site = os.environ.get("SITE_URL", "").strip().rstrip("/") or "https://fp-cafe.pages.dev"
    if len(secret) < 32:
        print("LIVE_INGEST_SECRET is not set (needs 32+ characters). Skipping.")
        return 0
    if not site.startswith("https://"):
        raise SystemExit("SITE_URL must start with https://")
    data = collect()
    print(f"ISC: infocon={data['infocon'] or '?'} day={data['day'] or '?'} ports={[p[0] for p in data['ports']]}")
    body = json.dumps({"source": "isc", "data": data}).encode()
    resp = R.http_get(f"{site}/api/ingest", data=body, retries=1, max_bytes=4096,
                      headers={"Content-Type": "application/json", "Authorization": "Bearer " + secret})
    print("Live API:", resp.decode("utf-8", "replace")[:300])
    return 0


if __name__ == "__main__":
    sys.exit(main())
