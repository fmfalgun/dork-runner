#!/usr/bin/env bash
# googler-dorks.sh — Run curated Google dork queries against any domain via googler.
#
# Usage:
#   bash googler-dorks.sh example.com
#   SLEEP=6 bash googler-dorks.sh example.com
#
# Output: ./dorks-raw-google.txt (in current working directory)
# Make executable: chmod +x googler-dorks.sh
#
# Notes:
#   - Google supports OR, * wildcards, and ext: as an alias for filetype:.
#   - Combined OR queries collapse multiple DDG queries into single Google queries.
#   - Requires: googler (https://github.com/jarun/googler), python3
#   - Override sleep interval: SLEEP=6 bash googler-dorks.sh example.com
#   - Override result count: COUNT=10 bash googler-dorks.sh example.com

set -euo pipefail

# ── argument check ────────────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
    echo "Error: target domain required." >&2
    echo "Usage: $0 <domain>" >&2
    echo "Example: $0 example.com" >&2
    exit 1
fi

TARGET="$1"
SLEEP=${SLEEP:-4}
COUNT=${COUNT:-20}
OUTFILE="./dorks-raw-google.txt"

# ── run_dorks() ───────────────────────────────────────────────────────────────

run_dorks() {
    local target="$1"
    local outfile="$2"
    shift 2
    local queries=("$@")

    : > "$outfile"   # truncate / create

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "TARGET : $target  [Google via googler]"
    echo "Output : $outfile"
    echo "Queries: ${#queries[@]}    Sleep: ${SLEEP}s    Count: ${COUNT}"
    echo "════════════════════════════════════════════════════════════"

    for query in "${queries[@]}"; do
        echo ""
        echo "--- $query ---" | tee -a "$outfile"
        googler --np --count "$COUNT" --json "$query" 2>/dev/null \
            | python3 -c "
import sys, json
data = json.load(sys.stdin)
for r in data:
    print(r.get('url', ''))
    print('  ' + r.get('title', ''))
    print('  ' + r.get('abstract', '')[:120])
    print()
" 2>/dev/null \
            | tee -a "$outfile" || true
        sleep "$SLEEP"
    done

    echo ""
    local count
    count=$(grep -cE '^https?://' "$outfile" 2>/dev/null || echo 0)
    echo "Done: $target — $count result URLs saved to $outfile"
}

# ── query list (Google supports OR, *, ext:) ──────────────────────────────────
# 13 categories, ~40 queries total.
# OR-combined where DDG needed separate queries; wildcard subdomain via site:*.

QUERIES=(

    # 1. Directory listings
    "site:$TARGET intitle:\"index of\""
    "site:$TARGET intitle:\"index of\" \"backup\""
    "site:$TARGET intitle:\"index of\" \".git\""
    "site:$TARGET intitle:\"index of\" \"uploads\""

    # 2. Sensitive files — OR-combined (Google handles OR correctly with site:)
    "site:$TARGET ext:sql OR ext:bak OR ext:zip OR ext:tar"
    "site:$TARGET ext:env OR ext:log OR ext:conf OR ext:config"
    "site:$TARGET ext:php intitle:\"phpinfo()\""

    # 3. Admin panels — OR-combined
    "site:$TARGET inurl:admin OR inurl:login"
    "site:$TARGET inurl:wp-admin OR inurl:phpmyadmin"
    "site:$TARGET inurl:cpanel OR inurl:webmail"

    # 4. Credentials / secrets — OR-combined
    "site:$TARGET \"password\""
    "site:$TARGET \"api_key\" OR \"api_secret\" OR \"secret_key\""
    "site:$TARGET \"db_password\" OR \"DB_PASSWORD\""
    "site:$TARGET \"Authorization:\" OR \"Bearer \""
    "site:$TARGET \"mysql_connect\" OR \"mysqli_connect\""

    # 5. Error messages — OR-combined
    "site:$TARGET \"Fatal error\" OR \"Parse error\""
    "site:$TARGET \"Warning: mysql\" OR \"Notice: Undefined\""
    "site:$TARGET \"SQLSTATE\" OR \"ORA-\""
    "site:$TARGET \"stack trace\" OR \"Traceback\""

    # 6. SQLi candidates (parameter exposure)
    "site:$TARGET inurl:\"?id=\""
    "site:$TARGET inurl:\"?page=\""
    "site:$TARGET inurl:\"?cat=\" OR inurl:\"?product=\""
    "site:$TARGET inurl:\".php?\""

    # 7. CMS detection (WordPress)
    "site:$TARGET inurl:wp-content OR inurl:wp-includes"
    "site:$TARGET \"Powered by WordPress\""
    "site:$TARGET ext:php inurl:wp-login"

    # 8. Cloud / infrastructure exposure
    "site:$TARGET inurl:s3.amazonaws.com"
    "site:$TARGET inurl:blob.core.windows.net"

    # 9. Paste / code leaks (off-domain)
    "\"$TARGET\" site:pastebin.com"
    "\"$TARGET\" site:github.com"
    "\"$TARGET\" password OR key OR secret"

    # 10. Email / user enumeration
    "site:$TARGET \"@$TARGET\""

    # 11. Subdomain discovery — wildcard only possible in Google
    "site:$TARGET -www"
    "site:*.$TARGET"

    # 12. Documents — OR-combined
    "site:$TARGET ext:pdf OR ext:doc OR ext:docx"
    "site:$TARGET ext:xlsx OR ext:csv"
    "site:$TARGET ext:pdf \"confidential\""

    # 13. Misc / info disclosure
    "site:$TARGET \"phpinfo()\""
    "site:$TARGET \"robots.txt\" inurl:robots.txt"
    "\"$TARGET\" password"

)

# ── execute ───────────────────────────────────────────────────────────────────

run_dorks "$TARGET" "$OUTFILE" "${QUERIES[@]}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "All done.  Results: $OUTFILE"
echo "════════════════════════════════════════════════════════════"
