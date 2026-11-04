'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/useProfile';
import Countdown from '../Countdown';

const color = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };

export default function Dashboard() {
  const profile = useProfile();
  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [done, setDone] = useState([]);
  const [next, setNext] = useState(null);
  const [urls, setUrls] = useState({});
  const [msg, setMsg] = useState({});

  async function load() {
    const now = new Date().toISOString();
    const [{ data: lb }, { data: ch }, { data: subs }, { data: nx }] = await Promise.all([
      supabase.rpc('leaderboard', { since: null }),
      supabase.from('challenges').select('*, questions(*)').lte('start_time', now).gte('end_time', now),
      supabase.from('submissions').select('challenge_id').eq('user_id', profile.id),
      supabase.rpc('next_release_time'),
    ]);
    setStats(lb?.find((r) => r.id === profile.id));
    setChallenges(ch || []);
    setDone((subs || []).map((s) => s.challenge_id));
    setNext(nx);
  }
  useEffect(() => { if (profile) load(); }, [profile]);

  async function submit(id) {
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ challengeId: id, url: urls[id] || '' }),
    });
    const j = await r.json();
    setMsg({ ...msg, [id]: j.error || j.message });
    if (r.ok) load();
  }

  if (!profile) return <p>Loading…</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Hello, {profile.name} 👋</h1>

      <Countdown target={next} onZero={load} />

      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        {[['Points', stats?.points ?? 0], ['Rank', stats ? `#${stats.rank}` : '-'], ['Solved', stats?.solved ?? 0]].map(([k, v]) => (
          <div key={k} className="bg-slate-900 rounded-lg p-4">
            <div className="text-2xl font-bold">{v}</div>
            <div className="text-slate-400 text-sm">{k}</div>
          </div>
        ))}
      </div>

      <h2 className="font-semibold mb-2">Today's Challenges</h2>
      {challenges.length === 0 && <p className="text-slate-400">No active challenge right now.</p>}
      {challenges.map((c) => (
        <div key={c.id} className="bg-slate-900 rounded-lg p-4 mb-3">
          <div className={`text-sm font-semibold ${color[c.questions.difficulty]}`}>
            {c.questions.difficulty} · {c.questions.points} pts · {c.questions.topic}
          </div>
          <div className="text-lg font-bold">{c.questions.title}</div>
          <div className="text-slate-400 text-sm mb-2">{c.label} — due {new Date(c.end_time).toLocaleString()}</div>
          <a href={c.questions.url} target="_blank" className="text-indigo-400 underline">
            Open on {c.questions.platform} ↗
          </a>
          {done.includes(c.id) ? (
            <p className="mt-3 text-green-400">✓ Submitted</p>
          ) : (
            <div className="flex gap-2 mt-3">
              <input
                placeholder="Paste your solution link"
                value={urls[c.id] || ''}
                onChange={(e) => setUrls({ ...urls, [c.id]: e.target.value })}
                className="flex-1 bg-slate-800 rounded px-3 py-2"
              />
              <button onClick={() => submit(c.id)} className="bg-indigo-600 px-4 rounded">Submit</button>
            </div>
          )}
          {msg[c.id] && <p className="mt-2 text-sm text-amber-300">{msg[c.id]}</p>}
        </div>
      ))}
    </div>
  );
}