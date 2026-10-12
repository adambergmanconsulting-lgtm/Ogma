# Connectivity (STUN / TURN)

**Purpose:** When paths form; when we consider TURN. Not an SFU policy.

## Fast path (read first)

- M1 default: public **STUN** only (`stun:stun.l.google.com:19302` and one backup).
- TURN is **NAT help**, never media mixing. Using TURN is a privacy trade (relay sees IP / timing; with DTLS may not see media plaintext).
- **Optional user TURN** ships in Settings (**Network help**), off when unset (`src/domain/thread/iceConfig.ts`). Prefer filling the [manual matrix](../../ops/manual-call-matrix.md) before recommending TURN in copy.
- Decision gate for *default* TURN: **M1 manual matrix**, not speculation.

## M1 acceptance matrix (manual)

Record pass/fail for A/V + text within ~30s of join:

| # | A | B | Network notes |
|---|---|---|----------------|
| 1 | Desktop Chrome | Desktop Chrome | Same LAN |
| 2 | Desktop Chrome | Desktop Chrome | Different networks |
| 3 | Desktop | Phone Safari/Chrome | Phone on Wi‑Fi, app foreground |
| 4 | Desktop | Phone | Phone on cellular if available |
| 5 | Phone | Phone | Both Wi‑Fi foreground |

**Pass:** two-way audio + video (or explicit user-muted) + data-channel text.  
**Fail:** ICE stuck, one-way media, or fake “connected” with silence — file as P0.

## TURN decision

| Result | Action |
|--------|--------|
| Matrix mostly pass | Stay STUN-only; document known failure class |
| Repeated fail on cellular / symmetric NAT | Design **optional** TURN: user-provided `turn:` URI or privacy-reviewed public TURN; off by default if possible |
| Fail even on same-LAN desktop | First: app signaling bug (wrong room / error path). Also common: Wi‑Fi **client/AP isolation** — peers meet on trackers but ICE never forms; TURN or a non-isolated network then helps |

## UI

- Status labels: `connectionLabel` — **Joining…** / **Reconnecting…** / error message (else **Couldn't connect**) / when `connected`: **Connected** / **Waiting…** / **Connecting…** ([ui-naming.md](../../product/heuristics/ui-naming.md)).
- Join failure copy: “Couldn't reach peers — this network may block direct connections. Try Settings → Network help.” (`JOIN_PEERS_UNREACHABLE` in `joinErrorMessage.ts`). Trystero `{ error }` is humanized there — never show `[object Object]` or raw SDP essays.
- Loom: do not keep that banner when a peer is already connected (chat can work while Trystero still reports a failed ICE attempt); clear on peer join (`loomJoinErrorIsActionable`).
- Never show connected with zero tracks and no explanation.

## Related

- Product: [overview.md](../../product/overview.md)
- Topology: [thread-topology.md](thread-topology.md)
