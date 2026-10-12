# Manual local two-browser protocol

**Purpose:** Smoke Loom text + Call on `npm run dev` with two real browser windows. Complements Playwright ([testing.md](../engineering/testing.md)); does not replace the NAT matrix ([manual-call-matrix.md](manual-call-matrix.md)).

## Fast path

1. `npm run dev` — note the URL (usually `http://localhost:5173/`).
2. **Two storage profiles** (required). Vault + Loom history live in `localStorage` / IndexedDB per browser profile.
3. Hard-refresh both (Ctrl+Shift+R) after pulling or HMR weirdness.
4. Keep **both windows visible** (not minimized) while sending text or ringing Call.
5. Pass = steps below in ~30s each; fail = record which step and what you saw.

## Profiles (read this)

| Pairing | Valid two-person test? | Why |
|---------|------------------------|-----|
| Normal + private (same browser) | Yes | Private is a separate ephemeral profile |
| Chrome + Firefox (either mode) | Yes | Different browsers = different storage |
| Two normal windows, **same** browser profile | No | Shared vault/IDB — one person, two tabs |
| Two private/incognito windows, **same** browser | No | Chrome/Edge/Firefox share one private session across those windows — same vault/IDB |

**Private → private in one browser will look broken** (joins/names collide, text/Call do not behave like two peers). That is not a product path we support for manual smoke.

**Use instead:** host normal + guest private, or Chrome private + Firefox private.

## Setup

| | Window A (host) | Window B (guest) |
|---|-----------------|------------------|
| Browser | Chrome/Edge **normal** | **Private** window of that browser, **or** Firefox (any mode) |
| URL | Dev origin from `npm run dev` | Same origin (same host + port; do not mix `localhost` and `127.0.0.1`) |
| Name | e.g. Ada | e.g. Bo |

Allow camera/mic when asked (Call steps).

## Protocol

### 1. Chat-only (Loom)

1. **A:** Continue with name → save vault key (Copy / Continue) → **New** → wait for “Ada joined”.
2. **A:** **Copy link**. Address bar / copied URL must include `?space=` (hash `#space=` alone is legacy).
3. **B:** Paste the **full** URL → Continue with name → save vault key → open chat.
4. **Pass:** Both see the other’s “{name} joined”; chat tab title shows the other person.
5. **A** sends `hello from A`. **B** sees it within ~30s.
6. **B** sends `hello from B`. **A** sees it within ~30s.

**Fail if:** join only, no text; URL missing `space=`; guest lands on empty home with no chat.

### 2. Call from chat

1. Both still on the same chat, both windows foreground.
2. **A:** video pane **Call** → allow media → status **Waiting…** or **Connected**.
3. **B:** banner “Ada started a call” → **Accept** (must click Accept; link Join is a separate path).
4. **Pass within ~30s:** both **Connected**; each sees the other’s video (or intentional mute/camera-off); chat still works during Call.
5. **A** or **B:** **Leave call** → Call chrome clears; Loom chat remains.

**Fail if:** no Accept banner; stuck Joining/Waiting; Connected with no remote video and no honest error; text dies only after Call starts.

### 3. Guest Join via Call link (optional)

1. **A:** start Call again → **Copy link** (should be `?room=…&space=…` or `?room=…` + `#space=…`).
2. Close **B**’s tab (or use a fresh private window).
3. **B:** paste Call URL → name if needed → lobby **Join**.
4. **Pass:** Connected + same Loom history visible.

## Record

| Step | Pass? | Notes |
|------|-------|-------|
| 1 Chat join + titles | | |
| 1 Text A→B and B→A | | |
| 2 Accept Call + two-way video | | |
| 2 Leave keeps chat | | |
| 3 Cold Join Call link (optional) | | |

## If it fails

| Symptom | Check |
|---------|--------|
| Guest never opens the chat | Copied URL has `space=`; paste full string; same `localhost` vs `127.0.0.1` as host |
| Join yes, text no | Both windows foreground; hard-refresh both; watch for join error pointing at **Network help** |
| Same Wi‑Fi, two PCs, text/Call fail | Guest/AP client isolation or hard NAT; Settings → **Network help** (network change first, then BYO TURN) ([connectivity.md](../engineering/protocols/connectivity.md)) |
| Brave/Firefox work, Edge fails | On Edge: allow **Local network access** for the Ogma origin if prompted; not two InPrivate windows |
| No Accept banner | Guest must already be on that space (warm); or use Call link Join (step 3) |
| Call never Connected | Trackers/network; try Settings → **Network help** TURN only if LAN matrix also fails ([connectivity.md](../engineering/protocols/connectivity.md)) |
| Weird vault / wrong name / private→private fails | Two private windows in one browser share storage — use normal+private or Chrome+Firefox |
| Stale UI after code change | Stop/start `npm run dev`; hard-refresh both |

## Related

- Harness: [testing.md](../engineering/testing.md)
- Cross-network matrix: [manual-call-matrix.md](manual-call-matrix.md)
- Invite shape: [capability-urls.md](../engineering/protocols/capability-urls.md)
