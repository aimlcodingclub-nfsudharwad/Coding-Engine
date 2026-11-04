-- Run in Supabase SQL editor
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, email text, year text, track text,
  leetcode_username text, codeforces_username text, gfg_username text,
  is_admin boolean default false
);
create table questions (
  id uuid primary key default gen_random_uuid(),
  title text not null, platform text not null, url text not null,
  platform_key text not null,
  difficulty text check (difficulty in ('Easy','Medium','Hard')),
  topic text, description text, points int not null default 10
);
create unique index questions_platform_key_idx on questions (platform, platform_key);
create table challenges (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions on delete cascade,
  label text, start_time timestamptz not null, end_time timestamptz not null
);
create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade default auth.uid(),
  challenge_id uuid references challenges on delete cascade,
  solution_url text not null,
  submitted_at timestamptz default now(),
  status text default 'accepted',
  points_awarded int not null,
  unique (user_id, challenge_id)
);

create function is_admin() returns boolean language sql security definer stable as
$$ select coalesce((select is_admin from profiles where id = auth.uid()), false) $$;

create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table questions enable row level security;
alter table challenges enable row level security;
alter table submissions enable row level security;
create policy "read profiles" on profiles for select to authenticated using (true);
create policy "update own profile" on profiles for update to authenticated using (id = auth.uid());
create policy "read questions" on questions for select to authenticated using (true);
create policy "admin questions" on questions for all to authenticated using (is_admin()) with check (is_admin());
create policy "read challenges" on challenges for select to authenticated using (true);
create policy "admin challenges" on challenges for all to authenticated using (is_admin()) with check (is_admin());
create policy "own submissions" on submissions for select to authenticated using (user_id = auth.uid() or is_admin());
-- no insert policy: submissions only go through submit_solution()

create function submit_solution(p_challenge uuid, p_url text) returns int
language plpgsql security definer as $$
declare c challenges; q questions;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  select * into c from challenges where id = p_challenge;
  if not found then raise exception 'Challenge not found'; end if;
  if now() < c.start_time or now() > c.end_time then raise exception 'Submission window is closed'; end if;
  if p_url !~* '^https?://' then raise exception 'Enter a valid URL'; end if;
  select * into q from questions where id = c.question_id;
  begin
    insert into submissions (user_id, challenge_id, solution_url, points_awarded)
    values (auth.uid(), p_challenge, p_url, q.points);
  exception when unique_violation then raise exception 'You already submitted this challenge';
  end;
  return q.points;
end $$;

create function leaderboard(since timestamptz default null)
returns table (id uuid, name text, year text, points bigint, solved bigint, rank bigint)
language sql security definer stable as $$
  select p.id, p.name, p.year,
         coalesce(sum(s.points_awarded),0)::bigint, count(s.id)::bigint,
         rank() over (order by coalesce(sum(s.points_awarded),0) desc)
  from profiles p
  left join submissions s on s.user_id = p.id and (since is null or s.submitted_at >= since)
  group by p.id order by 4 desc, 2
$$;

-- After your first login, make yourself admin:
-- update profiles set is_admin = true where email = 'you@college.ac.in';
