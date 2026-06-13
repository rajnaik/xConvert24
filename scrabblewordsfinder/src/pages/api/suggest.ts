import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/suggest — Save-before-send pattern
 * 1. Validate input (suggestion required)
 * 2. INSERT into emails table (PRIMARY operation)
 * 3. Attempt email send (SECONDARY, best-effort)
 * 4. On email failure: UPDATE emails.comment with error
 * 5. Return 200 if DB save succeeded, regardless of email outcome
 */
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  const { name, email, suggestion } = body;

  // Validate: suggestion is required and must not be empty/whitespace
  if (!suggestion || !suggestion.trim()) {
    return json({ error: 'suggestion is required' }, 400);
  }

  const db = (env as any).DB;
  if (!db) {
    return json({ ok: false, error: 'no database' }, 500);
  }

  const trimmedSuggestion = suggestion.trim();
  const ipAddress = request.headers.get('cf-connecting-ip') || '';

  // PRIMARY: Save to emails table first
  let insertedId: number | null = null;
  try {
    const result = await db.prepare(
      'INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      'suggest',
      name || '',
      email || '',
      'Feature Suggestion',
      trimmedSuggestion,
      ipAddress
    ).run();

    insertedId = result?.meta?.last_row_id ?? null;
  } catch (e: any) {
    // DB save failed — return 500 immediately, do NOT attempt email
    return json({ ok: false, error: e.message || 'database error' }, 500);
  }

  // SECONDARY: Attempt email send (best-effort)
  const EMAIL = (env as any).EMAIL;
  const SWF_NOTIFY_EMAIL = (env as any).SWF_NOTIFY_EMAIL;

  if (EMAIL && SWF_NOTIFY_EMAIL) {
    try {
      await EMAIL.send({
        from: 'noreply@scrabblewordsfinder.com',
        to: SWF_NOTIFY_EMAIL,
        subject: `[SWF Suggestion] from ${name || 'Anonymous'}`,
        text: [
          `From: ${name || 'Anonymous'}`,
          email ? `Reply-to: ${email}` : '',
          'Subject: Feature Suggestion',
          '',
          trimmedSuggestion,
          '',
          '---',
          'Sent via ScrabbleWordsFinder.com suggest form',
          `IP: ${ipAddress}`,
        ].filter(Boolean).join('\n'),
      });
    } catch (e: any) {
      // Email failed — update comment field with error (truncated to 500 chars)
      const errorMsg = (e.message || 'email send failed').slice(0, 500);
      if (insertedId != null) {
        try {
          await db.prepare(
            'UPDATE emails SET comment = ? WHERE id = ?'
          ).bind(errorMsg, insertedId).run();
        } catch {
          // Silently ignore comment update failure
        }
      }
    }
  }

  // DB save succeeded — return 200 regardless of email outcome
  return json({ ok: true });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
