(function () {
  'use strict';

  var allDorks = [];
  var currentEngineFilter = '';
  var currentCatFilter = '';
  var currentSearch = '';

  fetch('data/dorks.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      allDorks = data.dorks || [];
      document.getElementById('board-stats').textContent =
        allDorks.length + ' community dorks · ' +
        new Set(allDorks.map(function (d) { return d.submitted_by; })).size + ' contributors';
      render();
    })
    .catch(function () {
      document.getElementById('board-stats').textContent = 'unavailable';
      document.getElementById('dork-list').innerHTML = '<p class="api-error">Could not load dork board.</p>';
    });

  document.getElementById('search-input').addEventListener('input', function () {
    currentSearch = this.value.toLowerCase();
    render();
  });

  document.getElementById('engine-filter').addEventListener('change', function () {
    currentEngineFilter = this.value;
    render();
  });

  document.getElementById('category-filter').addEventListener('change', function () {
    currentCatFilter = this.value;
    render();
  });

  function render() {
    var filtered = allDorks.filter(function (d) {
      if (currentEngineFilter && d.engine !== currentEngineFilter) return false;
      if (currentCatFilter && d.category !== currentCatFilter) return false;
      if (currentSearch && !(
        d.query_pattern.toLowerCase().includes(currentSearch) ||
        d.description.toLowerCase().includes(currentSearch)
      )) return false;
      return true;
    });

    var el = document.getElementById('dork-list');
    if (!filtered.length) {
      el.innerHTML = '<p class="api-empty">No dorks match filter.</p>';
      return;
    }

    el.innerHTML = filtered.map(function (d) {
      return '<div class="dork-card">' +
        '<div class="dork-card-header">' +
          '<span class="dork-cat">' + d.category + '</span>' +
          '<span class="dork-eng eng-' + d.engine + '">' + d.engine + '</span>' +
          '<span class="dork-submitter">by ' + d.submitted_by + '</span>' +
        '</div>' +
        '<code class="dork-pattern">' + d.query_pattern + '</code>' +
        '<p class="dork-desc">' + d.description + '</p>' +
        '<div class="dork-card-footer">' +
          '<button class="copy-btn" data-pattern="' + d.query_pattern.replace(/"/g, '&quot;') + '">copy pattern</button>' +
          '<a href="dork-runner.html" class="open-btn">try in runner ↗</a>' +
        '</div>' +
      '</div>';
    }).join('');

    el.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(this.dataset.pattern).then(function () {
          btn.textContent = 'copied!';
          setTimeout(function () { btn.textContent = 'copy pattern'; }, 1200);
        });
      });
    });
  }

})();
