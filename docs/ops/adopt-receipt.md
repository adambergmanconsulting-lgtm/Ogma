# Adopt receipt (Ogma)

**Host:** `C:\Users\AdamBergman\Ogma`  
**Date:** 2026-10-09  
**Decider:** Adam Bergman  
**Kit source:** `C:\Users\AdamBergman\railkit` `kit/` only  
**Qualification:** Go — greenfield host, writable tree, active seam (P2P video SPA), accepts sequence.

**Post-adopt branding:** Product surface is **Ogma** only. Railkit remains bootstrap provenance — see [bootstrap-provenance.md](bootstrap-provenance.md). Do not keep kit pitch as the host README identity.

## Sequence outcome

| Step | Result |
|------|--------|
| 1 Inventory | Empty host; no prior dual homes; deploy tribal noted |
| 2 Install | `node kit/scripts/install/copy-kit-to-host.js --target C:\Users\AdamBergman\Ogma` |
| 3 Owners | CANONICAL → [overview.md](../product/overview.md); Fast paths; testing harness [testing.md](../engineering/testing.md) |
| 4 Size ratchet | `architecture-budgets.json` roots `["src"]`; baselined after scaffold |
| 5 Tribal → code | [tribal-inventory.md](tribal-inventory.md) |
| 6 On-contact win | Domain modules under `src/domain/` + Vitest room/media seam tests |

## Exit checks

**Foundation / working loop:**

- [x] Intent router (README Start here)
- [x] CANONICAL filled; no dual Open cells
- [x] Doc + architecture checks wired; roots set to `src`
- [x] Tribal inventory; deploy queued with date
- [x] Thin `.cursor/` adapter → `agents/skills/`
- [x] On-contact win: layered SPA domain
- [x] Behavior change has tests (`npm run test`)

**Ideal (dated queue):**

- [ ] `check:unused-export` — owner Adam Bergman — 2026-11-09 (`mode: queued`)
- [ ] UI heuristics + one `ui-review` — 2026-11-09
- [ ] E2e Playwright on umbrella — 2026-11-09
- [ ] Vendor assert/apply for static host — 2026-11-09 (GitHub Pages defaulted in contract + `deploy-pages.yml`)
