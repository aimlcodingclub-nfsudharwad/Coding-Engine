'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/useProfile';

const input = 'bg-slate-800 rounded px-3 py-2 w-full';
const fields = [
  ['name', 'Full name'], ['year', 'Year (e.g. 1st Year)'], ['track', 'Track (e.g. B.Tech CSE)'],
  ['leetcode_username', 'LeetCode username'], ['codeforces_username', 'Codeforces handle'], ['gfg_username', 'GFG username'],
];

export default function Profile() {
  const profile = useProfile();
  const [f, setF] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { if (profile) setF(profile); }, [profile]);

  async function save(e) {
    e.preventDefault();
    const update = Object.fromEntries(fields.map(([k]) => [k, (f[k] || '').trim() || null]));
    const { error } = await supabase.from('profiles').update(update).eq('id', profile.id);
    setMsg(error ? error.message : 'Saved ✓');
  }

  if (!profile) return <p>Loading…</p>;
  return (
    <form onSubmit={save} className="space-y-3 max-w-md">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="text-slate-400 text-sm">{profile.email}. Usernames are used to auto-verify your solves.</p>
      {fields.map(([k, label]) => (
        <div key={k}>
          <label className="text-sm text-slate-400">{label}</label>
          <input className={input} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        </div>
      ))}
      <button className="bg-indigo-600 px-4 py-2 rounded">Save</button>
      {msg && <span className="ml-3 text-amber-300">{msg}</span>}
    </form>
  );
}