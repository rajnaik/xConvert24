import { defineMiddleware } from 'astro:middleware';

const ALLOWED_EMAILS = ['raj007@gmail.com', 'xconvert24@gmail.com'];

export const onRequest = defineMiddleware(async ({ url, request, redirect }, next) => {
  // Only protect /admin routes
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // Read cookie from request header
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/swf_admin_session=([^;]+)/);

  if (!match) {
    return redirect('/api/auth/login');
  }

  try {
    const sessionData = decodeURIComponent(match[1]);
    const user = JSON.parse(sessionData);
    if (!ALLOWED_EMAILS.includes(user.email)) {
      return new Response('Access denied', { status: 403 });
    }
  } catch {
    return redirect('/api/auth/login');
  }

  return next();
});
