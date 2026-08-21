"use strict";
(function () {
    const script = document.currentScript;
    const level = script && script.dataset.level;
    if (!level)
        return;
    // Slug from data-slug. Path fallback only works on raw /topics/<slug>/ URLs,
    // not on the rewritten public ones (/interpolate_blog).
    const m = location.pathname.match(/^\/topics\/([^/]+)\//);
    const slug = (script.dataset.slug) || (m && m[1]);
    if (!slug)
        return;
    // Pages carry static title/description so crawlers see them without running JS.
    // spec.json stays the source of truth: overwrite here, and warn when the two differ
    // so drift shows up during SEO validation instead of silently shipping.
    function warnDrift(field, staticValue, specValue) {
        if (staticValue && staticValue !== specValue) {
            console.warn(`[seo] ${field} drift on ${location.pathname}\n` +
                `  page:      ${staticValue}\n` +
                `  spec.json: ${specValue}\n` +
                `  Update the static tag in the page to match spec.json.`);
        }
    }
    fetch(`/topics/${slug}/spec.json`)
        .then(r => r.json())
        .then(spec => {
        const meta = spec[level];
        if (!meta)
            return;
        if (meta.title) {
            warnDrift('title', document.title, meta.title);
            document.title = meta.title;
        }
        if (meta.description) {
            let tag = document.querySelector('meta[name="description"]');
            if (!tag) {
                tag = document.createElement('meta');
                tag.name = 'description';
                document.head.appendChild(tag);
            }
            else {
                warnDrift('description', tag.content, meta.description);
            }
            tag.content = meta.description;
        }
    })
        .catch(() => {
        // Static tags already rendered; a failed fetch just means no sync this load.
        console.warn(`[seo] could not load /topics/${slug}/spec.json`);
    });
})();
//# sourceMappingURL=seo.js.map