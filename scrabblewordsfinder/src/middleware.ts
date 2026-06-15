import { defineMiddleware } from 'astro:middleware';

const ALLOWED_EMAILS = ['raj007@gmail.com', 'xconvert24@gmail.com'];

// Auth is DISABLED on localhost (dev), ENABLED everywhere else (staging, live)
function isLocalDev(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export const onRequest = defineMiddleware(async ({ url, request, redirect }, next) => {
  // Enforce trailing slash with 301 (not 307) for SEO consistency
  if (url.pathname !== '/' && !url.pathname.endsWith('/') && !url.pathname.includes('.') && !url.pathname.startsWith('/api/')) {
    return new Response(null, {
      status: 301,
      headers: { 'Location': url.pathname + '/' + url.search }
    });
  }

  // Only protect /admin routes
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // Skip auth on local development — but ENFORCE on staging/live
  if (isLocalDev(url)) {
    return next();
  }

  // --- Auth enforced beyond this point (staging + live) ---

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
