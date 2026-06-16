import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    const body = await request.json();
    const { name, email, message } = body;

    if (!message) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });

    const ip = request.headers.get('cf-connecting-ip') || '';

    // Save to DB first
    await db.prepare('INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .bind('suggest', name || '', email || '', 'Feature Suggestion', message, ip).run();

    // Send email notification (best-effort)
    try {
      const notifyEmail = (env as any).XCRYPTO_NOTIFY_EMAIL;
      const emailService = (env as any).EMAIL;
      if (emailService && notifyEmail) {
        const emailBody = `From: ${name || 'Anonymous'}\nReply-to: ${email || 'not provided'}\n\n${message}\n\n---\nSent via xCrypto24.com suggest form\nIP: ${ip}`;
        await emailService.send({
          from: 'noreply@xcrypto24.com',
          to: notifyEmail,
          subject: `[xCrypto24 Suggestion] from ${name || 'Anonymous'}`,
          text: emailBody,
        });
      }
    } catch (e) {
      // Email is best-effort
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
