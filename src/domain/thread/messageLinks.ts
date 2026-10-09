import {
  parseRoomIdFromLocation,
  parseSpaceSecretFromLocation,
} from '../signaling/room';

export type MessageTextPart = { kind: 'text'; text: string };

export type MessageLinkPart = {
  kind: 'link';
  href: string;
  label: string;
  /** Full URL for hover / screen readers when label is shortened. */
  title: string;
  external: boolean;
};

export type MessagePart = MessageTextPart | MessageLinkPart;

/** http(s) URLs; trailing sentence punctuation is stripped from the match. */
const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi;

const TRAILING_PUNCT = /[),.!?;:]+$/;

function trimUrlMatch(raw: string): { href: string; trailing: string } {
  let href = raw;
  let trailing = '';
  const m = href.match(TRAILING_PUNCT);
  if (m) {
    trailing = m[0];
    href = href.slice(0, -trailing.length);
  }
  return { href, trailing };
}

function shortSecret(secret: string): string {
  if (secret.length <= 10) return secret;
  return `${secret.slice(0, 4)}…${secret.slice(-4)}`;
}

function shortenGeneric(href: string): string {
  try {
    const u = new URL(href);
    let s = `${u.host}${u.pathname}${u.search}${u.hash}`;
    if (s.endsWith('/') && s.length > u.host.length + 1) s = s.slice(0, -1);
    if (s.length <= 48) return s;
    return `${s.slice(0, 28)}…${s.slice(-12)}`;
  } catch {
    return href.length <= 48 ? href : `${href.slice(0, 28)}…${href.slice(-12)}`;
  }
}

function describeLink(href: string, appOrigin: string | undefined): MessageLinkPart {
  const title = href;
  try {
    const url = new URL(href);
    const room = parseRoomIdFromLocation(url);
    if (room) {
      const sameOrigin = Boolean(appOrigin && url.origin === appOrigin);
      return {
        kind: 'link',
        href,
        label: `Invite link (${shortSecret(room)})`,
        title,
        external: !sameOrigin,
      };
    }
    const space = parseSpaceSecretFromLocation(url);
    if (space) {
      const sameOrigin = Boolean(appOrigin && url.origin === appOrigin);
      return {
        kind: 'link',
        href,
        label: `Invite link (${shortSecret(space)})`,
        title,
        external: !sameOrigin,
      };
    }
    const sameOrigin = Boolean(appOrigin && url.origin === appOrigin);
    return {
      kind: 'link',
      href,
      label: shortenGeneric(href),
      title,
      external: !sameOrigin,
    };
  } catch {
    return {
      kind: 'link',
      href,
      label: shortenGeneric(href),
      title,
      external: true,
    };
  }
}

/** Split message text into plain runs and safe http(s) links for display. */
export function splitMessageLinks(
  text: string,
  appOrigin: string | undefined = undefined,
): MessagePart[] {
  if (!text) return [];

  const parts: MessagePart[] = [];
  let last = 0;
  URL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_RE.exec(text)) !== null) {
    const start = match.index;
    if (start > last) {
      parts.push({ kind: 'text', text: text.slice(last, start) });
    }
    const { href, trailing } = trimUrlMatch(match[0]);
    if (href) {
      parts.push(describeLink(href, appOrigin));
    }
    if (trailing) {
      parts.push({ kind: 'text', text: trailing });
    }
    last = start + match[0].length;
  }
  if (last < text.length) {
    parts.push({ kind: 'text', text: text.slice(last) });
  }
  return parts.length ? parts : [{ kind: 'text', text }];
}
