# UI naming

**Purpose:** Locked Prefer/Avoid for chrome strings and microcopy grammar. Shell / regions: [in-page-layout.md](in-page-layout.md). Product jobs: [overview.md](../overview.md).

## Fast path (read first)

- Prefer **you / your job** voice and **immediate** outcome verbs.
- Avoid system-narrator labels when a user-job verb exists.
- Product-specific locked strings: edit the tables below for the host.
- Do not decide layout here — point at [in-page-layout.md](in-page-layout.md).

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
| Lobby invite (opened link) | **Join** only | Paste field; cold **Create** lobby; **New room** |
| Call invite control | Button: **Copy** → **Copied**; field aria-label **Invite link** | Standing "send this so they join" / "paste it to them" essays |
| Call status (alone) | **Waiting…** | "Waiting for others…"; "Waiting alone — …" helper under the bar |
| Call status (setup) | **Connecting…** | "Connecting to trackers…" |
| Call status (joining) | **Joining…** | Raw enum `joining` |
| Call status (reconnecting) | **Reconnecting…** | Raw enum `reconnecting` |
| Call status (error) | Join/room error message, else **Couldn't connect** | Raw enum `error` |
| Settings privacy | Collapsed summary **How privacy works**; Thread free + Loom honest paragraphs inside | Standing full honest essays above You / vault actions; "no servers" / "fully anonymous" / unaudited "E2EE" |
| Settings TURN | Collapsed summary **Network help (optional)**; open when a TURN URI is saved; honesty that relay may see IP / timing | Standing TURN form above common settings; bundled public TURN on by default |
| Settings You | Heading **You**; vault scope + **Your name** / **Save name** first | Burying name / vault actions under Privacy / Network essays |
| Devices drawer title | **Devices** | "Hardware"; "hot-swap" subtitles; standing test-sound tutorials |
| Remote audio unlock | **Enable sound** | Browser-policy essays on the overlay |
| Local tile name | Display name only | "(You)" suffix |
| Capacity notice | `{n} of {max} — quality may drop` | Long "room is getting full" essays |
| Capacity full | `Room full ({max} max)` | Long "room is full of people" essays |
| Call lobby honest (free) | overview Thread free honest paragraph (muted under name on Join) | Paid-path copy; "no servers" / "fully anonymous" |
| Background blur | On the local video tile: sparkles **Blur background** / **Clear background**. While software blur is on, a sliders glyph **Blur settings** opens and closes **Backdrop** and **Edge cut** (folded until opened). Hidden while sharing a screen | "Portrait mode"; "virtual background" for blur-only; blur on the call bar; backdrop standing on the tile |
| Screen share | **Share screen** / **Stop sharing**. If the browser cannot capture: **This browser can't share a screen. Open Ogma in Chrome or Edge.** | A second Share window button; blur while the screen is the picture; raw `NotSupportedError` |
| Privacy backdrop (local video tile, while blur on) | **Backdrop** with chips **Soft** / **Cool** / **Warm** | "Virtual background"; photo gallery; file upload; backdrop in Devices |
| Blur matte firmness (local video tile, while blur on) | **Edge cut** Soft → Firm (0–100); Soft = original matte, Firm = tighter cut | "Aggressiveness"; multi-slider debug chrome; edge cut in Devices |
| Cold start | Field **Your name**; primary **Continue**; quiet **Use a vault** → splash | Create/Open as loud peers to Continue; vault essay on the main screen |
| Vault splash | Title **Vault**; short why; grouped **Create vault** / **Open vault** | Standing why on cold start; Create/Open as equal primary buttons |
| Vault key (opt-in) | Splash **Create vault**, or Settings **Add vault key** → **Your vault key** | Vault key on every Continue |
| Vault unlock | Title **Open vault**; field **Vault key**; **Open**; quiet **Back** | Heading = display name; unlock on every visit |
| Vault session | Stay signed in until **Log out** (only if vault key exists) | Re-prompt vault key on reload |
| Space invite | **InviteLinkBar**: **Copy** → **Copied** (share sheet on phone); same control on Call | Blocking invite essay; fake Copied without clipboard result; one-off quiet Copy |
| Top-bar brand | **Ogma** (mark + name); opens the **All** tab (soft-nav when in Call); aria **All chats** | Synonym product title in chrome; treating brand as a separate Home app |
| Settings gear | **Settings**; the same control opens and closes (top bar and the call bar) | "Preferences"; "Account" for the gear; a gear that only opens |
| Space **Call** | Button: **Call** (gold while video is off) | Synonym ("Start video", "Join call") on the video pane |
| Home create | Chat column: **New** (creates a space; aria **New chat**). Disabled while the open chat is alone with no text yet (would only stack empties). **All** continues an old one. Video **Call** starts A/V on the open space | Creating another empty solo chat; visible **New chat** beside **This chat**; dual Chat/Call create; create on the top bar |
| Chat column tabs | **This chat** \| **All** | **Chat** \| **Spaces**; **Current** / **Previous**; **Recents**; stacking both at once |
| All search | Quiet **Search** field above the list (filters chats + People) | No way to find a chat once the list grows; a loud search Moment |
| Pane fold | Chevron toward the edge the pane leaves: left (up when stacked) for video, right (down when stacked) for chat. The collapsed rail uses the opposite chevron. Labels **Hide video** / **Hide chat** / **Show video** / **Show chat** | A panel-window glyph; an X |
| Home invite cue | Quiet **Have an invite?** → Join | Loud parallel Join CTA |
| Soft-nav return | **Back to call**; Leave | Synonym strip labels ("Return", "Exit room") |
| Chat list title | Custom **label** if set; else **lastPreview** (last text, or `{name} joined`); else **Chat** | Participant-name titles; **No one yet**; opaque short ids; **New chat**; **Only you** (occupancy) |
| Open chat invite | One quiet row, ends pulled apart: **Invite** · **N Active** (left; dimmed at **0 Active**) · **Copy link** → **Copied** (right). When enabled, opens a vertical panel of Active people (Invite into this chat). `{name} joined` stays in the log | **Invite a person**; **No one to invite yet** instead of **0 Active**; horizontal people row; gold Copy; standing URL field |
| All people | Heading **People**; browse + Search; **Invite** starts a **new** chat while Active; **Hidden** when not | Full directory under This chat; treating Invite as into the open chat from All |
| Join system line | Centered muted **`{name} joined`** (sealed once per author on open) | Leave lines; inventing join without a sealed event |
| Older messages | Quiet **Load older** (+50) | Manual archive chore wording |
| Space empty | No standing sentence in the log. **Copy link** and `{name} joined` already cover an empty chat | **This chat stays here. Copy the invite…**; a second copy cue under Copy link |
| Call lobby title | **Call** (invite join only) | Cold Create lobby with paste field |
| Vault settings | **Save name**; optional **Add vault key**; **Export** / **Import**; **Log out** only with key; **Start over** / **Switch vault** | Vault key required; Log out without a key |
| Person id | Fingerprint beside a name when that person's id is known (this vault, or a card from a shared space). Hover or focus shows the id. The name text stays the name | A mark with no id; the raw id inside the name; the vault key as the id |
| Person active | Quiet dot + **Active** / **Hidden** before Settings (also in Settings) | A bordered chip beside the brand; gold text like **Chat** / **Call**; the control beside **All** |
| Call people | Once a call is up, short names on the video pane. **Invite** beside someone else only while they are **Active**, into this space | A people row in the chat header |
| Vault scope copy | Without key: chats stay in this browser…; with key: vault session copy | Device-wide / cross-OS claims |
| Install Moment (after first chat) | Title **Keep Ogma on your home screen**; body: chats stay in this browser; **Install** / **How to add** / **How to install** + **Not now** | Standing install essay on empty home; push notifications |
| Install how (iOS) | **Share → Add to Home Screen** | Long Safari tutorial |
| Install how (Firefox) | **For a real home-screen app, open this same Ogma link in Chrome, then use the install icon in the address bar.** | Pretending Firefox matches Chrome install; long Firefox pin essays |
| Install how (other) | **Use the install icon in the address bar (Chrome or Edge), or your browser’s Install control.** | Fake Install button when the browser cannot prompt |
| Settings home screen | Heading **Home screen**; **Install Ogma** when promptable; Firefox body points to Chrome; else short how | Duplicate loud install CTA beside every nav item |
| Vault nudge Moment | After install settled: **Open these chats elsewhere** → **Add vault key** / **Not now** | Vault essay on empty Chat; install + vault cards at once |
