import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/contact — Send contact form email via Cloudflare Email Service
 * Falls back to DB storage if email binding not available
 */
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name, email, subject, message } = body;
  if (!message || !message.trim()) {
    return json({ error: 'Message is required' }, 400);
  }

  const db = (env as any).DB;
  const EMAIL = (env as any).EMAIL;
  const SWF_NOTIFY_EMAIL = (env as any).SWF_NOTIFY_EMAIL;

  const subjectMap: Record<string, string> = {
    general: 'General Question',
    bug: 'Bug Report',
    feature: 'Feature Suggestion',
    privacy: 'Privacy / Data',
    other: 'Other',
  };

  const emailSubject = `[SWF Contact] ${subjectMap[subject] || 'Message'} from ${name || 'Anonymous'}`;
  const emailBody = [
    `From: ${name || 'Anonymous'}`,
    email ? `Reply-to: ${email}` : '',
    `Subject: ${subjectMap[subject] || subject || 'General'}`,
    '',
    message.trim(),
    '',
    '---',
    'Sent via ScrabbleWordsFinder.com contact form',
    `IP: ${request.headers.get('cf-connecting-ip') || 'unknown'}`,
  ].filter(Boolean).join('\n');

  // Try email first
  if (EMAIL && SWF_NOTIFY_EMAIL) {
    try {
      await EMAIL.send({
        from: 'noreply@scrabblewordsfinder.com',
        to: SWF_NOTIFY_EMAIL,
        subject: emailSubject,
        text: emailBody,
      });
      // If this is a test email, also save to test_emails table for verification
      const testMatch = (emailSubject + ' ' + message).match(/\[SWF-TEST-([a-z0-9]+)\]/i);
      if (testMatch && db) {
        try {
          await db.prepare(
            'INSERT INTO test_emails (unique_id, from_address, to_address, subject, body) VALUES (?, ?, ?, ?, ?)'
          ).bind(testMatch[1], 'noreply@scrabblewordsfinder.com', SWF_NOTIFY_EMAIL, emailSubject, emailBody).run();
        } catch {}
      }
      // Save to emails table
      if (db) {
        try {
          await db.prepare(
            'INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind('contact', name || '', email || '', subjectMap[subject] || subject || '', message.trim(), request.headers.get('cf-connecting-ip') || '').run();
        } catch {}
      }
      return json({ ok: true, method: 'email' });
    } catch (e: any) {
      // Fall through to DB fallback
    }
  }

  // Fallback: save to DB
  if (db) {
    try {
      await db.prepare(
        'INSERT INTO suggestions (name, email, suggestion) VALUES (?, ?, ?)'
      ).bind(name || '', email || '', `[CONTACT - ${subjectMap[subject] || 'General'}] ${message.trim()}`).run();
      // If test email, also save to test_emails
      const testMatch2 = (emailSubject + ' ' + message).match(/\[SWF-TEST-([a-z0-9]+)\]/i);
      if (testMatch2) {
        try {
          await db.prepare(
            'INSERT INTO test_emails (unique_id, from_address, to_address, subject, body) VALUES (?, ?, ?, ?, ?)'
          ).bind(testMatch2[1], name || '', email || '', emailSubject, message.trim()).run();
        } catch {}
      }
      // Also save to emails table
      try {
        await db.prepare(
          'INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind('contact', name || '', email || '', subjectMap[subject] || subject || '', message.trim(), request.headers.get('cf-connecting-ip') || '').run();
      } catch {}
      return json({ ok: true, method: 'db_fallback' });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  return json({ error: 'No email or database available' }, 503);
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
