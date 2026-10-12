// How long ago something happened, as data. The component turns it into text (so the words
// live in the translations). Done by hand because Hermes may not have Intl.RelativeTimeFormat.
export type RelativeTime =
  | { unit: 'now' }
  | { unit: 'minutes'; count: number }
  | { unit: 'hours'; count: number }
  | { unit: 'yesterday' }
  | { unit: 'days'; count: number }
  | { unit: 'date' }; // too old to say "ago": show the date

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(then: Date, now: Date = new Date()): RelativeTime {
  const diff = now.getTime() - then.getTime();

  // a clock a few seconds off can put "then" slightly in the future: that is still "now"
  if (diff < MINUTE) return { unit: 'now' };
  if (diff < HOUR) return { unit: 'minutes', count: Math.floor(diff / MINUTE) };
  if (diff < DAY) return { unit: 'hours', count: Math.floor(diff / HOUR) };
  if (diff < 2 * DAY) return { unit: 'yesterday' };
  if (diff < 7 * DAY) return { unit: 'days', count: Math.floor(diff / DAY) };
  return { unit: 'date' };
}
