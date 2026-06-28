import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/chatusage — Log and read ScrabbleBot AI chat interactions
 *
 * POST /api/chatusage  → Log a new chat interaction
 * GET  /api/chatusage  → Read chat logs (with optional filters)
 *   ?limit=50          → number of rows (default 50, max 200)
 *   ?offset=0          → pagination offset
 *   ?stats=true        → return summary stats only
 */

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const {
    user_id = '',
    user_message = '',
    bot_response = '',
    model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    tokens_used = 0,
    response_ms = 0,
    session_id = '',
    success = 1,
    error_message = '',
    keyword = '',
  } = body;

  if (!user_message) {
    return jsonError('user_message is required', 400);
  }

  // Extract IP and user agent from request headers
  const ip_address = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const user_agent = request.headers.get('user-agent') || '';

  try {
    await db.prepare(
      `INSERT INTO chatusage (user_id, user_message, bot_response, model, tokens_used, response_ms, ip_address, user_agent, session_id, success, error_message, keyword)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user_id,
      user_message.slice(0, 2000), // Cap message length
      bot_response.slice(0, 5000), // Cap response length
      model,
      Number(tokens_used) || 0,
      Number(response_ms) || 0,
      ip_address,
      user_agent.slice(0, 500),
      session_id,
      success ? 1 : 0,
      error_message.slice(0, 500),
      keyword.slice(0, 50), // Cap keyword length
    ).run();

    return json({ success: true });
  } catch (e: any) {
    return jsonError(e.message || 'Failed to log chat usage', 500);
  }
};

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  const url = new URL(request.url);
  const stats = url.searchParams.get('stats');
  const suggestions = url.searchParams.get('suggestions');

  // Suggestions mode — top 10 most frequently asked questions
  // Supports ?user_id=X to filter by user, ?page=N for pagination (10 per page)
  if (suggestions === 'true') {
    const userId = url.searchParams.get('user_id') || '';
    const page = Math.max(0, Number(url.searchParams.get('page')) || 0);
    const perPage = 10;
    const offset = page * perPage;

    try {
      let query: string;
      let bindings: any[];

      if (userId) {
        // Per-user top keywords (includes latest date asked)
        // Include both short user_messages AND keyword-tagged Ask Lex interactions
        query = `SELECT COALESCE(NULLIF(keyword, ''), user_message) as user_message, COUNT(*) as cnt, MAX(created_at) as last_asked
                 FROM chatusage
                 WHERE success = 1 AND user_message != ''
                   AND (
                     (keyword != '' AND keyword IS NOT NULL)
                     OR (LENGTH(user_message) >= 8 AND LENGTH(user_message) <= 80)
                   )
                   AND user_id = ?
                 GROUP BY LOWER(TRIM(COALESCE(NULLIF(keyword, ''), user_message)))
                 ORDER BY MAX(created_at) DESC
                 LIMIT ? OFFSET ?`;
        bindings = [userId, perPage, offset];
      } else {
        // Global top keywords
        query = `SELECT COALESCE(NULLIF(keyword, ''), user_message) as user_message, COUNT(*) as cnt
                 FROM chatusage
                 WHERE success = 1 AND user_message != ''
                   AND (
                     (keyword != '' AND keyword IS NOT NULL)
                     OR (LENGTH(user_message) >= 8 AND LENGTH(user_message) <= 80)
                   )
                 GROUP BY LOWER(TRIM(COALESCE(NULLIF(keyword, ''), user_message)))
                 ORDER BY cnt DESC
                 LIMIT ? OFFSET ?`;
        bindings = [perPage, offset];
      }

      const { results } = await db.prepare(query).bind(...bindings).all();

      // Get total count for pagination
      let totalQuery: string;
      let totalBindings: any[];
      if (userId) {
        totalQuery = `SELECT COUNT(*) as total FROM (
          SELECT 1 FROM chatusage
          WHERE success = 1 AND user_message != ''
            AND (
              (keyword != '' AND keyword IS NOT NULL)
              OR (LENGTH(user_message) >= 8 AND LENGTH(user_message) <= 80)
            )
            AND user_id = ?
          GROUP BY LOWER(TRIM(COALESCE(NULLIF(keyword, ''), user_message)))
        )`;
        totalBindings = [userId];
      } else {
        totalQuery = `SELECT COUNT(*) as total FROM (
          SELECT 1 FROM chatusage
          WHERE success = 1 AND user_message != ''
            AND (
              (keyword != '' AND keyword IS NOT NULL)
              OR (LENGTH(user_message) >= 8 AND LENGTH(user_message) <= 80)
            )
          GROUP BY LOWER(TRIM(COALESCE(NULLIF(keyword, ''), user_message)))
        )`;
        totalBindings = [];
      }

      const totalRow = totalBindings.length
        ? await db.prepare(totalQuery).bind(...totalBindings).first()
        : await db.prepare(totalQuery).first();
      const total = totalRow?.total || 0;

      return json({
        suggestions: (results || []).map((r: any) => r.user_message),
        items: (results || []).map((r: any) => ({ message: r.user_message, last_asked: r.last_asked || '' })),
        page,
        total,
        totalPages: Math.ceil(total / perPage),
      });
    } catch (e: any) {
      return jsonError(e.message, 500);
    }
  }

  // Stats-only mode
  if (stats === 'true') {
    try {
      const row = await db.prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
          ROUND(AVG(response_ms), 0) as avg_response_ms,
          COUNT(DISTINCT CASE WHEN user_id != '' THEN user_id END) as unique_users,
          MAX(created_at) as last_chat
        FROM chatusage`
      ).first();
      return json({ stats: row });
    } catch (e: any) {
      return jsonError(e.message, 500);
    }
  }

  // Paginated list
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Number(url.searchParams.get('offset')) || 0;

  try {
    const { results } = await db.prepare(
      `SELECT id, user_id, user_message, bot_response, model, tokens_used, response_ms, ip_address, session_id, success, error_message, keyword, created_at
       FROM chatusage ORDER BY id DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    const countRow = await db.prepare('SELECT COUNT(*) as total FROM chatusage').first();

    return json({ chats: results, total: countRow?.total || 0 });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
