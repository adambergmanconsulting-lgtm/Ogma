# Ogma test harness

**Purpose:** Preferred harness *how* for Rank **2** proof. *When* proof is required: [testing-bar.md](../ops/testing-bar.md).

## Fast path (read first)

- Unit: `npm run test` (Vitest) under `src/**/*.test.ts`.
- E2e: `npm run test:e2e` (Playwright) under `e2e/`.
- Extend these harnesses; do not invent a parallel suite for the same shape.
- E2e uses fake camera/mic Chromium flags — no physical devices required.

## Conventions

| Kind | Place | Style |
|------|-------|-------|
| Domain / pure | `src/domain/**/*.test.ts` | Vitest `describe` / `it` / `expect` |
| Thread UI / join | `e2e/*.spec.ts` | Playwright; `data-testid` on critical controls |
| Two-peer mesh | `e2e/thread.spec.ts` | Two contexts; needs network to public trackers |

Mock browser APIs at the domain boundary for unit proof. Prefer `data-testid` over brittle CSS for e2e.

## E2e notes

- Config: [playwright.config.ts](../../playwright.config.ts) — builds app, serves preview, fake media.
- Lobby/create-room should stay green offline-ish (except getUserMedia fakes).
- Two-peer chat needs tracker reachability; flaky tracker outages are infra, not product regressions — retry once in CI.
