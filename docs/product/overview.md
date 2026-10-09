# Ogma product overview

**Purpose:** Deciding spine for Ogma. Behavior lives in `src/`. Protocols: [capability-urls](../engineering/protocols/capability-urls.md), [thread-topology](../engineering/protocols/thread-topology.md), [loom-sync](../engineering/protocols/loom-sync.md), [connectivity](../engineering/protocols/connectivity.md).

**Name:** Ogma — In Celtic myth, the god of speech and open dialogue. Legend pictured him connecting the speaker's tongue to the listener's ear via invisible, weightless golden threads—a metaphor for peer-to-peer video.

## Fast path (read first)

- **Unhosted data plane:** static app shell; Ogma holds no user media/chat DB.
- **Thread (now):** link → live A/V + text → leave. Rendezvous via BitTorrent trackers (`@trystero-p2p/torrent`). Media over WebRTC.
- **Loom (later):** encrypted peer-seeded **text** spaces; same capability mindset.
- **1:1 video must work** (incl. phone foreground). 3 = mesh. 4+ = client hub + selective video.
- **Phones:** participants yes; hubs/seeders last resort.
- Layers: [application-layering.md](../engineering/architecture/application-layering.md#host-fill-in).

## Invariants

1. No Ogma backend for product data.
2. No accounts — capability link is access.
3. Live A/V and live chat are WebRTC P2P only.
4. Trackers are meet-cute only.
5. Text-only in chat/history; binaries = later paid product.
6. Loom must not weaken Thread.
7. Honest copy — no “no servers” / “fully anonymous” / unaudited “E2EE” claims.

## Jobs

| Job | Outcome |
|-----|---------|
| Create / join Thread | `#room=<secret>`; copy/share link out of band |
| Call | Mute, camera, leave; device hot-swap; truthful connection state |
| Side text | Data-channel text only (no images) |
| Loom (later) | `#space=<secret>`; encrypted text history; start Thread from space |

## Honest copy (ship in UI)

**Thread:** Video, audio, and live chat stay between peers. Ogma runs no media or chat server. Public trackers only help you meet; STUN may be used for connectivity. Anyone with the link can join.

**Loom:** Text history is encrypted with the space key, kept on members’ devices, and syncs when someone has the space open. Ogma keeps no central copy. Anyone with the space link can read that history.

## Non-goals

Accounts, Ogma-sent invites, SFU, images in free sync, cloud recording, screen share (v1), waiting room, background mobile VoIP, store app required to join.

## Milestones

| # | Bar |
|---|-----|
| M1 | Trystero; 1:1 solid (+ phone); 3-mesh; text; no Gun |
| M1.5 | Client hub and/or selective video for 4+ |
| M2 | Loom encrypted text sync |

## Related

- Topology: [thread-topology.md](../engineering/protocols/thread-topology.md)
- Connectivity / TURN: [connectivity.md](../engineering/protocols/connectivity.md)
- Loom: [loom-sync.md](../engineering/protocols/loom-sync.md)
- Fit / UX: [customer-targets.md](heuristics/customer-targets.md), [ui-principles.md](heuristics/ui-principles.md)
