# Living design surface

**Purpose:** Pattern note for an optional host yardstick page (tokens, components, motion). Reference shape: an internal `/admin/design`-style route. Railkit does not ship the page.

## Fast path (read first)

- Heuristics live in [ui-principles.md](ui-principles.md); the living page shows tokens/components in code.
- Build the page only when the host has a web UI and a token source.
- Code-first: tokens in repo CSS/variables; the page reads them, it does not invent a second palette in Markdown.

## Prefer / Avoid

| Prefer | Avoid |
|--------|--------|
| One route that mirrors production tokens | Screenshot wiki as the design single source of truth |
| Components rendered from the real library | Parallel Storybook that drifts from app imports |
| Link from ui-principles Fast path when the page exists | Requiring the page before adopt can start |

## Adopt

Queue "add living design surface" with owner + due date when UI heuristic docs are enabled. Do not block bootstrap on it.

## Host (Ogma)

- Heuristics owners: [ui-principles.md](ui-principles.md), [ui-naming.md](ui-naming.md), [in-page-layout.md](in-page-layout.md) (shell owner).
- Tokens today live in `src/index.css` (`@theme`). Shared chrome primitives there too: `.brand-wordmark`, `.gate-shell`, `.field` / `.field--inset`, `.btn-primary` / `.btn-secondary` / `.btn-quiet` / `.btn-ghost`, `.moment-card`, `.drawer-sheet`, `.link-action`. A living `/design` page is **queued** — thin catalog of real tokens + Chat/Call chrome; not a TeamResume-scale `/admin/design`. See [rank7-dated-queue.md](../../ops/rank7-dated-queue.md).
