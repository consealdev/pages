# Conseal docs

The docs for Conseal, built as a static site with [Starlight](https://starlight.astro.build/) and served at https://conseal.dev/docs/, beside the home page in `../www`. The pages are written here, in `src/content/docs`.

## Commands

Run from this folder, in PowerShell or any shell. The first time, install the dependencies:

    npm install

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:4321/docs/. Search says it is unavailable in dev |
| `npm run build` | Builds the static site into `dist/`, with the search index and a sitemap |
| `npm run preview` | Serves `dist/` at http://localhost:4321/docs/, as it would be deployed |

**On conseal.local.** The Caddyfile in `_local` serves `dist/` at http://conseal.local/docs, beside the home page (see the README one folder up). Run `npm run build`, then reload; there is no server to restart.

**Search works only after a build.** The index is built with the site, so use `npm run build`, then reload conseal.local or run `npm run preview`, and press Ctrl+K or click Search.

## Pages

The pages are markdown in `src/content/docs`, one folder for each part of Conseal: `start`, `concepts`, `core`, `sync`, `ui`, `dotnet`, `api` and `security`. A folder is a group in the sidebar, so a new markdown file in one joins it, ordered by its `sidebar.order` or else by its name. A new folder needs a group in `astro.config.mjs`. `index.mdx` is the docs' landing page, reached from the "Docs" label in the header. Links between pages include the base: `/docs/concepts/keys/`.

Each page has a `description` of 120 to 160 characters, and a title short enough to stay under 60 with the site's name added. The pages are placeholders for now: each says what its part is, and the guides come later.

## Other files

The look is the other product docs' (lpdf.io, authstack.id), copied from PaySignal's `docs-site`, with Conseal's mark and tones:

- `src/styles/docs.css`: the neutral surfaces and greys, and the accent tones, with their measured contrast. The brand tokens are not here: it imports `../www/assets/css/brand.css`, so the docs and the home page share one set.
- `src/components/page-frame.astro`: with a mouse, the content scrolls in Starlight's own `.main-frame`, below the header, not in the window (see "Scrolling" in `docs.css`), so the header never shifts between pages that scroll and pages that don't. This component gives the frame keyboard focus on load and keeps a clicked tab in place. A touch screen scrolls the window.
- `src/components/head.astro` and `src/scripts/search-hint.ts`: Starlight's search button shows its shortcut (`⌘ K`) as text while its `aria-label` is `Search`, which a desktop accessibility audit fails (`label-content-name-mismatch`). The script puts the shortcut into the name once Starlight's own script has set it.
- `src/components/header.astro`: Starlight's header with the pre-release notice as a second, full-width row under it. Its height is `--docs-notice-height` in `docs.css`. Remove the component, its entry in `astro.config.mjs` and that variable at v1.0.
- `src/components/site-title.astro`: the header lockup: the mark at 24px (`codesense/logos/dist/conseal-mark.svg`) and the word, which go to the home page, and a "Docs" label, which goes to the docs home.
- `src/components/theme-toggle.astro` and `theme-provider.astro`: the half-circle theme toggle in place of Starlight's three-way picker. Dark by default, stored the way the other product sites store it (`src/theme.ts`, key `cs-theme`).
