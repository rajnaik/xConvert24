import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': 'xcrypto_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
};
