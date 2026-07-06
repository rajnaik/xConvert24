import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const getDB = () => (env as any).DB;

const VALID_GAMES = ['daily-duel', 'sixty-second', 'cab', 'daily-rack', 'daily-anagram', 'word-quiz'];

// Standard Scrabble letter values — server-side truth for score calculation
const LETTER_VALUES: Record<string, number> = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};

/** Calculate Scrabble score from word letters */
function scrabbleScore(word: string): number {
  if (!word) return 0;
  return word.toUpperCase().split('').reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);
}

/**
 * POST /api/leaderboard/
 *
 * Body: { game, user_id, best_word, best_score, total_score?, words_played? }
 *
 * Upserts into the leaderboard table. If a row already exists for this
 * game + user + today, it updates best_score/best_word if the new score is higher
 * and increments total_score and words_played.
 */
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { game, user_id, best_word, best_score, total_score, words_played } = body;

  if (!game || !user_id || best_score == null) {
    return new Response(JSON.stringify({ error: 'Missing required fields: game, user_id, best_score' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!VALID_GAMES.includes(game)) {
    return new Response(JSON.stringify({ error: 'Invalid game. Must be one of: ' + VALID_GAMES.join(', ') }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const word = (best_word || '').toUpperCase();
  const score = Number(best_score) || 0;
  const total = Number(total_score) || score;
  const played = Number(words_played) || 1;

  // Check if an entry already exists for this game + user + today
  const existing = await db.prepare(
    'SELECT id, best_score, total_score, words_played FROM leaderboard WHERE game = ? AND user_id = ? AND date = ?'
  ).bind(game, user_id, today).first();

  if (existing) {
    // Update: only upgrade best_score/best_word if higher, always accumulate total
    const newBest = score > existing.best_score ? score : existing.best_score;
    const newBestWord = score > existing.best_score ? word : undefined;
    const newTotal = existing.total_score + total;
    const newPlayed = existing.words_played + played;

    if (newBestWord !== undefined) {
      await db.prepare(
        'UPDATE leaderboard SET best_score = ?, best_word = ?, total_score = ?, words_played = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(newBest, newBestWord, newTotal, newPlayed, existing.id).run();
    } else {
      await db.prepare(
        'UPDATE leaderboard SET total_score = ?, words_played = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(newTotal, newPlayed, existing.id).run();
    }

    return new Response(JSON.stringify({ success: true, updated: true, best_score: newBest, total_score: newTotal }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    // Insert new entry
    await db.prepare(
      'INSERT INTO leaderboard (game, user_id, date, best_word, best_score, total_score, words_played) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(game, user_id, today, word, score, total, played).run();

    return new Response(JSON.stringify({ success: true, inserted: true, best_score: score, total_score: total }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET /api/leaderboard/
 *
 * Query params:
 *   game    — required: 'daily-duel' | 'sixty-second' | 'cab' | 'daily-rack' | 'daily-anagram'
 *   date    — optional: 'YYYY-MM-DD' (defaults to today UTC)
 *   period  — optional: 'today' | 'week' | 'month' | 'alltime' (default: 'today')
 *   limit   — optional: max results (default 20, max 100)
 *
 * Returns ranked players with avatar image + display name + scores.
 * Falls back to game history tables if no leaderboard entries exist.
 */
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const game = url.searchParams.get('game');
  if (!game) {
    return new Response(JSON.stringify({ error: 'game parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const period = url.searchParams.get('period') || 'today';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const today = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  let dateFilter = '';
  let dateBinds: string[] = [];

  switch (period) {
    case 'today':
      dateFilter = 'AND l.date = ?';
      dateBinds = [today];
      break;
    case 'week': {
      const weekAgo = new Date();
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      dateFilter = 'AND l.date >= ?';
      dateBinds = [weekAgo.toISOString().split('T')[0]];
      break;
    }
    case 'month': {
      const monthAgo = new Date();
      monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
      dateFilter = 'AND l.date >= ?';
      dateBinds = [monthAgo.toISOString().split('T')[0]];
      break;
    }
    case 'alltime':
      dateFilter = '';
      dateBinds = [];
      break;
    default:
      dateFilter = 'AND l.date = ?';
      dateBinds = [today];
  }

  // For 'today' — rank by best_score (single best word wins)
  // For periods — aggregate: rank by SUM(total_score)
  let query: string;
  let binds: any[];

  if (period === 'today') {
    query = `
      SELECT
        l.user_id,
        l.best_word,
        l.best_score,
        l.total_score,
        l.words_played,
        u.display_name,
        u.avatar_id
      FROM leaderboard l
      LEFT JOIN users u ON u.user_id = l.user_id
      WHERE l.game = ? ${dateFilter}
      ORDER BY l.best_score DESC, l.total_score DESC
      LIMIT ?
    `;
    binds = [game, ...dateBinds, limit];
  } else {
    query = `
      SELECT
        l.user_id,
        MAX(l.best_score) as best_score,
        (SELECT l2.best_word FROM leaderboard l2 WHERE l2.user_id = l.user_id AND l2.game = ? AND l2.best_word != '' ORDER BY l2.best_score DESC LIMIT 1) as best_word,
        SUM(l.total_score) as total_score,
        SUM(l.words_played) as words_played,
        COUNT(l.date) as days_played,
        u.display_name,
        u.avatar_id
      FROM leaderboard l
      LEFT JOIN users u ON u.user_id = l.user_id
      WHERE l.game = ? ${dateFilter}
      GROUP BY l.user_id
      ORDER BY total_score DESC, best_score DESC
      LIMIT ?
    `;
    binds = [game, game, ...dateBinds, limit];
  }

  const result = await db.prepare(query).bind(...binds).all();

  let entries = (result.results || []).map((row: any, idx: number) => ({
    rank: idx + 1,
    user_id: row.user_id,
    display_name: row.display_name || 'Anonymous',
    avatar_src: row.avatar_id ? `/avatars/avatar-${row.avatar_id}.svg` : '/avatars/avatar-1.svg',
    avatar_id: row.avatar_id || 1,
    best_word: row.best_word || '',
    best_score: row.best_score || 0,
    total_score: row.total_score || 0,
    words_played: row.words_played || 0,
    days_played: row.days_played || undefined,
  }));

  // Always merge with game history tables to capture all participation data
  const historyEntries = await getFromHistory(db, game, period, today, limit);
  if (historyEntries.length > 0) {
    // For daily-rack: history uses server-calculated Scrabble scores (authoritative)
    // Replace leaderboard entries entirely with history-computed data
    if (game === 'daily-rack') {
      entries = historyEntries.slice(0, limit);
    } else {
      // Merge: history data takes priority for users not already in leaderboard entries
      const existingUserIds = new Set(entries.map((e: any) => e.user_id));
      for (const hEntry of historyEntries) {
        if (!existingUserIds.has(hEntry.user_id)) {
          entries.push(hEntry);
        } else {
          // Merge higher scores from history into existing entry
          const existing = entries.find((e: any) => e.user_id === hEntry.user_id);
          if (existing) {
            if (hEntry.best_score > existing.best_score) {
              existing.best_score = hEntry.best_score;
              existing.best_word = hEntry.best_word || existing.best_word;
            }
            if (hEntry.total_score > existing.total_score) {
              existing.total_score = hEntry.total_score;
            }
            if (hEntry.words_played > existing.words_played) {
              existing.words_played = hEntry.words_played;
            }
            // Merge cab-specific fields from history if present
            if (hEntry.attempts != null && (!existing.attempts || hEntry.best_score >= existing.best_score)) {
              existing.attempts = hEntry.attempts;
            }
            if (hEntry.timer_used != null && !existing.timer_used) {
              existing.timer_used = hEntry.timer_used;
            }
            if (hEntry.word_length != null && (!existing.word_length || hEntry.best_score >= existing.best_score)) {
              existing.word_length = hEntry.word_length;
            }
            // 60sec-specific: merge games_played
            if (hEntry.games_played != null) {
              existing.games_played = hEntry.games_played;
            }
          }
        }
      }
    }
    // Re-sort and re-rank after merge
    if (period === 'today') {
      entries.sort((a: any, b: any) => b.best_score - a.best_score || b.total_score - a.total_score);
    } else {
      entries.sort((a: any, b: any) => b.total_score - a.total_score || b.best_score - a.best_score);
    }
    entries = entries.slice(0, limit).map((e: any, idx: number) => ({ ...e, rank: idx + 1 }));
  }

  return new Response(JSON.stringify({
    game,
    period,
    date: today,
    entries,
    count: entries.length,
    stats: {
      players: entries.length,
      total_games: entries.reduce((sum: number, e: any) => sum + (e.words_played || 0), 0),
      top_score: entries.length > 0 ? Math.max(...entries.map((e: any) => e.best_score || 0)) : 0,
      // CaB-specific: include formula breakdown for top scorer
      ...(game === 'cab' && entries.length > 0 ? {
        top_best_word: entries[0].best_word || '',
        top_word_length: entries[0].word_length || 0,
        top_attempts: entries[0].best_attempts || 0,
        total_pts_sum: entries.reduce((sum: number, e: any) => sum + (e.total_score || 0), 0),
      } : {}),
      // Daily Rack specific: find the single highest Scrabble-value word across all entries
      ...(game === 'daily-rack' && entries.length > 0 ? (() => {
        // Find the entry with the highest best_score (Scrabble letter value of their best word)
        const bestEntry = entries.reduce((best: any, e: any) => e.best_score > best.best_score ? e : best, entries[0]);
        return {
          top_best_word: bestEntry.best_word || '',
          total_pts_sum: entries.reduce((sum: number, e: any) => sum + (e.total_score || 0), 0),
        };
      })() : {}),
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Query game-specific history tables for participation/completion data.
 * Merges with leaderboard data so all players who participated appear in rankings.
 */
async function getFromHistory(db: any, game: string, period: string, today: string, limit: number) {
  let fallbackQuery = '';
  let fallbackBinds: any[] = [];
  const dateCondition = buildDateCondition(period, today);

  switch (game) {
    case 'sixty-second': {
      // Aggregate from 60sec_history: best single-word score + total per user per day
      if (period === 'today') {
        fallbackQuery = `
          SELECT h.user_id, MAX(h.points) as best_score,
            (SELECT word FROM "60sec_history" h2 WHERE h2.user_id = h.user_id AND date(h2.created_at) = ? ORDER BY h2.points DESC LIMIT 1) as best_word,
            SUM(h.points) as total_score, COUNT(*) as words_played,
            COUNT(DISTINCT h.round_id) as games_played,
            u.display_name, u.avatar_id
          FROM "60sec_history" h
          LEFT JOIN users u ON u.user_id = h.user_id
          WHERE date(h.created_at) = ?
          GROUP BY h.user_id
          ORDER BY best_score DESC, total_score DESC
          LIMIT ?
        `;
        fallbackBinds = [today, today, limit];
      } else {
        fallbackQuery = `
          SELECT h.user_id, MAX(h.points) as best_score,
            SUM(h.points) as total_score, COUNT(*) as words_played,
            COUNT(DISTINCT h.round_id) as games_played,
            u.display_name, u.avatar_id
          FROM "60sec_history" h
          LEFT JOIN users u ON u.user_id = h.user_id
          ${dateCondition.where}
          GROUP BY h.user_id
          ORDER BY total_score DESC, best_score DESC
          LIMIT ?
        `;
        fallbackBinds = [...dateCondition.binds, limit];
      }
      break;
    }
    case 'cab': {
      // Aggregate from CaB_Scores: count solved games, best = fewest attempts (inverted to score)
      // Score: (11 - attempts) * word_length gives higher score for fewer attempts on longer words
      // Also return cab-specific fields: split_time (timer used), word_length, attempts, best_word
      if (period === 'today') {
        fallbackQuery = `
          SELECT s.user_id,
            MAX((11 - s.attempts) * c.length) as best_score,
            SUM((11 - s.attempts) * c.length) as total_score,
            COUNT(*) as words_played,
            (SELECT s2.attempts FROM CaB_Scores s2 JOIN CaB c2 ON c2.id = s2.wordId WHERE s2.user_id = s.user_id AND s2.solved = 1 AND date(s2.startDatetime) = ? ORDER BY (11 - s2.attempts) * c2.length DESC LIMIT 1) as best_attempts,
            MIN(s.split_time) as best_time,
            (SELECT c2.length FROM CaB_Scores s2 JOIN CaB c2 ON c2.id = s2.wordId WHERE s2.user_id = s.user_id AND s2.solved = 1 AND date(s2.startDatetime) = ? ORDER BY (11 - s2.attempts) * c2.length DESC LIMIT 1) as word_length,
            (SELECT c2.word FROM CaB_Scores s2 JOIN CaB c2 ON c2.id = s2.wordId WHERE s2.user_id = s.user_id AND s2.solved = 1 AND date(s2.startDatetime) = ? ORDER BY (11 - s2.attempts) * c2.length DESC LIMIT 1) as best_word,
            u.display_name, u.avatar_id
          FROM CaB_Scores s
          JOIN CaB c ON c.id = s.wordId
          LEFT JOIN users u ON u.user_id = s.user_id
          WHERE s.solved = 1 AND date(s.startDatetime) = ?
          GROUP BY s.user_id
          ORDER BY best_score DESC, total_score DESC
          LIMIT ?
        `;
        fallbackBinds = [today, today, today, today, limit];
      } else {
        fallbackQuery = `
          SELECT s.user_id,
            MAX((11 - s.attempts) * c.length) as best_score,
            SUM((11 - s.attempts) * c.length) as total_score,
            COUNT(*) as words_played,
            (SELECT s2.attempts FROM CaB_Scores s2 JOIN CaB c2 ON c2.id = s2.wordId WHERE s2.user_id = s.user_id AND s2.solved = 1 ORDER BY (11 - s2.attempts) * c2.length DESC LIMIT 1) as best_attempts,
            MIN(s.split_time) as best_time,
            (SELECT c2.length FROM CaB_Scores s2 JOIN CaB c2 ON c2.id = s2.wordId WHERE s2.user_id = s.user_id AND s2.solved = 1 ORDER BY (11 - s2.attempts) * c2.length DESC LIMIT 1) as word_length,
            (SELECT c2.word FROM CaB_Scores s2 JOIN CaB c2 ON c2.id = s2.wordId WHERE s2.user_id = s.user_id AND s2.solved = 1 ORDER BY (11 - s2.attempts) * c2.length DESC LIMIT 1) as best_word,
            u.display_name, u.avatar_id
          FROM CaB_Scores s
          JOIN CaB c ON c.id = s.wordId
          LEFT JOIN users u ON u.user_id = s.user_id
          WHERE s.solved = 1 ${dateCondition.where.replace('WHERE', 'AND').replace('date(h.created_at)', 'date(s.startDatetime)')}
          GROUP BY s.user_id
          ORDER BY total_score DESC, best_score DESC
          LIMIT ?
        `;
        fallbackBinds = [...dateCondition.binds, limit];
      }
      break;
    }
    case 'daily-rack': {
      // Fetch individual word submissions and recalculate scores server-side
      // This ensures correct Scrabble letter values regardless of stored score
      let rackQuery: string;
      let rackBinds: any[];

      if (period === 'today') {
        rackQuery = `
          SELECT r.user_id, r.word, u.display_name, u.avatar_id
          FROM daily_rack_scores r
          LEFT JOIN users u ON u.user_id = r.user_id
          WHERE r.date = ?
          ORDER BY r.user_id
        `;
        rackBinds = [today];
      } else if (period === 'alltime') {
        rackQuery = `
          SELECT r.user_id, r.word, u.display_name, u.avatar_id
          FROM daily_rack_scores r
          LEFT JOIN users u ON u.user_id = r.user_id
          ORDER BY r.user_id
          LIMIT 5000
        `;
        rackBinds = [];
      } else {
        rackQuery = `
          SELECT r.user_id, r.word, u.display_name, u.avatar_id
          FROM daily_rack_scores r
          LEFT JOIN users u ON u.user_id = r.user_id
          WHERE r.date >= ?
          ORDER BY r.user_id
          LIMIT 5000
        `;
        rackBinds = [dateCondition.binds[0]];
      }

      try {
        const rackResult = await db.prepare(rackQuery).bind(...rackBinds).all();
        const rows = rackResult.results || [];

        // Aggregate per user with server-calculated Scrabble scores
        const userMap = new Map<string, { user_id: string; display_name: string; avatar_id: number; words: { word: string; score: number }[] }>();
        for (const row of rows as any[]) {
          if (!userMap.has(row.user_id)) {
            userMap.set(row.user_id, {
              user_id: row.user_id,
              display_name: row.display_name || 'Anonymous',
              avatar_id: row.avatar_id || 1,
              words: [],
            });
          }
          const wordScore = scrabbleScore(row.word);
          userMap.get(row.user_id)!.words.push({ word: row.word, score: wordScore });
        }

        // Build entries sorted by best_score (highest single word)
        const rackEntries = Array.from(userMap.values()).map((u) => {
          const bestWord = u.words.reduce((best, w) => w.score > best.score ? w : best, { word: '', score: 0 });
          const totalScore = u.words.reduce((sum, w) => sum + w.score, 0);
          return {
            rank: 0,
            user_id: u.user_id,
            display_name: u.display_name,
            avatar_src: `/avatars/avatar-${u.avatar_id}.svg`,
            avatar_id: u.avatar_id,
            best_word: bestWord.word,
            best_score: bestWord.score,
            total_score: totalScore,
            words_played: u.words.length,
          };
        });

        if (period === 'today') {
          rackEntries.sort((a, b) => b.best_score - a.best_score || b.total_score - a.total_score);
        } else {
          rackEntries.sort((a, b) => b.total_score - a.total_score || b.best_score - a.best_score);
        }

        return rackEntries.slice(0, limit).map((e, idx) => ({ ...e, rank: idx + 1 }));
      } catch {
        return [];
      }
    }
    case 'daily-anagram': {
      // Aggregate from daily_anagram_scores: solved games, score = (6 - attempts) * 10 (fewer guesses = higher score)
      // JOIN daily_anagram to get the word solved for best_word display
      if (period === 'today') {
        fallbackQuery = `
          SELECT a.user_id,
            MAX(CASE WHEN a.solved = 1 THEN (6 - a.attempts) * 10 ELSE 0 END) as best_score,
            SUM(CASE WHEN a.solved = 1 THEN (6 - a.attempts) * 10 ELSE 0 END) as total_score,
            COUNT(*) as words_played,
            (SELECT da.word FROM daily_anagram_scores a2 JOIN daily_anagram da ON da.date = a2.date WHERE a2.user_id = a.user_id AND a2.solved = 1 AND a2.date = ? ORDER BY (6 - a2.attempts) DESC LIMIT 1) as best_word,
            u.display_name, u.avatar_id
          FROM daily_anagram_scores a
          LEFT JOIN users u ON u.user_id = a.user_id
          WHERE a.date = ? AND a.user_id != ''
          GROUP BY a.user_id
          ORDER BY best_score DESC, total_score DESC
          LIMIT ?
        `;
        fallbackBinds = [today, today, limit];
      } else {
        fallbackQuery = `
          SELECT a.user_id,
            MAX(CASE WHEN a.solved = 1 THEN (6 - a.attempts) * 10 ELSE 0 END) as best_score,
            SUM(CASE WHEN a.solved = 1 THEN (6 - a.attempts) * 10 ELSE 0 END) as total_score,
            COUNT(*) as words_played,
            (SELECT da.word FROM daily_anagram_scores a2 JOIN daily_anagram da ON da.date = a2.date WHERE a2.user_id = a.user_id AND a2.solved = 1 ORDER BY (6 - a2.attempts) DESC LIMIT 1) as best_word,
            u.display_name, u.avatar_id
          FROM daily_anagram_scores a
          LEFT JOIN users u ON u.user_id = a.user_id
          WHERE a.user_id != '' ${period === 'alltime' ? '' : 'AND a.date >= ?'}
          GROUP BY a.user_id
          ORDER BY total_score DESC, best_score DESC
          LIMIT ?
        `;
        fallbackBinds = period === 'alltime' ? [limit] : [dateCondition.binds[0], limit];
      }
      break;
    }
    default:
      return [];
  }

  if (!fallbackQuery) return [];

  try {
    const fallbackResult = await db.prepare(fallbackQuery).bind(...fallbackBinds).all();
    return (fallbackResult.results || []).map((row: any, idx: number) => ({
      rank: idx + 1,
      user_id: row.user_id,
      display_name: row.display_name || 'Anonymous',
      avatar_src: row.avatar_id ? `/avatars/avatar-${row.avatar_id}.svg` : '/avatars/avatar-1.svg',
      avatar_id: row.avatar_id || 1,
      best_word: row.best_word || '',
      best_score: row.best_score || 0,
      total_score: row.total_score || 0,
      words_played: row.words_played || 0,
      // 60sec-specific: distinct game sessions
      ...(row.games_played != null ? { games_played: row.games_played } : {}),
      // Cab-specific fields (only populated for cab game)
      ...(row.best_attempts != null ? { attempts: row.best_attempts } : {}),
      ...(row.best_time != null ? { timer_used: row.best_time } : {}),
      ...(row.word_length != null ? { word_length: row.word_length } : {}),
    }));
  } catch {
    return [];
  }
}

function buildDateCondition(period: string, today: string) {
  switch (period) {
    case 'today':
      return { where: 'WHERE date(h.created_at) = ?', binds: [today] };
    case 'week': {
      const weekAgo = new Date();
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      return { where: 'WHERE date(h.created_at) >= ?', binds: [weekAgo.toISOString().split('T')[0]] };
    }
    case 'month': {
      const monthAgo = new Date();
      monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
      return { where: 'WHERE date(h.created_at) >= ?', binds: [monthAgo.toISOString().split('T')[0]] };
    }
    case 'alltime':
      return { where: '', binds: [] };
    default:
      return { where: 'WHERE date(h.created_at) = ?', binds: [today] };
  }
}
