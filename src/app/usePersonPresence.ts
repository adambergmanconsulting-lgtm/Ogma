import { useCallback, useEffect, useRef, useState } from 'react';
import { createSpaceSecret } from '../domain/signaling/room';
import { getLoomStore } from '../domain/loom/store';
import {
  cardForName,
  readAppearActive,
  readPeople,
  subscribePeople,
  writeAppearActive,
  type KnownPerson,
} from '../domain/loom/peopleDirectory';
import { loadPersonMaterial, signHere, signPersonCard, type PersonMaterial } from '../domain/loom/personCard';
import { attachPersonId } from '../domain/loom/personKey';
import { openSealedForPerson, sealForPerson } from '../domain/loom/personBox';
import { openPersonRoom, type PersonRoom } from '../domain/loom/personPresence';
import type { PersonCardWire } from '../domain/loom/types';

const WATCH_CAP = 8;

export type ReachablePerson = {
  personPublicB64: string;
  name: string;
  active: boolean;
};

/**
 * This vault's invite room, plus a watch on people already met.
 * Active means their open tab is in that room. Hidden tabs are not active.
 */
export function usePersonPresence(opts: {
  wrapKey: CryptoKey | null;
  displayName: string;
  setOwnCard: (card: PersonCardWire | null) => void;
  onOpenSecret: (secret: string) => void | Promise<unknown>;
}) {
  const [people, setPeople] = useState<KnownPerson[]>(() => readPeople());
  const [appearActive, setAppearActive] = useState(() => readAppearActive());
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );
  const [selfId, setSelfId] = useState<string | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const materialRef = useRef<PersonMaterial | null>(null);
  const roomsRef = useRef(new Map<string, PersonRoom>());
  const onOpenRef = useRef(opts.onOpenSecret);
  onOpenRef.current = opts.onOpenSecret;

  useEffect(() => subscribePeople(() => setPeople(readPeople())), []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    let cancel = false;
    if (!opts.wrapKey) {
      materialRef.current = null;
      setSelfId(null);
      opts.setOwnCard(null);
      return;
    }
    const wrapKey = opts.wrapKey;
    void (async () => {
      try {
        const store = await getLoomStore();
        let meta = await store.getDeviceKeyMeta();
        if (!meta || cancel) return;
        let material = await loadPersonMaterial(wrapKey, meta);
        if (!material) {
          await attachPersonId(store, wrapKey, meta);
          meta = await store.getDeviceKeyMeta();
          if (!meta || cancel) return;
          material = await loadPersonMaterial(wrapKey, meta);
        }
        if (!material || cancel) return;
        materialRef.current = material;
        setSelfId(material.personPublicB64);
        opts.setOwnCard(await signPersonCard(material, opts.displayName));
      } catch {
        if (!cancel) opts.setOwnCard(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [opts.wrapKey, opts.displayName, opts.setOwnCard]);

  useEffect(() => {
    let cancel = false;
    const opened: PersonRoom[] = [];
    void (async () => {
      if (!tabVisible) return;
      const jobs: { id: string; role: 'self' | 'watch' }[] = [];
      if (selfId && appearActive) jobs.push({ id: selfId, role: 'self' });
      for (const person of people) {
        if (person.personPublicB64 === selfId) continue;
        if (jobs.length >= WATCH_CAP + (selfId && appearActive ? 1 : 0)) break;
        jobs.push({ id: person.personPublicB64, role: 'watch' });
      }
      for (const job of jobs) {
        if (cancel) return;
        try {
          const room = await openPersonRoom({
            personPublicB64: job.id,
            announce:
              job.role === 'self'
                ? () => {
                    const material = materialRef.current;
                    return material ? signHere(material) : Promise.resolve(null);
                  }
                : undefined,
            onActive:
              job.role === 'watch'
                ? (on) => setActive((prev) => ({ ...prev, [job.id]: on }))
                : undefined,
            onInvite:
              job.role === 'self'
                ? (sealed) => {
                    const box = materialRef.current?.boxPrivate;
                    if (!box) return;
                    void openSealedForPerson(box, sealed)
                      .then((secret) => onOpenRef.current(secret))
                      .catch(() => undefined);
                  }
                : undefined,
          });
          if (cancel) {
            room.leave();
            return;
          }
          opened.push(room);
          roomsRef.current.set(job.id, room);
        } catch {
          // The meeting room did not open. That person stays not active.
        }
      }
    })();
    return () => {
      cancel = true;
      for (const room of opened) room.leave();
      roomsRef.current.clear();
      setActive({});
    };
  }, [people, appearActive, tabVisible, selfId]);

  const toggleAppearActive = useCallback(() => {
    const next = !readAppearActive();
    writeAppearActive(next);
    setAppearActive(next);
  }, []);

  const invite = useCallback(
    async (personPublicB64: string, spaceSecret?: string) => {
      const card = people.find((p) => p.personPublicB64 === personPublicB64);
      const room = roomsRef.current.get(personPublicB64);
      if (!card || !active[personPublicB64] || !room) return;
      const existing = spaceSecret?.trim();
      const secret = existing || createSpaceSecret();
      await room.sendInvite(await sealForPerson(card.boxPublicB64, secret));
      if (!existing) await onOpenRef.current(secret);
    },
    [people, active],
  );

  const others: ReachablePerson[] = people
    .filter((p) => p.personPublicB64 !== selfId)
    .map((p) => ({
      personPublicB64: p.personPublicB64,
      name: p.name,
      active: Boolean(active[p.personPublicB64]),
    }));

  return {
    selfPersonId: selfId,
    appearActive,
    tabVisible,
    people: others,
    cardForName: (name: string) => cardForName(people, name),
    toggleAppearActive,
    invite,
  };
}
