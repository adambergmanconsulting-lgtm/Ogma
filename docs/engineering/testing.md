# Ogma test harness

**Purpose:** Preferred harness *how* for Rank **2** proof. *When* proof is required: [testing-bar.md](../ops/testing-bar.md).

## Fast path (read first)

- Unit: `npm run test` (Vitest) under `src/**/*.test.ts`.
- E2e: `npm run test:e2e` (Playwright) under `e2e/`.
- Extend these harnesses; do not invent a parallel suite for the same shape.
- E2e uses fake camera/mic Chromium flags — no physical devices required.
- Screen share uses `--auto-select-desktop-capture-source=Entire screen` so `getDisplayMedia` needs no OS picker (desktop vs window vs tab is not asserted).
- Loom invites use `?space=` (hash still accepted).
- **Manual two-window on `npm run dev`:** [manual-local-two-browser.md](../ops/manual-local-two-browser.md) (separate profiles; e2e does not replace this).

## Conventions

| Kind | Place | Style |
|------|-------|-------|
| Domain / pure | `src/domain/**/*.test.ts` | Vitest `describe` / `it` / `expect` |
| Thread UI / join | `e2e/*.spec.ts` | Playwright; `data-testid` on critical controls |
| Two-peer mesh | `e2e/thread.spec.ts` | Two contexts; needs network to public trackers |

Mock browser APIs at the domain boundary for unit proof. Prefer `data-testid` over brittle CSS for e2e.

## E2e notes

- Config: [playwright.config.ts](../../playwright.config.ts) — builds app, serves preview, fake media + fake display capture.
- Call-from-list (All-row **Call**), Call-from-space, and invite **Join** should stay green offline-ish (except getUserMedia fakes).
- Two-peer Loom (chat-only + Call), Accept Call, Active Invite, mobile PiP, reload resume, export/import, All Search, in-call mute/camera/screen share/blur tune, leave both sides, and home Join paste need tracker reachability where peers meet; flaky tracker outages are infra, not product regressions — retry once in CI.

## Jobs covered in e2e

| Product Job | Playwright coverage |
|-------------|---------------------|
| Name | Splash + name Continue |
| Vault | Enable key + person id; logout → unlock; export/import; rename save |
| Chat (Loom) | Chat-only 2P; compose; All search; home Join paste; Active Invite 2P |
| Host Call | New → Call; list Call; space Call |
| Accept Call | Accept / Not now; Leave clears ring |
| Join Call | Room URL Join; space URL; home paste Join |
| In call | Soft-nav; mobile PiP; blur toggle + settings/backdrop/edge cut; Share/Stop screen; mute; camera; one Leave ends Call on both |
| Move device | Export → import |
| Work shell | Tabs, fold, welcome; Settings TURN save/clear |

## Deferred (not e2e yet)

Capacity at 5–6 peers; hub product UI; PWA install/update; OS desktop-vs-window picker. Prefer unit or a later wave — do not invent a parallel suite.
