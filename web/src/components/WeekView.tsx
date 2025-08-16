import { DateTime } from 'luxon';
import { eventPositionInDay, hoursRange } from '../lib/dates';

export default function WeekView({ focus, events }: any) {
  const weekStart = focus.startOf('week');
  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, idx) => (
        <div key={idx} className="border rounded-xl h-[900px] relative">
          <div className="sticky top-0 bg-white/80 backdrop-blur px-2 py-1 border-b rounded-t-xl font-medium">{d.toFormat('ccc dd')}</div>
          {hoursRange(7, 22).map(h => (
            <div key={h} className="absolute left-0 right-0" style={{ top: `${((h)/(24))*100}%` }}>
              <div className="border-t text-[10px] text-gray-400 pl-1">{h}:00</div>
            </div>
          ))}

          {events.filter((e: any) => DateTime.fromISO(e.instanceStartUTC).hasSame(d, 'day')).map((e: any) => {
            const pos = eventPositionInDay(e.instanceStartUTC, e.instanceEndUTC);
            return (
              <div key={e.id + e.instanceStartUTC} className="absolute left-1 right-1 rounded-md px-2 py-1 text-sm overflow-hidden"
                   style={{ top: `${pos.topPct}%`, height: `${pos.heightPct}%`, background: '#3b82f633', border: '1px solid #3b82f6' }}>
                <div className="font-medium truncate">{e.title}</div>
                <div className="text-xs opacity-70 truncate">{DateTime.fromISO(e.instanceStartUTC).toFormat('t')}–{DateTime.fromISO(e.instanceEndUTC).toFormat('t')}</div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  );
}
