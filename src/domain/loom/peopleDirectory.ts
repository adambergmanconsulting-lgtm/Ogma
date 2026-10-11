import { verifyPersonCard } from './personCard';
import type { PersonCardWire } from './types';

const KEY = 'ogma.people.v1';
const ACTIVE_KEY = 'ogma.appearActive';
const CAP = 100;

export type KnownPerson = {
  name: string;
  personPublicB64: string;
  boxPublicB64: string;
  seenAt: number;
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function subscribePeople(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function readPeople(): KnownPerson[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isKnownPerson);
  } catch {
    return [];
  }
}

function isKnownPerson(value: unknown): value is KnownPerson {
  if (!value || typeof value !== 'object') return false;
  const row = value as KnownPerson;
  return (
    typeof row.name === 'string' &&
    typeof row.personPublicB64 === 'string' &&
    typeof row.boxPublicB64 === 'string' &&
    typeof row.seenAt === 'number'
  );
}

export function cardForName(people: KnownPerson[], name: string): KnownPerson | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return people.find((p) => p.name.trim().toLowerCase() === key) ?? null;
}

/** Keep a verified card. Same person id replaces the older row. */
export async function rememberPersonCard(card: PersonCardWire, now = Date.now()): Promise<boolean> {
  if (!(await verifyPersonCard(card))) return false;
  const next: KnownPerson = {
    name: card.name.trim(),
    personPublicB64: card.personPublicB64,
    boxPublicB64: card.boxPublicB64,
    seenAt: now,
  };
  const kept = readPeople().filter((p) => p.personPublicB64 !== next.personPublicB64);
  kept.push(next);
  kept.sort((a, b) => b.seenAt - a.seenAt);
  localStorage.setItem(KEY, JSON.stringify(kept.slice(0, CAP)));
  emit();
  return true;
}

/** Default on. Off means this app does not sit in its invite room. */
export function readAppearActive(): boolean {
  return localStorage.getItem(ACTIVE_KEY) !== '0';
}

export function writeAppearActive(on: boolean): void {
  localStorage.setItem(ACTIVE_KEY, on ? '1' : '0');
  emit();
}
