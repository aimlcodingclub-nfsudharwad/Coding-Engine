'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace('/dashboard'); });
  }, [router]);

  const login = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/dashboard`, queryParams: { prompt: 'select_account' } },
  });

  return (
    <div className="text-center mt-24">
      <h1 className="text-3xl font-bold mb-2">Club Challenge Tracker</h1>
      <p className="text-slate-400 mb-6">Solve. Submit. Climb the leaderboard.</p>
      <button onClick={login} className="bg-indigo-600 px-6 py-3 rounded-lg font-semibold">
        Sign in with Google
      </button>
    </div>
  );
}