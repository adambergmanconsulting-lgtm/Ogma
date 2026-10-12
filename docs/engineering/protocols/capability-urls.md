# Capability URLs

**Purpose:** One scheme for Thread rooms and Loom spaces. Owner for invite/link shape.

## Fast path (read first)

- Knowledge of the secret **is** access (password-equivalent).
- **Share / invite (Thread):** `?room=<secret>` — many messengers strip `#…`, which stranded guests in empty lobbies.
- **Share / invite (Loom):** `?space=<secret>` (+ `#space=` for older clients). Same strip risk as Thread.
- **Legacy:** `#room=<secret>` or `#space=<secret>` still accepted.
- Secrets are high-entropy. Query form may appear in static-host access logs; prefer rotating the room over long-lived secrets.

## Formats

| Kind | Preferred share | Also accepted | Used for |
|------|-----------------|---------------|----------|
| Thread room | `?room=<secret>` | `#room=<secret>`, bare `#id` | Live A/V; ephemeral text only if no space |
| Loom space | `?space=<secret>` (+ `#space=`) | `#space=` alone | Persistent encrypted text + Call |
| Call from chat | `?room=<thread>&space=<space>` (+ `#space=`) | `?room=` + `#space=` | Same Loom chat in the call drawer |

**Secret generation (Thread M1):** 96+ bits entropy, URL-safe base64 or hex (12+ chars opaque id minimum; prefer 16+ bytes random → base64url).

**Parsing rules:**

1. Read `?room=` first, then `#room=` / `#space=`.
2. Legacy bare `#id` (6–64 `[a-zA-Z0-9_-]`) → treat as **room** for backward compatibility.
3. Full URL paste: parse query then hash.

**Share URL:** `origin + base path + ?room=<secret>` (Vite `BASE_URL` included on GitHub Pages).

## UI copy

- Share controls use **InviteLinkBar** (**Copy** → **Copied**; share sheet on phone) in-call and under This chat **Copy link** — copy ≠ join.
- Home **Have an invite?** paste accepts the full share URL: space → open chat; room → Call lobby; room+space → lobby (Join opens the same Loom chat). Needed when the installed app has no address bar.
- Space-bound Call invites: `?room=<thread>#space=<space>` so guests get A/V and the same Loom log.
- Show a short room code in-call so both people can confirm they match.
- Labels: [ui-naming.md](../../product/heuristics/ui-naming.md).

## Non-goals

Short links via Ogma redirect service; email invite tokens; revocable links without rotating the secret (v1: rotate = new room/space).
