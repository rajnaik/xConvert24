import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const SUBJECT_MAP: Record<string, string> = {
  general: 'General Question',
  bug: 'Bug Report',
  feature: 'Feature Suggestion',
  privacy: 'Privacy / Data',
  other: 'Other',
};

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!message) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });

  const ip = request.headers.get('cf-connecting-ip') || '';
  const mappedSubject = SUBJECT_MAP[subject] || subject || 'General Question';
  const category = subject === 'suggestion' ? 'suggest' : 'contact';

  // Save to DB first (never lose data even if email fails)
  await db.prepare('INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(category, name || '', email || '', mappedSubject, message, ip).run();

  // Send email notification (best-effort)
  try {
    const notifyEmail = (env as any).XCRYPTO_NOTIFY_EMAIL;
    const emailService = (env as any).EMAIL;
    if (emailService && notifyEmail) {
      const emailBody = `From: ${name || 'Anonymous'}\nReply-to: ${email || 'not provided'}\nSubject: ${mappedSubject}\n\n${message}\n\n---\nSent via xCrypto24.com contact form\nIP: ${ip}`;
      await emailService.send({
        from: 'noreply@xcrypto24.com',
        to: notifyEmail,
        subject: `[xCrypto24 Contact] ${mappedSubject} from ${name || 'Anonymous'}`,
        text: emailBody,
      });
    }
  } catch (e) {
    // Email is best-effort — DB save already succeeded
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
