import { Router } from 'express';
import { z } from 'zod';
import { authenticate, createUser } from '../lib/auth.js';

const router = Router();

router.post('/signup', (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  try {
    const user = createUser(parsed.data.email, parsed.data.password);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const auth = authenticate(parsed.data.email, parsed.data.password);
  if (!auth) return res.status(401).json({ error: 'invalid credentials' });
  res.json(auth);
});

export default router;
