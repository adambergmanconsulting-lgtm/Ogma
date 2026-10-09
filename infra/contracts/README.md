# Contracts

Add one file per integration surface (hosting, DNS, edge, payments). Machines and agents read these; docs link here.

| Contract | Role |
|----------|------|
| [github-pages.json](github-pages.json) | **Default** static host for Ogma |
| [example-hosting-contract.json](example-hosting-contract.json) | Railkit shape example only |

Deploy how: [`.github/workflows/deploy-pages.yml`](../../.github/workflows/deploy-pages.yml).
