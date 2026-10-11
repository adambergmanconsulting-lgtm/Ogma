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
| Chrome | Permanent **top bar**: brand · quiet **Active** / **Hidden** (once a vault has an id) · Settings; brand → **All** tab (soft-nav when in Call); side inset matches the video and chat pane heads | **Call** or **New** on the top bar; **Active** beside the brand; **Active** styled as Chat/Call; nav hamburger; brand as non-interactive decoration; an All-only page |
| Side margins | Branded top bar uses **`.space-pane-pad`** (same 0.75rem as video and chat). **`.app-gutter-x`** still steps up on gates (vault, lobby, reveal) | Stepped page gutter on the branded row; per-view `px-3` / `px-6` that miss the pane heads |
| Work shell | **Video \| Chat** under the top bar; bare `/` resumes last space or idle workspace (no auto-create) | Separate `/` All-only screen; a Start-new band above video |
| Chat column | Tabs **This chat** \| **All** · **New** — one tab visible. **New** creates a space; **All** continues an old one (with **Search**). This chat = **Invite** (dimmed if no Active) · **Copy link**; Active list in a panel; log (`{name} joined` stays), compose. Call is on the video pane | Horizontal people in the header; full InviteLinkBar on This chat; full people directory in This chat; **Chat** \| **Spaces** |
| All list | **Search** filters chats + People; name opens that chat; **Call** is the secondary act on the row; **People** is where Invite starts a new chat | A Chat button beside a This chat tab; full-width list over video; full directory under This chat |
| Video + Chat | Full-bleed under the top bar; each foldable; keep ≥1 open when a space is open; idle when none. The idle wash sits behind both panes. It fades and stops once a call is up, a text message is in the log, or the compose box has text | Both panes closed; Call as a second full-screen place; chat-only with no presence pane; idle wash only inside the video pane; fireflies moving over an active chat or call |
| Space panes | Dense panels (`.space-pane-pad`): video = status + **Call** → tiles → controls; **Blur background** sits on the local camera tile, and **Blur settings** folds the backdrop / edge cut (hidden while sharing a screen); the call **Settings** gear opens and closes Devices; chat = **Copy link** action, steady Invite a person, log, compose | Blur or backdrop in Devices or the call bar; backdrop standing open on the tile; a settings gear that only opens; cramped Invite toggle; standing URL + Copy redundancy on This chat; second **Call** in the chat header |
| Space-bound Call | **Call** on the video pane fills Video; same compose + Loom log (no chat drawer) | Top-bar Call; cold Create lobby; Call as the only way to show video; separate ephemeral Thread transcript |
| Soft-nav in Call | Thread stays live; brand → idle workspace + strip + return strip (status · Back to call · Leave); hang up only on Leave or page close | Hang up on brand / open another chat; silent background with no return |
| Brand type | Fraunces on top-bar **Ogma** only | Display face on home body / space titles / Devices |
| Chrome primitives | Reuse `.gate-shell`, `.field`, `.btn-*`, `.drawer-sheet`, `.moment-card` from `src/index.css` | One-off `rounded-xl border…` / gold button copies per view |
| Tokens page | Optional later — [living-design-surface.md](living-design-surface.md); heuristics stay here + ui-principles / ui-naming | Screenshot wiki or TeamResume-scale `/admin/design` before gutters/shell are stable |
