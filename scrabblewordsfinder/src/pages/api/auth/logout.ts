import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  cookies.delete('swf_admin_session', { path: '/' });
  return Response.redirect('https://www.scrabblewordsfinder.com/', 302);
};
