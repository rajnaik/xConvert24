import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * MyBag API — star/diamond earning history for a user
 * 
 * GET /api/mybag?user_id=X — returns earning history + totals
 * Optional: ?limit=30 (default 30, max 90)
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '30', 10) || 30, 1), 90);

  // Get lifetime totals from user_rewards
  const rewards = await db.prepare(
    'SELECT total_stars, total_diamonds, current_streak, best_streak, diamond_streak, best_diamond_streak, last_active_date FROM user_rewards WHERE user_id = ?'
  ).bind(userId).first() as any;

  // Compute actual earned diamonds (daily_progress diamond days + bonus_diamonds + mined from diamond_claims)
  const earnedCountResult = await db.prepare(
    'SELECT COUNT(*) as count FROM daily_progress WHERE user_id = ? AND diamond = 1'
  ).bind(userId).first() as any;
  const earnedDiamonds = earnedCountResult?.count || 0;

  const bonusCountResult = await db.prepare(
    'SELECT COUNT(*) as count FROM bonus_diamonds WHERE user_id = ?'
  ).bind(userId).first() as any;
  const bonusDiamonds = bonusCountResult?.count || 0;

  const minedCountResult = await db.prepare(
    'SELECT COALESCE(SUM(diamonds_earned), 0) as total FROM diamond_claims WHERE user_id = ?'
  ).bind(userId).first() as any;
  const minedDiamonds = minedCountResult?.total || 0;

  const totalEarnedDiamonds = earnedDiamonds + bonusDiamonds + minedDiamonds;

  // Get earning history from daily_progress (most recent first)
  const historyResult = await db.prepare(
    'SELECT date, stars_earned, stars_total, diamond FROM daily_progress WHERE user_id = ? ORDER BY date DESC LIMIT ?'
  ).bind(userId, limit).all();

  const history = (historyResult.results || []).map((row: any) => {
    const starsEarned: string[] = JSON.parse(row.stars_earned || '[]');
    return {
      date: row.date,
      stars: starsEarned,
      stars_count: row.stars_total,
      diamond: row.diamond === 1,
    };
  });

  // Get activity registry for name/icon lookup
  const activitiesResult = await db.prepare(
    'SELECT slug, name, icon, color FROM activities ORDER BY sort_order'
  ).all();
  const activities = (activitiesResult.results || []).reduce((map: any, a: any) => {
    map[a.slug] = { name: a.name, icon: a.icon, color: a.color };
    return map;
  }, {} as Record<string, { name: string; icon: string; color: string }>);

  // Compute badge progression from total earned diamonds
  const totalDiamonds = totalEarnedDiamonds;
  const BADGE_TIERS = [
    { name: 'Word Maker', img: '/badges/word-maker.svg', threshold: 25, theme: 'Beginner' },
    { name: 'Word Smith', img: '/badges/word-smith.svg', threshold: 100, theme: 'Crafter' },
    { name: 'Word Master', img: '/badges/word-master.svg', threshold: 250, theme: 'Skilled' },
    { name: 'Word Wizard', img: '/badges/word-wizard.svg', threshold: 500, theme: 'Magical' },
    { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', threshold: 1000, theme: 'Vocabulary' },
    { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', threshold: 2500, theme: 'Wise' },
    { name: 'Lex Legend', img: '/badges/lex-legend.svg', threshold: 5000, theme: 'Legendary' },
    { name: 'Vocabulary Virtuoso', img: '/badges/vocabulary-virtuoso.svg', threshold: 10000, theme: 'Elite' },
    { name: 'Dictionary Guardian', img: '/badges/dictionary-guardian.svg', threshold: 20000, theme: 'Protector of words' },
    { name: 'Letter Lord', img: '/badges/letter-lord.svg', threshold: 40000, theme: 'Commander' },
    { name: 'Tile Titan', img: '/badges/tile-titan.svg', threshold: 75000, theme: 'Giant' },
    { name: 'Word Emperor', img: '/badges/word-emperor.svg', threshold: 125000, theme: 'Royal' },
    { name: 'Lexicon Immortal', img: '/badges/lexicon-immortal.svg', threshold: 250000, theme: 'Eternal' },
    { name: 'Alphabet Ascendant', img: '/badges/alphabet-ascendant.svg', threshold: 500000, theme: 'Mythical' },
    { name: 'Grand Word Deity', img: '/badges/grand-word-deity.svg', threshold: 1000000, theme: 'Ultimate' },
  ];

  const badges = BADGE_TIERS.map((tier) => ({
    name: tier.name,
    img: tier.img,
    info: tier.threshold.toLocaleString() + ' diamonds required — ' + tier.theme,
    theme: tier.theme,
    threshold: tier.threshold,
    achieved: totalDiamonds >= tier.threshold,
  }));

  return new Response(JSON.stringify({
    totals: {
      total_stars: rewards?.total_stars || 0,
      total_diamonds: totalEarnedDiamonds,
      current_streak: rewards?.current_streak || 0,
      best_streak: rewards?.best_streak || 0,
      diamond_streak: rewards?.diamond_streak || 0,
      best_diamond_streak: rewards?.best_diamond_streak || 0,
      last_active_date: rewards?.last_active_date || '',
    },
    activities,
    history,
    badges,
  }), { headers: { 'Content-Type': 'application/json' } });
};
