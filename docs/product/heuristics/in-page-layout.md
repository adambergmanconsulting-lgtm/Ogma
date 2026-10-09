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
| Chrome | Permanent **top bar**: brand · Chat · Call · Settings gear | Side rail; collapsible hamburger for three actions |
| Side margins | Shared **`.app-gutter-x`** (and `--spacing-gutter*`) on top bar + primary canvas | Per-view inventing `px-3` / `px-6` that misalign with chrome |
| Canvas width | Shared **`.app-column`** (`--width-app-column`, ~`max-w-lg`) for nav inner + Chat / Space; Call video full-bleed under the bar | Full-viewport nav while content is a narrow column; Space wider than Chat |
| Tokens page | Optional later — [living-design-surface.md](living-design-surface.md); heuristics stay in this file + ui-principles / ui-naming | Screenshot wiki or TeamResume-scale `/admin/design` before gutters/shell are stable |
