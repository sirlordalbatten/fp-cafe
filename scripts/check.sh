#!/usr/bin/env bash
# FP Café static security checks. Run locally or in CI: ./scripts/check.sh
set -u
fail=0; S=site
bad(){ echo "FAIL: $1"; fail=1; }
ok(){ echo "ok:   $1"; }

HTML=$(find $S -name '*.html')
JS=$(find $S/js -name '*.js')
# 1. No inline <script> bodies (CSP allows only script-src 'self')
if grep -Pzo '<script(?![^>]*\bsrc=)[^>]*>\s*\S' $HTML >/dev/null; then bad "inline <script> found"; else ok "no inline scripts"; fi
# 2. No inline event handlers (onclick= etc.)
if grep -nEi '<[^>]*\son[a-z]+\s*=' $HTML; then bad "inline event handler"; else ok "no inline event handlers"; fi
# 3. No inline style attributes (CSP style-src 'self'), in HTML or JS templates
if grep -nE '\sstyle\s*=\s*["'"'"']' $HTML $JS; then bad "inline style attribute"; else ok "no inline styles"; fi
# 4. No third-party resources loaded (src/href to another origin)
if grep -nEo '(src|href)\s*=\s*"https?://[^"]+' $HTML; then bad "external resource in HTML"; else ok "no external resources in HTML"; fi
if grep -nEo '@import|url\(\s*["'"'"']?https?://' $S/css/*.css; then bad "external resource in CSS"; else ok "no external resources in CSS"; fi
# 5. Dangerous JS sinks
if grep -nE '\beval\s*\(|new Function\s*\(|document\.write\s*\(|insertAdjacentHTML|outerHTML\s*=|setTimeout\s*\(\s*["'"'"'`]' $JS; then bad "dangerous JS sink"; else ok "no eval/Function/document.write/string timers"; fi
# 5a. every front-end module parses as an ES module (catches a typo before it blanks a page)
if command -v node >/dev/null; then
  BADJS=$(find $S/js -name '*.js' | while read -r f; do node --check --input-type=module < "$f" >/dev/null 2>&1 || echo "$f"; done)
  if [ -n "$BADJS" ]; then echo "$BADJS"; bad "JavaScript syntax error"; else ok "all JavaScript modules parse"; fi
fi
# 5b. innerHTML only in reviewed files (static art and trusted templates; data always goes through textContent or esc())
ALLOW=$(grep -v '^#' scripts/innerhtml-allowlist.txt 2>/dev/null)
BADHTML=$(grep -rln 'innerHTML' $S/js | while read -r f; do echo "$ALLOW" | grep -qx "${f#$S/}" || echo "$f"; done)
if [ -n "$BADHTML" ]; then echo "$BADHTML"; bad "innerHTML used in a file that isn't on scripts/innerhtml-allowlist.txt"; else ok "innerHTML only in reviewed files"; fi
# 5c. Pipeline output: every data file present must be valid
if ls $S/data/*.json >/dev/null 2>&1; then python3 pipeline/refresh.py --out $S/data --validate >/dev/null && ok "data files valid" || bad "data files failed validation"; else ok "no data files yet (first refresh pending)"; fi
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
