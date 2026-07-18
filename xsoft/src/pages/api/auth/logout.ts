import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `${origin}/`,
      'Set-Cookie': `xsoft_admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
};
