# Thread video topology

**Purpose:** How clients use only themselves to carry live A/V. Owner for M1 / M1.5 mesh and hub.

## Fast path (read first)

- Live video is WebRTC RTP — not torrent chunk sync.
- **Free path:** N=2 direct; N=3 full mesh; selective subscribe (active speaker + pins); N≥4 client hub after spike.
- Soft UI warn at **5**; hard refuse at **6** (`MAX_PEERS`) until hub; hub target refuse **7**.
- Phones: never hub if a non-phone peer exists.
- **Paid team (later):** SFU media-plane adapter — see [overview.md](../../product/overview.md).

## Roles

| Role | Duty |
|------|------|
| Leaf | Send own A/V to hub (or to each peer in mesh); receive subscribed videos |
| Hub | Receive from leaves; forward tracks to other leaves; send own A/V |

## Subscription (shipped on mesh)

Broadcast over data channel (JSON):

```json
{ "type": "subscribe", "wantVideoFrom": ["peerId", "..."], "pins": ["peerId"], "showAll": false }
```

```json
{ "type": "speaking", "level": 0.0, "ts": 0 }
```

Default want: active speaker(s) (audio level) + pins. Escape: show all videos. Others: no outbound video toward that peer (`replaceTrack(null)`).

## Hub election (M1.5)

```json
{ "type": "hubScore", "peerId": "...", "score": 0, "deviceClass": "desktop|phone", "ts": 0 }
```

**Score (higher wins):**

1. `deviceClass`: desktop = 100, phone = 0
2. +20 if `navigator.connection?.type === 'wifi'` (when available)
3. + min(30, estimated downlink Mbps) when Network Information API exists
4. Tie-break: lowest `peerId` lexicographic

**Re-elect** when hub leaves or score broadcast shows a better peer by ≥20 for 3s. Renegotiate topology after election.

## Hub spike go/no-go

Before coding M1.5 hub: prove on Chromium and WebKit that a received `MediaStreamTrack` can be added as outbound on another `RTCPeerConnection` (forward without full MCU re-encode).

| Result | M1.5 shape |
|--------|------------|
| Works on Chrome + Safari | Hub forward + subscription |
| Chrome only | Hub on desktop Chrome rooms; Safari leaves selective-mesh |
| Neither reliable | **No hub** — selective subscription on mesh only; hard cap stays 6 |

## Encoding

- Soft ceilings: width max 1280, fps max 30; scale with N, speaking tier, congestion (`buildUserMediaConstraints`, `maxVideoBitrateBps`).
- Prefer high quality on healthy small rooms; do not hard-drop solely because N rose.
- Prefer forward encoded bits; simulcast later (or with paid SFU).

## Hard cap

| Stage | Warn | Refuse |
|-------|------|--------|
| Mesh + subscribe (now) | 5 | 6 |
| After free-core hub | 5 | 7 |
| Paid SFU (later) | — | product cap (start 16) |

## Related

- [connectivity.md](connectivity.md)
- [overview.md](../../product/overview.md)
