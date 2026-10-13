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

// Whole calendar days between two moments, in the phone's time zone: 22:00 yesterday is
// "yesterday" at 23:00 today even though only 25 hours passed.
function calendarDaysBetween(then: Date, now: Date) {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(now) - startOf(then)) / (24 * HOUR));
}

export function relativeTime(then: Date, now: Date = new Date()): RelativeTime {
  const diff = now.getTime() - then.getTime();

  // Anything in the future counts as "now": the entry's time comes from the server and the phone's
  // clock can lag behind it, by seconds or even minutes.
  if (diff < MINUTE) return { unit: 'now' };
  if (diff < HOUR) return { unit: 'minutes', count: Math.floor(diff / MINUTE) };

  const days = calendarDaysBetween(then, now);
  if (days <= 0) return { unit: 'hours', count: Math.floor(diff / HOUR) }; // earlier today
  if (days === 1) return { unit: 'yesterday' };
  if (days < 7) return { unit: 'days', count: days };
  return { unit: 'date' };
}
