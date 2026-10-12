# Loom sync (encrypted text log)

**Purpose:** Spec for M2 peer-seeded history. Do not implement before Thread M1 exit.

## Fast path (read first)

- Sealed append log (text + join + Call/screen system lines) in IndexedDB; sync over WebRTC when space open (warm set up to 3 while tab open).
- Space secret → UTF-8 bytes → HKDF → AES-256-GCM (Web Crypto). **Locked:** UTF-8 of `#space=` string (never change).
- Availability = members online; Ogma stores nothing. Leave and reopen: missing ids catch up via the same `have`/`need`/`entries` from peers who still have them; no Ogma backlog while everyone with that history is offline.
- Cold **Continue** is name-only (Join works with `localSecret`). **New** chat or Settings **Add vault key** creates the key (shown once). Vault key wraps Remembered secrets + Log out / retrieve / move + person id. **Switch vault** / **Start over** then Continue erases this browser’s Loom store + people directory (no sealed orphans). Name-only profiles keep `localSecret` on-device; adding a key migrates those into `wrappedSecret`.
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
- Text edit (append-only): `{ "kind": "text", "text": "...", "replaces": "<root-id>" }` — `replaces` is the original text message id. UI folds the newest author-matching edit onto the root bubble (quiet **edited**); the edit envelope stays in the sealed log for sync.
- Join (once per author when they open the space): `{ "kind": "join" }`
- Call / screen (system lines, like join): `{ "kind": "call-start" }` · `{ "kind": "call-end" }` · `{ "kind": "screen-share" }` · `{ "kind": "screen-share-end" }`
- Legacy still opens: `{ "text": "..." }` (treated as text)

**All-list tip / lastMessageAt:** text only (including edits). System kinds do not write the tip (Call sort still uses `lastCallAt`).

**Dedupe:** by `id`. **Order:** `ts` then `id`. Clock skew: accept; UI sorts stably. Edits never rewrite an existing id.

## Keying

- `spaceSecret` from `#space=` — **UTF-8 bytes of the secret string** (locked).
- `encKey = HKDF-SHA-256(ikm=spaceSecret, salt=empty, info="ogma-loom-enc-v1", len=32)`.
- AES-GCM 256; 96-bit random nonce per message.
- Optional **device key** (PBKDF2-SHA-256 → AES-GCM) wraps remembered space secrets on one vault; not membership.

**v1 trust:** anyone with the space link can decrypt. No member removal / FS.

**Author:** display label only (spoofable). When a vault key exists, that vault also holds an Ed25519 person id (public key, wrapped private key on the device-key record) and a P-256 box key. The id is not the vault passphrase and is not written into the author string. The mark sits beside a name when that person's id is known. Other people stay names until their signed card has been seen in a shared space.

**Presence:** room `person:<sha256(personPublicId)[:16] hex>`. While the tab is visible and **Active** is on, that vault announces a fresh signed here. Peers who already have the card mark them **Active**. **Hidden**, or a hidden tab, leaves the room.

**Invite:** **Invite** seals a space secret to the person's box key and sends it on that room. From an open chat it seals that chat's secret. From People it seals a new secret and opens it here. Their open tab opens the space. The tracker sees the meeting room, not the secret. This is not an Ogma-sent invite and does not wake a closed app.

**Call ring (ephemeral):** While Loom sync is open for a space, **Call** broadcasts `{ type: "call", author, ts }` on the same Trystero room (not sealed history) as soon as Call starts (before camera/mic finishes). Peers with that space warm see **Accept** / **Not now**, a local looping ringtone (`callRingSound.ts`), title/favicon flash, and a short vibrate until they Accept, Not now, or receive **call-end**. The caller suppresses echo by marking the space as calling — not by matching display names (labels are not unique). **Leave** sends `{ type: "call-end" }`; peers in that space’s Call hang up too (and a pending Accept clears). Leave / call-end always stop the ringtone and briefly suppress new Accept offers for that space so a peer’s in-flight re-announce cannot leave the tab ringing after hang-up. While still in Call, re-announce on peer join, when the tab becomes visible, and on a short pulse so a missed first announce can still offer Accept. Does not wake a closed app.

**Chat alerts (in-tab):** Warm spaces may chime + vibrate + title flash when mail arrives while you are in another chat or the tab is hidden (Settings → **Alerts** → **Chat sounds**, default on). No push while the app is closed.

## Sync protocol (when space open)

1. Join Trystero room `loom:<spaceId>` (spaceId derived from hash of secret, not the secret itself if we need a public swarm id — **public room key** = `SHA-256(spaceSecret)[:16]` hex; **enc key** from full secret).
2. On peer connect: send `{ type: "have", ids: ["...", ...] }` (or ranged summary if large).
3. Peer replies `{ type: "need", ids: [...] }` then chunk `{ type: "entries", entries: [envelope, ...] }` (max ~64–256 KiB per chunk).
4. Persist new ids; re-broadcast `have` occasionally.

**Catch-up:** Closing the chat stops live sync for that peer. Opening again runs the same exchange; peers who kept the envelopes seed the gap. If no peer with those ids is online, the gap stays until one is.

**Seeding (outbound have/entries/card/call):** only while document visible (`document.visibilityState === 'visible'`). **Inbound** always applies; becoming visible again re-broadcasts `have` (and call announce if in Call) so a briefly hidden tab does not drop catch-up forever.

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
