import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import calendarsRoutes from './routes/calendars.js';
import eventsRoutes from './routes/events.js';
import { requireAuth } from './lib/auth.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/calendars', requireAuth, calendarsRoutes);
app.use('/events', requireAuth, eventsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
