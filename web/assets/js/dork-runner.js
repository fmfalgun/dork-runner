(function () {
  'use strict';

  var currentEngine = 'both';
  var currentDomain = '';
  var currentCategoryFilter = '';

  /* ── Engine toggle ──────────────────────────────────────────────── */

  document.querySelectorAll('.eng-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.eng-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentEngine = this.dataset.engine;
      updateEngineUI();
      if (currentDomain) renderQueries();
    });
  });

  function updateEngineUI() {
    var ddgNotice = document.getElementById('ddg-notice');
    var csePanel  = document.getElementById('cse-panel');
    ddgNotice.style.display = (currentEngine === 'ddg') ? 'block' : 'none';
    csePanel.style.display  = (currentEngine === 'google') ? 'block' : 'none';
  }

  /* ── Run button ─────────────────────────────────────────────────── */

  document.getElementById('run-btn').addEventListener('click', run);
  document.getElementById('domain-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') run();
  });

  function run() {
    var val = document.getElementById('domain-input').value.trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    if (!val) return;
    currentDomain = val;
    document.getElementById('b-results').style.display = 'block';
    document.getElementById('query-panel').style.display = 'block';
    runPassiveApis(val);
    renderQueries();
  }

  /* ── Option B — Passive APIs ────────────────────────────────────── */

  function runPassiveApis(domain) {
    fetchWayback(domain);
    fetchGithub(domain);
    fetchCrtsh(domain);
  }

  function fetchWayback(domain) {
    var el = document.getElementById('wayback-list');
    el.innerHTML = '<span class="loading">fetching...</span>';
    var url = 'https://web.archive.org/cdx/search/cdx?url=*.' + encodeURIComponent(domain) +
      '&output=json&limit=50&fl=original,statuscode,timestamp&collapse=urlkey&filter=statuscode:200';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var entries = rows.slice(1); // rows[0] is header
        document.getElementById('wayback-count').textContent = '(' + entries.length + ')';
        if (!entries.length) {
          el.innerHTML = '<span class="api-empty">no archived URLs found</span>';
          return;
        }
        el.innerHTML = entries.slice(0, 20).map(function (r) {
          return '<div class="b-entry"><a href="https://web.archive.org/web/' + r[2] + '/' + r[0] +
            '" target="_blank" rel="noopener">' + r[0] + '</a>' +
            '<span class="b-meta">' + r[1] + ' · ' + r[2].slice(0, 8) + '</span></div>';
        }).join('');
      })
      .catch(function () {
        el.innerHTML = '<span class="api-error">Wayback CDX unavailable</span>';
      });
  }

  function fetchGithub(domain) {
    var el = document.getElementById('github-list');
    el.innerHTML = '<span class="loading">fetching...</span>';
    var url = 'https://api.github.com/search/code?q=' + encodeURIComponent('"' + domain + '"') + '&per_page=10';
    fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = data.items || [];
        document.getElementById('github-count').textContent = '(' + (data.total_count || 0) + ' total)';
        if (!items.length) {
          el.innerHTML = '<span class="api-empty">no public code references found</span>';
          return;
        }
        el.innerHTML = items.map(function (i) {
          return '<div class="b-entry"><a href="' + i.html_url + '" target="_blank" rel="noopener">' +
            i.repository.full_name + ' / ' + i.name + '</a></div>';
        }).join('');
      })
      .catch(function () {
        el.innerHTML = '<span class="api-error">GitHub search unavailable (rate limit: 10 req/min unauthenticated)</span>';
      });
  }

  function fetchCrtsh(domain) {
    var el = document.getElementById('crtsh-list');
    el.innerHTML = '<span class="loading">fetching...</span>';
    var url = 'https://crt.sh/?q=%25.' + encodeURIComponent(domain) + '&output=json';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var names = Array.from(new Set(data.map(function (e) { return e.name_value; }))).sort();
        document.getElementById('crtsh-count').textContent = '(' + names.length + ')';
        if (!names.length) {
          el.innerHTML = '<span class="api-empty">no certificates found</span>';
          return;
        }
        el.innerHTML = names.slice(0, 30).map(function (n) {
          return '<div class="b-entry">' + n + '</div>';
        }).join('');
      })
      .catch(function () {
        el.innerHTML = '<span class="api-error">crt.sh unavailable</span>';
      });
  }

  /* ── Option A — Query rendering ─────────────────────────────────── */

  function getFilteredQueries() {
    var lists = [];
    if (currentEngine === 'google' || currentEngine === 'both') lists = lists.concat(DORK_QUERIES.google);
    if (currentEngine === 'ddg'    || currentEngine === 'both') lists = lists.concat(DORK_QUERIES.ddg);
    if (currentCategoryFilter) {
      lists = lists.filter(function (q) { return q.category === currentCategoryFilter; });
    }
    return lists;
  }

  function renderQueries() {
    var queries = getFilteredQueries();
    var container = document.getElementById('query-list');
    document.getElementById('query-count').textContent = '(' + queries.length + ')';

    container.innerHTML = queries.map(function (q, i) {
      var pattern   = q.pattern.replace(/\$DOMAIN/g, currentDomain);
      var eng       = (currentEngine === 'both') ? q.engine : currentEngine;
      var searchUrl = (eng === 'ddg')
        ? 'https://duckduckgo.com/?q=' + encodeURIComponent(pattern)
        : 'https://www.google.com/search?q=' + encodeURIComponent(pattern);

      return '<div class="query-card">' +
        '<label class="query-check"><input type="checkbox" class="query-checkbox" data-url="' + searchUrl + '" data-idx="' + i + '"></label>' +
        '<div class="query-body">' +
          '<span class="query-cat cat-' + q.category + '">' + q.category + '</span>' +
          '<span class="query-eng eng-' + q.engine + '">' + q.engine + '</span>' +
          '<code class="query-pattern">' + pattern + '</code>' +
          '<span class="query-desc">' + q.description + '</span>' +
        '</div>' +
        '<div class="query-actions-cell">' +
          '<button class="copy-btn" data-pattern="' + pattern.replace(/"/g, '&quot;') + '">copy</button>' +
          '<a class="open-btn" href="' + searchUrl + '" target="_blank" rel="noopener">open ↗</a>' +
        '</div>' +
      '</div>';
    }).join('');

    // copy buttons
    container.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(this.dataset.pattern).then(function () {
          btn.textContent = 'copied!';
          setTimeout(function () { btn.textContent = 'copy'; }, 1200);
        });
      });
    });

    // select-all + selected count
    document.getElementById('select-all').checked = false;
    updateSelectedCount();
    container.querySelectorAll('.query-checkbox').forEach(function (cb) {
      cb.addEventListener('change', updateSelectedCount);
    });
  }

  document.getElementById('select-all').addEventListener('change', function () {
    document.querySelectorAll('.query-checkbox').forEach(function (cb) {
      cb.checked = this.checked;
    }.bind(this));
    updateSelectedCount();
  });

  function updateSelectedCount() {
    var n = document.querySelectorAll('.query-checkbox:checked').length;
    document.getElementById('selected-count').textContent = n + ' selected';
  }

  /* ── Open Selected — tab launcher with delay ────────────────────── */

  document.getElementById('open-selected-btn').addEventListener('click', function () {
    var checked = Array.from(document.querySelectorAll('.query-checkbox:checked'));
    if (!checked.length) return;
    checked.forEach(function (cb, i) {
      setTimeout(function () { window.open(cb.dataset.url, '_blank'); }, i * 1500);
    });
  });

  /* ── Category filters ───────────────────────────────────────────── */

  function buildCategoryFilters() {
    var categories = Array.from(new Set(
      DORK_QUERIES.google.concat(DORK_QUERIES.ddg).map(function (q) { return q.category; })
    ));
    var el = document.getElementById('category-filters');
    el.innerHTML = '<button class="cat-chip active" data-cat="">All</button>' +
      categories.map(function (c) {
        return '<button class="cat-chip" data-cat="' + c + '">' + c + '</button>';
      }).join('');
    el.querySelectorAll('.cat-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        el.querySelectorAll('.cat-chip').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        currentCategoryFilter = this.dataset.cat;
        if (currentDomain) renderQueries();
      });
    });
  }

  buildCategoryFilters();

  /* ── Option C — Google CSE ──────────────────────────────────────── */

  // Load saved key on page load
  (function () {
    var key = localStorage.getItem('cse_key');
    var cx  = localStorage.getItem('cse_cx');
    if (key) document.getElementById('cse-key').value = key;
    if (cx)  document.getElementById('cse-cx').value  = cx;
    if (key && cx) document.getElementById('cse-status').textContent = 'key saved ✓';
  })();

  document.getElementById('save-cse-btn').addEventListener('click', function () {
    var key = document.getElementById('cse-key').value.trim();
    var cx  = document.getElementById('cse-cx').value.trim();
    localStorage.setItem('cse_key', key);
    localStorage.setItem('cse_cx', cx);
    document.getElementById('cse-status').textContent = 'saved ✓';
  });

  document.getElementById('clear-cse-btn').addEventListener('click', function () {
    localStorage.removeItem('cse_key');
    localStorage.removeItem('cse_cx');
    document.getElementById('cse-key').value = '';
    document.getElementById('cse-cx').value  = '';
    document.getElementById('cse-status').textContent = 'cleared';
  });

})();
