'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Nav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load(session) {
      setLoggedIn(!!session);
      if (!session) return setIsAdmin(false);
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
      setIsAdmin(!!data?.is_admin);
    }
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => load(session), 0); // avoids a supabase-js deadlock
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    try { await supabase.auth.signOut({ scope: 'local' }); } catch (e) {}
    Object.keys(localStorage).filter((k) => k.startsWith('sb-')).forEach((k) => localStorage.removeItem(k));
    window.location.replace('/');
  }

  return (
    <nav className="flex gap-4 items-center p-4 border-b border-slate-800">
      <b className="mr-auto">AI, ML & Coding Club</b>
      {loggedIn && (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/profile">Profile</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
          <button type="button" onClick={logout} className="text-slate-300 hover:text-white">Logout</button>
        </>
      )}
    </nav>
  );
}