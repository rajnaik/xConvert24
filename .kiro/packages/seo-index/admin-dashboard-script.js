    // SEO Index stats — add to admin dashboard <script> block
    fetch('/api/seo-index/').then(r => r.json()).then(d => {
      var counts = { indexed: 0, discovered: 0, not_indexed: 0, excluded: 0, error: 0 };
      (d.summary || []).forEach(function(s) { counts[s.status] = s.count; });
      document.getElementById('seo-s-indexed').textContent = counts.indexed;
      document.getElementById('seo-s-discovered').textContent = counts.discovered;
      document.getElementById('seo-s-not_indexed').textContent = counts.not_indexed;
      document.getElementById('seo-s-excluded').textContent = counts.excluded;
      document.getElementById('seo-s-total').textContent = d.total;
    }).catch(() => {});
