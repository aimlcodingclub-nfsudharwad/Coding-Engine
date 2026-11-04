const { createClient } = require('@supabase/supabase-js');

const POINTS = { Easy: 10, Medium: 15, Hard: 25 };

// Codeforces tag -> label shown in your app
const TOPICS = {
  implementation: 'Implementation',
  math: 'Math',
  greedy: 'Greedy',
  strings: 'Strings',
  sortings: 'Sorting',
  'binary search': 'Searching',
  'two pointers': 'Two Pointers',
  hashing: 'Hashing',
  dp: 'Dynamic Programming',
};
const COUNT = { Easy: 10, Medium: 8, Hard: 3 }; // per topic

const level = (r) => (r <= 1100 ? 'Easy' : r <= 1500 ? 'Medium' : r <= 1900 ? 'Hard' : null);

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('Fetching problem list from Codeforces...');
  const res = await fetch('https://codeforces.com/api/problemset.problems');
  const j = await res.json();
  if (j.status !== 'OK') return console.log('Codeforces error:', j.comment);

  // attach solvedCount to each problem
  const solved = {};
  for (const s of j.result.problemStatistics) solved[`${s.contestId}${s.index}`] = s.solvedCount;

  const problems = j.result.problems
    .filter((p) => p.type === 'PROGRAMMING' && p.rating && level(p.rating) && !p.tags.includes('*special'))
    .map((p) => ({ ...p, key: `${p.contestId}${p.index}`, solvedCount: solved[`${p.contestId}${p.index}`] || 0 }))
    .sort((a, b) => b.solvedCount - a.solvedCount);

  const taken = new Set(); // a problem is used under one topic only
  let total = 0;

  for (const [tag, label] of Object.entries(TOPICS)) {
    for (const [difficulty, limit] of Object.entries(COUNT)) {
      const picked = problems
        .filter((p) => !taken.has(p.key) && p.tags.includes(tag) && level(p.rating) === difficulty)
        .slice(0, limit);
      picked.forEach((p) => taken.add(p.key));
      if (!picked.length) { console.log(`${label} ${difficulty}: none found`); continue; }

      const rows = picked.map((p) => ({
        title: p.name,
        platform: 'Codeforces',
        url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
        difficulty,
        topic: label,
        platform_key: p.key,
        points: POINTS[difficulty],
      }));
      const { error } = await db.from('questions')
        .upsert(rows, { onConflict: 'platform,platform_key', ignoreDuplicates: true });
      if (error) console.log(`${label} ${difficulty}: DB error`, error.message);
      else { total += rows.length; console.log(`${label} ${difficulty}: ${rows.length} added`); }
    }
  }
  console.log(`Done. Processed ${total} problems.`);
})();