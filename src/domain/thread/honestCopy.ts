/**
 * Honest copy from overview.md. Thread: invite Join lobby + Settings privacy.
 * Loom: Settings privacy (empty-space Moment stays the shorter ui-naming line).
 * Do not reuse Thread free copy for paid team rooms.
 */
export const THREAD_FREE_HONEST_COPY =
  'Video, audio, and live chat stay between peers. Ogma runs no media or chat server on the free path. Public trackers only help you meet; STUN may be used for connectivity. Anyone with the link can join.';

export const LOOM_HONEST_COPY =
  'Text history is encrypted with the vault key, kept on members’ devices, and syncs when someone has the space open. Ogma keeps no central copy. Anyone with the space link can read that history.';

/** Public meta / niche packaging — no “serverless” / “anonymous” / unaudited E2EE. */
export const SITE_META_DESCRIPTION =
  'Ogma — peer-to-peer video and chat in the browser. No accounts; no central media or chat database. Anyone with the link can join.';

export const PRIVACY_SETTINGS = {
  /** Summary for collapsed disclosure — full paragraphs stay inside. */
  summary: 'How privacy works',
  heading: 'Privacy',
  threadLabel: 'Calls (free path)',
  loomLabel: 'Chat history',
} as const;
