import { DateTime } from 'luxon';
import { eventPositionInDay, hoursRange } from '../lib/dates';

export default function DayView({ focus, events, onSlotClick }: any) {
  return (
    <div className="border rounded-xl h-[900px] relative" onDoubleClick={(e)=>{
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const minutesIntoDay = (y / rect.height) * 24*60;
      const start = focus.startOf('day').plus({ minutes: Math.floor(minutesIntoDay/30)*30 }).toUTC().toISO();
      onSlotClick?.(start);
    }}>
      <div className="sticky top-0 bg-white/80 backdrop-blur px-2 py-1 border-b rounded-t-xl font-medium">{focus.toFormat('cccc dd')}</div>
      {hoursRange(7, 22).map(h => (
        <div key={h} className="absolute left-0 right-0" style={{ top: `${((h)/(24))*100}%` }}>
          <div className="border-t text-[10px] text-gray-400 pl-1">{h}:00</div>
        </div>
      ))}

      {events.filter((e: any) => DateTime.fromISO(e.instanceStartUTC).hasSame(focus, 'day')).map((e: any) => {
        const pos = eventPositionInDay(e.instanceStartUTC, e.instanceEndUTC);
        return (
          <div key={e.id + e.instanceStartUTC} className="absolute left-2 right-2 rounded-md px-3 py-2 text-sm overflow-hidden"
               style={{ top: `${pos.topPct}%`, height: `${pos.heightPct}%`, background: '#16a34a33', border: '1px solid #16a34a' }}>
            <div className="font-medium truncate">{e.title}</div>
            <div className="text-xs opacity-70 truncate">{DateTime.fromISO(e.instanceStartUTC).toFormat('t')}–{DateTime.fromISO(e.instanceEndUTC).toFormat('t')}</div>
          </div>
        )
      })}
    </div>
  );
}
