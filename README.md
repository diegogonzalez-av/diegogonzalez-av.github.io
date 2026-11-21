# diegogonzalez-av.github.io

Personal site of **Diego Gonzalez** — Enterprise AV, product management and workplace technology — with three free tools:
display size calculator, meeting cost calculator and conference room acoustics checker.

Static site, zero runtime dependencies, built by a ~100-line Node script and deployed by GitHub Actions.

## Everyday edits
| I want to… | Edit |
|---|---|
| Change LinkedIn/Amazon/Gumroad/email, title, bio facts, analytics | `site.config.json` |
| Add an insight (article or LinkedIn post card) | new file in `content/insights/` (copy an existing one). `url: linkedin` links to the LinkedIn feed; a full URL links out; no `url` + Markdown body = page on this site |
| Update tool assumptions, reference prices, sources | `data/tools.json` (update the `checked` date) |
| Change page copy | `src/templates/pages.mjs` (main pages), `src/templates/tool-*.mjs` + `src/tools/*/strings.mjs` |
| Change styles | `src/styles/site.css` |
| Regenerate social images / favicons | `python scripts/make_og.py` (needs Pillow; originals in `_source/`, not committed) |

Browser QA of every tool control: copy `tests/browser/qa.html` to `dist/_qa.html`, run `npm run serve`, open http://localhost:8080/_qa.html (results appear on the page; delete the file afterwards).

Then: `npm run check` (build + 38 tests) → `npm run serve` → open http://localhost:8080 → commit and push. GitHub Actions builds, tests and deploys; a failing test blocks the deploy.

## Publishing a new insight (e.g. the Tuesday post)
1. Save the visual (optional) as `assets/insights/<short-name>.jpg` (16:9 works best, ~1600 px wide).
2. Create `content/insights/NN-short-name.md`:
```
---
title: Everybody wants more of the room
kind: linkedin
source: LinkedIn
date: 2026-11-24
url: https://www.linkedin.com/feed/update/urn:li:activity:XXXXXXXXXXXXXXXXXXX/
topic: Experience
image: /assets/insights/short-name.jpg
imageAlt: One-line description of the visual
quote: Optional memorable line (shown only when there is no image)
summary: Two lines that make someone want to read it.
---
```
3. `npm run check` → commit → push. The newest dated item becomes **Latest idea** on the home page automatically; the AV Magazine piece stays alongside as **Published in AV Magazine** (`featured: true`).

## Structure
```
site.config.json        identity, links, contact, analytics (single source of truth)
data/tools.json         tool assumptions, dated reference prices, sources
content/insights/*.md   editorial cards / essays (front matter + Markdown)
src/templates/          page templates (JS template literals)
src/tools/<tool>/       calc.mjs (pure, tested) · strings.mjs (copy) · ui.js (browser)
src/styles/             design system
assets/                 fonts (self-hosted), images, Open Graph cards
docs/methodology/       formulas, assumptions, sources, limitations per tool
tests/                  calculation tests + built-site checks (links, SEO, no placeholders, no employer names)
build.mjs → dist/       generated site (not committed)
```

## Analytics (optional, off by default)
Create a free GoatCounter site, then set `"analytics": { "provider": "goatcounter", "code": "<your-code>" }`.
Only page views and anonymous events are sent (`display-opened`, `meeting-calculated`, `meeting-share-linkedin`, `book-amazon`, …). Calculator values are never sent. The privacy page updates itself.

## Custom domain
Set `site.url` to the new address and add `"cname": "yourdomain.com"` under `site`, rebuild, push, then configure DNS + GitHub Pages settings.
