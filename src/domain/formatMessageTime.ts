/** Chat log timestamp — local, compact (time today; date + time otherwise). */
export function formatMessageTime(
  at: number,
  now = Date.now(),
  locale?: string,
): string {
  if (!at || at <= 0) return '';
  const d = new Date(at);
  const n = new Date(now);
  const time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  const sameDay =
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate();
  if (sameDay) return time;
  if (d.getFullYear() === n.getFullYear()) {
    const day = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${day}, ${time}`;
  }
  const day = d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${day}, ${time}`;
}
