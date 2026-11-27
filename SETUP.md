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

## 3. Branch protection with data commits
The data job pushes to `main`. The `protect-main` ruleset (restrict deletions, block force pushes) allows that. If you later turn on **Require a pull request** or **Require status checks**, add **GitHub Actions** to the ruleset's bypass list, or the refresh will stop.

## 4. Limits worth knowing
* Cloudflare Pages free plan: 500 builds a month. The refresh runs at most 8 times a day (about 240 builds a month), and only commits when data changed.
* Pages Functions free plan: 100,000 requests a day. D1 free plan: 5 million reads a day.
