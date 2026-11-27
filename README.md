# FP Café ☕

**A break room for SOC analysts.** Live CVEs, malware families, fresh detections, AI-security news, games you can play against your team, and a shift buddy that keeps you sane. Everything refreshes on its own, and nothing gets typed in by hand.

> Live: https://fp-cafe.pages.dev

## What's inside
| Section | What it does | Freshness |
|---|---|---|
| **Lounge** | Live threat dashboard: a world map where attack arcs appear, travel and fade continuously, picked by real share of traffic (exploit attempts, web DDoS, bots and network DDoS from Cloudflare Radar, last 2 hours), with country labels and real events pulsing in as they happen (ransomware claims, new botnet C2 servers, new malware). A live attacks feed that glides in, a ticking "attack reports so far today" counter, exploit types blocked, phishing in email, yesterday's attack reports with a 14-day chart (SANS ISC DShield), 7-day attack traffic, most attacked countries and industries, how attacks were stopped, top botnet malware, a legend and a full-screen SOC wall mode, Infocon level, KPI tiles with 30-day sparklines, "Patch first", most-scanned ports (SANS ISC), ransomware groups, the arrivals board and pager | live (minutes) |
| **The desk** | Tickets walk in while the tab is open. Route them, bounce them to IT or Network, keep the CISO calm, swear at your tools | combinatorial scenes with generated colleagues, where one detail decides the route, plus templates and live CVEs and news |
| **Morning brew** | A two-minute digest: three things to know, numbers for your manager, the latest headlines, and a "happening now" panel | live (minutes) |
| **CVE menu** | Every CISA KEV entry from the last 120 days plus new critical CVEs from NVD, scored with EPSS, filterable by your stack. A "Just in" list of the newest KEV entries and critical CVEs, a "Patch first" list and vendor advisory links | live (minutes) |
| **Malware bar** | 32 curated family profiles (how it gets in, what you'll see, how to hunt it) with live activity from Malpedia, abuse.ch and news mentions, plus ransomware leak-site activity (groups, sectors, countries, daily posts; counts only, never victim names) from ransomware.live, and a "live from the wild" panel of new samples, malware URLs and C2 servers | live (minutes) |
| **AI lab** | Built from live data: AI news, AI-product CVEs, security advisories for AI libraries (GitHub Advisory Database), the newest MCP registry servers with a capability and risk read-out, agent walkthroughs generated from today's KEV entry, an active malware family and a new MCP server (with a prompt-injection toggle), and a prompt-injection scanner | live (minutes) |
| **Detection lab** | The newest rules from SigmaHQ, Splunk Security Content, Microsoft Sentinel and Google SecOps, plus "just merged upstream" rule changes as they land, and curated playbooks with triage and tuning notes | live (minutes) |
| **Under attack** | First-response playbooks for 13 incident types (ransomware, BEC, phishing click, account takeover, malware, DDoS, data breach, hacked server, leaked keys, supplier compromise, insider, lost device, extortion): steps for the first 15 minutes, first hour and next 24 hours, what not to do, evidence to keep, an incident clock, timestamped notes, a call tree and a report you can copy or download. Live CISA and NCSC UK advisories, active ransomware gangs and exploited CVEs, plus national CERT, police and regulator contacts for 19 countries with weekly link checks | live (minutes) / weekly |
| **Toolbox** | Log parser (Windows event XML and Sysmon, CloudTrail, Entra, Okta, ECS JSON, syslog and auth.log, Apache/Nginx, CEF/LEEF, key=value firewalls, CSV, Zeek: normalised fields, top values, what stands out, CSV/JSON export), hunt query builder (IOCs to KQL, SPL, Elastic and SecOps UDM), file and hash check (MD5, SHA-1, SHA-256, SHA-512, verify a download against the published hash, real file type from magic bytes, entropy, strings and IOCs), PowerShell decoder (encoded, nested and compressed), User-Agent inspector, Windows event ID and port references, lookup with TI pivots, SafeLinks/Proofpoint unwrapper, IOC extractor, email header analyser, URL parser, lookalike/punycode checker, decode, defang, time, JWT, CIDR, hash ID. All in the browser | |
| **SOC playbook** | 16 practices from well-run SOCs (Palantir ADS, MITRE 11 Strategies, NCSC, Google SRE and ASO, PEAK, CISA, NIST 800-61r3, GitLab), each with its source and a first-week version; a self-check; a **Surface audit** (where an attacker would look first, and a keep/narrow/remove review of what you expose, inspired by Florian Roth's defensive minimalism); and a live feed from SOC team blogs | every 3 h |
| **Phish sim** | Awareness campaign planner: briefs with a realistic sample message (email, text, chat, poster or call script, made-up organisation, numbered red flags you can reveal), ethics rules, ethics rules, a year of themes, this week's real lures from the news, and a results calculator focused on report rate | |
| **Arcade** | Five games (Swipe the phish, Alert rush, Contain the worm, Needle in the logs, Firewall frenzy) with a daily challenge | |
| **Leaderboards** | Global, team and daily boards, updated live, with server-side anti-cheat | live |
| **SOCdle** | A daily five-letter security word with the category shown up front, up to two letter reveals and a word list that greys out what you've ruled out, plus a decode puzzle | daily |
| **SOC tycoon** | Build a SOC: hire, automate, take client contracts, survive incidents, avoid burnout | |
| **Password lab** | A strength checker that explains why, a passphrase generator, and a daily "crack a colleague" with a shape hint, a character mask and how-close feedback | daily |
| **Shift buddy** | Custom shift hours (including overnight), break plan, wellbeing nudges (posture, water, movement, meals, caffeine cut-off, teammate check-ins, night-shift sleep prep), a checklist you can edit, handover builder and focus timer | |
| **Snack lessons** | 60 hands-on micro-labs, including 19 attack techniques (AS-REP roasting, pass-the-hash, pass-the-ticket, DCSync, LLMNR and NTLM relay, LSASS dumping, DLL side-loading, process injection, SQL injection, XSS, SSRF, command injection, path traversal, web shells, AiTM and device-code phishing, ClickFix, AD CS abuse, vulnerable drivers), a first-months track (triage routine, true vs false positives, severity vs priority, the Pyramid of Pain, persistence, lateral movement, phishing triage, C2 beacons, firewall logs, hashes, Linux commands, ports) plus noise vs agent scrutiny, shrinking the attack surface, BEC, OAuth consent, golden tickets, Linux auth logs, web logs, CloudTrail, KQL, ransomware first hour, EDR tampering, ticket writing, DMARC and more), filterable by topic, plus a daily lab from the newest KEV entry | daily |
| **Certifications** | Blue, red, cloud, DFIR and leadership roadmaps (58 certs, including the GIAC range from SANS, CompTIA, ISC2, ISACA, OffSec, EC-Council, cloud and Kubernetes) with search, an issuer filter, practical tips, a personal plan and cert news. Official links re-checked weekly; no prices or exam codes that go stale | weekly |
| **Pop incidents** | Short timed scenarios generated from templates and live data, so they rarely repeat | |

Your shift partner is one of six analysts (Sunny, Dex, Rin, Theo, Juno, Noor), each with their own personality and lines. Pick or switch in My corner.

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
* **Backend**: tiny Pages Functions and a D1 database. `/api/run`, `/api/score` and `/api/board` run the leaderboards. `/api/live` fetches fixed public sources (Cloudflare Radar, NVD, abuse.ch, ransomware.live, SANS ISC, GitHub, RSS), validates and trims every field, caches it for 5 to 60 minutes, and serves it to open tabs, so the site stays current between pipeline runs without spending builds.

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

**Live API** (`backend/live.mjs`, `GET /api/live?f=…`)
- Upstream URLs are hard-coded. The request only picks feed names from an allow-list, so it can't be turned into an SSRF proxy.
- Every value is re-validated before it's cached or returned: country codes, CVE and GHSA IDs, hashes, `https` links on allow-listed hosts, and markup-free, length-capped text. RSS is read with fixed patterns, never as HTML.
- Ransomware victim names, domains and descriptions are never read out of the upstream data. Only group, country, sector and time are kept.
- Each request refreshes at most a few stale sources, failures back off for 5 minutes and keep the last good data, and API keys live only in Cloudflare secrets. Unit tests in `backend/tests/live.test.mjs`.

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
