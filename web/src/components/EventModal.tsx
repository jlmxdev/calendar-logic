import { useState } from 'react';
import { DateTime } from 'luxon';

export default function EventModal({ open, onClose, onSave, startISO }: { open: boolean; onClose: () => void; onSave: (e: any)=>void; startISO?: string }) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(startISO || DateTime.now().toISO({ suppressMilliseconds: true }));
  const [end, setEnd] = useState(DateTime.fromISO(start).plus({ hours: 1 }).toISO({ suppressMilliseconds: true }));
  const [rrule, setRrule] = useState('');

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Create event</h2>
        <label className="block text-sm mb-1">Title</label>
        <input className="w-full border rounded-lg px-3 py-2 mb-3" value={title} onChange={e=>setTitle(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Start (UTC ISO)</label>
            <input className="w-full border rounded-lg px-3 py-2" value={start} onChange={e=>setStart(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">End (UTC ISO)</label>
            <input className="w-full border rounded-lg px-3 py-2" value={end} onChange={e=>setEnd(e.target.value)} />
          </div>
        </div>

        <label className="block text-sm mt-3">RRULE (optional)</label>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20251231T235959Z" value={rrule} onChange={e=>setRrule(e.target.value)} />

        <div className="flex justify-end gap-2 mt-6">
          <button className="px-4 py-2 rounded-lg border" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={()=>onSave({ title, startUTC: start, endUTC: end, rrule: rrule || null })}>Save</button>
        </div>
      </div>
    </div>
  );
}
