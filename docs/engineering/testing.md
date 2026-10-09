# Ogma test harness

**Purpose:** Preferred harness *how* for Rank **2** proof. *When* proof is required: [testing-bar.md](../ops/testing-bar.md).

## Fast path (read first)

- Command: `npm run test` (Vitest).
- Prefer unit/seam tests under `src/**/*.test.ts` next to domain modules.
- Extend this harness; do not invent a parallel suite for the same shape.
- E2e (Playwright) is Rank **7** dated queue until wired — see [rank7-dated-queue.md](../ops/rank7-dated-queue.md).

## Conventions

| Kind | Place | Style |
|------|-------|-------|
| Domain / pure | `src/domain/**/*.test.ts` | Vitest `describe` / `it` / `expect` |
| Hook/seam | `src/domain/**/*.test.ts` with mocked `MediaStream` / peer | Same |
| UI smoke | Optional later under `src/components/**/*.test.tsx` | Same |

Mock browser APIs at the domain boundary. Do not require a live camera for unit proof.
