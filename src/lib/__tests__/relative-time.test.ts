import { relativeTime } from '../relative-time';

// LOCAL dates (year, month index, day, hour, minute, second): the rules are about the phone's
// calendar days, so the tests must not depend on the time zone of the machine running them.
const at = (day: number, hour: number, minute = 0, second = 0) =>
  new Date(2026, 9, day, hour, minute, second);

const NOW = at(12, 12, 0);

describe('relativeTime', () => {
  it('says "now" for less than a minute, even if the clock is a few seconds ahead', () => {
    expect(relativeTime(at(12, 12, 0), NOW)).toEqual({ unit: 'now' });
    expect(relativeTime(at(12, 12, 0, 5), NOW)).toEqual({ unit: 'now' });
    expect(relativeTime(at(12, 11, 59, 1), NOW)).toEqual({ unit: 'now' });
  });

  it('counts minutes up to an hour', () => {
    expect(relativeTime(at(12, 11, 59), NOW)).toEqual({ unit: 'minutes', count: 1 });
    expect(relativeTime(at(12, 11, 1), NOW)).toEqual({ unit: 'minutes', count: 59 });
  });

  it('counts hours earlier the same day', () => {
    expect(relativeTime(at(12, 11, 0), NOW)).toEqual({ unit: 'hours', count: 1 });
    expect(relativeTime(at(12, 0, 30), NOW)).toEqual({ unit: 'hours', count: 11 });
  });

  it('follows calendar days: yesterday is yesterday, however few hours ago', () => {
    expect(relativeTime(at(11, 23, 50), NOW)).toEqual({ unit: 'yesterday' });
    expect(relativeTime(at(11, 0, 5), NOW)).toEqual({ unit: 'yesterday' });
    // 25 hours ago, seen at 23:00, is still "yesterday"
    expect(relativeTime(at(11, 22, 0), at(12, 23, 0))).toEqual({ unit: 'yesterday' });
  });

  it('keeps minutes across midnight when it was very recent', () => {
    expect(relativeTime(at(11, 23, 50), at(12, 0, 10))).toEqual({ unit: 'minutes', count: 20 });
  });

  it('counts calendar days up to a week, then gives the date', () => {
    expect(relativeTime(at(10, 23, 59), NOW)).toEqual({ unit: 'days', count: 2 });
    expect(relativeTime(at(10, 9, 0), at(12, 23, 0))).toEqual({ unit: 'days', count: 2 });
    expect(relativeTime(at(6, 12, 0), NOW)).toEqual({ unit: 'days', count: 6 });
    expect(relativeTime(at(5, 12, 0), NOW)).toEqual({ unit: 'date' });
    expect(relativeTime(new Date(2026, 6, 1), NOW)).toEqual({ unit: 'date' });
  });
});
