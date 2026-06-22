#!/usr/bin/env bash
# ddgr-dorks.sh — Run curated DDG dork queries against any domain via ddgr.
#
# Usage:
#   bash ddgr-dorks.sh example.com
#   SLEEP=6 bash ddgr-dorks.sh example.com
#
# Output: ./dorks-raw-ddg.txt (in current working directory)
# Make executable: chmod +x ddgr-dorks.sh
#
# Notes:
#   - DDG does NOT support OR operators when site: is present — each query is separate.
#   - DDG does NOT support * wildcards or cache: operator.
#   - Requires: ddgr (https://github.com/jarun/ddgr), python3
#   - Override sleep interval: SLEEP=6 bash ddgr-dorks.sh example.com
#   - Override result count: COUNT=10 bash ddgr-dorks.sh example.com

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
OUTFILE="./dorks-raw-ddg.txt"

# ── JSON parser (url + title + abstract snippet) ──────────────────────────────

PARSE='import sys,json
data=json.load(sys.stdin)
for r in data:
    print(r.get("url",""))
    print("  " + r.get("title",""))
    print("  " + r.get("abstract","")[:120])
    print()
'

# ── run_dorks() ───────────────────────────────────────────────────────────────

run_dorks() {
    local target="$1"
    local outfile="$2"
    shift 2
    local queries=("$@")

    : > "$outfile"   # truncate / create

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "TARGET : $target  [DuckDuckGo via ddgr]"
    echo "Output : $outfile"
    echo "Queries: ${#queries[@]}    Sleep: ${SLEEP}s    Count: ${COUNT}"
    echo "════════════════════════════════════════════════════════════"

    for query in "${queries[@]}"; do
        echo ""
        echo "--- $query ---" | tee -a "$outfile"
        ddgr --np --json -n "$COUNT" "$query" 2>/dev/null \
            | python3 -c "$PARSE" 2>/dev/null \
            | tee -a "$outfile" || true
        sleep "$SLEEP"
    done

    echo ""
    local count
    count=$(grep -cE '^https?://' "$outfile" 2>/dev/null || echo 0)
    echo "Done: $target — $count result URLs saved to $outfile"
}

# ── query list (DDG-safe: no OR with site:, no *, no cache:) ─────────────────
# 13 categories, ~40 queries total.

QUERIES=(

    # 1. Directory listings
    "site:$TARGET intitle:\"index of\""
    "site:$TARGET intitle:\"index of\" \"backup\""
    "site:$TARGET intitle:\"index of\" \".git\""
    "site:$TARGET intitle:\"index of\" \"uploads\""

    # 2. Sensitive files — one filetype per query (DDG breaks on OR + site:)
    "site:$TARGET filetype:sql"
    "site:$TARGET filetype:bak"
    "site:$TARGET filetype:zip"
    "site:$TARGET filetype:env"
    "site:$TARGET filetype:log"
    "site:$TARGET filetype:conf"

    # 3. Admin panels
    "site:$TARGET inurl:admin"
    "site:$TARGET inurl:login"
    "site:$TARGET inurl:wp-admin"
    "site:$TARGET inurl:phpmyadmin"
    "site:$TARGET inurl:cpanel"
    "site:$TARGET inurl:webmail"

    # 4. Credentials / secrets
    "site:$TARGET \"password\""
    "site:$TARGET \"api_key\""
    "site:$TARGET \"db_password\""
    "site:$TARGET \"secret_key\""
    "site:$TARGET \"Authorization:\""

    # 5. Error messages
    "site:$TARGET \"Fatal error\""
    "site:$TARGET \"Warning: mysql\""
    "site:$TARGET \"SQLSTATE\""
    "site:$TARGET \"Notice: Undefined\""
    "site:$TARGET \"stack trace\""

    # 6. SQLi candidates (parameter exposure)
    "site:$TARGET inurl:\"?id=\""
    "site:$TARGET inurl:\"?page=\""
    "site:$TARGET inurl:\".php?\""

    # 7. CMS detection (WordPress)
    "site:$TARGET inurl:wp-content"
    "site:$TARGET inurl:wp-includes"
    "site:$TARGET \"Powered by WordPress\""

    # 8. Cloud / infrastructure exposure
    "site:$TARGET inurl:s3.amazonaws.com"
    "site:$TARGET inurl:blob.core.windows.net"

    # 9. Paste / code leaks (off-domain — no site: restriction, OR is safe here)
    "\"$TARGET\" site:pastebin.com"
    "\"$TARGET\" site:github.com"

    # 10. Email / user enumeration
    "site:$TARGET \"@$TARGET\""

    # 11. Subdomain discovery
    "site:$TARGET -www"

    # 12. Documents
    "site:$TARGET filetype:pdf"
    "site:$TARGET filetype:xlsx"

    # 13. Misc / info disclosure
    "site:$TARGET \"phpinfo()\""
    "\"$TARGET\" password"

)

# ── execute ───────────────────────────────────────────────────────────────────

run_dorks "$TARGET" "$OUTFILE" "${QUERIES[@]}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "All done.  Results: $OUTFILE"
echo "════════════════════════════════════════════════════════════"
