# Ogma

Peer-to-peer video calls and side text in the browser. Static PWA — Ogma holds no user media or chat database.

Open or share a capability link (`#room=…`). Public BitTorrent trackers only help peers meet; live audio, video, and chat stay on WebRTC between browsers. Anyone with the link can join. There are no accounts.

**Name.** In Celtic myth, Ogma is the god of speech and open dialogue. Legend pictured him linking the speaker’s tongue to the listener’s ear with invisible golden threads — a metaphor for a serverless video stream.

**Product spine (deciding owner):** [docs/product/overview.md](docs/product/overview.md) — Thread (now), Loom (later), invariants, honest copy, milestones, non-goals.

**Stack:** Vite, React, TypeScript, PWA shell; rendezvous via [`@trystero-p2p/torrent`](https://www.npmjs.com/package/@trystero-p2p/torrent); media over WebRTC.

**Governing framework:** Railkit — shared situating path, skills, and tighten-only quality checks. Why apply it: [docs/WHY.md](docs/WHY.md).

## Run

```bash
npm install
npm run dev
```

Production build: `npm run build` → static `dist/`. Default host: **GitHub Pages** ([infra/contracts/github-pages.json](infra/contracts/github-pages.json); push `main` deploys). Preview: `npm run preview`.

## Checks

Same commands locally and in CI ([docs/ops/ci-flow.md](docs/ops/ci-flow.md)):

```bash
npm run check:railkit
npm run test
```

## Start here by intent

Pick one row. Name the task in one sentence. Open only that owner’s Fast path before the first edit. Re-open the right doc when blocked or the work shifts. Compressed mirror for agents: [llm.txt](llm.txt).

| Intent | Open |
|--------|------|
| Product spine (rooms, media, mesh, chat) | [docs/product/overview.md](docs/product/overview.md) |
| Install / merge Railkit into a host | [docs/00-QUICK-START.md](docs/00-QUICK-START.md) |
| Adopt / bootstrap existing docs | [docs/ADOPTION.md](docs/ADOPTION.md) ; skill `adopt` |
| Implement / fix / refactor | [AGENTS.md](AGENTS.md) → [docs/CANONICAL-SOURCES.md](docs/CANONICAL-SOURCES.md) |
| Code-first / tribal → code | [docs/CODE-FIRST.md](docs/CODE-FIRST.md) |
| CI / merge / what to run | [docs/ops/ci-flow.md](docs/ops/ci-flow.md) ; skill `ci-gate` |
| Layering / placement | [docs/engineering/architecture/application-layering.md](docs/engineering/architecture/application-layering.md) + [docs/ops/code-quality-and-refactor.md](docs/ops/code-quality-and-refactor.md) ; skill `layering-review` |
| Priorities / checks vs ranks | [docs/ops/governing-priorities.md](docs/ops/governing-priorities.md) ; skill `priorities-review` |
| Stability / side writes / leftover forks | [docs/ops/ongoing-engineering-bar.md](docs/ops/ongoing-engineering-bar.md) ; skill `stability-review` |
| Tests when behavior moves | [docs/ops/testing-bar.md](docs/ops/testing-bar.md) then Preferred harness owner |
| UI / design pass | [docs/product/heuristics/ui-principles.md](docs/product/heuristics/ui-principles.md) ; skill `ui-review` |
| Fit / who we serve | [docs/product/heuristics/customer-targets.md](docs/product/heuristics/customer-targets.md) then [customer-fit.md](docs/product/heuristics/customer-fit.md) ; skill `fit-review` |
| Doc structure / plain language | [docs/DOCUMENTATION-PRINCIPLES.md](docs/DOCUMENTATION-PRINCIPLES.md) ; skill `doc-review` |
| Browse docs (no code task yet) | [docs/MAP.md](docs/MAP.md) |
| Skills | [agents/skills/](agents/skills/) |
| Editor adapters | [adapters/README.md](adapters/README.md) |

This table routes. It does not decide product or eng contracts — those live in the Open owners.
