import { defineMiddleware } from 'astro:middleware';
import { verifySessionCookie, parseCookies, COOKIE_NAME } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;

  // Only protect /admin/* routes (except /admin/callback and /admin/login)
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // Allow the OAuth callback and login page through
  const path = url.pathname.replace(/\/$/, ''); // normalize trailing slash
  if (path === '/admin/callback' || path === '/admin/login') {
    return next();
  }

  // In local dev (localhost), skip auth and provide a mock user
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    (context.locals as any).user = { email: 'dev@localhost', name: 'Dev Admin', picture: '' };
    return next();
  }

  try {
    // Import env from cloudflare:workers
    const { env } = await import('cloudflare:workers');
    const authSecret = (env as any).AUTH_SECRET;
    const adminEmail = (env as any).ADMIN_EMAIL;

    if (!authSecret) {
      return context.redirect('/admin/login');
    }

    // Check session cookie
    const cookies = parseCookies(request.headers.get('cookie'));
    const session = await verifySessionCookie(cookies[COOKIE_NAME], authSecret);

    if (!session) {
      return context.redirect('/admin/login');
    }

    // Check if the email matches the allowed admin
    if (adminEmail && session.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return new Response('Access denied. This admin panel is restricted.', { status: 403 });
    }

    // Attach user to locals for use in pages
    (context.locals as any).user = session;
  } catch {
    // If cloudflare:workers import fails or any error, redirect to login
    return context.redirect('/admin/login');
  }

  return next();
});
