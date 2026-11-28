# Setting up FP Café

The site already runs on Cloudflare Pages from this repo. These steps switch on the live data and the leaderboards. Everything here fits in the free tiers.

## 1. Live data (GitHub Actions)
The workflow `.github/workflows/refresh-data.yml` runs every 3 hours by itself. To run it straight away:

**GitHub → Actions → refresh-data → Run workflow.**

When it turns green, a commit called `data: refresh …` appears, and Cloudflare redeploys within a minute.

### Optional keys (better data, still free)
Add these under **GitHub → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | What it unlocks | Get it at |
|---|---|---|
| `NVD_API_KEY` | Higher NVD rate limits, so more CVSS scores per run | nvd.nist.gov/developers/request-an-api-key |
| `ABUSECH_AUTH_KEY` | ThreatFox and MalwareBazaar trends in the Malware bar | auth.abuse.ch |
| `CLOUDFLARE_RADAR_TOKEN` | Live attack flows (origin → target arcs, web attacks and DDoS), most attacked industries and how attacks were stopped on the Lounge threat map. Create a Cloudflare API token with only **Account › Radar › Read** | dash.cloudflare.com/profile/api-tokens |

Without them everything still works. The Malware bar then ranks families by news mentions instead of IOC counts.

The AI library advisories use the workflow's built-in `GITHUB_TOKEN`, so there is nothing to add for them. The Under attack contact list lives in `pipeline/contacts.yaml` and the certifications in `pipeline/certs.yaml`; the pipeline checks every link in both once a week and falls back to the organisation's home page if one breaks.

## 2. Leaderboards (Cloudflare D1)
1. **Create the database.** Go to Cloudflare dashboard → **Storage & Databases → D1 → Create**. Name it `fpcafe`.
2. **Create the tables.** Open the database → **Console**. Paste the contents of `db/schema.sql` and run it.
3. **Bind it to the site.** Go to **Workers & Pages → fp-cafe → Settings → Bindings → Add → D1 database**. Set the variable name to `DB` and choose the database `fpcafe`.
4. **Add the signing secret.** Go to **Settings → Variables and Secrets → Add**. Set the type to **Secret**, the name to `RUN_SECRET`, and the value to a long random string. Generate one in the VM:
   ```bash
   openssl rand -base64 48
   ```
   Paste it into Cloudflare and don't store it anywhere else. If it's ever exposed, replace it: old run tokens simply stop working.
5. **Redeploy.** Go to **Deployments → … → Retry deployment** (or push any commit).

Check that it works:
```bash
curl -s "https://fp-cafe.pages.dev/api/board?game=phish&period=week"
```
You should get `{"game":"phish","period":"week","rows":[]}`. If you see `leaderboards are not set up yet`, the binding or the secret is missing.

## 3. Live data in minutes (Pages Function `/api/live`)
The 3-hourly pipeline is the full refresh. The fast-moving parts (attack flows, ransomware claims, new C2 servers and malware, new CVEs and KEV entries, news, AI advisories, rule changes) come from `/api/live`, which fetches the public sources itself and caches them for 5 to 60 minutes. No builds are used.

1. **Create the cache table.** Open the D1 database → **Console** and run this one line (it's also at the end of `db/schema.sql`):
   ```sql
   CREATE TABLE IF NOT EXISTS live_cache (k TEXT PRIMARY KEY, ts INTEGER NOT NULL, ok INTEGER NOT NULL, body TEXT NOT NULL);
   ```
   Without it the endpoint still works, but each Cloudflare server keeps its own copy and fetches upstream more often.
2. **Add the keys to Cloudflare** (the GitHub secrets aren't visible to Cloudflare). Go to **Workers & Pages → fp-cafe → Settings → Variables and Secrets → Add**, type **Secret**:

   | Name | Needed for | Value |
   |---|---|---|
   | `CLOUDFLARE_RADAR_TOKEN` | Live attack arcs, most attacked countries and industries, exploit types, phishing in email | The same Radar read-only token you put in GitHub |
   | `ABUSECH_AUTH_KEY` | New malware samples and malware URLs in the live feed | Same key as GitHub, if you have one |
   | `NVD_API_KEY` | Higher NVD limits for new CVEs | Same key as GitHub, if you have one |
   | `GITHUB_TOKEN` | Higher limits for AI advisories and rule changes | A fine-grained token with **no** permissions (public data only), 1-year expiry |

   | `LIVE_INGEST_SECRET` | Live SANS ISC (Infocon level, most-scanned ports), pushed hourly from GitHub | A random string, see step 3 |

   Every one is optional. Without the Radar token the map keeps working from the 3-hourly snapshot.
3. **Live SANS ISC.** SANS refuses requests from Cloudflare's servers, so the `isc-live` GitHub workflow fetches ISC once an hour and pushes it to `/api/ingest`. Make one secret and put the **same value** in both places:
   ```bash
   openssl rand -hex 32
   ```
   * Cloudflare: **fp-cafe → Settings → Variables and Secrets → Add**, type **Secret**, name `LIVE_INGEST_SECRET`.
   * GitHub: **repo → Settings → Secrets and variables → Actions → New repository secret**, name `LIVE_INGEST_SECRET`.

   Without the secret, `/api/ingest` answers 404 and the workflow skips itself. If the site moves to its own domain, add a repository **variable** (not a secret) `SITE_URL`, for example `https://fpcafe.example`.
4. **Redeploy** (push any commit, or **Deployments → … → Retry deployment**).

Check it:
```bash
curl -s "https://fp-cafe.pages.dev/api/live?f=map,events" | head -c 600
```
The first call after a deploy may show empty parts. Each request refreshes at most a few stale sources (the free plan allows 10 ms of CPU per request), so everything fills in after a few page views.

## 4. Branch protection with data commits
The data job pushes to `main`. The `protect-main` ruleset (restrict deletions, block force pushes) allows that. If you later turn on **Require a pull request** or **Require status checks**, add **GitHub Actions** to the ruleset's bypass list, or the refresh will stop.

## 5. Limits worth knowing
* Cloudflare Pages free plan: 500 builds a month. The refresh runs at most 8 times a day (about 240 builds a month), and only commits when data changed.
* Pages Functions free plan: 100,000 requests a day. D1 free plan: 5 million reads a day.
* `/api/live`: an open tab asks for the feeds of the page on screen every 1.5 to 5 minutes, and only while the tab is visible. That's about 30 to 40 requests an hour per open tab. If the site gets popular, add a Cloudflare rate-limiting rule for `/api/live` (for example 60 requests a minute per IP).
