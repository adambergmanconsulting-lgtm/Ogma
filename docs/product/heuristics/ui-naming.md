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
| Lobby invite/room field | Label: **Invite link**. No placeholder. | "Room link or id"; paste tutorials in placeholder |
| Lobby primary actions | **Create** / **Join** (invite: **Join** primary, **New room** quiet) | "Create room" / "Join room" / "Join this room"; long invite essays |
| Call invite control | Button: **Copy** → **Copied**; field aria-label **Invite link** | Standing "send this so they join" / "paste it to them" essays |
| Call status (alone) | **Waiting…** | "Waiting for others…"; "Waiting alone — …" helper under the bar |
| Call status (setup) | **Connecting…** | "Connecting to trackers…" |
| Chat drawer title | **Chat** | "Thread chat"; peer-to-peer essays in empty state |
| Devices drawer title | **Devices** | "Hardware"; "hot-swap" subtitles; standing test-sound tutorials |
| Remote audio unlock | **Enable sound** | Browser-policy essays on the overlay |
| Local tile name | Display name only | "(You)" suffix |
| Capacity notice | `{n} of {max} — quality may drop` | Long "room is getting full" essays |
