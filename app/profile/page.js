'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/useProfile';

const input = 'bg-slate-800 rounded px-3 py-2 w-full';
const YEARS = ['1st Year B.Tech', '2nd Year B.Tech', '3rd Year B.Tech', '4th Year B.Tech', 'M.Tech'];
const usernames = [
  ['leetcode_username', 'LeetCode username', 'Username only (leetcode.com/u/<username>)'],
  ['codeforces_username', 'Codeforces handle', 'Handle only (codeforces.com/profile/<handle>)'],
  ['gfg_username', 'GFG username', 'Username only (geeksforgeeks.org/user/<username>)'],
];
const keys = ['name', 'year', ...usernames.map(([k]) => k)];

export default function Profile() {
  const profile = useProfile();
  const [f, setF] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { if (profile) setF(profile); }, [profile]);

  async function save(e) {
    e.preventDefault();
    const update = Object.fromEntries(keys.map((k) => [k, (f[k] || '').trim() || null]));
    const { error } = await supabase.from('profiles').update(update).eq('id', profile.id);
    setMsg(error ? error.message : 'Saved ✓');
  }

  if (!profile) return <p>Loading…</p>;
  return (
    <form onSubmit={save} className="space-y-3 max-w-md">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="text-slate-400 text-sm">{profile.email}. Usernames are used to auto-verify your solves.</p>

      <div>
        <label className="text-sm text-slate-400">Full name</label>
        <input className={input} value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>

      <div>
        <label className="text-sm text-slate-400">Year</label>
        <select required className={input} value={f.year || ''} onChange={(e) => setF({ ...f, year: e.target.value })}>
          <option value="">Select your year…</option>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {usernames.map(([k, label, ph]) => (
        <div key={k}>
          <label className="text-sm text-slate-400">{label}</label>
          <input className={input} placeholder={ph} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        </div>
      ))}

      <button className="bg-indigo-600 px-4 py-2 rounded">Save</button>
      {msg && <span className="ml-3 text-amber-300">{msg}</span>}
    </form>
  );
}