import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validateSuggestBody, sendNotificationEmail, jsonResponse } from '../../lib/email';
import type { EmailPayload } from '../../lib/email';

/**
 * POST /api/suggest — Handle feature suggestion form submissions
 *
 * Flow: Parse → Validate → Save to DB → Attempt email (best-effort) → Return 200
 * Follows "save-first, email-best-effort" pattern.
 */
export const POST: APIRoute = async ({ request }) => {
  // Step 1: Parse JSON body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  // Step 2: Validate input
  const validation = validateSuggestBody(body);
  if (!validation.valid) {
    return jsonResponse({ error: validation.error }, 400);
  }

  // Step 3: Get database binding
  const db = (env as any).BUGS_DB;
  if (!db) {
    return jsonResponse({ error: 'Service temporarily unavailable' }, 503);
  }

  // Step 4: Capture IP address
  const ipAddress = request.headers.get('cf-connecting-ip') || 'unknown';

  // Step 5: Insert into emails table FIRST (save-before-send)
  let insertedId: number;
  try {
    const result = await db.prepare(
      `INSERT INTO emails (category, name, email, subject, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      'suggest',
      (validation.data.name || '').slice(0, 200),
      (validation.data.email || '').slice(0, 254),
      'Feature Suggestion',
      validation.data.message.slice(0, 5000),
      ipAddress.slice(0, 45)
    ).run();
    insertedId = result.meta.last_row_id;
  } catch {
    return jsonResponse({ error: 'Service temporarily unavailable' }, 503);
  }

  // Step 6: Attempt email send (best-effort, never fails the request)
  const EMAIL = (env as any).EMAIL;
  const destination = (env as any).SWF_NOTIFY_EMAIL;

  if (EMAIL && destination) {
    const payload: EmailPayload = {
      category: 'suggest',
      name: validation.data.name || '',
      email: validation.data.email || '',
      subject: 'Feature Suggestion',
      message: validation.data.message,
      ipAddress,
    };
    const sendResult = await sendNotificationEmail(EMAIL, destination, payload);

    // Step 7: On failure, log error to comment field
    if (!sendResult.success && insertedId) {
      try {
        await db.prepare(
          'UPDATE emails SET comment = ? WHERE id = ?'
        ).bind(sendResult.error || 'Send failed', insertedId).run();
      } catch {
        // Best-effort error logging — don't fail the request
      }
    }
  }

  // Step 8: Always return success if DB save worked
  return jsonResponse({ ok: true }, 200);
};
