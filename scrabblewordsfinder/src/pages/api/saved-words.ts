import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  const { results } = await db.prepare('SELECT uid, achievements, updated_at FROM scrabble_sync ORDER BY updated_at DESC LIMIT 500').all();

  const users: any[] = [];
  let totalWords = 0;
  const allWords: any[] = [];

  for (const row of results as any[]) {
    try {
      const ach = JSON.parse(row.achievements || '[]');
      const words = ach.filter((a: any) => a.word).map((a: any) => ({
        word: a.word,
        score: a.score || 0,
        meaning: a.meaning || '',
        category: a.category || 'manual',
        dateAdded: a.dateAdded || '',
        savedAt: a.savedAt || ''
      }));
      totalWords += words.length;
      users.push({ uid: row.uid, wordCount: words.length, words, updatedAt: row.updated_at });
      words.forEach((w: any) => allWords.push({ ...w, uid: row.uid }));
    } catch { }
  }

  // Aggregate by category
  const categories: Record<string, number> = {};
  allWords.forEach(w => { categories[w.category] = (categories[w.category] || 0) + 1; });

  return new Response(JSON.stringify({ users, totalUsers: users.length, totalWords, allWords, categories }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
