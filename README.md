# conseal.dev

The pages of [conseal.dev](https://conseal.dev), the site of [conseal](https://github.com/consealdev/conseal):

| Folder | What it is | Served at |
|---|---|---|
| `www/` | The home page, static files served as they are | https://conseal.dev/ |
| `docs-site/` | The docs, a [Starlight](https://starlight.astro.build/) site; see its README | https://conseal.dev/docs/ |
| `archive/v0.6.0/` | The site as conseal v0.6.0 deployed it: the home page and API reference, the demo, the threat model and the usage docs. Kept, not served | |

## Home page

`www/index.html`, with no build step: the look of the other product sites (lpdf.io, authstack.id, Relayout's, PaySignal's), and the docs' theme choice (`cs-theme`), so dark or light carries between the two. Paths are relative, so it works at any prefix. The demo is a window under the hero with a tab for each of its eight parts; the panels are in the page's HTML, and the scripts behind them load when the window is near the screen. What is in `www/assets`:

| File | What it is | Keep it in step |
|---|---|---|
| `css/relayout.css` | `dist/css/relayout.css` of `@relayoutui/relayout` 0.8.0, the same copy as Relayout's own pages | Copy it again from each new Relayout release |
| `css/pages-base.css`, `fonts/JetBrainsMono-Variable.ttf` | The product sites' shared look, copied unedited from `codesense/portal/ui/pages` and `ui/assets/fonts` | Copy them again after a change there; never edit the copy |
| `css/brand.css` | Conseal's tones for `pages-base.css`, with their measured contrast. The docs import it too, so both share one set | Run `npm run check-site-tones` in `codesense/logos/bin` after changing it |
| `css/home.css`, `js/home.js` | The page's own rules, and its theme toggle | |
| `css/demo.css` | The demo's look: the window, boxes, steps and results, and the two status colours with their measured contrast | Measure the two colours again after changing them, on the surfaces its header lists |
| `js/demo.js`, `js/demo/` | The demo's tabs and what each tab does, one file for each, started by `demo/start.js` | |
| `js/conseal.js` | Conseal's browser build from v0.6.0, the same file as the archive's. The demo calls only the core: sealing, wrapping, signing, the mnemonic and JWK | Replace it with the build of a newer release, and run the demo's eight tabs against it |
| `images/conseal-mark.svg`, `favicon.ico` | From `codesense/logos/dist`, the same files as the docs' | |

The page loads nothing from another site.

## Archive

`archive/v0.6.0/` is the site from before this one, with its `CNAME`. Its demo runs on that version's browser builds, `assets/conseal.js` and `assets/bip39.js`, which are committed there. Its addresses (`/demo.html`, `/threat-model.html`, `/usage/…`) don't exist in the new site, so they answer 404 once it is deployed.

## Locally

The Caddyfile in `_local` serves this repo at https://conseal.local: `www/` at `/` and the docs' build at `/docs`. A change in `www/` shows on reload. The demo needs a secure page, since the browser keeps its crypto functions from plain http: on https://conseal.local it runs, and on http://conseal.local it says so and its controls are off. The docs need `npm run build` in `docs-site` first, then reload; `/docs` is 404 until a build has run.

## Deploy

`.github/workflows/deploy.yml` builds the docs and assembles the site on every pull request (`.github/assemble-site.sh`: `www/`, with the docs' build at `/docs`). A push to `main` deploys it to GitHub Pages once approved in the `production` environment, which needs the repository's Pages source set to GitHub Actions, with conseal.dev as its custom domain. The deploy job is skipped while the repository is private, since GitHub Pages needs a public repository on a Free owner; it runs by itself on the first push to `main` after the repository is public.

Analytics: the docs add the Umami script only when the `UMAMI_WEBSITE_ID` repository variable is set. The home page has none yet.
