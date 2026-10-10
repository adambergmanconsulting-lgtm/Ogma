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
| Chrome | Permanent **top bar**: brand · **Start new** (Chat/Call) · Settings; brand → **Spaces** tab (soft-nav when in Call); side inset matches the video and chat pane heads | **Call** for the open space in the top bar; nav hamburger; brand as non-interactive decoration; a Spaces-only page |
| Side margins | Branded top bar uses **`.space-pane-pad`** (same 0.75rem as video and chat). **`.app-gutter-x`** still steps up on gates (vault, lobby, reveal) | Stepped page gutter on the branded row; per-view `px-3` / `px-6` that miss the pane heads |
| Work shell | **Video \| Chat** under the top bar; bare `/` resumes last space or idle workspace (no auto-create) | Separate `/` Spaces-only screen; a Start-new band above video |
| Chat column | Tabs **Chat** \| **Spaces** — one visible; Chat = title, invite, log, compose; Spaces = space list + quiet invite; opening a space returns to Chat | Stacking the list on the open chat; a second Start new inside Spaces |
| Previous spaces | Name opens that chat; **Call** is the secondary act on the row | A Chat button beside a Chat tab; full-width list over video |
| Video + Chat | Full-bleed under Start new; each foldable; keep ≥1 open when a space is open; idle when none | Both panes closed; Call as a second full-screen place; chat-only with no presence pane |
| Space panes | Dense panels (`.space-pane-pad`): video = status + **Call** → tiles → controls; chat = title + invite → log → compose | Loose stacked blocks; tall empty chrome; oversized call controls; second **Call** in the chat header |
| Space-bound Call | **Call** on the video pane fills Video; same compose + Loom log (no chat drawer) | Top-bar Call; cold Create lobby; Call as the only way to show video; separate ephemeral Thread transcript |
| Soft-nav in Call | Thread stays live; brand → idle workspace + strip + return strip (status · Back to call · Leave); hang up only on Leave or page close | Hang up on brand / open another chat; silent background with no return |
| Brand type | Fraunces on top-bar **Ogma** only | Display face on home body / space titles / Devices |
| Chrome primitives | Reuse `.gate-shell`, `.field`, `.btn-*`, `.drawer-sheet`, `.moment-card` from `src/index.css` | One-off `rounded-xl border…` / gold button copies per view |
| Tokens page | Optional later — [living-design-surface.md](living-design-surface.md); heuristics stay here + ui-principles / ui-naming | Screenshot wiki or TeamResume-scale `/admin/design` before gutters/shell are stable |
