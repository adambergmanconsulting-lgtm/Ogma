# Bootstrap provenance

**Purpose:** Record that this host used Railkit to **start** situating (owners, checks, skills). Ogma’s product face is not Railkit-branded afterward.

## Fast path (read first)

- Railkit = adopt-time bootstrap, not ongoing product identity.
- Keep the receipt (this file + [adopt-receipt.md](adopt-receipt.md)).
- Day-to-day: Ogma docs and `npm run check` / `npm test`. Do not lead README or UI with kit marketing.

## What stayed (useful machinery)

| Kept | Why |
|------|-----|
| `docs/` owners, CANONICAL, skills | Situating path still works |
| `scripts/railkit/` check scripts | Tighten-only gates (may be invoked as `npm run check`) |
| `.cursor/` thin adapters | Point at `agents/skills/` |
| Adopt receipt | Evidence of bootstrap |

## What must not linger as “the product”

- README / lobby / PWA copy that says the product *is* Railkit
- Asking every session to “open Railkit” before Ogma product work
- Treating kit install docs as the host’s primary start-here table forever

## Kit feedback (for Railkit maintainers)

Host desire: after adopt exit, **kit branding fades**; provenance remains. Suggest kit ADOPTION / Quick Start grow an explicit “exit branding” step: replace host README stub kit pitch with product spine; point “we used Railkit” at a provenance/receipt page only.

## Related

- Adopt receipt: [adopt-receipt.md](adopt-receipt.md)
- Product spine: [../product/overview.md](../product/overview.md)
