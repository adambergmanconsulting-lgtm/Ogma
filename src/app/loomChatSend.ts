import { sealTextMessage } from '../domain/loom/envelope';
import type { LoomEnvelope } from '../domain/loom/types';

type Ingest = (spaceId: string, entries: LoomEnvelope[], fromPeer: boolean) => Promise<void>;

/** Seal a new text (or edit) and push it through local ingest + peer sync. */
export async function publishLoomText(opts: {
  secret: string;
  spaceId: string;
  text: string;
  author: string;
  replaces?: string;
  ingest: Ingest;
  sendEntries: (entries: LoomEnvelope[]) => Promise<void> | void;
  reload: () => Promise<void>;
}): Promise<void> {
  const body = opts.text.trim();
  if (!body) return;
  const env = await sealTextMessage(
    opts.secret,
    body,
    opts.author,
    Date.now(),
    undefined,
    opts.replaces ? { replaces: opts.replaces } : undefined,
  );
  await opts.ingest(opts.spaceId, [env], false);
  await opts.sendEntries([env]);
  await opts.reload();
}
