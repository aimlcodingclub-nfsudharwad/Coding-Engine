import { createClient } from '@supabase/supabase-js';
import { verifySolve } from '@/lib/verify';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const fail = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return fail('Not logged in', 401);

  const { challengeId, url } = await req.json();
  if (!/^https?:\/\//i.test(url || '')) return fail('Enter a valid URL');

  const { data: ch } = await admin.from('challenges').select('*, questions(*)').eq('id', challengeId).single();
  if (!ch) return fail('Challenge not found');
  const now = Date.now();
  if (now < new Date(ch.start_time) || now > new Date(ch.end_time)) return fail('Submission window is closed');

  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
  const ok = await verifySolve(ch.questions, profile, new Date(ch.start_time));

  const { error } = await admin.from('submissions').insert({
    user_id: user.id, challenge_id: challengeId, solution_url: url,
    status: ok === true ? 'verified' : ok === false ? 'rejected_unverified' : 'pending',
    points_awarded: ok === true ? ch.questions.points : 0,
  });
  if (error?.code === '23505') return fail('You already submitted this challenge');
  if (error) return fail(error.message, 500);

  return Response.json({
    points: ok === true ? ch.questions.points : 0,
    message: ok === true ? `Verified! +${ch.questions.points} points`
      : 'Saved. We could not verify it automatically, so an organizer will review it.',
  });
}