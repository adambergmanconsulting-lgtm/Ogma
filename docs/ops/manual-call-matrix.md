# Manual call matrix (M1)

**Purpose:** Prove 1:1 “just works” before treating Thread as done. Owner procedure for [connectivity.md](../engineering/protocols/connectivity.md).

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

## Decision

- Mostly pass → STUN-only OK for now.
- Repeated cellular/symmetric fail → optional TURN design (see connectivity.md).
