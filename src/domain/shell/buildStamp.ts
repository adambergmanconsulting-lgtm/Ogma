/** Injected at Vite build / dev start (ISO-8601 UTC). */
declare const __BUILD_TIME__: string | undefined;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const BUILD_TIME_ISO =
  typeof __BUILD_TIME__ === 'string' && __BUILD_TIME__.trim() ? __BUILD_TIME__.trim() : '';

/** Quiet Settings footer: `Last updated · 11 Oct 2026` (UTC day). */
export function formatBuildStamp(iso: string): string | null {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `Last updated · ${day} ${month} ${year}`;
}

export function settingsBuildStampLabel(
  iso: string = BUILD_TIME_ISO,
): string | null {
  return formatBuildStamp(iso);
}
