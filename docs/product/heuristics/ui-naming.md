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
| Call status (error) | Join/room error message (`JOIN_PEERS_UNREACHABLE` / decrypt / handshake), else **Couldn't connect** | Raw enum `error`; `[object Object]`; “Couldn't reach Loom peers” |
| Settings privacy | Collapsed summary **How privacy works**; Thread free + Loom honest paragraphs inside | Standing full honest essays above You / vault actions; "no servers" / "fully anonymous" / unaudited "E2EE" |
| Settings TURN | Collapsed summary **Network help (optional)**; open when a TURN URI is saved; honesty that relay may see IP / timing | Standing TURN form above common settings; bundled public TURN on by default |
| Settings order | **You** (name) → **Vault** (export / import / log out) → **Home screen** when needed → folded **Alerts** / Privacy / Network → quiet **Last updated · {D Mon YYYY, HH:MM}** (build clock in local wall time; no semver; no UTC label) | Vault buttons with no heading; Privacy standing open; install duplicated under setup and Home screen; a version number when only the deploy day is known; UTC clock the user must convert |
| PWA update | Quiet strip under the top bar: **Reload for update** (one control; applies the waiting app and reloads). Hidden during vault-key reveal | Silent auto-reload; semver / “New version” essays; Update as loud as Incoming Call; dismiss that leaves a waiting worker with no path |
| Settings Alerts | Folded summary **Alerts**; **Chat sounds** (default on); note that Incoming Call rings in-tab | Silent chat by default; burying the toggle; push / wake-closed-app claims |
| Settings You | Heading **You**; **Your name** / **Save name**; Active row when a person id exists | Burying name under Privacy / Network; vault essay as the You lead |
| Settings Vault | Heading **Vault**; short scope; **Export** \| **Import** pair; **Log out**; quiet **Switch vault** + erase hint | Orphan vault buttons; Switch as loud as Export |
| Devices drawer title | **Devices** | "Hardware"; "hot-swap" subtitles; standing test-sound tutorials |
| Remote audio unlock | **Enable sound** | Browser-policy essays on the overlay |
| Local tile name | Display name only | "(You)" suffix |
| Capacity notice | `{n} of {max} — quality may drop` | Long "room is getting full" essays |
| Capacity full | `Room full ({max} max)` | Long "room is full of people" essays |
| Link quality (fair/poor, video still sending) | **Weak connection with {name} — lowering video**; without a known name: **Weak connection — lowering video** | Blaming "their Wi‑Fi"; rewriting **Connected**; listing every weak peer |
| Link quality (outbound camera paused for congestion) | **Weak connection with {name} — video paused**; without a known name: **Weak connection — video paused** | Muting audio for congestion; pausing screen share for congestion |
| Call lobby honest (free) | overview Thread free honest paragraph (muted under name on Join) | Paid-path copy; "no servers" / "fully anonymous" |
| Background blur | On the local video tile: sparkles **Blur background** / **Clear background**. While software blur is on, a sliders glyph **Blur settings** opens and closes **Backdrop** and **Edge cut** (folded until opened). Hidden while sharing a screen | "Portrait mode"; "virtual background" for blur-only; blur on the call bar; backdrop standing on the tile |
| Screen share | **Share screen** / **Stop sharing**. Shared picture fills the video window for everyone; other cameras stay as PiP. If the browser cannot capture: **This browser can't share a screen. Open Ogma in Chrome or Edge.** | A second Share window button; blur while the screen is the picture; shared screen only in a grid cell; raw `NotSupportedError` |
| Privacy backdrop (local video tile, while blur on) | **Backdrop** with chips **Soft** / **Cool** / **Warm** | "Virtual background"; photo gallery; file upload; backdrop in Devices |
| Blur matte firmness (local video tile, while blur on) | **Edge cut** Soft → Firm (0–100); Soft = original matte, Firm = tighter cut | "Aggressiveness"; multi-slider debug chrome; edge cut in Devices |
| Cold start | Field **Your name**; primary **Continue** → **Your vault key** (once) | Keyless Continue; **Use a vault** splash; vault essay on the main screen |
| Vault key | Continue (cold) creates a vault and shows **Your vault key** once; Copy then Continue | Skipping the reveal; keyless profile; vault key on every reload |
| Vault unlock | Title **Open vault**; field **Vault key**; **Open**; quiet **Create a new vault** (copy: erases chats saved here) | Heading = display name; unlock on every visit; **Back** that leaves a half-cleared vault; Create that leaves sealed orphans |
| Vault session | Stay signed in until **Log out** | Re-prompt vault key on reload |
| Space invite | **InviteLinkBar**: **Copy** → **Copied** (share sheet on phone); same control on Call | Blocking invite essay; fake Copied without clipboard result; one-off quiet Copy |
| Top-bar brand | **Ogma** (mark + name); opens the **All** tab (soft-nav when in Call); aria **All chats** | Synonym product title in chrome; treating brand as a separate Home app |
| Settings gear | **Settings**; the same control opens and closes (top bar and the call bar) | "Preferences"; "Account" for the gear; a gear that only opens |
| Space **Call** | Button: **Call** (gold while video is off) | Synonym ("Start video", "Join call") on the video pane |
| Incoming Call | Banner: **`{name} started a call`** · **Accept** / **Not now**; looping ringtone until Accept / Not now / call-end. Accept joins the same Thread as that space. While Accept is offered, hide video-pane **Call** (one path) | Silent Accept offer; message-beep only; auto-joining A/V without Accept; **Call** and **Accept** visible together; synonym ("Join video", "Decline") |
| Home create | Chat column: **New** (creates a space; aria **New chat**) · **Join** (aria **Join with invite**; opens **All** and focuses invite paste). Disabled **New** while the open chat is alone with no text yet (would only stack empties). **All** continues an old one. Video **Call** starts A/V on the open space | Creating another empty solo chat; visible **New chat** beside **This chat**; dual Chat/Call create; create on the top bar; burying join behind **Have an invite?** |
| Home join paste | All top row: field aria **Invite link** · **Join**. Chat-head **Join** focuses that field. Same verb as Call lobby **Join** | **Have an invite?** accordion; a second Create/Call lobby for paste |
| Chat column tabs | People title **`a,b,c`** (same as list) or **This chat** when alone \| **All** | Standing **This chat** when others are known; **Chat** \| **Spaces**; **Current** / **Previous**; **Recents**; stacking both at once |
| All search | Quiet **Search** field above the list (filters chats + People) | No way to find a chat once the list grows; a loud search Moment |
| Pane fold | Chevron toward the edge the pane leaves: left (up when stacked) for video, right (down when stacked) for chat. The collapsed rail uses the opposite chevron. Labels **Hide video** / **Hide chat** / **Show video** / **Show chat** | A panel-window glyph; an X |
| Pane region mark | Quiet muted **Video** / **Chat** glyphs on each pane head (and on the collapsed expand control) | Extra “Video” / “Chat” text labels beside the glyphs; gold or Call-loud icons |
| Soft-nav return | **Back to call**; **Leave** (ends this chat’s Call for everyone still on it) | Synonym strip labels ("Return", "Exit room"); Leave that only mutes locally while peers stay “in call” |
| Chat list title | Custom **label** if set; else other people as **`a,b,c`** (short first names, self omitted); else **Chat** when alone. lastPreview is not the title | **lastPreview** as the title; **No one yet**; opaque short ids; **New chat**; **Only you** (occupancy) |
| All list order | Newest **text** or **Call** activity first. Joins and opens do not reorder | Sorting by `{name} joined` or last opened |
| Open chat invite | One quiet row, ends pulled apart: **Invite** · **N Active** (left; dimmed at **0 Active**) · **Copy link** → **Copied** (right). When enabled, opens a vertical panel of Active people (Invite into this chat). `{name} joined` stays in the log | **Invite a person**; **No one to invite yet** instead of **0 Active**; horizontal people row; gold Copy; standing URL field |
| All people | Heading **People**; browse + Search; **Invite** starts a **new** chat while Active; **Hidden** when not | Full directory under This chat; treating Invite as into the open chat from All |
| Join system line | Centered muted **`{name} joined`** (sealed once per author on open) | Inventing join without a sealed event |
| Call / screen system lines | Centered muted sealed lines: **`{name} started a call`**, **`{name} ended the call`**, **`{name} shared a screen`**, **`{name} stopped sharing`** | Writing these as chat bubbles; All-list tip from system lines; “left the chat” for Call end |
| Older messages | Quiet **Load older** (+50) | Manual archive chore wording |
| Space empty | No standing sentence in the log. **Copy link** and `{name} joined` already cover an empty chat | **This chat stays here. Copy the invite…**; a second copy cue under Copy link |
| Call lobby title | **Call** (invite join only) | Cold Create lobby with paste field |
| Vault settings | Under **Vault**: **Export** \| **Import**; **Log out**; quiet **Switch vault** + erase hint. **Save name** stays under **You**. Legacy: **Add vault key** / **Start over** | Log out without a key; Switch as loud as Export; Switch that leaves sealed orphans |
| Person id | Fingerprint beside a name when that person's id is known (this vault, or a card from a shared space). Hover or focus shows the id. The name text stays the name | A mark with no id; the raw id inside the name; the vault key as the id |
| Person active | Quiet dot + **Active** / **Hidden** before Settings (also in Settings) | A bordered chip beside the brand; gold text like **Chat** / **Call**; the control beside **All** |
| Call people | Once a call is up, short names on the video pane. **Invite** beside someone else only while they are **Active**, into this space | A people row in the chat header |
| Vault scope copy | Vault session copy (chats stay in this browser until Log out / Export) | Device-wide / cross-OS claims; “vault key is optional” for new cold starts |
| Welcome nudge (after first chat) | One row: **Chats stay in this browser. Pin Ogma so you can open them again — Settings.** (Settings is an inline link) · dismiss **×** (aria **Dismiss**); shows while not installed (or legacy without a vault key) | Separate Settings chrome button; how-to essay on home; standing nudge on empty home; asking new users to add a vault key |
| Settings setup | When install (or legacy vault) still open: foldable title **Keep your chats handy** (collapsed until opened); inside plain why text + **Install Ogma** when promptable (else how in the same paragraph); **Add vault key** only for legacy profiles without one | Card/essay chrome; **Show steps**; parallel install/vault CTAs under an open setup; setup after both are done |
| Install how (iOS) | Settings splash / Home screen: **Share → Add to Home Screen** | Long Safari tutorial on home |
| Install how (Firefox) | Settings: **For a real home-screen app, open this same Ogma link in Chrome, then use the install icon in the address bar.** | Pretending Firefox matches Chrome install; home how-to essays |
| Install how (other) | Settings: **Use the install icon in the address bar (Chrome or Edge), or your browser’s Install control.** | Fake Install on the home nudge when the browser cannot prompt |
| Settings home screen | When already installed (or splash not covering it): heading **Home screen**; body text (Install button only when promptable) | **Show steps** gate; duplicate loud install CTA beside every nav item; second Install under an open setup splash |
