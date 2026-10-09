/** Loom sealed log + space index. Spec: docs/engineering/protocols/loom-sync.md */

export const LOOM_ENVELOPE_V = 1 as const;
export const MAX_PLAINTEXT_BYTES = 4 * 1024;
export const WARM_CAP = 3;
/** Newest N stay hot per space; older move to local cold store. */
export const MESSAGE_KEEP_CAP = 500;
/** How many cold messages to restore per “Load older”. */
export const MESSAGE_LOAD_OLDER_BATCH = 50;
export const SIZE_WARN_BYTES = 50 * 1024 * 1024;
export const SIZE_STRONG_WARN_BYTES = 100 * 1024 * 1024;

export type LoomEnvelope = {
  v: typeof LOOM_ENVELOPE_V;
  id: string;
  ts: number;
  author: string;
  nonce: string;
  ciphertext: string;
};

export type SpaceStatus = 'recent' | 'archived';

export type SpaceIndexRow = {
  spaceId: string;
  /** User-chosen title; when set, wins over participant names. */
  label?: string;
  /** Distinct message authors seen in this space (display labels). */
  authors?: string[];
  status: SpaceStatus;
  lastOpenedAt: number;
  lastMessageAt: number;
  unreadCount: number;
  muted?: boolean;
  /** Device-key-wrapped space secret (Remember). */
  wrappedSecret?: string;
};

export type StoredMessage = LoomEnvelope & { spaceId: string };

export type DeviceKeyMeta = {
  saltB64: string;
  /** Verifier: encrypt fixed string; proves passphrase without storing it. */
  verifierNonceB64: string;
  verifierCipherB64: string;
};

export type LoomBackupV1 = {
  v: 1;
  exportedAt: number;
  spaces: SpaceIndexRow[];
  messages: StoredMessage[];
  /** Present when export included Remembered secrets (still wrapped). */
  deviceKeyMeta?: DeviceKeyMeta;
};

export type SyncWire =
  | { type: 'have'; ids: string[] }
  | { type: 'need'; ids: string[] }
  | { type: 'entries'; entries: LoomEnvelope[] };
