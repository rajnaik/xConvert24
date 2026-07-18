import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { name, email, phone, service, timeline, message } = body;

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Name, email, and message are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const subject = `[xSoft Enquiry] ${service || 'General'} — from ${name}`;

  // Save to database
  if (db) {
    try {
      await db.prepare(
        `INSERT INTO emails (category, name, email, subject, message, service, timeline, ip_address, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind('contact', name, email, subject, message, service || '', timeline || '', ip, phone ? `Phone: ${phone}` : '').run();
    } catch (e: any) {
      console.error('DB insert error:', e);
    }
  }

  // Send email notification
  const EMAIL = (env as any).EMAIL;
  const NOTIFY_EMAIL = (env as any).XSOFT_NOTIFY_EMAIL;

  if (EMAIL && NOTIFY_EMAIL) {
    try {
      const { EmailMessage } = await import('cloudflare:email');
      const rawEmail = [
        `From: noreply@xsoftlimited.com`,
        `To: ${NOTIFY_EMAIL}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || 'Not provided'}`,
        `Service: ${service || 'Not specified'}`,
        `Timeline: ${timeline || 'Not specified'}`,
        ``,
        message,
        ``,
        `---`,
        `Sent via xsoftlimited.com contact form`,
        `IP: ${ip}`,
      ].join('\r\n');

      const msg = new EmailMessage('noreply@xsoftlimited.com', NOTIFY_EMAIL, rawEmail);
      await EMAIL.send(msg);
    } catch (e: any) {
      console.error('Email send error:', e);
    }
  }

  return new Response(JSON.stringify({ success: true, message: 'Message received. We will get back to you within 24 hours.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
