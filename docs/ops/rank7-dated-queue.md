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
| UI heuristics + one ui-review | 7 | Adam Bergman | 2026-11-09 | heuristics filled (naming/layout/overview); ongoing via ui-review |
| Living design surface (`/design`, thin) | 7 | Adam Bergman | 2026-12-01 | queued — tokens from `src/index.css`; see [living-design-surface.md](../product/heuristics/living-design-surface.md) |
| Vendor assert/apply (static host) | 5, 7 | Adam Bergman | 2026-11-09 | queued (GitHub Pages contract + workflow shipped; assert/apply still open) |
| M1.5 client hub (election + forward) | 2, 7 | Adam Bergman | 2026-11-24 | queued — Chromium forward spike in `e2e/hub-forward-spike.spec.ts`; WebKit go/no-go still open; mesh cap stays 6 until hub ships ([thread-topology.md](../engineering/protocols/thread-topology.md)) |
| M1 call matrix → default TURN decision | 2, 7 | Adam Bergman | 2026-11-10 | queued — optional user TURN shipped off-by-default; fill [manual-call-matrix.md](manual-call-matrix.md) before recommending TURN ([connectivity.md](../engineering/protocols/connectivity.md)) |

Yardstick: [governing-priorities.md](governing-priorities.md). Mechanical unused-export gate: `npm run check:unused-export`.
