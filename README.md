# Ogma

Peer-to-peer video calls and side text in the browser. Static PWA — Ogma holds no user media or chat database.

**Start a call:** [https://adambergmanconsulting-lgtm.github.io/Ogma/](https://adambergmanconsulting-lgtm.github.io/Ogma/)

Open or share a capability link (`#room=…`). Public BitTorrent trackers only help peers meet; live audio, video, and chat stay on WebRTC between browsers. Anyone with the link can join. There are no accounts.

**Name.** In Celtic myth, Ogma is the god of speech and open dialogue. Legend pictured him linking the speaker’s tongue to the listener’s ear with invisible golden threads — a metaphor for a serverless video stream.

**Product spine:** [docs/product/overview.md](docs/product/overview.md) — Thread (now), Loom (later), invariants, honest copy, milestones.

**Stack:** Vite, React, TypeScript, PWA; rendezvous via [`@trystero-p2p/torrent`](https://www.npmjs.com/package/@trystero-p2p/torrent); media over WebRTC.

## Run

```bash
npm run dev
```

`npm run dev` installs dependencies first when `node_modules` is missing.

Production build: `npm run build` → static `dist/`. Default host: **GitHub Pages** ([infra/contracts/github-pages.json](infra/contracts/github-pages.json)). Preview: `npm run preview`.

## Checks

```bash
npm run check
npm run test
```

E2e (Playwright, when configured): `npm run test:e2e`. CI: [docs/ops/ci-flow.md](docs/ops/ci-flow.md).

## Start here by intent

Pick one row. Name the task; open only that owner’s Fast path before the first edit.

| Intent | Open |
|--------|------|
| Product spine (Thread / Loom) | [docs/product/overview.md](docs/product/overview.md) |
| Capability / room links | [docs/engineering/protocols/capability-urls.md](docs/engineering/protocols/capability-urls.md) |
| Video topology / hub | [docs/engineering/protocols/thread-topology.md](docs/engineering/protocols/thread-topology.md) |
| Connectivity / TURN | [docs/engineering/protocols/connectivity.md](docs/engineering/protocols/connectivity.md) |
| Loom sync (later) | [docs/engineering/protocols/loom-sync.md](docs/engineering/protocols/loom-sync.md) |
| Implement / fix / refactor | [AGENTS.md](AGENTS.md) → [docs/CANONICAL-SOURCES.md](docs/CANONICAL-SOURCES.md) |
| Tests when behavior moves | [docs/ops/testing-bar.md](docs/ops/testing-bar.md) → [docs/engineering/testing.md](docs/engineering/testing.md) |
| CI / merge | [docs/ops/ci-flow.md](docs/ops/ci-flow.md) |
| Layering | [docs/engineering/architecture/application-layering.md](docs/engineering/architecture/application-layering.md) |
| UI / fit | [docs/product/heuristics/ui-principles.md](docs/product/heuristics/ui-principles.md) · [customer-targets.md](docs/product/heuristics/customer-targets.md) |

Bootstrap provenance (Railkit was used to start situating; not product brand): [docs/ops/bootstrap-provenance.md](docs/ops/bootstrap-provenance.md).
