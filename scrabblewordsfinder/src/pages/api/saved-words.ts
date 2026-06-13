import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  const { results } = await db.prepare('SELECT uid, achievements, updated_at FROM scrabble_sync ORDER BY updated_at DESC').all();

  const users: any[] = [];
  let totalWords = 0;

  for (const row of results as any[]) {
    try {
      const ach = JSON.parse(row.achievements || '[]');
      const words = ach.filter((a: any) => a.word).map((a: any) => ({ word: a.word, score: a.score || 0, savedAt: a.savedAt || '' }));
      totalWords += words.length;
      users.push({ uid: row.uid, wordCount: words.length, words, updatedAt: row.updated_at });
    } catch { }
  }

  return new Response(JSON.stringify({ users, totalUsers: users.length, totalWords }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
