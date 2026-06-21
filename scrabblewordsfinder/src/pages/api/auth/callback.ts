import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const ALLOWED_EMAILS = ['raj007@gmail.com', 'xconvert24@gmail.com'];

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code');
  if (!code) return new Response('No code provided', { status: 400 });

  const clientId = (env as any).GOOGLE_CLIENT_ID;
  const clientSecret = (env as any).GOOGLE_CLIENT_SECRET;

  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return new Response('Token exchange failed', { status: 401 });
  }

  const tokens = await tokenRes.json() as any;

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return new Response('Failed to get user info', { status: 401 });
  }

  const user = await userRes.json() as any;

  // Check if email is allowed
  if (!ALLOWED_EMAILS.includes(user.email)) {
    return new Response(`Access denied. ${user.email} is not authorized.`, { status: 403 });
  }

  // Set session cookie via header
  const sessionData = JSON.stringify({ email: user.email, name: user.name, picture: user.picture });
  const cookieValue = encodeURIComponent(sessionData);
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  return new Response(null, {
    status: 302,
    headers: {
      'Location': `${origin}/admin/`,
      'Set-Cookie': `swf_admin_session=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
    },
  });
};
