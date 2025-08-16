import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';
import { isoRangeForView } from '../lib/dates';
import { createEvent, listCalendars, listEvents } from '../lib/api';

export default function CalendarShell() {
  const [view, setView] = useState<'month'|'week'|'day'>('week');
  const [focus, setFocus] = useState(DateTime.now());
  const [calendars, setCalendars] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [seedStart, setSeedStart] = useState<string | undefined>(undefined);

  useEffect(() => { (async () => { setCalendars(await listCalendars()) })(); }, []);

  useEffect(() => {
    (async () => {
      if (!calendars[0]) return;
      const { start, end } = isoRangeForView(view, focus);
      const ev = await listEvents(calendars[0].id, start, end);
      setEvents(ev.map((e: any) => ({ ...e, calendar_id: calendars[0].id })));
    })();
  }, [view, focus, calendars]);

  const title = useMemo(() => {
    if (view === 'day') return focus.toFormat('LLLL d, yyyy');
    if (view === 'week') {
      const s = focus.startOf('week');
      const e = focus.endOf('week');
      return `${s.toFormat('LLL d')} – ${e.toFormat('LLL d, yyyy')}`;
    }
    return focus.toFormat('LLLL yyyy');
  }, [view, focus]);

  async function handleCreate(payload: any) {
    const cal = calendars[0];
    if (!cal) return;
    await createEvent({ calendarId: cal.id, title: payload.title, startUTC: payload.startUTC, endUTC: payload.endUTC, eventTz: cal.timezone, rrule: payload.rrule });
    setModalOpen(false);
    const { start, end } = isoRangeForView(view, focus);
    const ev = await listEvents(cal.id, start, end);
    setEvents(ev.map((e: any) => ({ ...e, calendar_id: cal.id })));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg border" onClick={()=>setFocus(DateTime.now())}>Today</button>
          <button className="px-3 py-2 rounded-lg border" onClick={()=>setFocus(focus.minus({ [view==='month'?'months':'days']: 1 }))}>←</button>
          <button className="px-3 py-2 rounded-lg border" onClick={()=>setFocus(focus.plus({ [view==='month'?'months':'days']: 1 }))}>→</button>
          <select className="px-3 py-2 rounded-lg border" value={view} onChange={e=>setView(e.target.value as any)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={()=>{ setSeedStart(undefined); setModalOpen(true); }}>New</button>
        </div>
      </div>

      {view === 'month' && <MonthView focus={focus} events={events} calendars={calendars} />}
      {view === 'week' && <WeekView focus={focus} events={events} />}
      {view === 'day' && <DayView focus={focus} events={events} onSlotClick={(startISO: string)=>{ setSeedStart(startISO); setModalOpen(true); }} />}

      <EventModal open={modalOpen} onClose={()=>setModalOpen(false)} onSave={handleCreate} startISO={seedStart} />
    </div>
  );
}
