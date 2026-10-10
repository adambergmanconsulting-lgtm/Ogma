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
| Space invite | **InviteLinkBar**: **Copy** → **Copied** (share sheet on phone); same control on Call | Blocking invite essay; fake Copied without clipboard result; one-off quiet Copy |
| Top-bar brand | **Ogma** (mark + name) | Synonym product title in chrome |
| Settings gear | **Settings** | "Preferences"; "Account" for the gear |
| Space **Call** | Button: **Call** (gold while video is off) | Synonym ("Start video", "Join call") on the video pane |
| Home **Start new** | Row label **Start new**; actions **Chat** / **Call** | Separate tile titles; second **Ogma** headline |
| Home spaces section | **Previous spaces** | "Recents"; "Chats" as the section title |
| Home invite cue | Quiet **Have an invite?** → Join | Loud parallel Join CTA |
| Soft-nav return | **Back to call**; Leave | Synonym strip labels ("Return", "Exit room") |
| Chat list title | Other participants' names (comma); custom **label** if set; else **Only you** | Opaque short ids; **New chat**; including yourself in the participant title |
| Older messages | Quiet **Load older** (+50) | Manual archive chore wording |
| Space empty (Moment) | **This chat stays here. Copy the invite to add people.** | Framing Call as a separate place; long tutorials |
| Call lobby title | **Call** (invite join only) | Cold Create lobby with paste field |
| Vault settings | **Save name**; optional **Add vault key**; **Export** / **Import**; **Log out** only with key; **Start over** / **Switch vault** | Vault key required; Log out without a key |
| Vault scope copy | Without key: chats stay in this browser…; with key: vault session copy | Device-wide / cross-OS claims |
| Install Moment (after first chat) | Title **Keep Ogma on your home screen**; body: chats stay in this browser; **Install** / **How to add** / **How to install** + **Not now** | Standing install essay on empty home; push notifications |
| Install how (iOS) | **Share → Add to Home Screen** | Long Safari tutorial |
| Install how (Firefox) | **For a real home-screen app, open this same Ogma link in Chrome, then use the install icon in the address bar.** | Pretending Firefox matches Chrome install; long Firefox pin essays |
| Install how (other) | **Use the install icon in the address bar (Chrome or Edge), or your browser’s Install control.** | Fake Install button when the browser cannot prompt |
| Settings home screen | Heading **Home screen**; **Install Ogma** when promptable; Firefox body points to Chrome; else short how | Duplicate loud install CTA beside every nav item |
| Vault nudge Moment | After install settled: **Open these chats elsewhere** → **Add vault key** / **Not now** | Vault essay on empty Chat; install + vault cards at once |
