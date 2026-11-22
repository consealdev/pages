#!/usr/bin/env bash
#
# Builds the folder that gets deployed: the static pages in www/, with the docs site's build
# (docs-site/dist) at /docs. Run it after `npm run build` in docs-site.
#
# Usage: assemble-site.sh <output-dir>
set -euo pipefail

out=${1:?usage: assemble-site.sh <output-dir>}
docs=docs-site/dist

if [ ! -f "$docs/index.html" ]; then
    echo "::error::$docs/index.html is missing — build the docs first ('npm run build' in docs-site)"
    exit 1
fi
if [ -e www/docs ]; then
    echo "::error::www/docs would be replaced by the docs build: the docs are written in docs-site"
    exit 1
fi

rm -rf "$out"
mkdir -p "$out/docs"
cp -a www/. "$out/"
cp -a "$docs/." "$out/docs/"

# The license page is a shell until its text, the Commercial License, is rendered into it.
node docs-site/scripts/render-license.mjs "$out"

# The visit counter. The docs load it from their own head (docs-site/astro.config.mjs), and the home page here, from
# the same OPENPANEL_CLIENT_ID. A build without it loads no counter. The id goes into HTML, so it is checked first.
if [ -n "${OPENPANEL_CLIENT_ID:-}" ]; then
    if ! [[ "$OPENPANEL_CLIENT_ID" =~ ^[A-Za-z0-9-]+$ ]]; then
        echo "::error::OPENPANEL_CLIENT_ID has characters other than letters, digits and '-'"
        exit 1
    fi
    awk -v tag="<script defer src=\"assets/js/analytics.js\" data-client-id=\"$OPENPANEL_CLIENT_ID\"></script>" \
        '/<\/head>/ { print "    " tag } { print }' "$out/index.html" > "$out/index.html.new"
    mv "$out/index.html.new" "$out/index.html"
    if [ "$(grep -c 'assets/js/analytics.js' "$out/index.html")" != 1 ]; then
        echo "::error::the home page should load the visit counter once: www/index.html needs one </head>"
        exit 1
    fi
fi
if grep -rq '/assets/js/analytics.js' "$out/docs" && [ ! -f "$out/assets/js/analytics.js" ]; then
    echo "::error::the docs load www/assets/js/analytics.js, which is missing"
    exit 1
fi

# GitHub Pages answers a missing path with the 404.html at the site's root. Until www has its own,
# the docs' one serves: its links carry the full /docs/ path, so it works from there too.
if [ ! -f "$out/404.html" ]; then
    cp "$docs/404.html" "$out/404.html"
fi

# Fail here rather than deploy the wrong thing.
if [ ! -f "$out/index.html" ]; then
    echo "::error::www/index.html is missing: the site has no home page"
    exit 1
fi
# The page's own description names the license, so look for its title, which only the rendered text has
if grep -q '<!-- license -->' "$out/license/index.html" || ! grep -q '<h1>Conseal Commercial License</h1>' "$out/license/index.html"; then
    echo "::error::the license page has no license text: render-license.mjs didn't fill it"
    exit 1
fi
if [ ! -f "$out/docs/pagefind/pagefind.js" ]; then
    echo "::error::the docs search index is missing from $out/docs/pagefind"
    exit 1
fi

echo "Assembled $out: $(find "$out" -type f | wc -l) files, docs at /docs"
