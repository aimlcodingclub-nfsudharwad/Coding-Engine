const { createClient } = require('@supabase/supabase-js');

const API = 'https://alfa-leetcode-api.onrender.com';
const POINTS = { Easy: 10, Medium: 15, Hard: 25 };

// slug (from API /tags) -> label shown in your app
const TOPICS = {
  array: 'Arrays',
  string: 'Strings',
  'hash-table': 'Hashing',
  'two-pointers': 'Two Pointers',
  'binary-search': 'Searching',
  sorting: 'Sorting',
  'linked-list': 'Linked List',
  stack: 'Stack',
  'binary-tree': 'Trees',
  'dynamic-programming': 'Dynamic Programming',
};
// how many problems to pull per topic, per difficulty
const COUNT = { EASY: 10, MEDIUM: 10, HARD: 3 };
const SKIP = 0; // raise to get different problems

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Render's free tier sleeps, so the first call can be slow: retry a few times
async function get(path) {
  for (let i = 1; i <= 4; i++) {
    try {
      const res = await fetch(API + path, { signal: AbortSignal.timeout(60000) });
      if (res.ok) return await res.json();
    } catch (e) { /* retry */ }
    console.log(`  retrying (${i})...`);
    await sleep(5000);
  }
  return null;
}

(async () => {
  let total = 0;
  for (const [slug, label] of Object.entries(TOPICS)) {
    for (const [diff, limit] of Object.entries(COUNT)) {
      const j = await get(`/problems?tags=${slug}&difficulty=${diff}&limit=${limit}&skip=${SKIP}`);
      const list = j?.problemsetQuestionList ?? [];
      if (!list.length) {
        console.log(`${label} ${diff}: nothing returned`, j ? Object.keys(j) : 'no response');
        continue;
      }
      const difficulty = diff[0] + diff.slice(1).toLowerCase(); // EASY -> Easy
      const rows = list.filter((p) => !p.paidOnly).map((p) => ({
        title: p.title,
        platform: 'LeetCode',
        url: `https://leetcode.com/problems/${p.titleSlug}/`,
        difficulty,
        topic: label,
        platform_key: p.titleSlug,
        points: POINTS[difficulty],
      }));
      const { error } = await db.from('questions')
        .upsert(rows, { onConflict: 'platform,platform_key', ignoreDuplicates: true });
      if (error) console.log(`${label} ${diff}: DB error`, error.message);
      else { total += rows.length; console.log(`${label} ${diff}: ${rows.length} added`); }
      await sleep(1000); // be gentle with the free API
    }
  }
  console.log(`Done. Processed ${total} problems.`);
})();