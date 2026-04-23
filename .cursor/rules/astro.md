# Astro Rules (george-guitars)

## Stack + approach
- Astro static site, focus on **performance**, **SEO**, **clean HTML**.
- Prefer **Astro components** and content collections over client-side frameworks.
- Avoid new dependencies unless clearly necessary.

## Routing + base path
- This site is hosted at the **domain root** (no base path like `/george-guitars/`).
- For internal links, use root-absolute paths like `/contact`, `/imprint/`, etc.
- For public assets, reference as `/assets/...` (from `public/assets/...`).

## Content collections
- Build pages come from content collections (e.g. `src/content/builds/*.md`).
- Rendering Markdown/MDX:
  - Use `render(entry)` from `astro:content` and render the returned `Content`.
- Keep schemas strict and explicit; default optional arrays to `[]` to avoid null checks.

## Images
- Store site images under `public/assets/...` (not `src/assets` for direct serving).
- Prefer consistent naming for “special” images:
  - Callout images: `public/assets/builds/<slug>/callout-1.png` etc.
- Avoid external image URLs in markdown bodies.

## Components conventions
- Keep components small and single-purpose.
- Interactive components:
  - Use inline scripts only when needed.
  - Prefer event delegation and defensive checks.
  - Ensure `hidden` works with CSS (`[hidden]{ display:none !important; }` if necessary).

## Styling
- Prefer global tokens (CSS variables) for colors and widths.
- Keep layout changes incremental; don’t unexpectedly change container widths or typography.
- Maintain:
  - Yellow header + footer
  - “Blocksatz” body text styling (justify) where intended
  - Camel Case headings (no forced uppercase transforms)

## Verification
- After changes, run `npm run build` and fix any introduced errors/warnings.
