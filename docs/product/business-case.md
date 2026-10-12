# Ogma business case

**Purpose:** Niche vs competition, and why optional paid connectivity / team infra can exist without becoming Meet. Does not own product jobs or STUN/TURN protocol — those stay in [overview.md](overview.md) and [connectivity.md](../engineering/protocols/connectivity.md).

## Fast path (read first)

- **Wedge:** link → talk, no account, no central chat/media DB. Trust model and friction — not “better codecs than Meet.”
- **Not the niche:** selling NAT traversal alone. Meet / Zoom / Teams already relay for free inside their accounts.
- **Paid layer:** opt-in relay (TURN) and later SFU so hard networks and larger rooms stay usable **without** putting free-path history on Ogma servers.
- **Who / jobs:** [customer-targets.md](heuristics/customer-targets.md). **Spine / SKUs:** [overview.md](overview.md). **ICE policy:** [connectivity.md](../engineering/protocols/connectivity.md).

## Niche (own this)

| We win when… | We lose when… |
|--------------|---------------|
| Buyers want capability links and on-device Loom text, not a Google/Microsoft chat archive | Buyers need calendars, recording, SSO, compliance archive, or “everyone already has Meet” |
| Privacy-minded groups accept honest P2P limits (trackers / STUN; optional TURN sees IP/timing) | They need unaudited “fully anonymous” or “no servers” claims we refuse |
| Small ad-hoc groups value zero-account join | They need webinar scale, waiting rooms, or org IT control as table stakes |

**One-line position:** Ephemeral / on-device group calls for people who will not put the chat in Meet — with optional paid relay when the network is hostile.

**Trust friction:** Cold Continue is name-only so invite Join is not blocked by a vault Moment; vault key appears on **New** or Settings **Add vault key**.

## Competition (own this)

| Competitor class | Their strength | Our answer |
|------------------|----------------|------------|
| Meet / Zoom / Teams | Connectivity, identity, admin, ubiquity | Do not compete on “hosted meeting suite.” Compete on no-account join + no central free-path DB |
| Other P2P / WebRTC toys | Similar privacy story | Ship solid 1:1 + Loom, honest copy, optional paid reliability |
| Self-hosted SFU stacks | Full control | Higher ops; Ogma stays static free shell + opt-in paid infra |

**Fail if:** roadmap or marketing positions Ogma as a Meet replacement on reliability or enterprise admin.

## Paid connectivity economics (own this)

TURN cost is **relayed gigabytes**, not CPU. Only sessions that fail direct ICE pay this cost.

| Shape | Rough bandwidth | Cost intuition (order of magnitude) |
|-------|-----------------|-------------------------------------|
| Fully relayed 1:1 at ~1.5 Mbps video | ~2.5–3 GB per call-hour (both peers, send+recv metering) | ~$0.05–0.20/hour on cheap TURN; ~$1/hour on expensive list TURN |
| Typical mix (most minutes stay P2P) | Relay share often ~10–30% of minutes; higher on guest / isolated Wi‑Fi | Flat “connectivity assist” can work if relay stays optional |
| Mesh N≥4 all relayed | Multiplies per pair | Prefer paid **SFU** over “TURN for everyone” |

**SKU intent (seams — not pricing):**

| Offer | Job | Not |
|-------|-----|-----|
| Connectivity assist (TURN) | Hard NAT / AP isolation / corporate firewalls; P2P default | Silent default TURN on free path |
| Team rooms (SFU + images) | Reliable A/V at larger N + binaries in chat | Free-path SFU or free central media DB |

Honest UI when paid relay is active: [overview.md](overview.md) Thread paid copy. Protocol gates: [connectivity.md](../engineering/protocols/connectivity.md). Until Ogma-hosted assist ships, Settings **Network help** steers to network changes + BYO TURN — not a fake checkout.

## Related

- Who / Primary jobs: [customer-targets.md](heuristics/customer-targets.md)
- Feature fit ranks: [customer-fit.md](heuristics/customer-fit.md)
- Product spine: [overview.md](overview.md)
- STUN / TURN: [connectivity.md](../engineering/protocols/connectivity.md)
