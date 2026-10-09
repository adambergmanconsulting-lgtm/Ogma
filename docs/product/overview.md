# Ogma product overview

**Purpose:** Deciding spine for Ogma. Behavior lives in `src/`. Protocols: [capability-urls](../engineering/protocols/capability-urls.md), [thread-topology](../engineering/protocols/thread-topology.md), [loom-sync](../engineering/protocols/loom-sync.md), [connectivity](../engineering/protocols/connectivity.md).

**Name:** Ogma — In Celtic myth, the god of speech and open dialogue. Legend pictured him connecting the speaker's tongue to the listener's ear via invisible, weightless golden threads—a metaphor for peer-to-peer video.

## Fast path (read first)

- **Free core (no cost):** static app shell; link → live A/V + text → leave. Ogma holds no free-user media/chat DB.
- **Thread (now):** rendezvous via BitTorrent trackers (`@trystero-p2p/torrent`); media over WebRTC **P2P mesh** (selective subscribe; hub later).
- **Paid team (later, optional):** images in chat, SFU streaming, related team extras — opt-in infra; honest copy when active.
- **Loom / Chat:** encrypted peer-seeded **text** on device; **name** to use; **vault optional** (cold **Use a vault**, or Settings **Add vault key**) for Log out / retrieve / move.
- **Shell:** permanent top bar — **Ogma** · **Chat** · **Call** · Settings gear; shared `.app-column` + `.app-gutter-x`.
- **1:1 video must work** (incl. phone foreground). 3 = mesh. 4+ = client hub + selective video on free path.
- **Phones:** participants yes; hubs/seeders last resort.
- **Room size (free):** warn at 5, refuse at 6 until hub; see [thread-topology.md](../engineering/protocols/thread-topology.md).
- Layers: [application-layering.md](../engineering/architecture/application-layering.md#host-fill-in).

## Invariants

1. No Ogma backend for **free** product data (chat/history/media DB).
2. Free access is capability link — no accounts required to join.
3. **Free** live A/V and live chat are WebRTC P2P only (no SFU on free path).
4. Trackers are meet-cute only.
5. Free chat/history is text-only; binaries / images = paid team product.
6. Loom must not weaken Thread.
7. Honest copy — no “no servers” / “fully anonymous” / unaudited “E2EE” claims; paid mode must say when media/files may relay.

## Jobs

| Job | Outcome |
|-----|---------|
| Name | Required once per browser profile to chat/call |
| Vault (optional) | Cold **Use a vault** splash → **Create vault** / **Open vault**; or Settings **Add vault key**; session until **Log out** |
| Chat (Loom) | `#space=<secret>`; sealed history; list **Hide** / **Hidden** (not message retention); warm sync while tab open; titles from other participants or **New chat** |
| **Host Call** | Open a chat → top-bar **Call** — same Loom log in the call drawer; invite `?room=` + `#space=` |
| Join Call | `?room=` (+ `#space=` when from a chat) → **Join**; no cold Create lobby |
| In call | Mute, camera, background blur, leave; device hot-swap; truthful connection state |
| Move device | Export file → Import (+ vault key if one was added) |

**First visit:** Top bar always visible. Empty Chat: create a chat to message and Call. **Call** needs an open chat (else returns to the list). Vault is optional behind **Use a vault**.

## Honest copy (ship in UI)

**Thread (free):** Video, audio, and live chat stay between peers. Ogma runs no media or chat server on the free path. Public trackers only help you meet; STUN may be used for connectivity. Anyone with the link can join.

**Thread (paid team, when active):** Media and/or files may relay through Ogma or a partner. Say so in the UI for that room — do not reuse free-path copy.

**Loom:** Text history is encrypted with the space key, kept on members’ devices, and syncs when someone has the space open. Ogma keeps no central copy. Anyone with the space link can read that history.

## Non-goals (free core)

Forced accounts to join, Ogma-sent invites, SFU on free path, images in free sync, cloud recording, screen share (v1), waiting room, background mobile VoIP, store app required to join.

## Paid team (later SKU — seams only until built)

| Extra | Intent |
|-------|--------|
| Images in side chat | Typed chat envelope; not on free Loom/Thread sync |
| SFU streaming | Second media-plane adapter; free stays mesh |
| Org billing | May need team accounts; free joins stay link-based |

## Milestones

| # | Bar |
|---|-----|
| M1 | Trystero; 1:1 solid (+ phone); 3-mesh; text; selective subscribe; no Gun |
| M1.5 | Client hub for free 4+ |
| M2 | Loom encrypted text sync |
| Team | Paid SFU + images (after free-core quality) |

## Planned (after M1)

| Feature | Intent |
|---------|--------|
| Background blur (shipped) | Optional local effect; peers see blur via processed track + `replaceTrack` (or OS blur when controllable). Not preview-only CSS. Model/WASM loads on first toggle. Yields under CPU/N pressure. |

## Related

- Topology: [thread-topology.md](../engineering/protocols/thread-topology.md)
- Connectivity / TURN: [connectivity.md](../engineering/protocols/connectivity.md)
- Loom: [loom-sync.md](../engineering/protocols/loom-sync.md)
- Fit / UX: [customer-targets.md](heuristics/customer-targets.md), [ui-principles.md](heuristics/ui-principles.md)
