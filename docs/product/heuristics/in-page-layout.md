# In-page layout

**Purpose:** Regions and content hierarchy template (Surface → Section → Unit). Specialize to the host shell during adopt.

## Fast path (read first)

- One page, one primary job.
- Inventory regions before inventing a new chrome slot.
- Content hierarchy: Surface → Section → Unit.

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
| Chrome | Permanent **top bar**: brand · Settings gear; inner = full-bleed **`.app-gutter-x`** (not `.app-column`) | **Call** in top bar; side rail; collapsible hamburger for chrome; column-locked chrome over full-bleed space |
| Side margins | Shared **`.app-gutter-x`** (and `--spacing-gutter*`) on top bar + primary canvas | Per-view inventing `px-3` / `px-6` that misalign with chrome |
| Canvas width | Shared **`.app-column`** for home; open space is full-bleed — **video left / chat right**, each foldable (keep ≥1 open); **Call** on the video pane | Call as a second place; both panes closed; chat-only with no presence pane |
| Space panes | Matching dense panels (`.space-pane-pad`): video = status + Call → tiles → dense controls; chat = title + invite → log → compose | Loose stacked blocks; home-scale gutters; tall empty chrome; oversized call controls in the space shell |
| Chrome primitives | Reuse `.gate-shell`, `.field`, `.btn-*`, `.drawer-sheet`, `.moment-card` from `src/index.css` | One-off `rounded-xl border…` / gold button copies per view |
| Tokens page | Optional later — [living-design-surface.md](living-design-surface.md); heuristics stay in this file + ui-principles / ui-naming | Screenshot wiki or TeamResume-scale `/admin/design` before gutters/shell are stable |
