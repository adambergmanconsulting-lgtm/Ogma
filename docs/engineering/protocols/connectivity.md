# Connectivity (STUN / TURN)

**Purpose:** When paths form; when we consider TURN. Not an SFU policy.

## Fast path (read first)

- M1 default: public **STUN** only (`stun:stun.l.google.com:19302` and one backup).
- TURN is **NAT help**, never media mixing. Using TURN is a privacy trade (relay sees IP / timing; with DTLS may not see media plaintext).
- **Optional user TURN** ships in Settings (**Network help**), off when unset (`src/domain/thread/iceConfig.ts`). Prefer filling the [manual matrix](../../ops/manual-call-matrix.md) before recommending TURN in copy.
- Decision gate for *default* TURN: **M1 manual matrix**, not speculation.

## M1 acceptance matrix (manual)

Record pass/fail for A/V + text within ~30s of join:

| # | A | B | Network notes |
|---|---|---|----------------|
| 1 | Desktop Chrome | Desktop Chrome | Same LAN |
| 2 | Desktop Chrome | Desktop Chrome | Different networks |
| 3 | Desktop | Phone Safari/Chrome | Phone on Wi‑Fi, app foreground |
| 4 | Desktop | Phone | Phone on cellular if available |
| 5 | Phone | Phone | Both Wi‑Fi foreground |

**Pass:** two-way audio + video (or explicit user-muted) + data-channel text.  
**Fail:** ICE stuck, one-way media, or fake “connected” with silence — file as P0.

## TURN decision

| Result | Action |
|--------|--------|
| Matrix mostly pass | Stay STUN-only; document known failure class |
| Repeated fail on cellular / symmetric NAT | Design **optional** TURN: user-provided `turn:` URI or privacy-reviewed public TURN; off by default if possible |
| Fail even on same-LAN desktop | First: app signaling bug (wrong room / error path). Also common: Wi‑Fi **client/AP isolation** — peers meet on trackers but ICE never forms; TURN or a non-isolated network then helps |
| Paid connectivity SKU (later) | Niche + GB economics (not Meet-clone): [business-case.md](../../product/business-case.md). Free path stays STUN-only / user TURN |

## UI

- Status labels: `connectionLabel` — **Joining…** / **Reconnecting…** / error message (else **Couldn't connect**) / when `connected`: **Connected** / **Waiting…** / **Connecting…** ([ui-naming.md](../../product/heuristics/ui-naming.md)).
- **Link quality** is separate from ICE status: quiet notice **Weak connection with {name} — lowering video** / **… — video paused** (or without a name when unknown). Names the worst mesh peer path; does not rewrite **Connected**. Encode ladder: [thread-topology.md Encoding](thread-topology.md).
- Join failure copy: “Couldn't reach peers — this network may block direct connections. Change network, or open Settings → Network help.” (`JOIN_PEERS_UNREACHABLE` in `joinErrorMessage.ts`). Settings **Network help** lists network changes first, then optional BYO TURN; no fake Ogma paywall until paid assist ships ([business-case.md](../../product/business-case.md)). Trystero `{ error }` is humanized there — never show `[object Object]` or raw SDP essays.
- Loom: do not keep that banner when a peer is already connected (chat can work while Trystero still reports a failed ICE attempt); clear on peer join (`loomJoinErrorIsActionable`).
- Never show connected with zero tracks and no explanation.

## LAN P2P (chat-first investigation)

**Product stance:** Prefer chat working when A/V cannot. Same free-path rule: WebRTC P2P (no free Ogma chat server). Loom and Thread both meet via Trystero trackers + ICE (`buildIceServers`); chat rides data channels on the same ICE path as media.

**Why same-LAN fails under AP / client isolation:** Trackers still introduce peers (signaling works). Host/LAN ICE candidates cannot reach each other because the AP blocks client↔client. STUN srflx often cannot hairpin through the same NAT. Result: SDP exchanged, ICE never connects — A/V and Loom chat fail together.

| Approach | Chat-only help? | Prefer / Avoid |
|----------|-----------------|----------------|
| Network change (leave guest Wi‑Fi, hotspot, disable isolation) | Yes | Prefer first — Settings **Network help** |
| BYO / paid **TURN** (relay data channels + media) | Yes | Prefer for hostile nets; same SKU as A/V assist |
| ICE `iceTransportPolicy: 'relay'` without TURN | No | Avoid — no candidates |
| Separate datachannel-only `RTCPeerConnection` | No | Avoid — same ICE/NAT failure class |
| Browser mDNS / `.local` host candidates | Rarely | Avoid as product bet — incomplete, OS/browser gated |
| Free public WebSocket chat relay | Yes technically | Avoid on free path — second spine + metadata server ([business-case.md](../../product/business-case.md)) |
| Paid opaque packet relay (WS or TURN) | Yes | OK later with honest copy; TURN preferred (one stack) |

**Smallest next spike** (½ day, no feature): two devices on a known **guest / client-isolated** SSID; Loom space only (no Call). Confirm trackers up and post-SDP unreachable copy. Optional dev-only log of ICE candidate types (`host` / `srflx` / `relay`). Then BYO TURN → rejoin Loom → expect chat sync. Control: same peers off isolation or on hotspot without TURN.

| Spike result | Next move |
|--------------|-----------|
| Isolated fail (host+srflx only); TURN restores Loom text | Known class — lean Network help + BYO/paid TURN; no mDNS / second-PC project |
| Host pairs succeed on “isolated” SSID | Not isolation — debug room id / appId / seeding |
| TURN still fails | Credential / UDP-443 firewall — not a LAN-P2P design problem |

No parallel WS transport until a matrix row fails with TURN. Record in [manual-call-matrix.md](../../ops/manual-call-matrix.md).

## Related

- Product: [overview.md](../../product/overview.md)
- Niche / paid connectivity: [business-case.md](../../product/business-case.md)
- Topology: [thread-topology.md](thread-topology.md)
- Loom transport: [loom-sync.md](loom-sync.md)
