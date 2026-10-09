# CI flow

**Purpose:** Mental model for cheap local checks → clean-room CI → release. Commands live in `package.json` and workflows ([CODE-FIRST.md](../CODE-FIRST.md)).

## Fast path (read first)

- **Local:** `npm run check` (alias: `check:railkit`)
- **CI:** [`.github/workflows/railkit-checks.yml`](../../.github/workflows/railkit-checks.yml) runs the same script
- **Skill:** `ci-gate` — what to run when merge fails or before push
- **Do not:** invent remote-only gates that humans cannot run locally

## Mental model

| Stage | Role |
|-------|------|
| **Editor / pre-commit (optional)** | Fast lint or staged checks; wire Husky later ([scripts/ci/README.md](../../scripts/ci/README.md)) |
| **Local package scripts** | Doc ownership + file-size ratchets (budgets that only get stricter) first (`check:railkit`); unused-export / Knip-or-equivalent via `check:unused-export` as Rank **7** on the same umbrella when ready |
| **CI workflow** | Clean-room confirmation of the same scripts |
| **Release** | Push `main` → [deploy-pages.yml](../../.github/workflows/deploy-pages.yml) (GitHub Pages). Skill `release` uses this. |

## Host fill-in

| Item | Value |
|------|--------|
| Local umbrella | `npm run check` then `npm run test` (`check:railkit` aliases `check`) |
| App build | `npm run build` → `dist/` (GitHub Pages; set `BASE_PATH=/<repo>/` for project sites) |
| Static host | GitHub Pages — [github-pages.json](../../infra/contracts/github-pages.json) |
| Release | Push `main` or `workflow_dispatch` on `deploy-pages.yml` |
| E2e | Queued — Playwright — 2026-11-09 |
| Branch | `main` |

Keep the rule: CI invokes the same entrypoints as local. Actor-agnostic (same rules for humans and agents): one umbrella for every editor of the repo.

**Trend gates / tests:** instruments (checks/tools that serve a rank) of [governing-priorities.md](governing-priorities.md). Adopt order and customer depth: [ADOPTION.md](../ADOPTION.md#correct-sequence), [testing-bar.md](testing-bar.md).

## Prefer / Avoid

| Prefer | Avoid |
|--------|--------|
| One host umbrella that matches laptop commands | Divergent CI and laptop commands |
| Rank **1**–**2** held before chasing Rank **7** instruments | Skipping owners to wire Knip or showy e2e jobs first |
| CI as how Rank **3**/**4** bind every editor | Treating CI jobs as goals above situating (opening the one right owner doc before edit) |
| Unit + e2e as Rank **2** proof vehicles | Merging behavior changes with red or skipped tests |
| Path-triggered heavy jobs when the host grows | Running the universe on every docs typo |
| Resume from a named gate after a green prefix | Re-running hours of green work without a resume story |
