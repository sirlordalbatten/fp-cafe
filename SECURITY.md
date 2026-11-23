# Security policy

FP Café is a static site plus a small leaderboard API (`/api/run`, `/api/score`, `/api/board`) on Cloudflare Pages Functions with a D1 database. There are no accounts, cookies or emails. Progress stays in the visitor's browser (localStorage, `fpc2_` prefix). Only players who opt in send a callsign, an optional team code (stored as an HMAC) and their scores. IP addresses are used only as salted, daily-rotating hashes for rate limiting.

## Reporting a vulnerability

Please report privately through **GitHub → Security → Report a vulnerability** on this repository (also listed in `/.well-known/security.txt`). Do not open a public issue.

You can expect a reply within 7 days. Good-faith research is welcome; please don't run automated scanners at volume against the live site or test anything that would affect other visitors.

## In scope
- Submitting leaderboard scores that weren't earned (bypassing run tokens, timing checks or proof-of-work)
- Injection into the leaderboard API or D1
- Poisoning the data pipeline (`pipeline/refresh.py`) so it publishes unsafe content
- XSS or script injection, including through saved localStorage values or team challenge / result codes
- Bypassing the Content Security Policy
- Clickjacking or framing
- Anything that makes the site load content from another origin

## Out of scope
- Missing headers already covered by the policy below
- Issues that need a compromised browser or device
- Volumetric DoS (Cloudflare handles this)
