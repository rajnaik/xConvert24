import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Admin API — Users Activity Overview
 * GET /api/users — aggregates user activity from all tables grouped by user_id
 *
 * Returns:
 *   summary: { totalUsers, totalClicks, totalGamesPlayed, totalSolverUses }
 *   users: [ { user_id, clicks, stars, diamonds, streak, best_streak, games_played, solver_uses, quizzes, anagrams, racks, cab_games, practice_words, last_active, first_seen } ]
 */

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  try {
    // 1. Clicks per user
    const clicksResult = await db.prepare(
      `SELECT user_id, COUNT(*) as click_count, MAX(created_at) as last_click
       FROM clicks WHERE user_id != '' GROUP BY user_id`
    ).all();
    const clicksMap: Record<string, { count: number; last: string }> = {};
    for (const r of (clicksResult.results || []) as any[]) {
      clicksMap[r.user_id] = { count: r.click_count, last: r.last_click };
    }

    // 2. Rewards (stars, diamonds, streaks)
    const rewardsResult = await db.prepare(
      `SELECT user_id, total_stars, total_diamonds, current_streak, best_streak,
              diamond_streak, last_active_date, created_at
       FROM user_rewards`
    ).all();
    const rewardsMap: Record<string, any> = {};
    for (const r of (rewardsResult.results || []) as any[]) {
      rewardsMap[r.user_id] = r;
    }

    // 3. Quiz scores per user
    const quizResult = await db.prepare(
      `SELECT user_id, COUNT(*) as quiz_count FROM quiz_scores GROUP BY user_id`
    ).all();
    const quizMap: Record<string, number> = {};
    for (const r of (quizResult.results || []) as any[]) {
      quizMap[r.user_id] = r.quiz_count;
    }

    // 4. Daily anagram scores per user
    const anagramResult = await db.prepare(
      `SELECT user_id, COUNT(*) as anagram_count FROM daily_anagram_scores GROUP BY user_id`
    ).all();
    const anagramMap: Record<string, number> = {};
    for (const r of (anagramResult.results || []) as any[]) {
      anagramMap[r.user_id] = r.anagram_count;
    }

    // 5. Daily rack scores per user
    const rackScoreResult = await db.prepare(
      `SELECT user_id, COUNT(*) as rack_count FROM daily_rack_scores GROUP BY user_id`
    ).all();
    const rackMap: Record<string, number> = {};
    for (const r of (rackScoreResult.results || []) as any[]) {
      rackMap[r.user_id] = r.rack_count;
    }

    // 6. Rack history (solver uses) per user
    const solverResult = await db.prepare(
      `SELECT user_id, COUNT(*) as solver_count FROM rack_history GROUP BY user_id`
    ).all();
    const solverMap: Record<string, number> = {};
    for (const r of (solverResult.results || []) as any[]) {
      solverMap[r.user_id] = r.solver_count;
    }

    // 7. CaB scores per user
    const cabResult = await db.prepare(
      `SELECT user_id, COUNT(*) as cab_count FROM CaB_Scores WHERE user_id != '' GROUP BY user_id`
    ).all();
    const cabMap: Record<string, number> = {};
    for (const r of (cabResult.results || []) as any[]) {
      cabMap[r.user_id] = r.cab_count;
    }

    // 8. Wordbench practice per user
    const practiceResult = await db.prepare(
      `SELECT user_id, COUNT(*) as practice_count FROM wordbench_practice GROUP BY user_id`
    ).all();
    const practiceMap: Record<string, number> = {};
    for (const r of (practiceResult.results || []) as any[]) {
      practiceMap[r.user_id] = r.practice_count;
    }

    // 9. Distinct active days per user (for "return customers" tracking)
    const activeDaysResult = await db.prepare(
      `SELECT user_id, COUNT(DISTINCT date(created_at)) as active_days
       FROM clicks WHERE user_id != '' GROUP BY user_id`
    ).all();
    const activeDaysMap: Record<string, number> = {};
    for (const r of (activeDaysResult.results || []) as any[]) {
      activeDaysMap[r.user_id] = r.active_days;
    }

    // 10. Most recent location (city, country) per user from clicks
    const locationResult = await db.prepare(
      `SELECT user_id, city, country FROM clicks
       WHERE user_id != '' AND (city != '' OR country != '')
       GROUP BY user_id
       HAVING MAX(id)`
    ).all();
    const locationMap: Record<string, { city: string; country: string }> = {};
    for (const r of (locationResult.results || []) as any[]) {
      locationMap[r.user_id] = { city: r.city || '', country: r.country || '' };
    }

    // Collect all unique user_ids
    const allUserIds = new Set<string>();
    Object.keys(clicksMap).forEach(id => allUserIds.add(id));
    Object.keys(rewardsMap).forEach(id => allUserIds.add(id));
    Object.keys(quizMap).forEach(id => allUserIds.add(id));
    Object.keys(anagramMap).forEach(id => allUserIds.add(id));
    Object.keys(rackMap).forEach(id => allUserIds.add(id));
    Object.keys(solverMap).forEach(id => allUserIds.add(id));
    Object.keys(cabMap).forEach(id => allUserIds.add(id));
    Object.keys(practiceMap).forEach(id => allUserIds.add(id));
    Object.keys(activeDaysMap).forEach(id => allUserIds.add(id));

    // Build unified user list
    const users = Array.from(allUserIds).map(user_id => {
      const reward = rewardsMap[user_id];
      const clicks = clicksMap[user_id]?.count || 0;
      const quizzes = quizMap[user_id] || 0;
      const anagrams = anagramMap[user_id] || 0;
      const racks = rackMap[user_id] || 0;
      const solver_uses = solverMap[user_id] || 0;
      const cab_games = cabMap[user_id] || 0;
      const practice_words = practiceMap[user_id] || 0;
      const games_played = quizzes + anagrams + racks + cab_games;

      // Determine last active from multiple sources
      const lastDates = [
        clicksMap[user_id]?.last,
        reward?.last_active_date,
      ].filter(Boolean);
      const last_active = lastDates.length > 0
        ? lastDates.sort().reverse()[0]
        : '';

      const first_seen = reward?.created_at || clicksMap[user_id]?.last || '';

      return {
        user_id,
        clicks,
        stars: reward?.total_stars || 0,
        diamonds: reward?.total_diamonds || 0,
        current_streak: reward?.current_streak || 0,
        best_streak: reward?.best_streak || 0,
        diamond_streak: reward?.diamond_streak || 0,
        games_played,
        quizzes,
        anagrams,
        racks,
        cab_games,
        solver_uses,
        practice_words,
        active_days: activeDaysMap[user_id] || 1,
        returning: (activeDaysMap[user_id] || 1) >= 2,
        last_active,
        first_seen,
        location: locationMap[user_id] ? [locationMap[user_id].city, locationMap[user_id].country].filter(Boolean).join(', ') : '',
      };
    });

    // Sort by most active (clicks + games + solver) descending
    users.sort((a, b) => (b.clicks + b.games_played + b.solver_uses) - (a.clicks + a.games_played + a.solver_uses));

    // Summary
    const totalUsers = users.length;
    const totalClicks = users.reduce((sum, u) => sum + u.clicks, 0);
    const totalGamesPlayed = users.reduce((sum, u) => sum + u.games_played, 0);
    const totalSolverUses = users.reduce((sum, u) => sum + u.solver_uses, 0);
    const totalReturning = users.filter(u => u.returning).length;

    return new Response(JSON.stringify({
      summary: { totalUsers, totalClicks, totalGamesPlayed, totalSolverUses, totalReturning },
      users,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
};
