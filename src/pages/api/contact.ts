import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  validateContactBody,
  mapSubjectCategory,
  sendNotificationEmail,
  jsonResponse,
  type EmailPayload,
} from '../../lib/email';

/**
 * POST /api/contact — Accept contact form submissions.
 *
 * Flow: validate → save to DB → attempt email (best-effort).
 * Returns 200 if DB save succeeds, regardless of email outcome.
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
  const validation = validateContactBody(body);
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

  // Step 5: Map subject category (already validated as valid key)
  const mappedSubject = mapSubjectCategory(validation.data.subject)!;

  // Step 6: Insert into emails table FIRST (save-before-send)
  let insertedId: number;
  try {
    const result = await db.prepare(
      `INSERT INTO emails (category, name, email, subject, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      'contact',
      validation.data.name.slice(0, 200),
      validation.data.email.slice(0, 254),
      mappedSubject.slice(0, 200),
      validation.data.message.slice(0, 5000),
      ipAddress.slice(0, 45)
    ).run();
    insertedId = result.meta.last_row_id;
  } catch {
    return jsonResponse({ error: 'Service temporarily unavailable' }, 503);
  }

  // Step 7: Attempt email send (best-effort, never fails the request)
  const EMAIL = (env as any).EMAIL;
  const destination = (env as any).SWF_NOTIFY_EMAIL;

  if (EMAIL && destination) {
    const payload: EmailPayload = {
      category: 'contact',
      name: validation.data.name,
      email: validation.data.email,
      subject: validation.data.subject,
      message: validation.data.message,
      ipAddress,
    };
    const sendResult = await sendNotificationEmail(EMAIL, destination, payload);

    // Step 8: On failure, log error to comment field
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

  // Step 9: Always return success if DB save worked
  return jsonResponse({ ok: true }, 200);
};
