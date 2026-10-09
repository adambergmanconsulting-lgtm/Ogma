# Code work entry (Railkit)

**Not the session start table.** If the job is not implement / fix / refactor, use [README.md](README.md#start-here-by-intent). This file is only the **code work** path.

## Before you edit (situating)

**Situating** = open the one right owner doc before you change code.

**Gate:** Do not write code until you have read that owner's Fast path (or named section). Skip only for one-line typos or renames with no behavior change. If you are blocked or the seam changes, read further or open one new CANONICAL row.

1. **Truth is code and tests** — governing Rank **2** ([governing-priorities.md](docs/ops/governing-priorities.md), [testing-bar.md](docs/ops/testing-bar.md)). If behavior changes, add or update proof in the same change: open Preferred harness owner from testing-bar Host fill-in when filled, then extend that harness — do not invent a parallel suite. If docs disagree with shipped behavior, fix the docs in the same change (or mark story rows Retired / Partial).
2. **Read order:** this file → [docs/CANONICAL-SOURCES.md](docs/CANONICAL-SOURCES.md) → **one** owner from the task table → implement.
3. **Do not browse** [docs/MAP.md](docs/MAP.md) or `docs/wip/` unless you have a named task.
4. **Repeatable how lives in code** — `scripts/`, `infra/`, workflows, and [agents/skills/](agents/skills/). See [docs/CODE-FIRST.md](docs/CODE-FIRST.md).

Words we use: [DOCUMENTATION-PRINCIPLES.md — Plain language](docs/DOCUMENTATION-PRINCIPLES.md#plain-language).

## When an agent must stop

If an agent is editing: **do the work** — fix must/should issues, run skills and checks — without asking “shall I?”. Stop **only** for:

1. **Heuristic fork** — two or more valid Prefer/Avoid paths (use numbered forks). Includes small domain splits (for example admin vs end-user) when both are valid.
2. **Hard approach conflict** — two coherent designs in the code; a human must pick.
3. **Dual homes** — two docs both decide the same thing, and no named decider or due date ([ADOPTION.md](docs/ADOPTION.md)).
4. **Missing secret or access** the agent cannot get.

**Do not stop** the whole job when a Rank **7** check cannot run yet (for example no test harness): write a **dated queue** (owner + due date) and continue. Yardstick: [governing-priorities.md](docs/ops/governing-priorities.md) Rank **7**.

**Avoid:** “Shall I proceed?”, skipping must/should fixes, treating a dated queue as “never.”

## Repo rules (after adopt)

- **Dead code:** keep new helpers private unless a second file imports them in the same change. Delete or unexport when importers go away.
- **Size budgets (ratchets):** extract and tighten; do not raise `architecture-ratchet` ceilings to pass CI.
- **Thin boundaries:** HTTP/UI shells parse and call; domain modules own persistence and side effects ([application-layering.md](docs/engineering/architecture/application-layering.md)).
- **Wrap-up:** when exports change, run unused-export / Knip-class if wired; always run `npm run check:architecture` (and doc checks when docs change) and fix in-tree. Order: [ADOPTION.md](docs/ADOPTION.md#correct-sequence).

## Kit maintenance

When changing Railkit itself: same situating rules; keep adapters thin ([adapters/README.md](adapters/README.md)); Prefer/Avoid stay in owner docs, not in Cursor frontmatter.
