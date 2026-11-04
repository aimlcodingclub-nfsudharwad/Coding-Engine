'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace('/');
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
      setProfile(p);
    });
  }, [router]);
  return profile;
}
