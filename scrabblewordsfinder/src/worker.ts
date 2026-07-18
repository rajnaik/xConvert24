/**
 * Custom Worker entrypoint for ScrabbleWordsFinder
 * Handles both HTTP requests (via Astro) and scheduled cron events (WOTD push)
 */
import { handle } from '@astrojs/cloudflare/handler';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    return handle(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    // Daily cron (0 0 * * *) — send WOTD push notification + fetch latest scrabble news
    ctx.waitUntil(sendDailyWOTD(env));
    ctx.waitUntil(fetchLatestNews(env));

    // Monthly tasks (run on 1st of each month only)
    const today = new Date();
    if (today.getUTCDate() === 1) {
      ctx.waitUntil(takeMonthlySnapshot(env));
    }
  },
} satisfies ExportedHandler;

async function sendDailyWOTD(env: any) {
  try {
    const db = env.DB;
    if (!db) return;

    const today = new Date().toISOString().split('T')[0];

    // Get today's WOTD
    const wotd = await db.prepare(
      'SELECT word, meaning, fun_fact FROM word_of_the_day WHERE date = ?'
    ).bind(today).first();

    if (!wotd) return;

    // Get all active subscribers
    const subs = await db.prepare(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE active = 1'
    ).all();

    const subscribers = subs.results || [];
    if (subscribers.length === 0) return;

    const vapidPublicKey = env.VAPID_PUBLIC_KEY || '';
    const vapidPrivateKey = env.VAPID_PRIVATE_KEY || '';
    if (!vapidPublicKey || !vapidPrivateKey) return;

    // Build notification payload
    const payload = JSON.stringify({
      title: `📖 Word of the Day: ${wotd.word}`,
      body: wotd.meaning || 'Discover today\'s word!',
      url: '/activities/#wotd',
      date: today,
    });

    // Send to all subscribers — empty payload push with VAPID auth
    // The service worker will fetch WOTD data itself when it receives the push event
    for (const sub of subscribers) {
      try {
        const audience = new URL(sub.endpoint as string).origin;
        const vapidToken = await createCronVAPIDToken(audience, vapidPrivateKey, vapidPublicKey);

        const response = await fetch(sub.endpoint as string, {
          method: 'POST',
          headers: {
            'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
            'Content-Length': '0',
            'TTL': '86400',
            'Urgency': 'normal',
          },
        });

        if (response.status === 410 || response.status === 404) {
          // Subscription expired
          await db.prepare('UPDATE push_subscriptions SET active = 0 WHERE id = ?').bind(sub.id).run();
        } else if (response.ok || response.status === 201) {
          await db.prepare("UPDATE push_subscriptions SET last_sent = datetime('now') WHERE id = ?").bind(sub.id).run();
        }
      } catch {
        // Individual send failure — skip
      }
    }
  } catch (err) {
    console.error('WOTD push cron error:', err);
  }
}

/**
 * Create VAPID JWT token for cron push authorization (ES256)
 */
async function createCronVAPIDToken(audience: string, privateKeyBase64: string, publicKeyBase64: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 86400, sub: 'mailto:contact@scrabblewordsfinder.com' };

  const headerB64 = cronBase64url(JSON.stringify(header));
  const claimsB64 = cronBase64url(JSON.stringify(claims));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import VAPID private key as JWK (works with raw 32-byte base64url keys from web-push)
  // The private key (d) is 32 bytes base64url, public key (x,y) is 65 bytes (04 + 32x + 32y)
  const pubBytes = new Uint8Array(cronBase64urlDecode(publicKeyBase64));
  // Public key is 65 bytes: 0x04 prefix + 32 bytes X + 32 bytes Y
  const x = cronBase64url(pubBytes.slice(1, 33));
  const y = cronBase64url(pubBytes.slice(33, 65));

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: x,
    y: y,
    d: privateKeyBase64, // Already base64url
  };

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw r||s format (64 bytes) for JWT
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes[0] === 0x30) {
    // DER encoded — extract r and s
    const rLen = sigBytes[3];
    const rStart = 4;
    const r = sigBytes.slice(rStart + (rLen > 32 ? 1 : 0), rStart + rLen);
    const sLenOffset = rStart + rLen + 1;
    const sLen = sigBytes[sLenOffset];
    const sStart = sLenOffset + 1;
    const s = sigBytes.slice(sStart + (sLen > 32 ? 1 : 0), sStart + sLen);
    rawSig = new Uint8Array(64);
    rawSig.set(r.length <= 32 ? r : r.slice(r.length - 32), 32 - Math.min(r.length, 32));
    rawSig.set(s.length <= 32 ? s : s.slice(s.length - 32), 64 - Math.min(s.length, 32));
  } else {
    // Already raw format (64 bytes)
    rawSig = sigBytes;
  }

  return `${unsignedToken}.${cronBase64url(rawSig)}`;
}

function cronBase64url(data: string | Uint8Array): string {
  const str = typeof data === 'string' ? btoa(data) : btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function cronBase64urlDecode(str: string): ArrayBuffer {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}


/**
 * Fetch latest Scrabble news from Tavily web search, AI-summarise, store in DB.
 * Runs daily via cron. Rotates search queries to cover different angles.
 */
async function fetchLatestNews(env: any) {
  try {
    const db = env.DB;
    const ai = env.AI;
    const tavilyKey = env.TAVILY_API_KEY;
    if (!db || !tavilyKey) return;

    // Rotate queries by day of week
    const queries = [
      'competitive scrabble tournament results 2026',
      'WESPA scrabble news',
      'NASPA scrabble tournament winners 2026',
      'world scrabble championship news',
      'scrabble community news events 2026',
      'international scrabble tournament results',
      'scrabble player achievements 2026',
    ];
    const dayOfWeek = new Date().getDay();
    const query = queries[dayOfWeek % queries.length];

    // Step 1: Search with Tavily for real, current results
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: 'basic',
        max_results: 8,
        days: 30,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!searchRes.ok) {
      console.error(`[News Cron] Tavily search failed: ${searchRes.status}`);
      return;
    }

    const searchData: any = await searchRes.json();
    const rawResults = searchData.results || [];

    // Filter out generic topic/tag/category pages — only keep actual articles
    const results = rawResults.filter((r: any) => {
      const url = r.url || '';
      if (/\/topic\/|\/tag\/|\/tags\/|\/category\/|\/categories\/|\/search\?/.test(url)) return false;
      const path = new URL(url).pathname;
      if (path === '/' || path === '') return false;
      if (path.split('/').filter(Boolean).length < 2 && !path.includes('-')) return false;
      return true;
    });

    if (results.length === 0) {
      console.log('[News Cron] No article-level results after filtering');
      return;
    }

    // Step 2: Build news items directly from Tavily results + optional AI summary
    let newsItems: any[] = [];

    // Build items from raw Tavily results (guaranteed real URLs + dates)
    const rawItems = results.slice(0, 5).map((r: any) => ({
      title: (r.title || '').slice(0, 80),
      summary: (r.content || '').slice(0, 300),
      source_url: r.url || '',
      source_name: (() => { try { return new URL(r.url || '').hostname.replace('www.', ''); } catch { return ''; } })(),
      category: 'general' as string,
      published_date: r.published_date ? r.published_date.split('T')[0] : '',
    }));

    // Optionally use AI to improve summaries (but keep URLs and dates from Tavily)
    if (ai) {
      try {
        const snippets = results.slice(0, 5).map((r: any, i: number) =>
          `${i + 1}. "${r.title}" — ${r.content?.slice(0, 200) || ''}`
        ).join('\n');

        const response = await ai.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
          messages: [
            { role: 'system', content: 'You improve news summaries. For each numbered item, write a better 2-sentence summary. Return a JSON array of strings. JSON only.' },
            { role: 'user', content: `Improve these Scrabble news summaries:\n${snippets}\n\nReturn JSON array of summaries, e.g. ["summary1", "summary2", ...]` }
          ],
          max_tokens: 1000,
        });

        const text = response?.response || '';
        try {
          const summaries = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          if (Array.isArray(summaries)) {
            summaries.forEach((s: string, i: number) => {
              if (i < rawItems.length && typeof s === 'string' && s.length > 20) {
                rawItems[i].summary = s.slice(0, 300);
              }
            });
          }
        } catch { /* keep raw summaries */ }
      } catch { /* AI failed, use raw */ }
    }

    // Categorise based on keywords
    for (const item of rawItems) {
      const lower = (item.title + ' ' + item.summary).toLowerCase();
      if (lower.includes('tournament') || lower.includes('championship') || lower.includes('won') || lower.includes('winner')) {
        item.category = 'tournament';
      } else if (lower.includes('player') || lower.includes('champion') || lower.includes('ranked')) {
        item.category = 'player';
      } else if (lower.includes('rule') || lower.includes('dictionary') || lower.includes('word list')) {
        item.category = 'rules';
      } else if (lower.includes('club') || lower.includes('community') || lower.includes('youth')) {
        item.category = 'community';
      }
    }

    newsItems = rawItems;

    // Step 3: Deduplicate against last 7 days
    const existingTitles = await db.prepare(
      "SELECT title FROM latest_news WHERE fetched_at > datetime('now', '-7 days')"
    ).all();
    const existing = new Set((existingTitles.results || []).map((r: any) => r.title.toLowerCase()));

    // Step 4: Insert new items
    let inserted = 0;
    for (const item of newsItems.slice(0, 5)) {
      if (!item.title || !item.summary) continue;
      if (existing.has(item.title.toLowerCase())) continue;

      await db.prepare(
        `INSERT INTO latest_news (title, summary, source_url, source_name, category, published_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        item.title.slice(0, 200),
        item.summary.slice(0, 500),
        item.source_url || '',
        item.source_name || '',
        ['tournament', 'player', 'rules', 'community', 'general'].includes(item.category) ? item.category : 'general',
        item.published_date || ''
      ).run();
      inserted++;
    }

    // Cleanup: remove news older than 60 days
    await db.prepare("DELETE FROM latest_news WHERE fetched_at < datetime('now', '-60 days')").run();

    // Record last fetch time in site_status
    await db.prepare("UPDATE site_status SET last_news_fetch = datetime('now') WHERE id = 1").run();

    console.log(`[News Cron] Inserted ${inserted} news items for query: "${query}"`);
  } catch (err) {
    console.error('Latest news cron error:', err);
  }
}


/**
 * Monthly snapshot: saves all active player rankings to ranking_snapshots.
 * Also computes rating_changes (vs previous snapshot) and country_stats.
 * Runs on the 1st of each month via cron. Skips if already taken this month.
 */
async function takeMonthlySnapshot(env: any) {
  try {
    const db = env.DB;
    if (!db) return;

    const today = new Date();
    const snapshotDate = today.toISOString().split('T')[0]; // e.g. 2026-08-01

    // Duplicate protection: check if snapshot already exists for this date
    const existing = await db.prepare(
      'SELECT COUNT(*) as cnt FROM ranking_snapshots WHERE snapshot_date = ?'
    ).bind(snapshotDate).first();
    if (existing && (existing as any).cnt > 0) {
      console.log(`[Snapshot] Already exists for ${snapshotDate}, skipping.`);
      return;
    }

    // Get all active rankings
    const rankings = await db.prepare(
      'SELECT name, rank, rating, country_code, ranking_type FROM player_rankings WHERE active = 1'
    ).all();
    const players = rankings.results || [];

    if (players.length === 0) {
      console.log('[Snapshot] No active rankings to snapshot.');
      return;
    }

    // Bulk insert snapshots
    let snapshotCount = 0;
    for (const p of players as any[]) {
      await db.prepare(
        'INSERT INTO ranking_snapshots (snapshot_date, ranking_type, player_name, rank, rating, country_code) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(snapshotDate, p.ranking_type, p.name, p.rank, p.rating, p.country_code || '').run();
      snapshotCount++;
    }

    // Compute rating changes vs previous snapshot
    // Find the previous snapshot date
    const prevSnapshot = await db.prepare(
      "SELECT DISTINCT snapshot_date FROM ranking_snapshots WHERE snapshot_date < ? ORDER BY snapshot_date DESC LIMIT 1"
    ).bind(snapshotDate).first();

    if (prevSnapshot) {
      const prevDate = (prevSnapshot as any).snapshot_date;
      const prevData = await db.prepare(
        'SELECT player_name, rank, rating, ranking_type FROM ranking_snapshots WHERE snapshot_date = ?'
      ).bind(prevDate).all();

      // Build lookup: player_name+ranking_type → {rank, rating}
      const prevMap: Record<string, { rank: number; rating: number }> = {};
      for (const p of (prevData.results || []) as any[]) {
        prevMap[`${p.player_name}::${p.ranking_type}`] = { rank: p.rank, rating: p.rating };
      }

      // Compute changes
      for (const p of players as any[]) {
        const key = `${p.name}::${p.ranking_type}`;
        const prev = prevMap[key];
        if (prev) {
          await db.prepare(
            'INSERT INTO rating_changes (player_name, ranking_type, rating_before, rating_after, rank_before, rank_after, change_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(p.name, p.ranking_type, prev.rating, p.rating, prev.rank, p.rank, snapshotDate).run();
        }
      }
    }

    // Compute country stats for this snapshot
    const types = ['wespa', 'ytd', 'online'];
    for (const type of types) {
      const typePlayers = (players as any[]).filter(p => p.ranking_type === type);
      if (typePlayers.length === 0) continue;

      // Aggregate by country
      const countryMap: Record<string, { code: string; name: string; players: any[] }> = {};
      for (const p of typePlayers) {
        const code = p.country_code || 'XX';
        if (!countryMap[code]) {
          countryMap[code] = { code, name: code, players: [] };
        }
        countryMap[code].players.push(p);
      }

      for (const [code, data] of Object.entries(countryMap)) {
        const totalPlayers = data.players.length;
        const avgRating = Math.round(data.players.reduce((s: number, p: any) => s + p.rating, 0) / totalPlayers);
        const topPlayer = data.players.reduce((max: any, p: any) => p.rating > max.rating ? p : max);

        await db.prepare(
          `INSERT OR REPLACE INTO country_stats (country_code, country_name, total_players, avg_rating, top_player, top_rating, total_titles, ranking_type, snapshot_date)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
        ).bind(code, topPlayer.name ? code : code, totalPlayers, avgRating, topPlayer.name, topPlayer.rating, type, snapshotDate).run();
      }
    }

    console.log(`[Snapshot] Saved ${snapshotCount} rankings for ${snapshotDate}, computed changes + country stats.`);
  } catch (err) {
    console.error('[Snapshot] Monthly snapshot error:', err);
  }
}
