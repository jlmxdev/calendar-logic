import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function createUser(email: string, password: string) {
  const hash = bcrypt.hashSync(password, 10);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(id, email, hash, now);
  const calId = randomUUID();
  db.prepare('INSERT INTO calendars (id, user_id, name, color, timezone, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(calId, id, 'My Calendar', '#3b82f6', 'UTC', 1, now);
  return { id, email };
}

export function authenticate(email: string, password: string) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) return null;
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return null;
  const token = jwt.sign({ sub: row.id, email: row.email }, JWT_SECRET, { expiresIn: '7d' });
  return { token };
}

export interface AuthedRequest extends Request { userId?: string }

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ error: 'missing auth header' });
  const token = hdr.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}
