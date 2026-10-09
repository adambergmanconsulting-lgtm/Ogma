# Canonical sources (code-work router)

**Purpose:** One screen: which doc owns which code-work task. Behavior lives in code, tests, and CI. Editor adapters only link here; they do not copy policy.

**Read order (code work):** [`AGENTS.md`](../AGENTS.md) → this file → **one** doc from [Task → one doc](#task--one-doc).

**Other intents:** [README.md](../README.md#start-here-by-intent).

## Fast path (read first)

- **Pick one task row** below — at most one owner doc per task.
- **Who wins when docs disagree:** [DOCUMENTATION-PRINCIPLES.md — Authority](DOCUMENTATION-PRINCIPLES.md#authority-when-docs-disagree).
- **During adopt:** replace TODO Core owners with the host's real deciding docs ([ADOPTION.md](ADOPTION.md)).

## Core owners (fill during adopt)

| Concern | Owner |
|---------|--------|
| UX ranks, tensions, Moments | [ui-principles.md](product/heuristics/ui-principles.md) |
| Locked chrome strings / microcopy grammar | [ui-naming.md](product/heuristics/ui-naming.md) |
| In-page regions / content hierarchy | [in-page-layout.md](product/heuristics/in-page-layout.md) |
| Who we serve / Primary jobs | [customer-targets.md](product/heuristics/customer-targets.md) |
| Feature / claim fit | [customer-fit.md](product/heuristics/customer-fit.md) |
| Layering / persistence boundaries | [application-layering.md](engineering/architecture/application-layering.md) |
| Dedupe / hotspots / where things live / size and unused-export checks | [code-quality-and-refactor.md](ops/code-quality-and-refactor.md) |
| Governing priority ranks (higher wins) | [governing-priorities.md](ops/governing-priorities.md) |
| Enduring eng touch rules | [ongoing-engineering-bar.md](ops/ongoing-engineering-bar.md) |
| Tests when behavior moves (Rank 2 — *when*) | [testing-bar.md](ops/testing-bar.md) |
| Preferred harness how (*how* to write suite tests) | [testing.md](engineering/testing.md) |
| CI / merge commands | [ci-flow.md](ops/ci-flow.md) |
| Code-first / tribal → code | [CODE-FIRST.md](CODE-FIRST.md) |
| Doc structure and plain language | [DOCUMENTATION-PRINCIPLES.md](DOCUMENTATION-PRINCIPLES.md) |
| Integrations / hosting contracts | [integrations-as-code.md](ops/integrations-as-code.md) + [`infra/contracts/`](../infra/contracts/) |
| Host domain spine | [overview.md](product/overview.md) |
| Capability / invite URLs | [capability-urls.md](engineering/protocols/capability-urls.md) |
| Thread topology / hub | [thread-topology.md](engineering/protocols/thread-topology.md) |
| STUN / TURN decision | [connectivity.md](engineering/protocols/connectivity.md) |
| Loom encrypted sync | [loom-sync.md](engineering/protocols/loom-sync.md) |
| Auth / entitlement | N/A free path (capability links); paid team billing later |

## Task → one doc

| Task | Open (Fast path first) |
|------|------------------------|
| Add / change Thread or Loom product rules | [overview.md](product/overview.md) |
| Room / space link format | [capability-urls.md](engineering/protocols/capability-urls.md) |
| Mesh / hub / subscription | [thread-topology.md](engineering/protocols/thread-topology.md) |
| ICE / TURN | [connectivity.md](engineering/protocols/connectivity.md) |
| Loom history sync / crypto envelopes | [loom-sync.md](engineering/protocols/loom-sync.md) |
| Structure / dedupe / size debt / unused exports | [code-quality-and-refactor.md](ops/code-quality-and-refactor.md) |
| Priority conflict (which owner vs which check vs depth) | [governing-priorities.md](ops/governing-priorities.md) |
| Side effects / leftover forks / clocks | [ongoing-engineering-bar.md](ops/ongoing-engineering-bar.md) |
| Unit / seam / e2e when behavior moves | [testing-bar.md](ops/testing-bar.md) |
| Author / extend preferred suite / harness tests | [testing.md](engineering/testing.md) |
| What CI to run / merge bar | [ci-flow.md](ops/ci-flow.md) |
| Doc ownership / dual homes | [DOCUMENTATION-PRINCIPLES.md](DOCUMENTATION-PRINCIPLES.md) |
| UI chrome conflict | [ui-principles.md](product/heuristics/ui-principles.md) |
| Should we build this (fit) | [customer-fit.md](product/heuristics/customer-fit.md) |
| Portal / deploy / DNS only in wiki | [CODE-FIRST.md](CODE-FIRST.md) |
| Bootstrap host into Railkit | [ADOPTION.md](ADOPTION.md) |
