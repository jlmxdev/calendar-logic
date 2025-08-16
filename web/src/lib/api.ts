const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('login failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
}

export async function signup(email: string, password: string) {
  const res = await fetch(`${API}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('signup failed');
  return res.json();
}

export async function listCalendars() {
  const res = await fetch(`${API}/calendars`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('calendars');
  return res.json();
}

export async function listEvents(calendarId: string, start: string, end: string) {
  const params = new URLSearchParams({ calendarId, start, end });
  const res = await fetch(`${API}/events?${params}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('events');
  return res.json();
}

export async function createEvent(payload: any) {
  const res = await fetch(`${API}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('create');
  return res.json();
}
