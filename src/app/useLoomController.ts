import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDeviceKeyMeta,
  loadRememberedSecrets,
  unlockDeviceKey,
  unwrapSpaceSecret,
  wrapSpaceSecret,
} from '../domain/loom/deviceKey';
import { compareEnvelopes, openEnvelope, sealEnvelope } from '../domain/loom/envelope';
import {
  hasUnloadableCold,
  pickColdBatch,
  trimSpaceMessages,
} from '../domain/loom/retention';
import { localSizeLevel } from '../domain/loom/size';
import {
  backfillSpaceAuthors,
  bumpLastMessage,
  clearUnread,
  displaySpaceLabel,
  ensureSpaceRow,
  noteSpaceAuthors,
  partitionSpaces,
  setSpaceStatus,
} from '../domain/loom/spaceIndex';
import { getLoomStore } from '../domain/loom/store';
import type { LoomStore } from '../domain/loom/storePort';
import { openLoomSync, type LoomSyncSession } from '../domain/loom/sync';
import type { LoomEnvelope, SpaceIndexRow, StoredMessage } from '../domain/loom/types';
import {
  applyVaultRename,
  clearLocalVaultRecord,
  exportVaultFile,
  importVaultFile,
} from './loomVaultActions';
import {
  createVaultRecord,
  readVault,
  writeVault,
  type VaultRecord,
} from '../domain/loom/vault';
import { generateVaultKey } from '../domain/loom/vaultKey';
import {
  clearVaultSession,
  readVaultSessionKey,
  writeVaultSessionKey,
} from '../domain/loom/vaultSession';
import { playNewMessageSound } from '../domain/loom/notifySound';
import { pickWarmSpaceIds } from '../domain/loom/warm';
import {
  createSpaceSecret,
  parseSpaceSecretFromLocation,
  replaceUrlWithSpace,
  spaceShareUrl,
} from '../domain/signaling/room';
import { extractSpaceSecret, shareRoomLink } from '../domain/signaling/share';
import type { SpaceMessageView } from '../components/SpaceView';

export type LoomScreen = 'vault' | 'unlock' | 'reveal' | 'chats' | 'space' | 'thread';

export type RevealState = {
  kind: 'vault' | 'space';
  /** Shown to the user (vault key or full invite URL). */
  secret: string;
  why: string;
  /** For space: raw secret used to open after continue. */
  spaceSecret?: string;
};

const SOUND_KEY = 'ogma.chatSound';

function initialScreen(): LoomScreen {
  const v = readVault();
  if (!v) return 'vault';
  // Stay in chats when session exists; restore wrap key in effect.
  if (v.hasDeviceKey && !readVaultSessionKey()) return 'unlock';
  return 'chats';
}

export function useLoomController() {
  const [vault, setVault] = useState<VaultRecord | null>(() => readVault());
  const [screen, setScreen] = useState<LoomScreen>(initialScreen);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [spaces, setSpaces] = useState<SpaceIndexRow[]>([]);
  const [spaceInput, setSpaceInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrapKey, setWrapKey] = useState<CryptoKey | null>(null);
  const [focusedSecret, setFocusedSecret] = useState<string | null>(null);
  const [focusedSpaceId, setFocusedSpaceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SpaceMessageView[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const soundEnabled = localStorage.getItem(SOUND_KEY) === '1';

  const secretsRef = useRef(new Map<string, string>());
  const syncRef = useRef(new Map<string, LoomSyncSession>());
  const storeRef = useRef<LoomStore | null>(null);
  const focusedSpaceIdRef = useRef<string | null>(null);
  const messagesRef = useRef<SpaceMessageView[]>([]);
  const displayName = vault?.displayName ?? '';
  const unlocked = Boolean(wrapKey) || Boolean(vault && !vault.hasDeviceKey);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const refreshSpaces = useCallback(async () => {
    const store = storeRef.current ?? (await getLoomStore());
    storeRef.current = store;
    const listed = await store.listSpaces();
    await backfillSpaceAuthors(store, listed);
    setSpaces(await store.listSpaces());
    await localSizeLevel(store);
  }, []);

  const decryptRows = useCallback(
    async (secret: string, rows: StoredMessage[]): Promise<SpaceMessageView[]> => {
      const views: SpaceMessageView[] = [];
      for (const row of rows) {
        try {
          const text = await openEnvelope(secret, row);
          views.push({
            id: row.id,
            author: row.author,
            text,
            ts: row.ts,
            self: row.author === displayName,
          });
        } catch {
          // skip
        }
      }
      return views;
    },
    [displayName],
  );

  const refreshHasMoreOlder = useCallback(async (spaceId: string, shown: SpaceMessageView[]) => {
    const store = storeRef.current ?? (await getLoomStore());
    setHasMoreOlder(await hasUnloadableCold(store, spaceId, new Set(shown.map((m) => m.id))));
  }, []);

  const loadMessages = useCallback(
    async (spaceId: string, secret: string) => {
      const store = storeRef.current ?? (await getLoomStore());
      const hot = await decryptRows(
        secret,
        (await store.listMessages(spaceId)).sort(compareEnvelopes),
      );
      const hotIds = new Set(hot.map((m) => m.id));
      const keptOlder = messagesRef.current.filter((m) => !hotIds.has(m.id));
      const next = [...keptOlder, ...hot].sort((a, b) =>
        a.ts !== b.ts ? a.ts - b.ts : a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
      );
      setMessages(next);
      await refreshHasMoreOlder(spaceId, next);
    },
    [decryptRows, refreshHasMoreOlder],
  );

  const ingestEntries = useCallback(
    async (spaceId: string, entries: LoomEnvelope[], fromPeer: boolean) => {
      const store = storeRef.current ?? (await getLoomStore());
      const added = await store.putMessages(spaceId, entries);
      if (added === 0) return;
      await trimSpaceMessages(store, spaceId);
      let maxTs = 0;
      for (const e of entries) maxTs = Math.max(maxTs, e.ts);
      await noteSpaceAuthors(
        store,
        spaceId,
        entries.map((e) => e.author),
      );
      const viewing = focusedSpaceIdRef.current === spaceId;
      await bumpLastMessage(store, spaceId, maxTs, fromPeer && !viewing ? added : 0);
      if (viewing) {
        await clearUnread(store, spaceId);
        const secret = secretsRef.current.get(spaceId);
        if (secret) await loadMessages(spaceId, secret);
      }
      await refreshSpaces();
      if (fromPeer && !viewing && soundEnabled) playNewMessageSound();
      await syncRef.current.get(spaceId)?.broadcastHave();
    },
    [loadMessages, refreshSpaces, soundEnabled],
  );

  const stopSync = useCallback((spaceId: string) => {
    syncRef.current.get(spaceId)?.leave();
    syncRef.current.delete(spaceId);
  }, []);

  const ensureSync = useCallback(
    async (spaceId: string, secret: string) => {
      if (syncRef.current.has(spaceId)) return;
      const store = storeRef.current ?? (await getLoomStore());
      const session = await openLoomSync(secret, store, {
        onEntries: (entries) => void ingestEntries(spaceId, entries, true),
        onError: (message) => setError(message),
      });
      syncRef.current.set(spaceId, session);
    },
    [ingestEntries],
  );

  const openSpaceWithSecret = useCallback(
    async (secret: string): Promise<string | null> => {
      setBusy(true);
      setError(null);
      try {
        const store = storeRef.current ?? (await getLoomStore());
        storeRef.current = store;
        const row = await ensureSpaceRow(store, secret);
        secretsRef.current.set(row.spaceId, secret);
        focusedSpaceIdRef.current = row.spaceId;
        setFocusedSecret(secret);
        setFocusedSpaceId(row.spaceId);
        replaceUrlWithSpace(secret);
        if (wrapKey && !row.wrappedSecret) {
          const wrapped = await wrapSpaceSecret(wrapKey, secret);
          await store.putSpace({ ...row, wrappedSecret: wrapped });
        }
        await clearUnread(store, row.spaceId);
        await trimSpaceMessages(store, row.spaceId);
        setMessages([]);
        messagesRef.current = [];
        await loadMessages(row.spaceId, secret);
        const stored = await store.listMessages(row.spaceId);
        await noteSpaceAuthors(
          store,
          row.spaceId,
          stored.map((m) => m.author),
        );
        await ensureSync(row.spaceId, secret);
        setScreen('space');
        await refreshSpaces();
        return secret;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open space');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [ensureSync, loadMessages, refreshSpaces, wrapKey],
  );

  useEffect(() => {
    const warmIds = pickWarmSpaceIds(spaces, {
      focusedSpaceId,
      hasSecret: (id) => secretsRef.current.has(id),
    });
    const warmSet = new Set(warmIds);
    for (const id of [...syncRef.current.keys()]) {
      if (!warmSet.has(id)) stopSync(id);
    }
    for (const id of warmIds) {
      const secret = secretsRef.current.get(id);
      if (secret) void ensureSync(id, secret);
    }
  }, [ensureSync, focusedSpaceId, spaces, stopSync]);

  useEffect(() => {
    if (!vault || !unlocked) return;
    void (async () => {
      storeRef.current = await getLoomStore();
      await refreshSpaces();
      const fromUrl = parseSpaceSecretFromLocation();
      if (fromUrl) {
        setSpaceInput(fromUrl);
        await openSpaceWithSecret(fromUrl);
      }
    })();
  }, [vault, unlocked, refreshSpaces, openSpaceWithSecret]);

  useEffect(() => {
    return () => {
      for (const id of [...syncRef.current.keys()]) stopSync(id);
    };
  }, [stopSync]);

  const applyVaultKey = useCallback(
    async (vaultKey: string, persistSession: boolean) => {
      const store = storeRef.current ?? (await getLoomStore());
      storeRef.current = store;
      const meta = await store.getDeviceKeyMeta();
      if (!meta) throw new Error('No vault key on this browser');
      const key = await unlockDeviceKey(vaultKey, meta);
      setWrapKey(key);
      await loadRememberedSecrets(key, await store.listSpaces(), secretsRef.current);
      if (persistSession) writeVaultSessionKey(vaultKey);
      await refreshSpaces();
    },
    [refreshSpaces],
  );

  // Restore session after reload (stay signed in until Log out).
  useEffect(() => {
    if (!vault?.hasDeviceKey || wrapKey) return;
    const sessionKey = readVaultSessionKey();
    if (!sessionKey) return;
    void (async () => {
      try {
        await applyVaultKey(sessionKey, false);
      } catch {
        clearVaultSession();
        setScreen('unlock');
      }
    })();
  }, [vault, wrapKey, applyVaultKey]);

  /** Name only — use the app without a vault key. */
  const onContinueWithoutVault = useCallback(
    async (name: string) => {
      setBusy(true);
      setError(null);
      try {
        storeRef.current = await getLoomStore();
        const rec = createVaultRecord(name, false);
        writeVault(rec);
        localStorage.setItem('ogma.displayName', name.trim());
        setVault(rec);
        setWrapKey(null);
        setScreen('chats');
        await refreshSpaces();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not continue');
      } finally {
        setBusy(false);
      }
    },
    [refreshSpaces],
  );

  /** Create vault: name + new vault key (shown once). */
  const onCreateVault = useCallback(
    async (name: string) => {
      setBusy(true);
      setError(null);
      try {
        const store = await getLoomStore();
        storeRef.current = store;
        const vaultKey = generateVaultKey();
        const meta = await createDeviceKeyMeta(vaultKey);
        await store.setDeviceKeyMeta(meta);
        setWrapKey(await unlockDeviceKey(vaultKey, meta));
        writeVaultSessionKey(vaultKey);
        const rec = createVaultRecord(name, true);
        writeVault(rec);
        localStorage.setItem('ogma.displayName', name.trim());
        setVault(rec);
        setReveal({
          kind: 'vault',
          secret: vaultKey,
          why: 'Save this vault key to open this vault later (after Log out, or to confirm you have it). You stay signed in here until you log out. Ogma cannot recover the key.',
        });
        setScreen('reveal');
        await refreshSpaces();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not create vault');
      } finally {
        setBusy(false);
      }
    },
    [refreshSpaces],
  );

  /** Opt-in vault key from Settings (profile already exists). */
  const onEnableVault = useCallback(async () => {
    if (!vault) return;
    setBusy(true);
    setError(null);
    try {
      const store = storeRef.current ?? (await getLoomStore());
      storeRef.current = store;
      const vaultKey = generateVaultKey();
      const meta = await createDeviceKeyMeta(vaultKey);
      await store.setDeviceKeyMeta(meta);
      setWrapKey(await unlockDeviceKey(vaultKey, meta));
      writeVaultSessionKey(vaultKey);
      const rec = { ...vault, hasDeviceKey: true };
      writeVault(rec);
      setVault(rec);
      setReveal({
        kind: 'vault',
        secret: vaultKey,
        why: 'Save this vault key to retrieve your chats later (new browser, or after Log out). You stay signed in here until you log out. Ogma cannot recover the key.',
      });
      setScreen('reveal');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create vault key');
    } finally {
      setBusy(false);
    }
  }, [vault]);

  /** Whether this browser already has a vault key (for Open vault). */
  const onProbeVault = useCallback(async () => {
    const store = storeRef.current ?? (await getLoomStore());
    storeRef.current = store;
    return Boolean(await store.getDeviceKeyMeta());
  }, []);

  /** Open vault already stored on this browser. */
  const onOpenVault = useCallback(async () => {
    setError(null);
    const store = storeRef.current ?? (await getLoomStore());
    storeRef.current = store;
    const meta = await store.getDeviceKeyMeta();
    if (!meta) {
      setError('No vault on this browser yet. Create one with a name, or close and Continue.');
      return;
    }
    const existing = readVault();
    if (!existing) {
      const name = localStorage.getItem('ogma.displayName')?.trim() || 'Vault';
      const rec = createVaultRecord(name, true);
      writeVault(rec);
      setVault(rec);
    } else if (!existing.hasDeviceKey) {
      const rec = { ...existing, hasDeviceKey: true };
      writeVault(rec);
      setVault(rec);
    }
    setScreen('unlock');
  }, []);

  const onUnlockVault = useCallback(
    async (vaultKey: string) => {
      setBusy(true);
      setError(null);
      try {
        await applyVaultKey(vaultKey, true);
        setScreen('chats');
      } catch {
        setError('Wrong vault key');
      } finally {
        setBusy(false);
      }
    },
    [applyVaultKey],
  );

  const onLogout = useCallback(() => {
    for (const id of [...syncRef.current.keys()]) stopSync(id);
    secretsRef.current.clear();
    clearVaultSession();
    setWrapKey(null);
    setFocusedSecret(null);
    setFocusedSpaceId(null);
    focusedSpaceIdRef.current = null;
    setMessages([]);
    setError(null);
    setScreen('unlock');
  }, [stopSync]);

  const onSwitchVault = useCallback(() => {
    for (const id of [...syncRef.current.keys()]) stopSync(id);
    secretsRef.current.clear();
    clearVaultSession();
    clearLocalVaultRecord();
    setVault(null);
    setWrapKey(null);
    setReveal(null);
    setFocusedSecret(null);
    setFocusedSpaceId(null);
    focusedSpaceIdRef.current = null;
    setMessages([]);
    setSpaces([]);
    setError(null);
    setScreen('vault');
  }, [stopSync]);

  const onRenameVault = useCallback((name: string) => {
    setError(null);
    try {
      setVault(applyVaultRename(name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not rename');
    }
  }, []);

  const onExport = useCallback(async () => {
    await exportVaultFile(storeRef.current);
  }, []);

  const onImportFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        await importVaultFile(storeRef.current, file);
        await refreshSpaces();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Import failed');
      }
    },
    [refreshSpaces],
  );

  const onRevealContinue = useCallback(async () => {
    const current = reveal;
    setReveal(null);
    if (current?.kind === 'space' && current.spaceSecret) {
      await openSpaceWithSecret(current.spaceSecret);
      return;
    }
    setScreen('chats');
  }, [openSpaceWithSecret, reveal]);

  const partitioned = useMemo(() => partitionSpaces(spaces), [spaces]);
  const focusedRow = spaces.find((s) => s.spaceId === focusedSpaceId) ?? null;

  return {
    vault,
    screen,
    setScreen,
    reveal,
    displayName,
    recent: partitioned.recent,
    archived: partitioned.archived,
    spaceInput,
    setSpaceInput,
    busy,
    error,
    unlocked,
    inviteUrl: focusedSecret ? spaceShareUrl(focusedSecret) : null,
    /** Space capability secret for the open chat (Call derives Thread room from this). */
    focusedSecret,
    spaceTitle: focusedRow ? displaySpaceLabel(focusedRow, displayName) : 'Space',
    messages,
    hasMoreOlder,
    loadingOlder,
    onLoadOlder: async () => {
      if (!focusedSecret || !focusedSpaceId || loadingOlder) return;
      setLoadingOlder(true);
      try {
        const store = storeRef.current ?? (await getLoomStore());
        const shown = messagesRef.current;
        const shownIds = new Set(shown.map((m) => m.id));
        const before = shown[0] ? { ts: shown[0].ts, id: shown[0].id } : null;
        const batch = pickColdBatch(
          await store.listColdMessages(focusedSpaceId),
          before,
          shownIds,
        );
        if (batch.length === 0) {
          setHasMoreOlder(false);
          return;
        }
        const older = await decryptRows(focusedSecret, batch);
        const next = [...older, ...shown].sort((a, b) =>
          a.ts !== b.ts ? a.ts - b.ts : a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
        );
        setMessages(next);
        await refreshHasMoreOlder(focusedSpaceId, next);
      } finally {
        setLoadingOlder(false);
      }
    },
    onContinueWithoutVault,
    onCreateVault,
    onProbeVault,
    onOpenVault,
    onEnableVault,
    onUnlockVault,
    onLogout,
    onSwitchVault,
    hasVaultKey: Boolean(vault?.hasDeviceKey),
    onRenameVault,
    onExport,
    onImportFile,
    onRevealContinue,
    onCreateSpace: () => {
      const spaceSecret = createSpaceSecret();
      setReveal({
        kind: 'space',
        secret: spaceShareUrl(spaceSecret),
        spaceSecret,
        why: 'Anyone with this invite can read this chat. Share it only with people you trust.',
      });
      setScreen('reveal');
    },
    /** New Loom space (no invite reveal) — used when Call starts chat + Thread together. */
    createAndOpenSpace: (): Promise<string | null> =>
      openSpaceWithSecret(createSpaceSecret()),
    onJoinSpace: () => {
      const secret = extractSpaceSecret(spaceInput);
      if (!secret) {
        setError('Paste an invite link');
        return;
      }
      void openSpaceWithSecret(secret);
    },
    onOpenSpace: async (spaceId: string) => {
      let secret = secretsRef.current.get(spaceId);
      if (!secret && wrapKey) {
        const store = storeRef.current ?? (await getLoomStore());
        const row = await store.getSpace(spaceId);
        if (row?.wrappedSecret) {
          try {
            secret = await unwrapSpaceSecret(wrapKey, row.wrappedSecret);
            secretsRef.current.set(spaceId, secret);
          } catch {
            setError('Paste the invite link to open this chat');
            return;
          }
        }
      }
      if (!secret) {
        setError('Paste the invite link to open this chat');
        return;
      }
      await openSpaceWithSecret(secret);
    },
    onArchive: async (spaceId: string) => {
      const store = storeRef.current ?? (await getLoomStore());
      await setSpaceStatus(store, spaceId, 'archived');
      stopSync(spaceId);
      await refreshSpaces();
    },
    onUnarchive: async (spaceId: string) => {
      const store = storeRef.current ?? (await getLoomStore());
      await setSpaceStatus(store, spaceId, 'recent');
      await refreshSpaces();
    },
    onBackToChats: () => {
      focusedSpaceIdRef.current = null;
      setFocusedSpaceId(null);
      setFocusedSecret(null);
      setMessages([]);
      messagesRef.current = [];
      setHasMoreOlder(false);
      setScreen('chats');
      void refreshSpaces();
    },
    onSend: async (text: string) => {
      if (!focusedSecret || !focusedSpaceId) return;
      const env = await sealEnvelope(focusedSecret, text, displayName);
      await ingestEntries(focusedSpaceId, [env], false);
      await syncRef.current.get(focusedSpaceId)?.sendEntries([env]);
      await loadMessages(focusedSpaceId, focusedSecret);
    },
    onCopyInvite: async () => {
      if (!focusedSecret) {
        return { ok: false as const, reason: 'failed' as const, url: '' };
      }
      return shareRoomLink(spaceShareUrl(focusedSecret));
    },
  };
}
