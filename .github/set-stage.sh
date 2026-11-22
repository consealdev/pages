#!/usr/bin/env bash
#
# Points an assembled site at one stage: pre (pre.conseal.dev) or prod (conseal.dev).
#
# The pages carry nothing that differs between the stages. Their canonical addresses and the docs' sitemap name
# conseal.dev on both, so the same files go to pre and then to prod: what was looked at on pre is what ships.
# What a stage adds is beside the pages:
#
#   pre    a CNAME of pre.conseal.dev, which GitHub Pages reads from the gh-pages branch of consealdev/pages-pre, and
#          a robots.txt that disallows everything, so pre stays out of search results.
#   prod   the site as assembled. No CNAME: the custom domain of conseal.dev is set in the Pages settings of
#          consealdev/pages, which a workflow deploy reads in place of a file. A robots.txt is optional, and when
#          there is one it must not disallow everything.
#
# Then it checks what it wrote, so a stage never ships with another stage's host or robots.txt.
#
# Usage: set-stage.sh <site-dir> pre|prod
set -euo pipefail

site=${1:?usage: set-stage.sh <site-dir> pre|prod}
stage=${2:?usage: set-stage.sh <site-dir> pre|prod}

if [ ! -f "$site/index.html" ]; then
    echo "::error::$site/index.html is missing: assemble the site first (.github/assemble-site.sh)"
    exit 1
fi

case "$stage" in
    pre)
        echo "pre.conseal.dev" > "$site/CNAME"
        printf 'User-agent: *\nDisallow: /\n' > "$site/robots.txt"
        ;;
    prod)
        # The site as assembled is prod's. Nothing to write, only to check.
        ;;
    *)
        echo "::error::unknown stage '$stage': expected pre or prod"
        exit 1
        ;;
esac

if [ "$stage" = pre ]; then
    if [ "$(tr -d '[:space:]' < "$site/CNAME")" != "pre.conseal.dev" ]; then
        echo "::error file=$site/CNAME::CNAME is not pre.conseal.dev"
        exit 1
    fi
    if ! grep -qx 'Disallow: /' "$site/robots.txt"; then
        echo "::error file=$site/robots.txt::pre's robots.txt does not disallow everything"
        exit 1
    fi
else
    if [ -e "$site/CNAME" ]; then
        echo "::error file=$site/CNAME::prod has a CNAME: conseal.dev is set in the repository's Pages settings, and a file here would only be a second place to say it"
        exit 1
    fi
    if [ -f "$site/robots.txt" ] && grep -qx 'Disallow: /' "$site/robots.txt"; then
        echo "::error file=$site/robots.txt::prod's robots.txt disallows everything"
        exit 1
    fi
    # Text files only (-I skips binaries): no page, sitemap or script of prod may name the pre host.
    refs=$(grep -rIl 'pre\.conseal\.dev' "$site" || true)
    if [ -n "$refs" ]; then
        echo "::error::prod refers to pre.conseal.dev in:"
        echo "$refs"
        exit 1
    fi
fi

echo "Set $site to $stage"
