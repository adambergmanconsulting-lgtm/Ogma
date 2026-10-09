# Thread video topology

**Purpose:** How clients use only themselves to carry live A/V. Owner for M1 / M1.5 mesh and hub.

## Fast path (read first)

- Live video is WebRTC RTP — not torrent chunk sync.
- **N=2:** direct link (P0). **N=3:** full mesh. **N≥4:** client hub forward + selective subscribe (after spike).
- Phones: never hub if a non-phone peer exists.

## Roles

| Role | Duty |
|------|------|
| Leaf | Send own A/V to hub (or to each peer in mesh); receive subscribed videos |
| Hub | Receive from leaves; forward tracks to other leaves; send own A/V |

## Hub election (M1.5)

Broadcast over data channel (JSON):

```json
{ "type": "hubScore", "peerId": "...", "score": 0, "deviceClass": "desktop|phone", "ts": 0 }
```

**Score (higher wins):**

1. `deviceClass`: desktop = 100, phone = 0
2. +20 if `navigator.connection?.type === 'wifi'` (when available)
3. + min(30, estimated downlink Mbps) when Network Information API exists
4. Tie-break: lowest `peerId` lexicographic

**Re-elect** when hub leaves or score broadcast shows a better peer by ≥20 for 3s. Renegotiate topology after election.

## Subscription (M1.5)

```json
{ "type": "subscribe", "wantVideoFrom": ["peerId", "..."], "pins": ["peerId"] }
```

Default want: active speaker(s) (audio level) + pins + self. Others: no video or lowest layer.

## Hub spike go/no-go

Before coding M1.5 hub: prove on Chromium and WebKit that a received `MediaStreamTrack` can be added as outbound on another `RTCPeerConnection` (forward without full MCU re-encode).

| Result | M1.5 shape |
|--------|------------|
| Works on Chrome + Safari | Hub forward + subscription |
| Chrome only | Hub on desktop Chrome rooms; Safari leaves selective-mesh |
| Neither reliable | **No hub** — selective subscription on mesh only; hard cap lower |

## Encoding

- Caps: width max 1280, fps max 30; scale down with N (see `buildUserMediaConstraints`).
- Prefer forward encoded bits; simulcast later.

## Hard cap

UI warns at 5, refuses new joins at 7 until tree/multi-hub exists.

## Related

- [connectivity.md](connectivity.md)
- [overview.md](../../product/overview.md)
