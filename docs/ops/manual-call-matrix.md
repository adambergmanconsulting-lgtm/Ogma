# Manual call matrix (M1)

**Purpose:** Prove 1:1 “just works” before treating Thread as done. Owner procedure for [connectivity.md](../engineering/protocols/connectivity.md).

**Local smoke first:** same machine, two profiles on `npm run dev` — [manual-local-two-browser.md](manual-local-two-browser.md). Use this matrix for real networks / phones.

## Fast path

- Run after Trystero Thread changes that touch join/media.
- Record pass/fail within ~30s of join: two-way A/V (or intentional mute) + data-channel text.
- Failures that are STUN/NAT → log for TURN decision; app bugs → fix first.

## Matrix

| # | A | B | Network | Pass? | Notes |
|---|---|---|---------|-------|-------|
| 1 | Desktop Chrome | Desktop Chrome | Same LAN | | |
| 2 | Desktop Chrome | Desktop Firefox/Chrome | Different networks | | |
| 3 | Desktop | Phone Safari/Chrome | Phone Wi‑Fi, foreground | | |
| 4 | Desktop | Phone | Phone cellular | | |
| 5 | Phone | Phone | Both Wi‑Fi foreground | | |
| 6 | Desktop | Desktop | Guest / AP-isolated Wi‑Fi — **Loom text only** | | Expect fail without TURN if isolation is real |
| 7 | Desktop | Desktop | Same as #6 + BYO TURN — Loom text only | | Expect pass; A/V optional |

## Decision

- Mostly pass → STUN-only OK for now.
- Repeated cellular/symmetric fail → optional TURN design (see connectivity.md).
- #6 fail + #7 pass → isolation class confirmed; chat-only does not need a parallel transport ([connectivity.md LAN P2P](../engineering/protocols/connectivity.md#lan-p2p-chat-first-investigation)).
