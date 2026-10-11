# Ogma product overview

**Purpose:** Deciding spine for Ogma. Behavior lives in `src/`. Protocols: [capability-urls](../engineering/protocols/capability-urls.md), [thread-topology](../engineering/protocols/thread-topology.md), [loom-sync](../engineering/protocols/loom-sync.md), [connectivity](../engineering/protocols/connectivity.md).

**Name:** Ogma — In Celtic myth, the god of speech and open dialogue. Legend pictured him connecting the speaker's tongue to the listener's ear via invisible, weightless golden threads—a metaphor for peer-to-peer video.

## Fast path (read first)

- **Free core (no cost):** static app shell; link → live A/V + text → leave. Ogma holds no free-user media/chat DB.
- **Thread (now):** rendezvous via BitTorrent trackers (`@trystero-p2p/torrent`); media over WebRTC **P2P mesh** (selective subscribe; hub later).
- **Paid team (later, optional):** images in chat, SFU streaming, related team extras — opt-in infra; honest copy when active.
- **Loom / Chat:** encrypted peer-seeded **text** on device; **name** to use; **vault optional** (cold **Use a vault**, or Settings **Add vault key**) for Log out / retrieve / move.
- **Shell:** [in-page-layout.md](heuristics/in-page-layout.md) — top bar, gutters, space panes, Call placement.
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
| Vault (optional) | Cold **Use a vault** splash → **Create vault** / **Open vault**; or Settings **Add vault key**; session until **Log out**. A vault holds a person id (public key). The name stays a label. The vault key is not the id |
| Chat (Loom) | `#space=<secret>`; sealed history + join events; list by last activity; titles **`a,b,c`** (other people); **`{name} joined`** in open chat; warm sync while tab open; This chat **Copy link** (+ Active **Invite a person** into this chat); All **People** **Invite** starts a new space while **Active**; retention/Load older: [loom-sync.md](../engineering/protocols/loom-sync.md) |
| **Host Call** | Chat-column **New** → space (invite on-space) → video-pane **Call**; same Loom log + compose; call invite `?room=` + `#space=` — shell: [in-page-layout.md](heuristics/in-page-layout.md) |
| Accept Call | Peer with the space warm sees **`{name} started a call`** → **Accept** / **Not now**; Accept starts the same Thread. Link Join still works without a warm tab |
| Join Call | `?room=` (+ `#space=` when from a chat) → **Join**; no cold Create lobby |
| In call | Mute, camera, **Share screen** (replaces the camera until **Stop sharing**), background blur, leave; soft-nav keeps Thread live; hang up only on Leave or page close; device hot-swap; truthful connection state — soft-nav chrome: [in-page-layout.md](heuristics/in-page-layout.md) |
| Move device | Export file → Import (+ vault key if one was added) |
| Work shell | Top bar brand · Active · Settings; Video \| Chat; chat column **This chat** \| **All** · **New**; All **Search**; resume last space or idle (no auto-create); **Ogma** opens the All tab (soft-nav in Call); **Invite** on the open chat; install Moment then optional vault nudge; Settings **Home screen** anytime |

**First visit:** Chat-column **New**, or the All tab (search, list, or quiet invite Join). Vault optional behind **Use a vault**. After the first chat, offer install. One work shell — [in-page-layout.md](heuristics/in-page-layout.md).

## Honest copy (ship in UI)

**Thread (free):** Video, audio, and live chat stay between peers. Ogma runs no media or chat server on the free path. Public trackers only help you meet; STUN may be used for connectivity. Anyone with the link can join. Surfaces: Join lobby + Settings **Privacy** (`THREAD_FREE_HONEST_COPY`).

**Thread (paid team, when active):** Media and/or files may relay through Ogma or a partner. Say so in the UI for that room — do not reuse free-path copy.

**Loom:** Text history is encrypted with the vault key, kept on members’ devices, and syncs when someone has the space open. Reopen after time away catches up from peers who still have the missing messages. Ogma keeps no central copy. Anyone with the space link can read that history. Surface: Settings **Privacy** (`LOOM_HONEST_COPY`); empty-space Moment stays the shorter ui-naming line.

**Public meta:** `SITE_META_DESCRIPTION` in `honestCopy.ts` / `index.html` — no “serverless” / “fully anonymous” / unaudited “E2EE”.

## Non-goals (free core)

Forced accounts to join, Ogma-sent invites, public room directory / open hangouts, SFU on free path, images in free sync, cloud recording, camera and screen at the same time, waiting room, background mobile VoIP, store app required to join.

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
| Background blur (shipped) | Optional local effect on the camera tile (hidden while sharing a screen). Soft fills (Soft / Cool / Warm) and **Edge cut** open from **Blur settings** on that tile while blur is on, and fold away again. Default Soft uses the original person matte; Firm adds a tighter cut. Peers see the processed track via `replaceTrack` (or OS blur when controllable). No custom upload. Model/WASM loads on first toggle. Yields under CPU/N pressure. |
| Screen share (shipped) | **Share screen** replaces the camera on the one video track. The browser picker chooses screen, window, or tab. **Stop sharing** (or the browser stop bar) restores the camera. Blur stays off that picture. |

## Related

- Topology: [thread-topology.md](../engineering/protocols/thread-topology.md)
- Connectivity / TURN: [connectivity.md](../engineering/protocols/connectivity.md)
- Loom: [loom-sync.md](../engineering/protocols/loom-sync.md)
- Fit / UX: [customer-targets.md](heuristics/customer-targets.md), [ui-principles.md](heuristics/ui-principles.md)
