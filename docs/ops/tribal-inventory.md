# Tribal → code inventory

**Purpose:** Adopt step 5 inventory for Ogma. Dated queues are Rank **7** OK.

## Fast path (read first)

- Inventory exists (adopt exit).
- Prefer script / contract / workflow; else owner + date.

## Inventory

| Process (was tribal) | Status | Owner / path |
|----------------------|--------|----------------|
| Static deploy (GitHub Pages default) | Partial | Contract + workflow: [github-pages.json](../../infra/contracts/github-pages.json), `deploy-pages.yml`; assert/apply still queued — Adam Bergman — 2026-11-09 |
| Room signaling ops (public Gun relays) | Moved to code | `src/domain/signaling/` |
| Local check + CI umbrella | Partial | `npm run check:railkit`; CI workflow — 2026-11-09 |

## Dual homes

| Concept | Winner | Note |
|---------|--------|------|
| Product spine | [overview.md](../product/overview.md) | README indexes only |
| Deploy how | This inventory + contract | No second deploy bible |
