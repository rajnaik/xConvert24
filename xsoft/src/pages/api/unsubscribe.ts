import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(unsubscribePage('Invalid unsubscribe link.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!db) {
    return new Response(unsubscribePage('Service temporarily unavailable.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Token can be the email address directly
  const email = decodeURIComponent(token);

  // Mark as unsubscribed in campaign_recipients (if exists)
  await db.prepare(
    "UPDATE campaign_recipients SET status = 'unsubscribed', unsubscribed_at = datetime('now') WHERE email = ? AND status != 'unsubscribed'"
  ).bind(email).run();

  // Add to global unsubscribe list
  await db.prepare(
    "INSERT OR IGNORE INTO campaign_unsubscribes (email) VALUES (?)"
  ).bind(email).run();

  return new Response(unsubscribePage(`You've been unsubscribed. You won't receive further emails from us.`, true), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — xSoft Ltd</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { max-width: 400px; text-align: center; padding: 40px; border-radius: 16px; border: 1px solid ${success ? '#065f46' : '#7f1d1d'}; background: ${success ? '#064e3b20' : '#7f1d1d20'}; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
    a { color: #818cf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '⚠️'}</div>
    <h1>${success ? 'Unsubscribed' : 'Error'}</h1>
    <p>${message}</p>
    <p style="margin-top: 20px;"><a href="https://xsoftlimited.com/">Visit xSoft Ltd →</a></p>
  </div>
</body>
</html>`;
}
