import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDeviceKeyMeta,
  loadRememberedSecrets,
  unlockDeviceKey,
  unwrapSpaceSecret,
} from '../domain/loom/deviceKey';
import {
  SPACE_SECRET_MISSING,
  hydrateLocalSecrets,
  persistSpaceSecret,
  secretFromSpaceRow,
  wrapStoredSpaceSecrets,
} from '../domain/loom/spaceSecretAccess';
import {
  compareEnvelopes,
  openPayload,
  previewFromPayload,
  sealJoin,
  sealSystemEvent,
  sealTextMessage,
} from '../domain/loom/envelope';
import {
  hasUnloadableCold,
  pickColdBatch,
  trimSpaceMessages,
} from '../domain/loom/retention';
import { localSizeLevel } from '../domain/loom/size';
import {
  backfillSpaceAuthors,
  bumpLastCall,
  bumpLastMessage,
  bumpUnread,
  chatTabLabel,
  clearUnread,
  ensureSpaceRow,
  noteSpaceAuthors,
  sortSpacesRecentFirst,
  spacePeopleNames,
} from '../domain/loom/spaceIndex';
import { eraseLocalVaultData } from '../domain/loom/eraseLocalVault';
import { rememberPersonCard } from '../domain/loom/peopleDirectory';
import { attachPersonId } from '../domain/loom/personKey';
import { getLoomStore } from '../domain/loom/store';
import type { LoomStore } from '../domain/loom/storePort';
import { openLoomSync, type LoomSyncSession } from '../domain/loom/sync';
import type { LoomEnvelope, PersonCardWire, SpaceIndexRow, StoredMessage } from '../domain/loom/types';
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
import {
  readChatSoundEnabled,
  writeChatSoundEnabled,
} from '../domain/loom/chatSoundSettings';
import { playNewMessageSound } from '../domain/loom/notifySound';
import { pulseChatAlert, stopTabAlert } from '../domain/shell/tabAlert';
import { pickWarmSpaceIds } from '../domain/loom/warm';
import {
  clearCapabilityFromUrl,
  createSpaceSecret,
  replaceUrlWithSpace,
  spaceShareUrl,
} from '../domain/signaling/room';
import { extractInviteSecrets, shareRoomLink, type InviteSecrets } from '../domain/signaling/share';
import type { SpaceMessageView } from '../components/SpaceView';
import type { LoomSystemKind } from '../domain/loom/systemLine';
import { useLoomUrlOpen } from './useLoomUrlOpen';

/** Ephemeral Call ring handlers bound from the app shell (warm Loom sync). */
export type LoomCallRingHandlers = {
  getCallAnnounce: (spaceId: string) => string | null;
  onCall: (spaceId: string, author: string, ts: number) => void;
  onCallEnd: (spaceId: string) => void;
};

export type LoomScreen = 'vault' | 'unlock' | 'reveal' | 'home' | 'space' | 'thread';

/** Vault key shown once after Create / Add vault key. Space invites live on the open chat. */
export type RevealState = {
  kind: 'vault';
  secret: string;
  why: string;
};

function initialScreen(): LoomScreen {
  const v = readVault();
  if (!v) return 'vault';
  // Stay on home when session exists; restore wrap key in effect.
  if (v.hasDeviceKey && !readVaultSessionKey()) return 'unlock';
  return 'home';
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
  const [personId, setPersonId] = useState<string | null>(null);
  const [focusedSecret, setFocusedSecret] = useState<string | null>(null);
  const [focusedSpaceId, setFocusedSpaceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SpaceMessageView[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [chatSoundEnabled, setChatSoundEnabled] = useState(() => readChatSoundEnabled());

  const secretsRef = useRef(new Map<string, string>());
  const syncRef = useRef(new Map<string, LoomSyncSession>());
  const ownCardRef = useRef<PersonCardWire | null>(null);
  const callRingRef = useRef<LoomCallRingHandlers | null>(null);
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
    let next = await store.listSpaces();
    hydrateLocalSecrets(next, secretsRef.current);
    // Persist any in-memory invites so Call/Chat reopen after refresh (no-vault + migrate).
    for (const [spaceId, secret] of secretsRef.current) {
      const row = next.find((r) => r.spaceId === spaceId);
      if (!row) continue;
      if (row.localSecret || row.wrappedSecret) continue;
      await persistSpaceSecret(store, row, secret, wrapKey);
    }
    next = await store.listSpaces();
    hydrateLocalSecrets(next, secretsRef.current);
    setSpaces(next);
    await localSizeLevel(store);
  }, [wrapKey]);

  const decryptRows = useCallback(
    async (secret: string, rows: StoredMessage[]): Promise<SpaceMessageView[]> => {
      const views: SpaceMessageView[] = [];
      for (const row of rows) {
        try {
          const payload = await openPayload(secret, row);
          const base = {
            id: row.id,
            author: row.author,
            ts: row.ts,
            self: row.author === displayName,
          };
          views.push(
            payload.kind === 'text'
              ? { ...base, kind: 'text', text: payload.text }
              : { ...base, kind: payload.kind },
          );
        } catch {
          // skip
        }
      }
      return views;
    },
    [displayName],
  );

  const authorHasJoin = useCallback(
    async (spaceId: string, secret: string, author: string): Promise<boolean> => {
      const store = storeRef.current ?? (await getLoomStore());
      const self = author.trim().toLowerCase();
      if (!self) return true;
      const rows = [
        ...(await store.listMessages(spaceId)),
        ...(await store.listColdMessages(spaceId)),
      ];
      for (const row of rows) {
        if (row.author.trim().toLowerCase() !== self) continue;
        try {
          const payload = await openPayload(secret, row);
          if (payload.kind === 'join') return true;
        } catch {
          // skip
        }
      }
      return false;
    },
    [],
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
      await noteSpaceAuthors(
        store,
        spaceId,
        entries.map((e) => e.author),
      );
      const viewing = focusedSpaceIdRef.current === spaceId;
      const secret = secretsRef.current.get(spaceId);
      const unreadDelta = fromPeer && !viewing ? added : 0;
      // All-list activity: text only (joins update authors/unread, not lastMessageAt).
      let textTip: LoomEnvelope | null = null;
      let textPreview: string | undefined;
      if (secret) {
        for (const e of entries) {
          try {
            const payload = await openPayload(secret, e);
            if (payload.kind !== 'text') continue;
            if (!textTip || compareEnvelopes(e, textTip) > 0) {
              textTip = e;
              textPreview = previewFromPayload(e.author, payload);
            }
          } catch {
            // skip undecryptable
          }
        }
      }
      if (textTip) {
        await bumpLastMessage(store, spaceId, textTip.ts, unreadDelta, textPreview);
      } else if (unreadDelta > 0) {
        await bumpUnread(store, spaceId, unreadDelta);
      }
      if (viewing) {
        await clearUnread(store, spaceId);
        if (secret) await loadMessages(spaceId, secret);
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          stopTabAlert();
        }
      }
      await refreshSpaces();
      const tabHidden =
        typeof document !== 'undefined' && document.visibilityState === 'hidden';
      if (fromPeer && chatSoundEnabled && (!viewing || tabHidden)) {
        playNewMessageSound();
        pulseChatAlert();
      }
      await syncRef.current.get(spaceId)?.broadcastHave();
    },
    [chatSoundEnabled, loadMessages, refreshSpaces],
  );

  const setChatSoundEnabledPersist = useCallback((enabled: boolean) => {
    writeChatSoundEnabled(enabled);
    setChatSoundEnabled(enabled);
  }, []);

  const ensureSelfJoin = useCallback(
    async (spaceId: string, secret: string) => {
      const name = displayName.trim();
      if (!name) return;
      if (await authorHasJoin(spaceId, secret, name)) return;
      const env = await sealJoin(secret, name);
      await ingestEntries(spaceId, [env], false);
      await syncRef.current.get(spaceId)?.sendEntries([env]);
    },
    [authorHasJoin, displayName, ingestEntries],
  );

  const stopSync = useCallback((spaceId: string) => {
    syncRef.current.get(spaceId)?.leave();
    syncRef.current.delete(spaceId);
  }, []);

  const setOwnCard = useCallback((card: PersonCardWire | null) => {
    ownCardRef.current = card;
    for (const session of syncRef.current.values()) void session.sendCard();
  }, []);

  const setCallRingHandlers = useCallback((handlers: LoomCallRingHandlers | null) => {
    callRingRef.current = handlers;
  }, []);

  const ensureSync = useCallback(
    async (spaceId: string, secret: string) => {
      if (syncRef.current.has(spaceId)) return;
      const store = storeRef.current ?? (await getLoomStore());
      const session = await openLoomSync(secret, store, {
        onEntries: (entries) => void ingestEntries(spaceId, entries, true),
        onError: (message) => setError(message),
        onPeerCount: (n) => {
          if (n > 0) setError(null);
        },
        getOwnCard: () => ownCardRef.current,
        onCard: (card) => {
          void rememberPersonCard(card);
        },
        getCallAnnounce: () => callRingRef.current?.getCallAnnounce(spaceId) ?? null,
        onCall: (author, ts) => callRingRef.current?.onCall(spaceId, author, ts),
        onCallEnd: () => callRingRef.current?.onCallEnd(spaceId),
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
        await persistSpaceSecret(store, row, secret, wrapKey);
        focusedSpaceIdRef.current = row.spaceId;
        setFocusedSecret(secret);
        setFocusedSpaceId(row.spaceId);
        replaceUrlWithSpace(secret);
        stopTabAlert();
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
        await ensureSelfJoin(row.spaceId, secret);
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
    [ensureSelfJoin, ensureSync, loadMessages, refreshSpaces, wrapKey],
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

  const resumeLastSpace = useCallback(async (): Promise<string | null> => {
    const store = storeRef.current ?? (await getLoomStore());
    storeRef.current = store;
    const recent = sortSpacesRecentFirst(await store.listSpaces())[0];
    if (!recent) return null;
    let secret = secretFromSpaceRow(recent.spaceId, recent, secretsRef.current);
    if (!secret && wrapKey && recent.wrappedSecret) {
      try {
        secret = await unwrapSpaceSecret(wrapKey, recent.wrappedSecret);
        secretsRef.current.set(recent.spaceId, secret);
      } catch {
        return null;
      }
    }
    if (!secret) return null;
    secretsRef.current.set(recent.spaceId, secret);
    return openSpaceWithSecret(secret);
  }, [openSpaceWithSecret, wrapKey]);

  const readyStore = useCallback(async () => {
    storeRef.current = await getLoomStore();
  }, []);

  useLoomUrlOpen({
    vault,
    unlocked,
    focusedSecret,
    refreshSpaces,
    openSpaceWithSecret,
    resumeLastSpace,
    readyStore,
  });

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
      setPersonId(await attachPersonId(store, key, meta));
      const rows = await store.listSpaces();
      hydrateLocalSecrets(rows, secretsRef.current);
      await loadRememberedSecrets(key, rows, secretsRef.current);
      await wrapStoredSpaceSecrets(key, store, await store.listSpaces(), secretsRef.current);
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

  /** Create vault: name + new vault key (shown once). Erases any prior vault on this browser. */
  const onCreateVault = useCallback(
    async (name: string) => {
      setBusy(true);
      setError(null);
      try {
        const store = await getLoomStore();
        storeRef.current = store;
        await eraseLocalVaultData(store);
        secretsRef.current.clear();
        // Drop leftover ?room= / #space= so bootstrap does not skip the key reveal.
        clearCapabilityFromUrl();
        focusedSpaceIdRef.current = null;
        setFocusedSecret(null);
        setFocusedSpaceId(null);
        setMessages([]);
        const vaultKey = generateVaultKey();
        const meta = await createDeviceKeyMeta(vaultKey);
        await store.setDeviceKeyMeta(meta);
        const key = await unlockDeviceKey(vaultKey, meta);
        setWrapKey(key);
        setPersonId(await attachPersonId(store, key, meta));
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
      const key = await unlockDeviceKey(vaultKey, meta);
      setWrapKey(key);
      setPersonId(await attachPersonId(store, key, meta));
      writeVaultSessionKey(vaultKey);
      const rec = { ...vault, hasDeviceKey: true };
      writeVault(rec);
      setVault(rec);
      await wrapStoredSpaceSecrets(
        key,
        store,
        await store.listSpaces(),
        secretsRef.current,
      );
      setReveal({
        kind: 'vault',
        secret: vaultKey,
        why: 'Save this vault key to retrieve your chats later (new browser, or after Log out). You stay signed in here until you log out. Ogma cannot recover the key.',
      });
      setScreen('reveal');
      await refreshSpaces();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create vault key');
    } finally {
      setBusy(false);
    }
  }, [vault, refreshSpaces]);

  const onUnlockVault = useCallback(
    async (vaultKey: string) => {
      setBusy(true);
      setError(null);
      try {
        await applyVaultKey(vaultKey, true);
        setScreen('home');
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
    setPersonId(null);
    setFocusedSecret(null);
    setFocusedSpaceId(null);
    focusedSpaceIdRef.current = null;
    setMessages([]);
    setError(null);
    setScreen('unlock');
  }, [stopSync]);

  /**
   * Leave this vault and return to cold create.
   * Chats/device key are erased when Continue creates the new vault (not here),
   * so a fast Create cannot race a background wipe.
   */
  const onSwitchVault = useCallback(() => {
    for (const id of [...syncRef.current.keys()]) stopSync(id);
    secretsRef.current.clear();
    clearVaultSession();
    clearLocalVaultRecord();
    clearCapabilityFromUrl();
    setVault(null);
    setWrapKey(null);
    setPersonId(null);
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
    await exportVaultFile(storeRef.current, wrapKey);
  }, [wrapKey]);

  const onImportFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const store = storeRef.current ?? (await getLoomStore());
        storeRef.current = store;
        await importVaultFile(store, file);
        const rows = await store.listSpaces();
        hydrateLocalSecrets(rows, secretsRef.current);
        if (wrapKey) {
          await wrapStoredSpaceSecrets(wrapKey, store, rows, secretsRef.current);
        }
        await refreshSpaces();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Import failed');
      }
    },
    [refreshSpaces, wrapKey],
  );

  const onRevealContinue = useCallback(() => {
    setReveal(null);
    setScreen('home');
  }, []);

  /** All chats, newest activity first (no Hide / archive UI). */
  const chats = useMemo(() => sortSpacesRecentFirst(spaces), [spaces]);
  const focusedRow = spaces.find((s) => s.spaceId === focusedSpaceId) ?? null;

  return {
    vault,
    screen,
    setScreen,
    reveal,
    displayName,
    chats,
    spaceInput,
    setSpaceInput,
    busy,
    error,
    chatSoundEnabled,
    setChatSoundEnabled: setChatSoundEnabledPersist,
    unlocked,
    inviteUrl: focusedSecret ? spaceShareUrl(focusedSecret) : null,
    /** Space capability secret for the open chat (Call derives Thread room from this). */
    focusedSecret,
    focusedSpaceId,
    spaceSecret: (spaceId: string) => secretsRef.current.get(spaceId),
    spaceIdForSecret: (secret: string) => {
      for (const [id, sec] of secretsRef.current) {
        if (sec === secret) return id;
      }
      return null;
    },
    setCallRingHandlers,
    announceCall: (spaceId: string, author: string) => {
      void syncRef.current.get(spaceId)?.announceCall(author);
      void (async () => {
        const store = storeRef.current ?? (await getLoomStore());
        await bumpLastCall(store, spaceId);
        await refreshSpaces();
      })();
    },
    announceCallEnd: (spaceId: string) => {
      void syncRef.current.get(spaceId)?.announceCallEnd();
    },
    people: spacePeopleNames(focusedRow?.authors, displayName),
    /** Open-chat tab / list title for the focused space. */
    chatTitle: chatTabLabel(focusedRow, displayName),
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
    onCreateVault,
    onEnableVault,
    onUnlockVault,
    onLogout,
    onSwitchVault,
    hasVaultKey: Boolean(vault?.hasDeviceKey),
    personId,
    wrapKey,
    setOwnCard,
    onRenameVault,
    onExport,
    onImportFile,
    onRevealContinue,
    /** Land in the space immediately — invite lives on the space (not a dead-end reveal). */
    onCreateSpace: () => openSpaceWithSecret(createSpaceSecret()),
    /** Home **Join** paste — returns room/space for App to open Call lobby and/or chat. */
    onJoinSpace: (): InviteSecrets | null => {
      const invite = extractInviteSecrets(spaceInput);
      if (!invite.room && !invite.space) {
        setError('Paste an invite link');
        return null;
      }
      setError(null);
      setSpaceInput('');
      return invite;
    },
    /** Re-open a space by capability secret (e.g. return to a backgrounded Call). */
    onOpenSpaceSecret: (secret: string): Promise<string | null> => openSpaceWithSecret(secret),
    onOpenSpace: async (spaceId: string): Promise<string | null> => {
      const store = storeRef.current ?? (await getLoomStore());
      storeRef.current = store;
      const row = await store.getSpace(spaceId);
      let secret = secretFromSpaceRow(spaceId, row, secretsRef.current);
      if (!secret && wrapKey && row?.wrappedSecret) {
        try {
          secret = await unwrapSpaceSecret(wrapKey, row.wrappedSecret);
          secretsRef.current.set(spaceId, secret);
        } catch {
          setError(SPACE_SECRET_MISSING);
          return null;
        }
      }
      if (!secret) {
        setError(SPACE_SECRET_MISSING);
        return null;
      }
      secretsRef.current.set(spaceId, secret);
      return openSpaceWithSecret(secret);
    },
    /** Soft-nav / idle: clear open space; keep Call live via InCallBar. */
    onBackToHome: () => {
      focusedSpaceIdRef.current = null;
      setFocusedSpaceId(null);
      setFocusedSecret(null);
      setMessages([]);
      messagesRef.current = [];
      setHasMoreOlder(false);
      setSpaceInput('');
      clearCapabilityFromUrl();
      setScreen('home');
      void refreshSpaces();
    },
    resumeLastSpace,
    onSend: async (text: string) => {
      if (!focusedSecret || !focusedSpaceId) return;
      const env = await sealTextMessage(focusedSecret, text, displayName);
      await ingestEntries(focusedSpaceId, [env], false);
      await syncRef.current.get(focusedSpaceId)?.sendEntries([env]);
      await loadMessages(focusedSpaceId, focusedSecret);
    },
    /** Sealed system line (Call / screen share) into the open space log. */
    sealSystemLine: async (
      kind: Exclude<LoomSystemKind, 'join'>,
      spaceId?: string | null,
      secret?: string | null,
    ) => {
      const id = spaceId ?? focusedSpaceIdRef.current;
      const sec = secret ?? (id ? secretsRef.current.get(id) : undefined) ?? focusedSecret;
      const name = displayName.trim();
      if (!id || !sec || !name) return;
      const env = await sealSystemEvent(sec, kind, name);
      await ingestEntries(id, [env], false);
      await syncRef.current.get(id)?.sendEntries([env]);
    },
    onCopyInvite: async () => {
      if (!focusedSecret) {
        return { ok: false as const, reason: 'failed' as const, url: '' };
      }
      return shareRoomLink(spaceShareUrl(focusedSecret));
    },
  };
}
