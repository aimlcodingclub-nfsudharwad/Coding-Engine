'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/useProfile';

export default function Leaderboard() {
  const profile = useProfile();
  const [range, setRange] = useState('all');
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!profile) return;
    const since = range === 'week' ? new Date(Date.now() - 7 * 864e5).toISOString()
      : range === 'month' ? new Date(Date.now() - 30 * 864e5).toISOString() : null;
    supabase.rpc('leaderboard', { since }).then(({ data }) => setRows(data || []));
  }, [profile, range]);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">🏆 Leaderboard</h1>
      <div className="flex gap-2 mb-4">
        {[['all', 'Overall'], ['week', 'This Week'], ['month', 'This Month']].map(([k, l]) => (
          <button key={k} onClick={() => setRange(k)}
            className={`px-3 py-1 rounded ${range === k ? 'bg-indigo-600' : 'bg-slate-800'}`}>{l}</button>
        ))}
      </div>
      <table className="w-full text-left">
        <thead className="text-slate-400"><tr><th>#</th><th>Student</th><th>Solved</th><th>Points</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className={`border-t border-slate-800 ${r.id === profile?.id ? 'text-indigo-300' : ''}`}>
            <td className="py-2">{r.rank}</td><td>{r.name}</td><td>{r.solved}</td><td>{r.points}</td>
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}
