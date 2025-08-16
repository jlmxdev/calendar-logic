import { RRule, RRuleSet, rrulestr } from 'rrule';
import { DateTime } from 'luxon';

export type RecurrenceInput = {
  startUTC: string;
  endUTC: string;
  eventTz: string;
  rrule?: string | null;
  exdates?: string[];
  overrides?: { originalStartUTC: string; instance: { startUTC: string; endUTC: string } }[];
};

export function expandRecurrences(input: RecurrenceInput, rangeStartISO: string, rangeEndISO: string) {
  const { startUTC, endUTC, eventTz, rrule, exdates = [], overrides = [] } = input;
  const rangeStart = DateTime.fromISO(rangeStartISO, { zone: 'utc' });
  const rangeEnd = DateTime.fromISO(rangeEndISO, { zone: 'utc' });

  const durationMs = DateTime.fromISO(endUTC).toMillis() - DateTime.fromISO(startUTC).toMillis();

  if (!rrule) {
    const s = DateTime.fromISO(startUTC);
    const e = DateTime.fromISO(endUTC);
    if (e > rangeStart && s < rangeEnd) {
      return [{ startUTC, endUTC }];
    }
    return [];
  }

  const set = new RRuleSet();
  const dtstartLocal = DateTime.fromISO(startUTC).setZone(eventTz);
  const base = rrulestr(rrule, { forceset: false, dtstart: new Date(dtstartLocal.toISO()) }) as RRule;
  set.rrule(base);

  for (const ex of exdates) {
    const dt = DateTime.fromISO(ex, { zone: eventTz });
    set.exdate(new Date(dt.toISO()));
  }

  const between = set.between(rangeStart.toJSDate(), rangeEnd.toJSDate(), true);

  const instances = between.map((occ) => {
    const occStart = DateTime.fromJSDate(occ).setZone(eventTz, { keepLocalTime: true }).toUTC();
    const occEnd = occStart.plus({ milliseconds: durationMs });
    const override = overrides.find(o => DateTime.fromISO(o.originalStartUTC).toMillis() == occStart.toMillis());
    if (override) {
      return { startUTC: override.instance.startUTC, endUTC: override.instance.endUTC, isOverride: true };
    }
    return { startUTC: occStart.toISO(), endUTC: occEnd.toISO() };
  });

  return instances;
}
