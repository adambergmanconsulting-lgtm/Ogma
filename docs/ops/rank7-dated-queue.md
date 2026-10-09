# Rank 7 dated queue (Ogma)

**Purpose:** Named ideal instruments with owner + due. Undated / ownerless rows fail Rank **7**.

## Fast path (read first)

- One row per instrument.
- Owner + due required.
- Slipped dates re-enter the working loop ([ADOPTION.md](../ADOPTION.md#gradual-change)).

| Instrument | Serves ranks | Owner | Due (YYYY-MM-DD) | Status |
|------------|--------------|-------|------------------|--------|
| Unused-export / Knip-class | 4, 6, 7 | Adam Bergman | 2026-11-09 | queued |
| Host unit+e2e on CI umbrella | 2, 4, 7 | Adam Bergman | 2026-11-09 | unit shipped; e2e local via `npm run test:e2e`; CI job still to wire |
| UI heuristics + one ui-review | 7 | Adam Bergman | 2026-11-09 | queued |
| Vendor assert/apply (static host) | 5, 7 | Adam Bergman | 2026-11-09 | queued (GitHub Pages contract + workflow shipped; assert/apply still open) |

Yardstick: [governing-priorities.md](governing-priorities.md). Mechanical unused-export gate: `npm run check:unused-export`.
