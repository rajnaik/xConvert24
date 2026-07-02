import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { generateDisplayName, TOTAL_AVATARS } from '../../../lib/avatar-names';

export const prerender = false;

const getDB = () => (env as any).DB;

/**
 * Parse a user-agent string into browser, OS, and device type.
 */
function parseUserAgent(ua: string): { browser: string; os: string; device_type: string } {
  let browser = '';
  let os = '';
  let device_type = 'desktop';

  // Browser detection
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
  else if (ua.includes('Chrome/') && ua.includes('Safari/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else browser = 'Other';

  // OS detection
  if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('CrOS')) os = 'ChromeOS';
  else os = 'Other';

  // Device type
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device_type = 'mobile';
  else if (ua.includes('iPad') || ua.includes('Tablet')) device_type = 'tablet';

  return { browser, os, device_type };
}

/**
 * POST /api/users/register/
 * Registers a new user with a random avatar, display name, and captures
 * as much contextual data as possible (geo, device, screen, etc.).
 *
 * If the user_id already exists, updates last_seen and visit_count.
 *
 * Body: {
 *   user_id: string,
 *   message?: string (max 1000 chars),
 *   screen_width?: number,
 *   screen_height?: number,
 *   viewport_width?: number,
 *   viewport_height?: number,
 *   language?: string,
 *   referrer?: string,
 *   timezone?: string
 * }
 *
 * Returns: { user_id, display_name, avatar_id, created_at, is_new, visit_count }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const userId = body.user_id?.trim();

    if (!userId || userId.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB();
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract server-side data from request headers (Cloudflare provides these)
    const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const country = request.headers.get('cf-ipcountry') || '';
    const city = request.headers.get('cf-ipcity') || '';
    const region = request.headers.get('cf-region') || '';
    const latitude = request.headers.get('cf-iplatitude') || '';
    const longitude = request.headers.get('cf-iplongitude') || '';
    const cfTimezone = request.headers.get('cf-timezone') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Extract client-side data from body
    const message = (body.message || '').substring(0, 1000);
    const screenWidth = body.screen_width || null;
    const screenHeight = body.screen_height || null;
    const viewportWidth = body.viewport_width || null;
    const viewportHeight = body.viewport_height || null;
    const language = body.language || request.headers.get('accept-language')?.split(',')[0] || '';
    const referrer = body.referrer || request.headers.get('referer') || '';
    const timezone = body.timezone || cfTimezone || '';

    // Parse user agent
    const { browser, os, device_type } = parseUserAgent(userAgent);

    // Parse lat/lng to numbers
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    // Check if user already exists
    const existing = await db.prepare(
      'SELECT user_id, display_name, avatar_id, created_at, visit_count, message FROM users WHERE user_id = ?'
    ).bind(userId).first();

    if (existing) {
      // Returning user — update last_seen, visit_count, and refresh device data
      await db.prepare(`
        UPDATE users SET
          last_seen = datetime('now'),
          visit_count = visit_count + 1,
          ip_address = ?,
          country = ?,
          city = ?,
          region = ?,
          latitude = ?,
          longitude = ?,
          timezone = ?,
          user_agent = ?,
          browser = ?,
          os = ?,
          device_type = ?,
          language = ?,
          referrer = ?,
          screen_width = ?,
          screen_height = ?,
          viewport_width = ?,
          viewport_height = ?
        WHERE user_id = ?
      `).bind(
        ipAddress, country, city, region, lat, lng, timezone,
        userAgent, browser, os, device_type, language, referrer,
        screenWidth, screenHeight, viewportWidth, viewportHeight,
        userId
      ).run();

      return new Response(JSON.stringify({
        user_id: existing.user_id,
        display_name: existing.display_name,
        avatar_id: existing.avatar_id,
        created_at: existing.created_at,
        visit_count: (existing.visit_count as number) + 1,
        message: existing.message || '',
        is_new: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // New user — assign random avatar and generate display name
    const avatarId = Math.floor(Math.random() * TOTAL_AVATARS) + 1;
    const displayName = generateDisplayName(avatarId);

    await db.prepare(`
      INSERT INTO users (
        user_id, display_name, avatar_id, message,
        ip_address, country, city, region, latitude, longitude, timezone,
        user_agent, browser, os, device_type, language, referrer,
        screen_width, screen_height, viewport_width, viewport_height,
        last_seen, visit_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 1)
    `).bind(
      userId, displayName, avatarId, message,
      ipAddress, country, city, region, lat, lng, timezone,
      userAgent, browser, os, device_type, language, referrer,
      screenWidth, screenHeight, viewportWidth, viewportHeight
    ).run();

    return new Response(JSON.stringify({
      user_id: userId,
      display_name: displayName,
      avatar_id: avatarId,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      visit_count: 1,
      is_new: true,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Registration failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
