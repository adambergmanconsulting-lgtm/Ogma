# Loom sync (encrypted text log)

**Purpose:** Spec for M2 peer-seeded history. Do not implement before Thread M1 exit.

## Fast path (read first)

- Text-only sealed append log in IndexedDB; sync over WebRTC when space open.
- Space secret → HKDF → AES-256-GCM (Web Crypto).
- Availability = members online; Ogma stores nothing.

## Envelope (wire + disk)

```json
{
  "v": 1,
  "id": "ulid-or-random",
  "ts": 1710000000000,
  "author": "display-label",
  "nonce": "base64",
  "ciphertext": "base64"
}
```

**Plaintext inside ciphertext:** `{ "text": "..." }` UTF-8 JSON. Max plaintext 4 KiB per message.

**Dedupe:** by `id`. **Order:** `ts` then `id`. Clock skew: accept; UI sorts stably.

## Keying

- `spaceSecret` from `#space=` (raw bytes after base64url decode, or UTF-8 bytes of secret string — pick one in impl and never change).
- `encKey = HKDF-SHA-256(ikm=spaceSecret, salt=empty, info="ogma-loom-enc-v1", len=32)`.
- AES-GCM 256; 96-bit random nonce per message.

**v1 trust:** anyone with the space link can decrypt. No member removal / FS.

**Author:** display label only (spoofable). Optional ed25519 per device later.

## Sync protocol (when space open)

1. Join Trystero room `loom:<spaceId>` (spaceId derived from hash of secret, not the secret itself if we need a public swarm id — **public room key** = `SHA-256(spaceSecret)[:16]` hex; **enc key** from full secret).
2. On peer connect: send `{ type: "have", ids: ["...", ...] }` (or ranged summary if large).
3. Peer replies `{ type: "need", ids: [...] }` then chunk `{ type: "entries", entries: [envelope, ...] }` (max ~64–256 KiB per chunk).
4. Persist new ids; re-broadcast `have` occasionally.

**Seeding:** only while document visible (`document.visibilityState === 'visible'`).

## Size guards

- Warn at 50 MB local; strongly warn 100 MB; suggest export/trim.
- Export (M2+): decrypt locally to JSON download for holder with secret.

## Non-goals (M2)

Images/files; CRDT rich text; always-on Ogma backup; push notifications.

## Related

- [capability-urls.md](capability-urls.md)
- [overview.md](../../product/overview.md)
