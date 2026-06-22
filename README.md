# dork-runner

Google + DDG dork query launcher with passive OSINT APIs and a community Dork Board.
400+ built-in query patterns across 13 categories. No backend required.

[Live Site](https://fmfalgun.github.io/dork-runner) · [Dork Board](https://fmfalgun.github.io/dork-runner/dork-board.html) · [GitHub](https://github.com/fmfalgun/dork-runner)

---

## What it does

Three complementary features that work together without any server-side component:

- **Option A — Query Launcher:** 400+ built-in dork patterns (Google + DDG). Enter a domain, filter by category and engine, then open queries in browser tabs with an automatic 1.5s delay to bypass popup blockers.
- **Option B — Passive APIs (auto-runs, no key needed):** Wayback Machine CDX (historical URLs), GitHub code search (domain mentioned in public repos), crt.sh (SSL certificate subdomains). All three APIs are CORS-open; results appear inline on the page.
- **Option C — Google CSE (optional):** Provide your own Google Custom Search Engine API key for in-page search results per dork query. Stored locally in your browser's `localStorage`, never shared.

---

## Engine comparison

| Feature | Google | DDG |
|---------|--------|-----|
| Query launcher (Option A) | ✓ | ✓ |
| Passive APIs (Option B) | ✓ | ✓ |
| In-page search results (Option C) | ✓ (with CSE key) | ✗ |
| `OR` operators | ✓ | ✗ (breaks site: scope) |
| `*` wildcards | ✓ | ✗ |
| `cache:` operator | ✓ | ✗ |

**DDG limitation:** DuckDuckGo has no public search results API. Their `api.duckduckgo.com` endpoint returns only Instant Answers (definitions, infoboxes) — not web search results. Browser-side fetch of DDG search pages is blocked by CORS + bot detection. DDG mode uses Option A (query launcher) + Option B (passive APIs) only. This is documented in the UI via a tooltip on the DDG toggle and in the source at `dork-runner.js`.

---

## CLI usage

For terminal users who prefer `ddgr` or `googler`:

```bash
# DDG dorks
bash ddgr-dorks.sh nmap.org

# Google dorks
bash googler-dorks.sh nmap.org

# Adjust sleep between queries (default 4s)
SLEEP=6 bash ddgr-dorks.sh nmap.org

# Requirements: ddgr (for ddgr-dorks.sh), googler (for googler-dorks.sh)
# Install: pip install ddgr googler
```

---

## Web UI usage

1. Go to `https://fmfalgun.github.io/dork-runner`
2. Click **Open Runner**
3. Enter a domain (e.g. `nmap.org`)
4. Select engine: **Both** / **Google** / **DDG**
5. Click **RUN** — passive APIs auto-fetch, query list appears
6. Filter by category, check the queries you want, click **Open Selected in Tabs**

---

## Google CSE setup (optional)

Enables actual Google search results per dork query directly on the page. 100 free queries/day via the Google Custom Search API.

1. Go to [programmablesearchengine.google.com](https://programmablesearchengine.google.com) → **New search engine** → search the entire web → copy the **Search Engine ID (cx)**
2. Go to [Google Cloud Console](https://console.cloud.google.com) → Enable **Custom Search API** → Create credentials → **API key**
3. In the Runner: select **Google** engine → click **⚙ CSE Setup** → paste both values → **Save**

Both values are stored in your browser's `localStorage` only — never sent anywhere except `customsearch.googleapis.com`.

---

## Community Dork Board

The [Dork Board](https://fmfalgun.github.io/dork-runner/dork-board.html) is a community-contributed collection of dork patterns. Users submit patterns (not findings — patterns only). Each entry shows the category, target engine, a copy button, and a link to run it directly in the Runner.

**To submit a pattern:**

1. Open a GitHub Issue with the title format:

   ```
   [dork] category | engine | description | site:$DOMAIN your-pattern
   ```

2. Example:

   ```
   [dork] file-exposure | google | Find exposed .env files | site:$DOMAIN filetype:env
   ```

3. The `$DOMAIN` placeholder is required — it is substituted with the target domain when someone runs your pattern in the Runner.

4. CI processes the issue, adds the pattern to the board, and closes the issue with a confirmation comment.

---

## Dork categories

13 built-in categories covering the most common OSINT and recon use cases:

- Directory Listings
- File Exposure
- Admin Panels
- Credentials
- Error Messages
- SQLi Candidates
- CMS Detection
- Cloud/Infra
- Paste Leaks
- Email/Users
- Subdomain Discovery
- Documents
- Miscellaneous

---

## License

MIT
