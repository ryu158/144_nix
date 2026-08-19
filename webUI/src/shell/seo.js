(function () {
  const script = document.currentScript;
  const level = script && script.dataset.level;
  const m = location.pathname.match(/^\/topics\/([^/]+)\//);
  if (!level || !m) return;
  const slug = m[1];

  fetch(`/topics/${slug}/spec.json`)
    .then(r => r.json())
    .then(spec => {
      const meta = spec[level];
      if (!meta) return;

      if (meta.title) document.title = meta.title;

      if (meta.description) {
        let tag = document.querySelector('meta[name="description"]');
        if (!tag) {
          tag = document.createElement('meta');
          tag.name = 'description';
          document.head.appendChild(tag);
        }
        tag.content = meta.description;
      }
    });
})();
