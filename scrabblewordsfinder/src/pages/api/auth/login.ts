import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const clientId = (env as any).GOOGLE_CLIENT_ID;
  if (!clientId) return new Response('Auth not configured', { status: 500 });

  const redirectUri = 'https://scrabblewordsfinder.com/api/auth/callback';
  const scope = 'openid email profile';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

  return Response.redirect(authUrl, 302);
};
