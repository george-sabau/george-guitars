# General Cursor Agent Rules (george-guitars)

## Goals
- Keep the site **simple, fast, and maintainable** (Astro static build).
- Prioritize **clean UX**, **SEO**, and **consistency** with george-guitars.com styling.
- Prefer small, targeted changes over big refactors.

## Project constraints (must follow)
- **Root hosted**: this site is hosted at the domain root (no base path like `/george-guitars/`).
  - Use root-absolute internal links like `/contact` and asset paths like `/assets/...`.
- **No favicon**: do not add favicon assets/links.
  - If browsers auto-request `/favicon.ico`, neutralize with a blank icon link (data URI).
- **Images live in `public/assets/...`** and must be referenced as `/assets/...` (base-safe where needed).

## Interaction / workflow
- After any UI or content change: run **`npm run build`** and fix any build errors introduced.
- When changing interactive UI (cookie banner, burger menu, gallery):
  - Prefer **defensive event handling** (works even if event target is not an Element).
  - Prefer **simple DOM + minimal JS**, no extra deps.

## Project status (session memory)
- Treat `PROJECT_STATUS.md` as the source of truth for multi-day context.
- At the start of any new session or substantial task:
  - Read `PROJECT_STATUS.md` first.
  - Summarize: today’s goal, next 3 actions, known issues/gotchas.
- Before finishing a work session:
  - Update `PROJECT_STATUS.md` with a new Daily log entry (Focus/Done/Notes/Next).
  - Refresh “Current goal (today)” + “Next 3 actions”.

## Cookie consent (important)
- Consent state is stored in **`localStorage`**.
- If the user reports “banner not visible” during iteration:
  - First suspect stored consent; **bump the storage key version** (e.g. `..._v5`) to force it to reappear.
- Ensure hiding works:
  - If using `hidden`, enforce `.[hidden]{ display:none !important; }` to prevent CSS overrides.

## Content model rules
- Builds are driven by Astro content collections.
- `callouts`:
  - Exactly **3 items** max, rendered as **3 columns** on desktop.
  - **No ALL CAPS** headings; use **Camel Case**.
  - Do not render callout headings in bold unless explicitly requested.
- Titles:
  - Use `Custom Tele "..."` naming; avoid “Fender-style” prefixes.

## Styling rules
- Keep overall style aligned with existing site:
  - **Yellow header + yellow footer**.
  - Clean typography; avoid overly bold headings.
  - Body text in **Blocksatz** (justified) where currently used.
- Avoid surprise layout changes:
  - If adjusting widths/sizing, do it in small increments and keep previous feel.

## “Don’t regress” checklist (common mistakes)
- Don’t reintroduce external Jimdo/Cloudflare image URLs into markdown bodies.
- Don’t accidentally duplicate section headings (e.g. “About this project”).
- Don’t change the cookie banner layout/behavior unless explicitly requested.
