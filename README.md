# george-guitars.com (rebuild)

Static rebuild of `george-guitars.com` using Astro, with content-driven guitar/build pages.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server (`http://localhost:4321`) |
| `npm run build` | Build production output to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run scrape` | (Optional) Run local scraper (may be blocked by Cloudflare) |

## Content model (how to add a new guitar/build)

- **Add a new file** in `src/content/builds/<slug>.md`
- Required frontmatter fields:
  - `slug`: the URL slug (e.g. `two`)
  - `title`: page title (e.g. `Fender-style Custom Telecaster "Two"`)
- Optional fields:
  - `intro`: short intro paragraph
  - `specs`: list of spec strings
  - `callouts`: list of `{ heading, text }`
  - `featured: true` to make it the homepage build
  - `order`: sort order in the build navigation
- The markdown body is the **About this project** content.

URLs:
- Featured build renders at `/`
- Non-featured builds render at `/<slug>` (e.g. `/one`)

## Deploy

This site outputs static files (`dist/`) and can be deployed to Netlify/Vercel/GitHub Pages.

### Netlify
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Vercel
- Framework preset: Astro (or “Other”)
- **Build command**: `npm run build`
- **Output**: `dist`

## Notes

- Astro generates `sitemap-index.xml` on build and `public/robots.txt` points to it.
- Astro telemetry can be disabled with `npm run astro telemetry disable`.
