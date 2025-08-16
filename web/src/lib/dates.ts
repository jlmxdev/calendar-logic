import { DateTime } from 'luxon';

export const startOfWeek = (dt: DateTime, weekStartsOn = 0) => dt.startOf('week').plus({ days: weekStartsOn });
export const endOfWeek = (dt: DateTime, weekStartsOn = 0) => startOfWeek(dt, weekStartsOn).plus({ days: 7 }).minus({ milliseconds: 1 });

export function hoursRange(start = 8, end = 18) {
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export function isoRangeForView(view: 'month' | 'week' | 'day', focus: DateTime) {
  if (view === 'day') {
    const s = focus.startOf('day');
    const e = focus.endOf('day');
    return { start: s.toUTC().toISO(), end: e.toUTC().toISO() };
  }
  if (view === 'week') {
    const s = startOfWeek(focus);
    const e = endOfWeek(focus);
    return { start: s.toUTC().toISO(), end: e.toUTC().toISO() };
  }
  const s = focus.startOf('month').startOf('week');
  const e = focus.endOf('month').endOf('week');
  return { start: s.toUTC().toISO(), end: e.toUTC().toISO() };
}

export function eventPositionInDay(startISO: string, endISO: string) {
  const s = DateTime.fromISO(startISO);
  const e = DateTime.fromISO(endISO);
  const dayStart = s.startOf('day');
  const minutesFrom = Math.max(0, s.diff(dayStart, 'minutes').minutes);
  const minutesDur = Math.max(30, e.diff(s, 'minutes').minutes);
  return { topPct: (minutesFrom / (24*60)) * 100, heightPct: (minutesDur / (24*60)) * 100 };
}
