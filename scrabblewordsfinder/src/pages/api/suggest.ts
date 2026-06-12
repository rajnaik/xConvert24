import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), { status: 400 });
  }

  const { name, email, suggestion } = body;
  if (!suggestion || !suggestion.trim()) {
    return new Response(JSON.stringify({ error: 'suggestion is required' }), { status: 400 });
  }

  const db = (env as any).DB;
  if (!db) {
    return new Response(JSON.stringify({ ok: false, error: 'no database' }), { status: 500 });
  }

  try {
    await db.prepare(
      `INSERT INTO suggestions (name, email, suggestion) VALUES (?, ?, ?)`
    ).bind(name || '', email || '', suggestion.trim()).run();

    // Send email notification if available
    const EMAIL = (env as any).EMAIL;
    const SWF_NOTIFY_EMAIL = (env as any).SWF_NOTIFY_EMAIL;
    if (EMAIL && SWF_NOTIFY_EMAIL) {
      try {
        await EMAIL.send({
          from: 'noreply@scrabblewordsfinder.com',
          to: SWF_NOTIFY_EMAIL,
          subject: `[SWF Suggestion] from ${name || 'Anonymous'}`,
          text: [
            'New feature suggestion received:',
            '',
            `From: ${name || 'Anonymous'}`,
            email ? `Email: ${email}` : '',
            '',
            'Suggestion:',
            suggestion.trim(),
            '',
            '---',
            'Sent via ScrabbleWordsFinder.com suggest form',
          ].filter(Boolean).join('\n'),
        });
      } catch {}
    }

    // Save to emails table
    try {
      await db.prepare(
        'INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind('suggest', name || '', email || '', 'Feature Suggestion', suggestion.trim(), request.headers.get('cf-connecting-ip') || '').run();
    } catch {}

    return new Response(JSON.stringify({ ok: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};
