# Connectivity (STUN / TURN)

**Purpose:** When paths form; when we consider TURN. Not an SFU policy.

## Fast path (read first)

- M1: public **STUN** only (`stun:stun.l.google.com:19302` and one backup).
- TURN is **NAT help**, never media mixing. Using TURN is a privacy trade (relay sees IP / timing; with DTLS may not see media plaintext).
- Decision gate: **M1 manual matrix**, not speculation.

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
| Fail even on same-LAN desktop | Bug in app signaling — fix before TURN |

## UI

- States: `joining` → `connected` only after media or data channel useful; else `error` with plain language (“Couldn’t reach peer — network may block P2P”).
- Never show connected with zero tracks and no explanation.

## Related

- Product: [overview.md](../../product/overview.md)
- Topology: [thread-topology.md](thread-topology.md)
