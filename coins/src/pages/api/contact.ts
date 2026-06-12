import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!message) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });

  const ip = request.headers.get('cf-connecting-ip') || '';
  const category = subject === 'suggestion' ? 'suggest' : 'contact';

  await db.prepare('INSERT INTO emails (category, name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(category, name || '', email || '', subject || 'general', message, ip).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
