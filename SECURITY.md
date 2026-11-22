# Security policy

FP Café is a static site: HTML, CSS, JavaScript and self-hosted fonts. There is no backend, no database, no login and no third-party script. Everything a visitor saves (name, mood log, scores) stays in their own browser's localStorage under the `fpc_` prefix and is never sent anywhere.

## Reporting a vulnerability

Please report privately through **GitHub → Security → Report a vulnerability** on this repository (also listed in `/.well-known/security.txt`). Do not open a public issue.

You can expect a reply within 7 days. Good-faith research is welcome; please don't run automated scanners at volume against the live site or test anything that would affect other visitors.

## In scope
- XSS or script injection, including through saved localStorage values or team challenge / result codes
- Bypassing the Content Security Policy
- Clickjacking or framing
- Anything that makes the site load content from another origin

## Out of scope
- Missing headers already covered by the policy below
- Issues that need a compromised browser or device
- Volumetric DoS (Cloudflare handles this)
