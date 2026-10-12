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

  // a clock a few seconds off can put "then" slightly in the future: that is still "now"
  if (diff < MINUTE) return { unit: 'now' };
  if (diff < HOUR) return { unit: 'minutes', count: Math.floor(diff / MINUTE) };

  const days = calendarDaysBetween(then, now);
  if (days <= 0) return { unit: 'hours', count: Math.floor(diff / HOUR) }; // earlier today
  if (days === 1) return { unit: 'yesterday' };
  if (days < 7) return { unit: 'days', count: days };
  return { unit: 'date' };
}
