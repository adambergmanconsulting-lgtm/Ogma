# Capability URLs

**Purpose:** One scheme for Thread rooms and Loom spaces. Owner for invite/link shape.

## Fast path (read first)

- Knowledge of the secret **is** access (password-equivalent).
- **Share / invite (Thread):** `?room=<secret>` — many messengers strip `#…`, which stranded guests in empty lobbies.
- **Legacy / Loom:** `#room=<secret>` or `#space=<secret>` still accepted.
- Secrets are high-entropy. Query form may appear in static-host access logs; prefer rotating the room over long-lived secrets.

## Formats

| Kind | Preferred share | Also accepted | Used for |
|------|-----------------|---------------|----------|
| Thread room | `?room=<secret>` | `#room=<secret>`, bare `#id` | Live call + ephemeral text |
| Loom space | `#space=<secret>` | — | Persistent encrypted text + start Thread |

**Secret generation (Thread M1):** 96+ bits entropy, URL-safe base64 or hex (12+ chars opaque id minimum; prefer 16+ bytes random → base64url).

**Parsing rules:**

1. Read `?room=` first, then `#room=` / `#space=`.
2. Legacy bare `#id` (6–64 `[a-zA-Z0-9_-]`) → treat as **room** for backward compatibility.
3. Full URL paste: parse query then hash.

**Share URL:** `origin + base path + ?room=<secret>` (Vite `BASE_URL` included on GitHub Pages).

## UI copy

- Always show the full invite URL in-call and a **Copy invite link** control (copy ≠ join).
- Always show: “Anyone with this link can join” (room) / “Anyone with this link can read history” (space).
- Show a short room code so both people can confirm they match.
## Non-goals

Short links via Ogma redirect service; email invite tokens; revocable links without rotating the secret (v1: rotate = new room/space).
