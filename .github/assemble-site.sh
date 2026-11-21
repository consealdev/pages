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
