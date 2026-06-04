/**
 * Google OAuth helper functions for the admin module.
 *
 * Required environment variables (set in Cloudflare Worker secrets):
 *   GOOGLE_CLIENT_ID     — from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET — from Google Cloud Console
 *   AUTH_SECRET           — a random string for signing session cookies
 *   ADMIN_EMAIL           — the Google email allowed to access admin (e.g. raj007@gmail.com)
 *
 * OAuth redirect URI to register in Google Console:
 *   https://<your-domain>/admin/callback
 */

const COOKIE_NAME = 'xc24_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface AuthEnv {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AUTH_SECRET: string;
  ADMIN_EMAIL: string;
}

function getRedirectUri(url: URL): string {
  return `${url.origin}/admin/callback`;
}

/**
 * Build the Google OAuth consent URL.
 */
export function getGoogleAuthUrl(env: AuthEnv, requestUrl: URL): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(requestUrl),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange the authorization code for tokens, then fetch user info.
 */
export async function exchangeCodeForUser(
  code: string,
  env: AuthEnv,
  requestUrl: URL
): Promise<{ email: string; name: string; picture: string } | null> {
  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(requestUrl),
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) return null;
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return null;

  // Fetch user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) return null;
  const user = (await userRes.json()) as { email?: string; name?: string; picture?: string };
  if (!user.email) return null;

  return { email: user.email, name: user.name || '', picture: user.picture || '' };
}

/**
 * Create a signed session cookie value.
 * Format: base64(JSON payload).base64(HMAC-SHA256 signature)
 */
export async function createSessionCookie(
  data: { email: string; name: string; picture: string },
  secret: string
): Promise<string> {
  const payload = btoa(JSON.stringify({ ...data, exp: Date.now() + SESSION_MAX_AGE * 1000 }));
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

/**
 * Verify and decode a session cookie.
 */
export async function verifySessionCookie(
  cookie: string | undefined,
  secret: string
): Promise<{ email: string; name: string; picture: string } | null> {
  if (!cookie) return null;
  const [payload, sig] = cookie.split('.');
  if (!payload || !sig) return null;

  const expectedSig = await sign(payload, secret);
  if (sig !== expectedSig) return null;

  try {
    const data = JSON.parse(atob(payload));
    if (data.exp && data.exp < Date.now()) return null; // expired
    return { email: data.email, name: data.name, picture: data.picture };
  } catch {
    return null;
  }
}

/**
 * Get the Set-Cookie header string for the session.
 */
export function getSessionCookieHeader(value: string): string {
  return `${COOKIE_NAME}=${value}; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

/**
 * Get the Set-Cookie header to clear the session.
 */
export function getClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/**
 * Parse cookies from the Cookie header.
 */
export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
}

export { COOKIE_NAME };

// ─── Crypto helpers ──────────────────────────────────────────────────────────

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
