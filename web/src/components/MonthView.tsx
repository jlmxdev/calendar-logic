import { DateTime } from 'luxon';
import ColorDot from './ColorDot';

export default function MonthView({ focus, events, calendars }: any) {
  const start = focus.startOf('month').startOf('week');
  const days = Array.from({ length: 42 }, (_, i) => start.plus({ days: i }));

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
      {days.map((d, i) => {
        const todays = events.filter((e: any) => DateTime.fromISO(e.instanceStartUTC).hasSame(d, 'day'));
        return (
          <div key={i} className="bg-white min-h-[110px] p-2">
            <div className={`text-sm ${d.month !== focus.month ? 'text-gray-400' : ''}`}>{d.day}</div>
            <div className="mt-1 space-y-1">
              {todays.slice(0,3).map((ev: any) => {
                const cal = calendars.find((c: any) => c.id === ev.calendar_id) || { color: '#3b82f6' };
                return (
                  <div key={ev.id + ev.instanceStartUTC} className="text-xs truncate px-2 py-1 rounded-md" style={{ backgroundColor: cal.color + '22' }}>
                    <ColorDot color={cal.color} />{ev.title}
                  </div>
                )
              })}
              {todays.length > 3 && <div className="text-xs text-gray-500">+{todays.length - 3} more</div>}
            </div>
          </div>
        )
      })}
    </div>
  );
}
