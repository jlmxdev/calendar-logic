import { useEffect, useState } from 'react';
import CalendarShell from './components/CalendarShell';
import { login, signup } from './lib/api';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem('token'));
  const [mode, setMode] = useState<'login'|'signup'>('signup');
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demopass');
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    if (!authed) {
      signup(email, password).finally(()=>{});
    }
  },[]);

  async function handleAuth() {
    try {
      setError(null);
      await login(email, password);
      setAuthed(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (!authed) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
        <h1 className="text-xl font-semibold mb-4">{mode === 'login' ? 'Log in' : 'Create account'}</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <input className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 mb-3" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={handleAuth}>Continue</button>
        <div className="text-sm text-gray-500 mt-2">This demo auto-creates a primary calendar.</div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <CalendarShell />
    </div>
  );
}
