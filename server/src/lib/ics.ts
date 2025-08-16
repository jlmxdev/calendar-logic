import { createEvents } from 'ics';
import * as ICAL from 'ical.js';
import { DateTime } from 'luxon';

export function exportToICS(events: Array<{
  title: string; description?: string; location?: string;
  startUTC: string; endUTC: string; allDay?: boolean; tz?: string;
  rrule?: string | null; exdates?: string[];
}>) {
  const icsEvents = events.map(e => {
    const start = DateTime.fromISO(e.startUTC).toUTC();
    const end = DateTime.fromISO(e.endUTC).toUTC();
    const base: any = {
      title: e.title,
      description: e.description || '',
      location: e.location || '',
      start: [start.year, start.month, start.day, start.hour, start.minute],
      end: [end.year, end.month, end.day, end.hour, end.minute],
      startInputType: 'utc',
      endInputType: 'utc'
    };
    if (e.rrule) base.rrule = e.rrule;
    return base;
  });
  const { value } = createEvents(icsEvents as any);
  return value;
}

export function importICS(icsText: string) {
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');
  return vevents.map(v => {
    const e = new ICAL.Event(v);
    const start = e.startDate.toJSDate();
    const end = e.endDate?.toJSDate() || new Date(start.getTime() + 60*60*1000);
    const rrule = v.getFirstPropertyValue('rrule');
    return {
      title: e.summary || 'Untitled',
      description: e.description || '',
      location: e.location || '',
      startUTC: DateTime.fromJSDate(start).toUTC().toISO(),
      endUTC: DateTime.fromJSDate(end).toUTC().toISO(),
      rrule: rrule ? ICAL.stringify.property({ name: 'RRULE', value: rrule as any }).replace('RRULE:', '') : null
    };
  });
}
