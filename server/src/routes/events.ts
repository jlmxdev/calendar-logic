import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { randomUUID } from 'crypto';
import { expandRecurrences } from '../lib/recurrence.js';
import { DateTime } from 'luxon';
import { exportToICS, importICS } from '../lib/ics.js';
import multer from 'multer';

const upload = multer();
const router = Router();

const EventSchema = z.object({
  calendarId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startUTC: z.string().datetime(),
  endUTC: z.string().datetime(),
  allDay: z.boolean().default(false),
  eventTz: z.string().default('UTC'),
  rrule: z.string().nullable().optional(),
  exdates: z.array(z.string()).optional()
});

router.get('/', (req, res) => {
  const { calendarId, start, end } = req.query as any;
  if (!calendarId || !start || !end) return res.status(400).json({ error: 'calendarId,start,end required' });

  const masters = db.prepare('SELECT * FROM events WHERE calendar_id = ? AND recurrence_id IS NULL').all(calendarId);
  const overrides = db.prepare('SELECT * FROM events WHERE calendar_id = ? AND recurrence_id IS NOT NULL').all(calendarId);

  const rangeStart = String(start);
  const rangeEnd = String(end);

  const results: any[] = [];

  for (const m of masters) {
    const ovr = overrides
      .filter(o => o.recurrence_id === m.id)
      .map(o => ({ originalStartUTC: o.original_start, instance: { startUTC: o.start, endUTC: o.end } }));

    const instances = expandRecurrences({
      startUTC: m.start,
      endUTC: m.end,
      eventTz: m.event_tz,
      rrule: m.rrule,
      exdates: m.exdates ? JSON.parse(m.exdates) : [],
      overrides: ovr
    }, rangeStart, rangeEnd);

    for (const inst of instances) {
      results.push({
        id: m.id,
        instanceStartUTC: inst.startUTC,
        instanceEndUTC: inst.endUTC,
        title: m.title,
        description: m.description,
        location: m.location,
        allDay: !!m.all_day,
        eventTz: m.event_tz,
        isOverride: !!(inst as any).isOverride,
        masterStartUTC: m.start,
        masterEndUTC: m.end,
        rrule: m.rrule
      });
    }
  }

  res.json(results.sort((a, b) => DateTime.fromISO(a.instanceStartUTC).toMillis() - DateTime.fromISO(b.instanceStartUTC).toMillis()));
});

router.post('/', (req, res) => {
  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const id = randomUUID();
  const now = new Date().toISOString();
  const e = parsed.data;
  db.prepare(`INSERT INTO events (id, calendar_id, title, description, location, start, end, all_day, event_tz, rrule, exdates, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, e.calendarId, e.title, e.description || null, e.location || null, e.startUTC, e.endUTC, e.allDay ? 1 : 0, e.eventTz, e.rrule || null, e.exdates ? JSON.stringify(e.exdates) : null, now, now);
  res.json({ id });
});

router.put('/:id', (req, res) => {
  const id = req.params.id;
  const parsed = EventSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const sets: string[] = [];
  const vals: any[] = [];
  const fields: Record<string, string> = {
    title: 'title', description: 'description', location: 'location', startUTC: 'start', endUTC: 'end',
    allDay: 'all_day', eventTz: 'event_tz', rrule: 'rrule', exdates: 'exdates'
  };
  for (const [k, v] of Object.entries(parsed.data)) {
    sets.push(`${fields[k]} = ?`);
    vals.push(k === 'exdates' ? JSON.stringify(v) : v);
  }
  vals.push(new Date().toISOString());
  vals.push(id);
  db.prepare(`UPDATE events SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals);
  res.json({ updated: true });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM events WHERE id = ? OR recurrence_id = ?').run(id, id);
  res.json({ deleted: true });
});

router.post('/:id/override', (req, res) => {
  const id = req.params.id;
  const schema = z.object({ originalStartUTC: z.string().datetime(), newStartUTC: z.string().datetime(), newEndUTC: z.string().datetime() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const master = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!master) return res.status(404).json({ error: 'not found' });

  const now = new Date().toISOString();
  const overrideId = randomUUID();
  db.prepare(`INSERT INTO events (id, calendar_id, title, description, location, start, end, all_day, event_tz, rrule, exdates, recurrence_id, original_start, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`)
    .run(overrideId, master.calendar_id, master.title, master.description, master.location, parsed.data.newStartUTC, parsed.data.newEndUTC, master.all_day, master.event_tz, id, parsed.data.originalStartUTC, now, now);

  const exdates = master.exdates ? JSON.parse(master.exdates) as string[] : [];
  const { DateTime } = await import('luxon');
  const origLocal = DateTime.fromISO(parsed.data.originalStartUTC).setZone(master.event_tz).toISO();
  exdates.push(origLocal as string);
  db.prepare('UPDATE events SET exdates = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(exdates), now, id);

  res.json({ overrideId });
});

router.get('/export/ics', (req, res) => {
  const { calendarId } = req.query as any;
  if (!calendarId) return res.status(400).json({ error: 'calendarId required' });
  const rows = db.prepare('SELECT * FROM events WHERE calendar_id = ? AND recurrence_id IS NULL').all(calendarId);
  const ics = exportToICS(rows.map((r: any) => ({
    title: r.title, description: r.description || '', location: r.location || '',
    startUTC: r.start, endUTC: r.end, allDay: !!r.all_day, tz: r.event_tz, rrule: r.rrule || undefined,
  })));
  res.setHeader('Content-Type', 'text/calendar');
  res.send(ics);
});

router.post('/import/ics', upload.single('file'), (req, res) => {
  const { calendarId } = req.body as any;
  if (!calendarId || !req.file) return res.status(400).json({ error: 'calendarId and file required' });
  const text = req.file.buffer.toString('utf8');
  const items = importICS(text);
  const now = new Date().toISOString();
  for (const it of items) {
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO events (id, calendar_id, title, description, location, start, end, all_day, event_tz, rrule, exdates, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, ?, ?)`)
      .run(id, calendarId, it.title, it.description, it.location, it.startUTC, it.endUTC, 'UTC', it.rrule, now, now);
  }
  res.json({ imported: items.length });
});

export default router;
