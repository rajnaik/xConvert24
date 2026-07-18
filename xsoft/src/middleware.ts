import { defineMiddleware } from 'astro:middleware';

const ALLOWED_EMAILS = ['raj007@gmail.com', 'xconvert24@gmail.com'];

function isLocalDev(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export const onRequest = defineMiddleware(async ({ url, request, redirect }, next) => {
  // Only protect /admin routes
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // Skip auth on local development
  if (isLocalDev(url)) {
    return next();
  }

  // Read cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/xsoft_admin_session=([^;]+)/);

  if (!match) {
    return redirect('/api/auth/login/');
  }

  try {
    const sessionData = decodeURIComponent(match[1]);
    const user = JSON.parse(sessionData);
    if (!ALLOWED_EMAILS.includes(user.email)) {
      return new Response('Access denied', { status: 403 });
    }
  } catch {
    return redirect('/api/auth/login/');
  }

  return next();
});
