import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/contact — Save-before-send pattern
 * 1. Validate input
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
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name, email, subject, message } = body;

  // Validate message is non-empty after trimming
  if (!message || !message.trim()) {
    return json({ error: 'Message is required' }, 400);
  }

  const db = (env as any).DB;
  const EMAIL = (env as any).EMAIL;
  const SWF_NOTIFY_EMAIL = (env as any).SWF_NOTIFY_EMAIL;

  // 503 if neither DB nor EMAIL binding is available
  if (!db && !EMAIL) {
    return json({ error: 'Service unavailable' }, 503);
  }

  // Subject category mapping
  const subjectMap: Record<string, string> = {
    general: 'General Question',
    bug: 'Bug Report',
    feature: 'Feature Suggestion',
    privacy: 'Privacy / Data',
    other: 'Other',
  };

  const mappedSubject = subjectMap[subject] || 'Other';
  const ipAddress = request.headers.get('cf-connecting-ip') || 'unknown';
  const trimmedMessage = message.trim();

  // PRIMARY: Save to emails table first
  let savedRowId: number | null = null;
  if (db) {
    try {
      const result = await db.prepare(
        'INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind('contact', name || '', email || '', mappedSubject, trimmedMessage, ipAddress).run();
      savedRowId = result.meta?.last_row_id ?? null;
    } catch (e: any) {
      return json({ error: e.message || 'Database save failed' }, 500);
    }
  }

  // Test email tracking: save to test_emails table for SWF-TEST pattern
  if (db && savedRowId !== null) {
    const testMatch = (trimmedMessage).match(/\[SWF-TEST-([a-z0-9]+)\]/i);
    if (testMatch) {
      try {
        const emailSubject = `[SWF Contact] ${mappedSubject} from ${name || 'Anonymous'}`;
        await db.prepare(
          'INSERT INTO test_emails (unique_id, from_address, to_address, subject, body) VALUES (?, ?, ?, ?, ?)'
        ).bind(testMatch[1], 'noreply@scrabblewordsfinder.com', SWF_NOTIFY_EMAIL || '', emailSubject, trimmedMessage).run();
      } catch {
        // Non-critical, ignore
      }
    }
  }

  // SECONDARY: Attempt email send (best-effort)
  if (EMAIL && SWF_NOTIFY_EMAIL) {
    const emailSubject = `[SWF Contact] ${mappedSubject} from ${name || 'Anonymous'}`;
    const emailBody = [
      `From: ${name || 'Anonymous'}`,
      email ? `Reply-to: ${email}` : '',
      `Subject: ${mappedSubject}`,
      '',
      trimmedMessage,
      '',
      '---',
      'Sent via ScrabbleWordsFinder.com contact form',
      `IP: ${ipAddress}`,
    ].filter(Boolean).join('\n');

    try {
      await EMAIL.send({
        from: 'noreply@scrabblewordsfinder.com',
        to: SWF_NOTIFY_EMAIL,
        subject: emailSubject,
        text: emailBody,
      });
    } catch (e: any) {
      // Email failed — update comment field with error (truncated to 500 chars)
      if (db && savedRowId !== null) {
        const errorMsg = (e.message || 'Email send failed').slice(0, 500);
        try {
          await db.prepare(
            'UPDATE emails SET comment = ? WHERE id = ?'
          ).bind(errorMsg, savedRowId).run();
        } catch {
          // Non-critical, ignore
        }
      }
    }
  }

  return json({ ok: true });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
