import { defineMiddleware } from 'astro:middleware';

const ALLOWED_EMAILS = ['raj007@gmail.com', 'xconvert24@gmail.com'];

export const onRequest = defineMiddleware(async ({ request, url, redirect }, next) => {
  // Only protect /admin/* routes
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // Skip API auth routes
  if (url.pathname.startsWith('/api/auth')) {
    return next();
  }

  const cookie = request.headers.get('cookie') || '';
  const sessionMatch = cookie.match(/xcrypto_session=([^;]+)/);

  if (!sessionMatch) {
    return redirect('/api/auth/login');
  }

  try {
    const session = JSON.parse(atob(sessionMatch[1]));

    // Check expiry
    if (session.exp && session.exp < Date.now()) {
      return redirect('/api/auth/login');
    }

    // Check allowed email
    if (!ALLOWED_EMAILS.includes(session.email)) {
      return new Response('Access denied', { status: 403 });
    }
  } catch {
    return redirect('/api/auth/login');
  }

  return next();
});
