'use client';
import { useEffect, useState } from 'react';

export default function Countdown({ target, onZero }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!target) return setLeft(null);
    const t = new Date(target).getTime();
    const id = setInterval(tick, 1000);
    function tick() {
      const d = t - Date.now();
      if (d <= 0) { clearInterval(id); setLeft(0); setTimeout(onZero, 3000); }
      else setLeft(d);
    }
    tick();
    return () => clearInterval(id);
  }, [target]);

  if (left === null) return <div className="bg-slate-900 rounded-lg p-4 mb-6 text-slate-400">Next challenge: to be scheduled</div>;
  if (left === 0) return <div className="bg-indigo-700 rounded-lg p-4 mb-6 font-bold">🚀 New challenge is live! Loading…</div>;
  const s = Math.floor(left / 1000);
  const parts = [['Days', Math.floor(s / 86400)], ['Hours', Math.floor(s / 3600) % 24], ['Mins', Math.floor(s / 60) % 60], ['Secs', s % 60]];
  return (
    <div className="bg-slate-900 rounded-lg p-4 mb-6">
      <div className="text-slate-400 text-sm mb-2">⏳ Next challenge releases in</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {parts.map(([k, v]) => (
          <div key={k} className="bg-slate-800 rounded p-2">
            <div className="text-2xl font-bold tabular-nums">{String(v).padStart(2, '0')}</div>
            <div className="text-xs text-slate-400">{k}</div>
          </div>))}
      </div>
    </div>
  );
}