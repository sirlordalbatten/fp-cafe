# FP Café ☕

**A break room for SOC analysts.** Live CVEs, malware families, fresh detections, AI-security news, games you can play against your team, and a shift buddy that keeps you sane. Everything refreshes on its own, and nothing gets typed in by hand.

> Live: https://fp-cafe.pages.dev

## What's inside
| Section | What it does | Freshness |
|---|---|---|
| **Lounge** | A dashboard: split-flap arrivals board, KPI tiles (exploited this week, new criticals, ransomware posts, top vendor), quick indicator lookup with TI pivot links, a sector radar (where CVEs hit × how recent) with a "look at these first" list, ten-second brief, buddy, quests, pager. Open tabs re-fetch data every 15 minutes | every 3 h |
| **The desk** | Tickets walk in while the tab is open. Route them, bounce them to IT or Network, keep the CISO calm, swear at your tools | combinatorial scenes with generated colleagues, where one detail decides the route, plus templates and live CVEs and news |
| **Morning brew** | A two-minute digest: three things to know, numbers for your manager, the latest headlines | every 3 h |
| **CVE menu** | Every CISA KEV entry from the last 120 days plus new critical CVEs from NVD, scored with EPSS, filterable by your stack. A "Patch first" list and vendor advisory links | every 3 h |
| **Malware bar** | 32 curated family profiles (how it gets in, what you'll see, how to hunt it) with live activity from Malpedia, abuse.ch and news mentions, plus ransomware leak-site activity (groups, sectors, countries, daily posts; counts only, never victim names) from ransomware.live | every 3 h |
| **AI lab** | Built from live data: AI news, AI-product CVEs, the newest MCP registry servers with a capability and risk read-out, agent walkthroughs generated from today's KEV entry, an active malware family and a new MCP server (with a prompt-injection toggle), and a prompt-injection scanner | every 3 h |
| **Detection lab** | The newest rules from SigmaHQ, Splunk Security Content, Microsoft Sentinel and Google SecOps, plus curated playbooks with triage and tuning notes | every 3 h |
| **SOC playbook** | Practices from well-run SOCs (Palantir ADS, MITRE 11 Strategies, NCSC, Google SRE and ASO, PEAK, CISA, NIST 800-61r3, GitLab), each with its source and a first-week version, a self-check, and a live feed from SOC and detection team blogs | every 3 h |
| **Phish sim** | Awareness campaign planner: briefs with red flags to teach (never send-ready kits), ethics rules, a year of themes, this week's real lures from the news, and a results calculator focused on report rate | |
| **Arcade** | Five games (Swipe the phish, Alert rush, Contain the worm, Needle in the logs, Firewall frenzy) with a daily challenge | |
| **Leaderboards** | Global, team and daily boards, updated live, with server-side anti-cheat | live |
| **SOCdle** | A daily five-letter security word with the category shown up front, up to two letter reveals and a word list that greys out what you've ruled out, plus a decode puzzle | daily |
| **SOC tycoon** | Build a SOC: hire, automate, take client contracts, survive incidents, avoid burnout | |
| **Password lab** | A strength checker that explains why, a passphrase generator, and a daily "crack a colleague" with a shape hint, a character mask and how-close feedback | daily |
| **Shift buddy** | Custom shift hours (including overnight), break plan, essential nudges, a checklist with suggestions, a handover builder, wellbeing nudges (posture, water, movement, meals, caffeine cut-off, teammate check-ins, night-shift sleep prep), and an analyst toolbox: link unwrapper (SafeLinks, Proofpoint v1–v3, Google, Barracuda), IOC extractor, TI pivots, email header analyser, URL parser, lookalike/punycode checker, time converter, defang, decode, JWT, CIDR, hash ID | |
| **Snack lessons** | 27 hands-on micro-labs (BEC, OAuth consent, golden tickets, Linux auth logs, web logs, CloudTrail, KQL, ransomware first hour, EDR tampering, ticket writing, DMARC and more), filterable by topic, plus a daily lab from the newest KEV entry | daily |
| **Pop incidents** | Short timed scenarios generated from templates and live data, so they rarely repeat | |

Sound is synthesised in the browser with the Web Audio API (no audio files), and only starts after you click something.

## Architecture
```
 GitHub Actions (every 3 h)                       Cloudflare Pages
 ┌──────────────────────────┐   commit data   ┌──────────────────────────────┐
 │ pipeline/refresh.py      │ ──────────────▶ │ site/        static front end │
 │  CISA KEV · NVD · EPSS   │                 │ site/data/   validated JSON   │
 │  Malpedia · abuse.ch     │                 │ functions/   /api/* (Workers) │──▶ D1 (SQLite)
 │  RSS/Atom news + AI/SOC  │
 │  ransomware.live · MCP   │                 └──────────────────────────────┘    leaderboard
 │  Sigma · Splunk · KQL ·  │                              ▲
 │  YARA-L rule repos       │                              │ same origin only
 └──────────────────────────┘                          browser
```
* **Front end**: plain ES modules, no framework and no build step. Each section loads only when you open it.
* **Data pipeline**: Python standard library, plus PyYAML from Ubuntu's signed apt repository. It runs on GitHub's servers, so no server of mine is involved.
* **Backend**: three tiny Pages Functions (`/api/run`, `/api/score`, `/api/board`) and a D1 database. It's only used for leaderboards.

## Security design
The brief was "fully secured", so the design starts from **as little as possible to attack**, and treats everything that does exist as hostile.

**Browser**
- Strict CSP: `default-src 'none'`. Scripts, styles and fonts come only from this site. The single third-party exception is Cloudflare's cookieless analytics beacon, which is allowed by exact hostname.
- No inline scripts, styles or event handlers anywhere, so the CSP needs no `'unsafe-inline'` or `'unsafe-eval'`.
- Every piece of data from the network or the user reaches the page through `textContent`. `innerHTML` is allowed only in a reviewed list of files that insert static art (`scripts/innerhtml-allowlist.txt`), and CI enforces that list.
- Data is validated twice, once by the pipeline and again in the browser. Links are rendered only if they're `https://` and open with `noopener noreferrer`.
- Headers: HSTS (preload), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, COOP/CORP/COEP, `nosniff`, `Referrer-Policy: no-referrer`, a locked-down `Permissions-Policy`, and no wildcard CORS.

**Data pipeline** (`pipeline/refresh.py`)
- HTTPS only, and redirects to anything that isn't HTTPS are refused. Every download has a size cap and a timeout.
- XML with a `DOCTYPE` or `ENTITY` declaration is rejected before parsing, which blocks entity-expansion attacks. YAML is parsed only with `safe_load`.
- All text is stripped of markup, control characters and bidi overrides, then length-capped. Links are kept only for allow-listed hosts.
- Rule repositories are blob-less, shallow clones. Only regular files inside the clone are read: symlinks are skipped, so a malicious upstream can't make the pipeline publish `/etc/passwd`. There's a test for this.
- A failing source never wipes good data. The previous data is kept and marked "stale".
- The commit step refuses to commit anything outside `site/data/`. Only that one job has write permission.

**Leaderboard API** (`backend/core.mjs`)
- No accounts, cookies or emails. Players opt in with a callsign. Team codes are stored as HMACs, and IP addresses only as salted hashes that rotate daily, used for rate limiting.
- Scores can't simply be posted. A score is accepted only if:
  1. the server signed a run token (HMAC) when the game started;
  2. the token is unused (single-use);
  3. the time between start and submit is plausible for that game;
  4. the score is reachable in that time;
  5. the client solved a proof-of-work bound to the token.
- Per-IP rate limits, a same-origin check on every write, JSON only, 2 KB maximum body, allow-listed names, parameterised SQL, and generic errors.

**Supply chain and CI**
- No runtime dependencies at all. CI runs the site checks, pipeline tests and backend tests, gitleaks over the full history, and CodeQL. Dependabot keeps actions current.
- `main` is protected against force-pushes and deletion. Secret scanning and push protection are on.

### Threat model
| Threat | Mitigation |
|---|---|
| XSS via feed, rule or API data | Pipeline sanitising + browser re-validation + `textContent` rendering + strict CSP |
| Poisoned upstream feed or rule repo | Size caps, XML entity refusal, `safe_load`, symlink refusal, schema validation, keep last-good data |
| Fake leaderboard scores | Signed single-use run tokens, timing and score plausibility, proof-of-work, rate limits |
| Cross-site abuse of the API | Same-origin check, no CORS headers, JSON-only, `frame-ancestors 'none'` |
| Supply-chain compromise | No third-party runtime code; one analytics origin pinned by hostname |
| Secret leaked in the repo | Nothing secret in code; gitleaks and push protection as backstops; runtime secrets live in Cloudflare and GitHub secrets |
| Malicious change to the site | Protected `main`, CI on every push, the data job can only change `site/data/` |
| Clickjacking / downgrade | `frame-ancestors 'none'`, HSTS preload |
| DDoS / cost abuse | Cloudflare edge, per-IP limits, small fixed-size queries |

## Run and test locally
```bash
./scripts/check.sh                                   # site security checks
python3 -m unittest discover -s pipeline/tests       # pipeline tests (needs python3-yaml)
node --test backend/tests/*.test.mjs                 # leaderboard logic tests
cd site && python3 -m http.server 8000               # front end only (no leaderboard)
```

## Deploy
See [SETUP.md](SETUP.md): Cloudflare Pages (build command: none, output: `site`), a D1 database, one secret, and an optional pair of API keys.
