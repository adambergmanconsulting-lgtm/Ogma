# Application layering

**Purpose:** Stack-neutral layer boundaries so locks, caching, security, and agent edits stay consistent.

## Fast path (read first)

- **Thin shells:** HTTP handlers / UI route files parse input, call domain, map response. No raw persistence in the shell.
- **Domain owns writes:** one coordinator per concern for persistence ordering and side effects.
- **Hot paths first:** high-frequency probes and list/shell APIs stay cheap; thorough checks stay rare or cached.
- **Single source of truth:** shared access / identity / photo-or-asset resolution lives in one helper; surfaces call it.
- **Quality detail:** [code-quality-and-refactor.md](../../ops/code-quality-and-refactor.md).

## Boundary table (adapt names to host stack)

| Layer | Responsibility |
|-------|----------------|
| **UI / page / route shell** | Orchestration, loading, wiring hooks |
| **HTTP API handler** | Parse, auth gate, call domain, status + JSON |
| **Domain service / store** | Persistence, transactions, invalidation |
| **Shared contracts** | Access decisions, identity keys, cross-surface resolution |
| **Infra adapters** | Cloud SDKs, email, payments (behind narrow ports) |

## Prefer / Avoid

| Prefer | Avoid |
|--------|--------|
| New persistence only in domain modules | New DB handles in generic `lib/` or UI trees |
| One write path per entity concern | Parallel `v2` write path without a removal plan |
| Batch reads on list endpoints | N+1 queries on hot paths |
| Fail-fast when not ready | Spin-wait on every probe |
| **Minor domain splits** (e.g. admin vs end-user) as separate Prefer/Avoid or CANONICAL rows when surfaces differ for good reason | Treating admin vs user as a dual home of the *same* deciding concept; or one blob Prefer/Avoid that fights both surfaces |

## Host fill-in

| Layer | Ogma folders |
|-------|----------------|
| **UI / page / route shell** | `src/app/`, `src/components/` — wire hooks, layout, drawers |
| **Domain: media** | `src/domain/media/` — capture, devices, track swap, send quality |
| **Domain: thread** | `src/domain/thread/` — session, streams, live text, subscribe/speaking |
| **Domain: media plane** | `src/domain/thread/mediaPlane.ts` — narrow publish/subscribe port; mesh adapter now, SFU later |
| **Domain: chat wire** | `src/domain/thread/chatEnvelope.ts` — typed payloads (`text` now; `image-ref` reserved) |
| **Domain: room mode** | `src/domain/thread/roomMode.ts` — `free` vs `team` (team unused until paid) |
| **Domain: crypto / loom** | `src/domain/crypto/`, `src/domain/loom/` — seal/open, IndexedDB store, sync, vault, export |
| **Shell chrome** | `src/components/AppNav.tsx` — top bar only; Call starts open Loom space via `src/app/App.tsx` |
| **Domain: signaling URLs** | `src/domain/signaling/` — capability hash parse/format |
| **Shared contracts** | `src/domain/types.ts` — peer/room/message shapes |
| **Infra adapters** | Browser APIs + public trackers / STUN; later paid SFU/TURN behind media plane |

No HTTP API layer on free path — unhosted static host. Paid team credentials (later) stay behind thin ports. Protocols under `docs/engineering/protocols/`.
