# UI naming

**Purpose:** Locked Prefer/Avoid for chrome strings and microcopy grammar. Fill host product words during adopt.

## Fast path (read first)

- Prefer **you / your job** voice and **immediate** outcome verbs.
- Avoid system-narrator labels when a user-job verb exists.
- Product-specific locked strings: edit the tables below for the host.

## Prefer / Avoid (grammar)

| Prefer | Avoid |
|--------|--------|
| Everyday outcome verb ("Save", "Send", "Download PDF") | Abstract synonym ("Persist", "Submit payload") |
| You / your when addressing the actor | "The user must…" in chrome |
| Same word for the same object everywhere | Synonym drift across surfaces |
| Cut standing helper text by default | Permanent tutorial chrome on high-frequency paths |

## Host locked strings (fill-in)

| Concept | Locked label | Avoid |
|---------|--------------|-------|
| Lobby display-name field | Label: **Your name**. No placeholder (empty field). | Sample first names in placeholder ("Ada", "Alex", …); synonym labels ("Nickname", "Handle") |
| Lobby invite (opened link) | **Join** only | Paste field; cold **Create** lobby; **New room** parallel path |
| Call invite control | Button: **Copy** → **Copied**; field aria-label **Invite link** | Standing "send this so they join" / "paste it to them" essays |
| Call status (alone) | **Waiting…** | "Waiting for others…"; "Waiting alone — …" helper under the bar |
| Call status (setup) | **Connecting…** | "Connecting to trackers…" |
| Chat on Call | Same space compose + Loom log (no drawer) when Call is space-bound | Separate ephemeral Thread transcript; hiding the chat behind a drawer on space-bound Call |
| Devices drawer title | **Devices** | "Hardware"; "hot-swap" subtitles; standing test-sound tutorials |
| Remote audio unlock | **Enable sound** | Browser-policy essays on the overlay |
| Local tile name | Display name only | "(You)" suffix |
| Capacity notice | `{n} of {max} — quality may drop` | Long "room is getting full" essays |
| Capacity full | `Room full ({max} max)` | Long "room is full of people" essays |
| Call lobby honest (free) | overview Thread free honest paragraph (muted under name on Join) | Paid-path copy; "no servers" / "fully anonymous" |
| Background blur | **Blur background** / **Clear background** | "Portrait mode"; "virtual background" for blur-only |
| Privacy backdrop (Devices, while blur on) | **Backdrop** with chips **Soft** / **Cool** / **Warm** | "Virtual background"; photo gallery; file upload in ControlBar |
| Blur matte firmness (Devices, while blur on) | **Edge cut** Soft → Firm (0–100); Soft = original matte, Firm = tighter cut | "Aggressiveness"; multi-slider debug chrome |
| Cold start | Field **Your name**; primary **Continue**; quiet **Use a vault** → splash | Create/Open as loud peers to Continue; vault essay on the main screen |
| Vault splash | Title **Vault**; short why; grouped **Create vault** / **Open vault** | Standing why on cold start; Create/Open as equal primary buttons |
| Vault key (opt-in) | Splash **Create vault**, or Settings **Add vault key** → **Your vault key** | Vault key on every Continue |
| Vault unlock | Title **Open vault**; field **Vault key**; **Open**; quiet **Back** | Heading = display name; unlock on every visit |
| Vault session | Stay signed in until **Log out** (only if vault key exists) | Re-prompt vault key on reload |
| Space invite | On the open chat: **InviteLinkBar** (**Copy** → **Copied**) | Blocking invite reveal before the chat exists; standing capability essays |
| App chrome | Permanent top bar: **Ogma** brand · trailing **Settings**; inner row = full-bleed `.app-gutter-x` (home canvas stays `.app-column`) | **Call** in the top bar; column-locked chrome over full-bleed space; Chat + Call as equal global create paths; Call as cold lobby; side rail |
| Space **Call** | On the video pane: **Call** starts Thread; gold button while video is off | Top-bar Call; second Call in the chat header |
| Display type | Fraunces on top-bar **Ogma** brand only | Display face on home body / space titles / Devices |
| Home overview | **Start new** row (**Chat** / **Call** + glyphs); section **Previous spaces** (same row pattern + muted last activity); quiet **Have an invite?** → Join | Separate Chat/Call tiles; second **Ogma** headline; Join as loud peer |
| Call entry | Home / row **Call** starts Thread for that chat; space video-pane **Call** upgrades the open chat | Cold Create lobby; top-bar Call; second Call in the chat header |
| Space panes | Video left / chat right; each foldable; at least one open | Both panes closed; Call as the only way to show video |
| Chat list title | Other participants' names (comma); custom **label** if set; else **Only you** (solo / empty) | Opaque short ids; **New chat**; including yourself in the participant title |
| Chat list order | **Start new**; then **Previous spaces** newest activity first; muted activity time on the same row | Manual Hide / reorder; activity as loud chrome; two-line space rows |
| Older messages | Hot keep-last-**500**; overflow to cold; quiet **Load older** (+50) | Manual archive chore; deleting overflow with no look-back |
| Space empty (Moment) | **This chat stays here. Copy the invite to add people.** | Framing Call as a separate place; long tutorials |
| Call lobby title | **Call** (invite join only) | Cold Create lobby with paste field |
| Vault settings | Nav **Settings**; **Save name**; optional **Add vault key**; **Export** / **Import**; **Log out** only with key; **Start over** / **Switch vault** | Vault key required; Log out without a key |
| Vault scope copy | Without key: chats stay in this browser…; with key: vault session copy | Device-wide / cross-OS claims |
| Space invite control | Same **InviteLinkBar** as Call: **Copy** → **Copied** (share sheet on phone) | One-off quiet Copy button; fake Copied without clipboard result |
| Space video Call | **Call** on the video pane — fills the left pane; same compose + Loom log | Top-bar Call; Call as a second full-screen place; Create lobby |
| Soft-nav while in Call | Call stays live; strip: status · **Back to call** · Leave | Hanging up on brand home / open another chat; silent background with no return |
| Brand home | Top-bar **Ogma** (mark + name) → home list (**Start new** + spaces) | Brand as non-interactive decoration |
| Home **Start new** | First list row; **Chat** / **Call** create a space (Call opens Thread) | Parallel loud Chat/Call tiles outside the list |
| Home / row **Chat** | Opens the chat (invite on the space) | Blocking invite reveal before the place exists |
| Home / row **Call** | Opens that chat’s Thread (creates a chat if starting from home) | Call only reachable after opening chat first |
| Install Moment (after first chat) | Title **Keep Ogma on your home screen**; body: chats stay in this browser; **Install** / **How to add** / **How to install** + **Not now** | Standing install essay on empty home; push notifications |
| Install how (iOS) | **Share → Add to Home Screen** | Long Safari tutorial |
| Install how (Firefox) | **For a real home-screen app, open this same Ogma link in Chrome, then use the install icon in the address bar.** | Pretending Firefox matches Chrome install; long Firefox pin essays |
| Install how (other) | **Use the install icon in the address bar (Chrome or Edge), or your browser’s Install control.** | Fake Install button when the browser cannot prompt |
| Settings home screen | Heading **Home screen**; **Install Ogma** when promptable; Firefox body points to Chrome; else short how | Duplicate loud install CTA beside every nav item |
| Vault nudge Moment | After install settled: **Open these chats elsewhere** → **Add vault key** / **Not now** | Vault essay on empty Chat; install + vault cards at once |
