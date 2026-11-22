#!/usr/bin/env bash
# FP Café static security checks. Run locally or in CI: ./scripts/check.sh
set -u
fail=0; S=site
bad(){ echo "FAIL: $1"; fail=1; }
ok(){ echo "ok:   $1"; }

# 1. No inline <script> bodies (CSP allows only script-src 'self')
if grep -Pzo '<script(?![^>]*\bsrc=)[^>]*>\s*\S' $S/index.html >/dev/null; then bad "inline <script> found"; else ok "no inline scripts"; fi
# 2. No inline event handlers (onclick= etc.)
if grep -nEi '\son[a-z]+\s*=' $S/index.html; then bad "inline event handler"; else ok "no inline event handlers"; fi
# 3. No inline style attributes (CSP style-src 'self')
if grep -nE '\sstyle\s*=' $S/index.html; then bad "inline style attribute"; else ok "no inline styles"; fi
# 4. No third-party resources loaded (src/href to another origin)
if grep -nEo '(src|href)\s*=\s*"https?://[^"]+' $S/index.html; then bad "external resource in HTML"; else ok "no external resources in HTML"; fi
if grep -nEo '@import|url\(\s*["'"'"']?https?://' $S/css/*.css; then bad "external resource in CSS"; else ok "no external resources in CSS"; fi
# 5. Dangerous JS sinks
if grep -nE '\beval\s*\(|new Function\s*\(|document\.write\s*\(' $S/js/*.js; then bad "dangerous JS sink"; else ok "no eval/Function/document.write"; fi
# 6. Security headers present
for h in Content-Security-Policy Strict-Transport-Security X-Content-Type-Options frame-ancestors Permissions-Policy; do
  grep -q "$h" $S/_headers && ok "_headers has $h" || bad "_headers missing $h"
done
# 7. security.txt present and not expired
f=$S/.well-known/security.txt
if [ -f "$f" ]; then
  exp=$(grep -i '^Expires:' "$f" | cut -d' ' -f2)
  if [ "$(date -u -d "$exp" +%s)" -gt "$(date -u +%s)" ]; then ok "security.txt valid until $exp"; else bad "security.txt expired"; fi
else bad "security.txt missing"; fi

[ $fail -eq 0 ] && echo "All checks passed." || echo "Some checks failed."
exit $fail
