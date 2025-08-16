import Database from 'better-sqlite3';

export const db = new Database('calendar.sqlite');
db.pragma('journal_mode = WAL');

db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0,
  event_tz TEXT NOT NULL DEFAULT 'UTC',
  rrule TEXT,
  exdates TEXT,
  recurrence_id TEXT,
  original_start TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(calendar_id) REFERENCES calendars(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS attendees (
  event_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'needsAction',
  PRIMARY KEY(event_id, email),
  FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  minutes_before INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'popup',
  FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();
