# Capability URLs

**Purpose:** One scheme for Thread rooms and Loom spaces. Owner for invite/link shape.

## Fast path (read first)

- Knowledge of the secret **is** access (password-equivalent).
- Hash form only (no server round-trip): `#room=<secret>` or `#space=<secret>`.
- Secrets are high-entropy; never put them in query logs if we can avoid query strings.

## Formats

| Kind | Hash | Used for |
|------|------|----------|
| Thread room | `#room=<secret>` | Live call + ephemeral text |
| Loom space | `#space=<secret>` | Persistent encrypted text + start Thread |

**Secret generation (Thread M1):** 96+ bits entropy, URL-safe base64 or hex (12+ chars opaque id minimum; prefer 16+ bytes random → base64url).

**Parsing rules:**

1. Prefer `room=` / `space=` keys.
2. Legacy bare `#id` (6–64 `[a-zA-Z0-9_-]`) → treat as **room** for backward compatibility.
3. Full URL paste: parse `hash` from URL.

**Share URL:** `origin + pathname + hash` (no extra query).

## UI copy

Always show: “Anyone with this link can join” (room) / “Anyone with this link can read history” (space).

## Non-goals

Short links via Ogma redirect service; email invite tokens; revocable links without rotating the secret (v1: rotate = new room/space).
