// returns true / false / null (null = couldn't check)
export async function verifySolve(question, profile, since) {
  const sinceSec = Math.floor(since.getTime() / 1000);
  try {
    if (question.platform === 'Codeforces') {
      const h = profile.codeforces_username;
      if (!h || !question.platform_key) return null;
      const r = await fetch(`https://codeforces.com/api/user.status?handle=${h}&from=1&count=50`);
      const j = await r.json();
      if (j.status !== 'OK') return null;
      return j.result.some((s) =>
        `${s.problem.contestId}${s.problem.index}` === question.platform_key &&
        s.verdict === 'OK' && s.creationTimeSeconds >= sinceSec);
    }
    if (question.platform === 'LeetCode') {
      const u = profile.leetcode_username;
      if (!u || !question.platform_key) return null;
      const r = await fetch(`${process.env.LEETCODE_API}/${u}/acSubmission?limit=20`);
      const j = await r.json();
      if (!j.submission) return null;
      return j.submission.some((s) =>
        s.titleSlug === question.platform_key && Number(s.timestamp) >= sinceSec);
    }
  } catch { /* fall through */ }
  return null; // GFG / HackerRank: manual approval for now
}