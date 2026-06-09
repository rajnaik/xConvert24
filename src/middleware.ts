import { defineMiddleware } from 'astro:middleware';
import { verifySessionCookie, parseCookies, COOKIE_NAME } from './lib/auth';

/**
 * Public API routes that unauthenticated users can access.
 * All other /api/* write operations require admin session.
 */
const PUBLIC_API_ROUTES: { path: string; methods: string[] }[] = [
  // Bug reporting & voting (public pages)
  { path: '/api/bugs', methods: ['GET', 'POST'] },
  { path: '/api/bugs/vote', methods: ['POST'] },
  // Suggestions (public pages)
  { path: '/api/suggestions', methods: ['GET', 'POST'] },
  { path: '/api/suggestions/rate', methods: ['POST'] },
  // Favourites (public pages)
  { path: '/api/favourites', methods: ['GET', 'POST', 'PATCH'] },
  // ConvertCoins / Rewards (public pages)
  { path: '/api/coins', methods: ['GET', 'POST'] },
  // Event bus (public pages)
  { path: '/api/events', methods: ['GET', 'POST'] },
  // Analytics tracking (public pages)
  { path: '/api/analytics', methods: ['GET', 'POST'] },
  // Click tracking (public — high-volume UI click stream)
  { path: '/api/clicks', methods: ['GET', 'POST'] },
  // Clicks analysis (aggregated IP geo data — read-only, used by admin dashboard)
  { path: '/api/clicks-analysis', methods: ['GET'] },
  // Build and test run data (read-only admin dashboard)
  { path: '/api/builds', methods: ['GET'] },
  { path: '/api/test-runs', methods: ['GET'] },
  // SEO health report (read-only admin dashboard)
  { path: '/api/seo-health', methods: ['GET'] },
  // Admin dashboard read-only endpoints
  { path: '/api/auditlog', methods: ['GET'] },
  { path: '/api/org-chart', methods: ['GET'] },
  { path: '/api/code-reviews', methods: ['GET'] },
  { path: '/api/code-scans', methods: ['GET'] },
  { path: '/api/security-scans', methods: ['GET'] },
  { path: '/api/vocabulary', methods: ['GET'] },
  { path: '/api/hooks', methods: ['GET'] },
  { path: '/api/feature-flags', methods: ['GET'] },
  { path: '/api/blog-posts', methods: ['GET'] },
  // Opinions (public pages)
  { path: '/api/opinions', methods: ['GET', 'POST'] },
  // Support / Wallet display (public page — GET only, POST is admin)
  { path: '/api/wallet', methods: ['GET'] },
  // Copy notification (public support page)
  { path: '/api/notify-copy', methods: ['GET', 'POST'] },
  // CI/CD pipeline view (public build-pipeline page — read only)
  { path: '/api/cicd-pipeline', methods: ['GET'] },
  // Breaking news (public contagion tracker)
  { path: '/api/breaking-news', methods: ['GET'] },
  // Commits (public — read only)
  { path: '/api/commits', methods: ['GET'] },
  // Cron jobs (called by external scheduler — no auth)
  { path: '/api/cron/refresh-clicks-analysis', methods: ['GET'] },
  { path: '/api/cron/publish-blogs', methods: ['GET'] },
  { path: '/api/cron/refresh-news', methods: ['GET'] },
];

/**
 * Check if a given API path + method is in the public allowlist.
 */
function isPublicApiRoute(path: string, method: string): boolean {
  const normalized = path.replace(/\/$/, '');
  return PUBLIC_API_ROUTES.some(
    (route) => route.path === normalized && route.methods.includes(method.toUpperCase())
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  const path = url.pathname.replace(/\/$/, ''); // normalize trailing slash

  // ──────────────────────────────────────────────────────────────────────
  // 1. Non-admin, non-API routes — pass through
  // ──────────────────────────────────────────────────────────────────────
  if (!path.startsWith('/admin') && !path.startsWith('/api')) {
    return next();
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2. API routes — protect admin-only endpoints
  // ──────────────────────────────────────────────────────────────────────
  if (path.startsWith('/api')) {
    const method = request.method.toUpperCase();

    // Allow explicitly public routes through without auth
    if (isPublicApiRoute(path, method)) {
      return next();
    }

    // All other API routes require admin authentication
    // Allow OPTIONS for CORS preflight
    if (method === 'OPTIONS') {
      return next();
    }

    // In local dev, skip auth for API routes too
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      (context.locals as any).user = { email: 'dev@localhost', name: 'Dev Admin', picture: '' };
      return next();
    }

    // Cron routes: check for cron secret header
    if (path.startsWith('/api/cron')) {
      try {
        const { env } = await import('cloudflare:workers');
        const cronSecret = (env as any).CRON_SECRET;
        const authHeader = request.headers.get('Authorization');
        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
          return next();
        }
      } catch {
        // Fall through to session check
      }
    }

    // Pipeline routes (site-status): allow with pipeline/cron secret
    if (path === '/api/site-status') {
      try {
        const { env } = await import('cloudflare:workers');
        const cronSecret = (env as any).CRON_SECRET;
        const authHeader = request.headers.get('Authorization');
        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
          return next();
        }
      } catch {
        // Fall through to session check
      }
    }

    // Verify admin session cookie for protected API routes
    try {
      const { env } = await import('cloudflare:workers');
      const authSecret = (env as any).AUTH_SECRET;
      const adminEmail = (env as any).ADMIN_EMAIL;

      if (!authSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const cookies = parseCookies(request.headers.get('cookie'));
      const session = await verifySessionCookie(cookies[COOKIE_NAME], authSecret);

      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized — admin session required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (adminEmail && session.email.toLowerCase() !== adminEmail.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Forbidden — admin access only' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      (context.locals as any).user = session;
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  }

  // ──────────────────────────────────────────────────────────────────────
  // 3. Admin pages — existing protection
  // ──────────────────────────────────────────────────────────────────────
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
