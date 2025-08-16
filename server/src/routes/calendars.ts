import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { randomUUID } from 'crypto';
import { AuthedRequest } from '../lib/auth.js';

const router = Router();

router.get('/', (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT * FROM calendars WHERE user_id = ? ORDER BY is_primary DESC, created_at ASC')
    .all(req.userId);
  res.json(rows);
});

router.post('/', (req: AuthedRequest, res) => {
  const schema = z.object({ name: z.string(), color: z.string().default('#3b82f6'), timezone: z.string().default('UTC') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO calendars (id, user_id, name, color, timezone, is_primary, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .run(id, req.userId, parsed.data.name, parsed.data.color, parsed.data.timezone, now);
  res.json({ id, ...parsed.data });
});

export default router;
