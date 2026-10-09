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
| Chat drawer title | **Chat** — same Loom log when Call started from a chat | Separate ephemeral Thread transcript for space-bound calls |
| Devices drawer title | **Devices** | "Hardware"; "hot-swap" subtitles; standing test-sound tutorials |
| Remote audio unlock | **Enable sound** | Browser-policy essays on the overlay |
| Local tile name | Display name only | "(You)" suffix |
| Capacity notice | `{n} of {max} — quality may drop` | Long "room is getting full" essays |
| Capacity full | `Room full ({max} max)` | Long "room is full of people" essays |
| Call lobby honest (free) | overview Thread free honest paragraph (muted under name on Join) | Paid-path copy; "no servers" / "fully anonymous" |
| Background blur | **Blur background** / **Clear background** | "Portrait mode"; "virtual background" for blur-only |
| Cold start | Field **Your name**; primary **Continue**; quiet **Use a vault** → splash | Create/Open as loud peers to Continue; vault essay on the main screen |
| Vault splash | Title **Vault**; short why; grouped **Create vault** / **Open vault** | Standing why on cold start; Create/Open as equal primary buttons |
| Vault key (opt-in) | Splash **Create vault**, or Settings **Add vault key** → **Your vault key** | Vault key on every Continue |
| Vault unlock | Title **Open vault**; field **Vault key**; **Open**; quiet **Back** | Heading = display name; unlock on every visit |
| Vault session | Stay signed in until **Log out** (only if vault key exists) | Re-prompt vault key on reload |
| Space invite reveal | Title **Invite link**; same **Copy** / **Continue** | Standing capability essays on every screen |
| App chrome | Permanent top bar: **Ogma** brand · **Chat** · **Call** · trailing **Settings** gear; inner row = `.app-column` | Full-bleed nav controls; side rail / hamburger; Call as cold lobby |
| Nav **Chat** active | Only on the chat chooser (list) | Gold-active **Chat** while a single thread is open (hides “back to list”) |
| Display type | Fraunces on **Ogma** brand only | Display face on Chat / Devices / space titles |
| Chat home title | **Chat** (body font) | "Chats"/"Spaces"/"Contacts"; display face on the title |
| Call entry | Top bar **Call** — open chat’s Thread, or create chat + Thread when none open | Second **Call** in the space header; cold Create lobby |
| Chat list title | Other participants' names (comma); custom **label** if set; else **New chat** | Opaque short ids; including yourself in the list title |
| Chats empty (Moment) | **Create a chat, or Call to start with video** — or paste an invite | Hiding Call from empty state; standing how-to essays |
| Hide chat (list) | Row **Hide** → collapsed **Hidden (n)**; **Show** to restore | Calling this **Archive** (collides with message retention); always-open section |
| Older messages | Hot keep-last-**500**; overflow to cold; quiet **Load older** (+50) | Manual archive chore; deleting overflow with no look-back |
| Space empty (Moment) | Quiet **Call when you’re ready** under the header area when no messages | Long video tutorials; second Create-call path |
| Call lobby title | **Call** (invite join only) | Cold Create lobby with paste field |
| Vault settings | Nav **Settings**; **Save name**; optional **Add vault key**; **Export** / **Import**; **Log out** only with key; **Start over** / **Switch vault** | Vault key required; Log out without a key |
| Vault scope copy | Without key: chats stay in this browser…; with key: vault session copy | Device-wide / cross-OS claims |
| Space invite control | Same **InviteLinkBar** as Call: **Copy** → **Copied** (share sheet on phone) | One-off quiet Copy button; fake Copied without clipboard result |
| Top-bar Call | **Call** — Thread for the open chat, or new chat + Thread; same Loom log in the call drawer | Separate Create lobby; silent no-op when no chat open |
