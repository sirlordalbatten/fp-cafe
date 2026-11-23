# FP Café ☕

**A break room for SOC analysts.** False positives, cold coffee, a CISO who yells, and tools you're allowed to swear at. It's built to stay open in a tab all shift: a split-flap board of the day's chaos, a desk of tickets to route (or bounce to IT), detections worth stealing, and games you can play against your team.

> Live: https://fp-cafe.pages.dev

## What's inside
| Area | What it does |
|---|---|
| **Lounge** | Split-flap "days since last incident" board, an aquarium of live threats, a buddy who reacts to your mood, daily quests |
| **The desk** | Tickets walk in all day. Work them, escalate them, or bounce them to IT and Network. The CISO notices. |
| **Brew & menu** | CVE digest served as a café menu, with a coffee machine you can actually hear |
| **Detections** | Copy-ready rules in KQL (Defender/Sentinel), SPL, YARA-L 2.0 (Google SecOps) and Sigma |
| **Arcade** | Five security games with seeded challenge codes so a whole team plays the same round |
| **Password lab** | Strength checker that explains *why*, a passphrase generator, and a "crack the user's password" game |
| **SOCdle, tycoon, shop, sticker album** | Reasons to come back tomorrow |

Sound is synthesized live with the Web Audio API (no audio files), and only starts after you click something.

## Security design
The brief was "fully secured", so the design starts from **nothing to attack**:

- **No backend.** Static files on Cloudflare Pages. No server, database, API keys or login to steal.
- **No third parties.** Fonts are self-hosted; no CDN, analytics script, ads or embeds. The CSP is `default-src 'none'` and only allows the site's own origin.
- **No inline code.** Every script and style is an external file, so the CSP needs neither `'unsafe-inline'` nor `'unsafe-eval'`. Dynamic widths are set through the CSSOM rather than `style=""`.
- **Untrusted input is treated as hostile.** Everything read back from localStorage, and every pasted team code, is validated against an allow-list before use.
- **Hardened headers** (`site/_headers`): CSP, HSTS (preload), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, a locked-down `Permissions-Policy`, COOP and CORP.
- **CI on every push** (`.github/workflows/security.yml`): `scripts/check.sh` fails the build on inline scripts, inline handlers, inline styles, external resources, `eval`/`new Function`/`document.write`, missing headers, or an expired `security.txt`. Gitleaks scans the full history for secrets. Workflows run with read-only permissions, and Dependabot keeps the actions updated.
- **Repo hygiene:** secret scanning and push protection on, private commit email, SSH key with a passphrase, 2FA.
- **Disclosure:** `/.well-known/security.txt` (RFC 9116) and [SECURITY.md](SECURITY.md).

### Threat model
| Threat | Mitigation |
|---|---|
| XSS via stored or pasted data | Allow-list validation on load; strict CSP blocks inline and external script even if something slips through |
| Supply-chain compromise of a CDN or script | No third-party code at runtime, nothing to compromise |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Downgrade / MITM | HSTS with preload, `upgrade-insecure-requests` |
| Secret leaked in the repo | Nothing secret exists; gitleaks + GitHub push protection as backstops |
| Malicious change to the site | Branch protection on `main`, CI must pass, build workstation is a hardened VM |
| DDoS | Cloudflare's edge |

### Build workstation
Development happens on an isolated Ubuntu 22.04 VM: encrypted, NAT-only networking, unused virtual hardware removed, no listening services except local DNS, `ufw` deny-incoming, unattended security upgrades, and snapshots before risky changes.

## Run locally
```bash
cd site && python3 -m http.server 8000
```
Then open http://localhost:8000. (The `_headers` file only applies on Cloudflare Pages; the meta CSP in `index.html` still applies locally.)

## Check before you push
```bash
./scripts/check.sh
```

## Deploy
Cloudflare Pages → connect this repo → **Build command:** none → **Build output directory:** `site`.
