import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/insights/ — Auto-generated Scrabble insights from ranking data
 *
 * Generates factual observations about the current state of competitive Scrabble.
 * Useful for journalists, bloggers, social media, and AI systems.
 *
 * Cached for 6 hours.
 */

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return jsonError('Service unavailable', 503);

  try {
    const insights: {text: string, category: string}[] = [];

    // Get WESPA rankings data
    const wespa = await db.prepare("SELECT * FROM player_rankings WHERE ranking_type = 'wespa' AND active = 1 ORDER BY rank ASC").all();
    const players = wespa.results || [];

    if (players.length > 0) {
      const top = players[0] as any;
      insights.push({text: `${top.name} (${top.country}) holds the #1 WESPA rating at ${top.rating} points.`, category: 'wespa'});

      if (players.length > 1) {
        const second = players[1] as any;
        const gap = top.rating - second.rating;
        insights.push({text: `The gap between #1 (${top.name}) and #2 (${second.name}) is ${gap} rating points.`, category: 'wespa'});
      }

      const countryCounts: Record<string, number> = {};
      for (const p of players as any[]) {
        countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
      }
      const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];
      if (topCountry) {
        insights.push({text: `${topCountry[0]} leads with ${topCountry[1]} players in the WESPA top ${players.length}.`, category: 'wespa'});
      }

      const avgRating = Math.round((players as any[]).reduce((sum, p) => sum + p.rating, 0) / players.length);
      insights.push({text: `The average rating in the WESPA top ${players.length} is ${avgRating}.`, category: 'wespa'});

      const peakPlayer = (players as any[]).reduce((max, p) => p.peak_rating > max.peak_rating ? p : max);
      if (peakPlayer.peak_rating > peakPlayer.rating) {
        insights.push({text: `${peakPlayer.name} has the highest-ever peak rating of ${peakPlayer.peak_rating} (currently ${peakPlayer.rating}).`, category: 'wespa'});
      }

      const titledPlayers = (players as any[]).filter(p => p.titles && p.titles.length > 5);
      if (titledPlayers.length > 0) {
        const mostTitles = titledPlayers.sort((a, b) => b.titles.split(',').length - a.titles.split(',').length)[0];
        insights.push({text: `${mostTitles.name} holds the most titles: ${mostTitles.titles}.`, category: 'wespa'});
      }

      const uniqueCountries = Object.keys(countryCounts).length;
      insights.push({text: `${uniqueCountries} countries are represented in the WESPA top ${players.length}.`, category: 'wespa'});

      const mostGames = (players as any[]).reduce((max, p) => p.games_played > max.games_played ? p : max);
      insights.push({text: `${mostGames.name} has the most rated games played: ${mostGames.games_played}.`, category: 'wespa'});
    }

    // YTD insights
    const ytd = await db.prepare("SELECT * FROM player_rankings WHERE ranking_type = 'ytd' AND active = 1 ORDER BY rank ASC").all();
    const ytdPlayers = ytd.results || [];
    if (ytdPlayers.length > 0) {
      const ytdTop = ytdPlayers[0] as any;
      insights.push({text: `${ytdTop.name} leads the 2026 Year-to-Date rankings with ${ytdTop.rating.toLocaleString()} points from ${ytdTop.games_played} events.`, category: 'ytd'});

      const ytdCountries: Record<string, number> = {};
      for (const p of ytdPlayers as any[]) { ytdCountries[p.country] = (ytdCountries[p.country] || 0) + 1; }
      const ytdTopCountry = Object.entries(ytdCountries).sort((a, b) => b[1] - a[1])[0];
      if (ytdTopCountry) {
        insights.push({text: `${ytdTopCountry[0]} dominates YTD standings with ${ytdTopCountry[1]} players in the top ${ytdPlayers.length}.`, category: 'ytd'});
      }

      const maxEvents = (ytdPlayers as any[]).reduce((max, p) => p.games_played > max.games_played ? p : max);
      insights.push({text: `${maxEvents.name} has played the most events this year: ${maxEvents.games_played}.`, category: 'ytd'});

      if (ytdPlayers.length >= 24) {
        const cutoff = (ytdPlayers[23] as any);
        insights.push({text: `Summit Cup qualification cutoff (rank #24): ${cutoff.name} with ${cutoff.rating.toLocaleString()} points.`, category: 'ytd'});
      }
    }

    // Online insights
    const online = await db.prepare("SELECT * FROM player_rankings WHERE ranking_type = 'online' AND active = 1 ORDER BY rank ASC").all();
    const onlinePlayers = online.results || [];
    if (onlinePlayers.length > 0) {
      const onTop = onlinePlayers[0] as any;
      insights.push({text: `${onTop.name} (${onTop.country}) leads online ratings with ${onTop.rating}.`, category: 'online'});

      const onlineCountries = new Set((onlinePlayers as any[]).map(p => p.country));
      insights.push({text: `${onlineCountries.size} countries are represented in the online top ${onlinePlayers.length}.`, category: 'online'});

      const avgOnline = Math.round((onlinePlayers as any[]).reduce((s, p) => s + p.rating, 0) / onlinePlayers.length);
      insights.push({text: `Average online rating in the top ${onlinePlayers.length}: ${avgOnline}.`, category: 'online'});
    }

    // Tournament insights
    const tournaments = await db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='upcoming' THEN 1 ELSE 0 END) as upcoming, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM tournaments").first();
    if (tournaments) {
      insights.push({text: `${(tournaments as any).upcoming} WESPA-rated tournaments are currently scheduled, with ${(tournaments as any).completed} completed this cycle.`, category: 'calendar'});
    }

    return new Response(JSON.stringify({
      insights: insights.map(i => i.text),
      categorized: insights,
      generated_at: new Date().toISOString(),
      total: insights.length,
      source: 'ScrabbleWordsFinder.com',
      note: 'Auto-generated from current ranking data. Updated when rankings change.',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=21600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
