import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const ALLOWED_EMAILS = ['raj007@gmail.com', 'xconvert24@gmail.com'];

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });

  const clientId = (env as any).GOOGLE_CLIENT_ID;
  const clientSecret = (env as any).GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/auth/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });

  if (!tokenRes.ok) return new Response('Token exchange failed', { status: 401 });
  const tokens = await tokenRes.json() as any;

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) return new Response('Failed to get user info', { status: 401 });
  const user = await userRes.json() as any;

  if (!ALLOWED_EMAILS.includes(user.email)) {
    return new Response('Access denied — email not authorized', { status: 403 });
  }

  const session = btoa(JSON.stringify({ email: user.email, name: user.name, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin',
      'Set-Cookie': `xcrypto_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
    },
  });
};
