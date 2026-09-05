// Home page: renders the topic list from topics/topics.json + each spec.json.
// Never hardcode a topic here - adding one means a folder plus a topics.json line.
(function () {
  // Level -> button label. Levels come from spec.json, so a topic that adds
  // "advanced" later shows up without touching this file.
  const LEVEL_LABEL: Record<string, string> = {
    blog: '📖 Blog',
    calculator: '🧮 Calculator',
    advanced: '🔬 Advanced'
  };

  function card(spec: Spec) {
    const el = document.createElement('article');
    el.className = 'topic-item';

    const name = spec.name || spec.slug;
    const insight = spec.insight || (spec.blog && spec.blog.description) || '';
    const meta = [spec.category, spec.difficulty].filter(Boolean).join(' · ');

    const row = document.createElement('div');
    row.className = 'topic-row';

    const title = document.createElement('strong');
    title.className = 'topic-name';
    title.textContent = name;
    row.appendChild(title);

    // Row order: name, toggle, then one button per level.
    const detail = insight ? document.createElement('div') : null;
    if (detail) {
      detail.className = 'topic-detail';
      detail.hidden = true;
      detail.textContent = insight;

      if (meta) {
        const m = document.createElement('p');
        m.className = 'topic-meta';
        m.textContent = meta;
        detail.appendChild(m);
      }

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'topic-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `What is ${name}?`);
      toggle.textContent = '▾';
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        toggle.textContent = open ? '▾' : '▴';
        detail!.hidden = open;
        if (!open && window.trackEvent) {
          window.trackEvent('topic_detail_open', { slug: spec.slug });
        }
      });
      row.appendChild(toggle);
    }

    (spec.levels || []).forEach(level => {
      const href = spec.pages && spec.pages[level];
      if (!href) return; // level declared but no page URL - skip rather than link nowhere
      const a = document.createElement('a');
      a.href = href;
      a.className = 'teal-button-link';
      a.textContent = LEVEL_LABEL[level] || level;
      a.addEventListener('click', () => {
        if (window.trackEvent) window.trackEvent('topic_open', { slug: spec.slug, level: level });
      });
      row.appendChild(a);
    });

    el.appendChild(row);
    if (detail) el.appendChild(detail);

    return el;
  }

  function render() {
    fetch('/scientific_cal/topics/topics.json')
      .then(r => r.json() as Promise<string[]>)
      .then(slugs => Promise.all(
        slugs.map(slug =>
          fetch(`/scientific_cal/topics/${slug}/spec.json`)
            .then(r => r.json() as Promise<Spec>)
            .catch(() => null) // one broken spec must not blank the whole page
        )
      ))
      .then(specs => {
        const list = document.getElementById('topicList');
        if (!list) return;
        const ok = specs.filter((s): s is Spec => Boolean(s));
        list.innerHTML = '';
        if (!ok.length) {
          list.innerHTML = '<p class="topic-insight">No topics yet.</p>';
          return;
        }
        ok.forEach(spec => list.appendChild(card(spec)));
      })
      .catch(() => {
        const status = document.getElementById('topicListStatus');
        if (status) status.textContent = 'Could not load topics.';
      });
  }

  // defer in the tag means the DOM is parsed already, but guard anyway.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
