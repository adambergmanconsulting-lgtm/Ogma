# In-page layout

**Purpose:** Deciding owner for shell composition, regions, and content hierarchy (Surface → Section → Unit). Labels: [ui-naming.md](ui-naming.md). Product jobs: [overview.md](../overview.md).

## Fast path (read first)

- One page, one primary job.
- Inventory regions before inventing a new chrome slot.
- Content hierarchy: Surface → Section → Unit.
- **Host shell locks:** [Host fill-in (Ogma)](#host-fill-in-ogma) — top bar, gutters, space panes, Call placement, soft-nav.

## Regions (template)

| Region | Role |
|--------|------|
| **Primary canvas** | The work itself (editor, list, board) |
| **Secondary** | Supporting tools (filters, inspector) |
| **Activity / status** | Transient feedback, not permanent essay |
| **Chrome** | Nav, account, global actions |

## Prefer / Avoid

| Prefer | Avoid |
|--------|--------|
| Shared layout patterns reused across routes | One-off layout per page without a named reason |
| Progressive disclosure for rare controls | Equally loud controls for rare and common jobs |
| Page orientation stated once (work vs config) | Mixing settings chores into the work canvas without a clear mode switch |

## Host fill-in (Ogma)

| Lock | Prefer | Avoid |
|------|--------|--------|
| Chrome | Permanent **top bar**: brand · Settings gear; brand → home list; inner = full-bleed **`.app-gutter-x`** (not `.app-column`) | **Call** in top bar; side rail; collapsible hamburger; column-locked chrome over full-bleed space; brand as non-interactive decoration |
| Side margins | Shared **`.app-gutter-x`** (and `--spacing-gutter*`) on top bar + primary canvas | Per-view inventing `px-3` / `px-6` that misalign with chrome |
| Home canvas | Shared **`.app-column`**; list: **Start new** first, then spaces by activity | Parallel loud Chat/Call tiles outside the list; Join as loud peer chrome |
| Space canvas | Full-bleed **video left / chat right**; each foldable; keep ≥1 open | Both panes closed; Call as a second full-screen place; chat-only with no presence pane |
| Space panes | Dense panels (`.space-pane-pad`): video = status + **Call** → tiles → controls; chat = title + invite → log → compose | Loose stacked blocks; home-scale gutters; tall empty chrome; oversized call controls; second **Call** in the chat header |
| Space-bound Call | **Call** on the video pane fills the left side; same compose + Loom log (no chat drawer) | Top-bar Call; cold Create lobby; Call as the only way to show video; separate ephemeral Thread transcript |
| Soft-nav in Call | Thread stays live; return strip (status · Back to call · Leave); hang up only on Leave or page close | Hang up on brand home / open another chat; silent background with no return |
| Brand type | Fraunces on top-bar **Ogma** only | Display face on home body / space titles / Devices |
| Chrome primitives | Reuse `.gate-shell`, `.field`, `.btn-*`, `.drawer-sheet`, `.moment-card` from `src/index.css` | One-off `rounded-xl border…` / gold button copies per view |
| Tokens page | Optional later — [living-design-surface.md](living-design-surface.md); heuristics stay here + ui-principles / ui-naming | Screenshot wiki or TeamResume-scale `/admin/design` before gutters/shell are stable |
