# Loom sync (encrypted text log)

**Purpose:** Spec for M2 peer-seeded history. Do not implement before Thread M1 exit.

## Fast path (read first)

- Sealed append log (text + join) in IndexedDB; sync over WebRTC when space open (warm set up to 3 while tab open).
- Space secret → UTF-8 bytes → HKDF → AES-256-GCM (Web Crypto). **Locked:** UTF-8 of `#space=` string (never change).
- Availability = members online; Ogma stores nothing. Leave and reopen: missing ids catch up via the same `have`/`need`/`entries` from peers who still have them; no Ogma backlog while everyone with that history is offline.
- Display **name** required before Chat / Call. **Vault key optional** (cold **Use a vault** or Settings **Add vault key**): wraps Remembered secrets + Log out / retrieve; not required to use the app. Without a vault key, each space keeps `localSecret` on-device so Previous spaces can reopen after refresh; Add vault key migrates those into `wrappedSecret`.
- Host Call binds Thread room + `#space=` so in-call text is this Loom log ([capability-urls.md](capability-urls.md), [overview.md](../../product/overview.md)).

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

**Plaintext inside ciphertext** (UTF-8 JSON, max 4 KiB):
- Text: `{ "kind": "text", "text": "..." }`
- Join (once per author when they open the space): `{ "kind": "join" }`
- Legacy still opens: `{ "text": "..." }` (treated as text)

**Dedupe:** by `id`. **Order:** `ts` then `id`. Clock skew: accept; UI sorts stably.

## Keying

- `spaceSecret` from `#space=` — **UTF-8 bytes of the secret string** (locked).
- `encKey = HKDF-SHA-256(ikm=spaceSecret, salt=empty, info="ogma-loom-enc-v1", len=32)`.
- AES-GCM 256; 96-bit random nonce per message.
- Optional **device key** (PBKDF2-SHA-256 → AES-GCM) wraps remembered space secrets on one vault; not membership.

**v1 trust:** anyone with the space link can decrypt. No member removal / FS.

**Author:** display label only (spoofable). When a vault key exists, that vault also holds an Ed25519 person id (public key, wrapped private key on the device-key record) and a P-256 box key. The id is not the vault passphrase and is not written into the author string. The mark sits beside a name when that person's id is known. Other people stay names until their signed card has been seen in a shared space.

**Presence:** room `person:<sha256(personPublicId)[:16] hex>`. While the tab is visible and **Active** is on, that vault announces a fresh signed here. Peers who already have the card mark them **Active**. **Hidden**, or a hidden tab, leaves the room.

**Invite:** **Invite** seals a space secret to the person's box key and sends it on that room. From an open chat it seals that chat's secret. From People it seals a new secret and opens it here. Their open tab opens the space. The tracker sees the meeting room, not the secret. This is not an Ogma-sent invite and does not wake a closed app.

**Call ring (ephemeral):** While Loom sync is open for a space, **Call** broadcasts `{ type: "call", author, ts }` on the same Trystero room (not sealed history). Peers with that space warm see **Accept** / **Not now**. Leaving sends `{ type: "call-end" }`. Late peers get a re-announce on join while the caller is still in Call. Does not wake a closed app.

## Sync protocol (when space open)

1. Join Trystero room `loom:<spaceId>` (spaceId derived from hash of secret, not the secret itself if we need a public swarm id — **public room key** = `SHA-256(spaceSecret)[:16]` hex; **enc key** from full secret).
2. On peer connect: send `{ type: "have", ids: ["...", ...] }` (or ranged summary if large).
3. Peer replies `{ type: "need", ids: [...] }` then chunk `{ type: "entries", entries: [envelope, ...] }` (max ~64–256 KiB per chunk).
4. Persist new ids; re-broadcast `have` occasionally.

**Catch-up:** Closing the chat stops live sync for that peer. Opening again runs the same exchange; peers who kept the envelopes seed the gap. If no peer with those ids is online, the gap stays until one is.

**Seeding:** only while document visible (`document.visibilityState === 'visible'`).

## Size guards

- **Keep-last-N (locked):** each space keeps the newest **500** messages hot (`MESSAGE_KEEP_CAP`); older envelopes move to a local **cold** store on ingest/open. Sync `have`/`need` includes cold ids.
- **Load older:** UI restores cold in batches of **50** (`MESSAGE_LOAD_OLDER_BATCH`) without promoting them back to hot.
- Warn at 50 MB local (hot + cold); strongly warn 100 MB; suggest export.
- Export (M2+): decrypt locally to JSON download for holder with secret.

## Non-goals (M2)

Images/files; CRDT rich text; always-on Ogma backup; push notifications.

## Related

- [capability-urls.md](capability-urls.md)
- [overview.md](../../product/overview.md)
