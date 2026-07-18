import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const AI = (env as any).AI;

  if (!AI) {
    return new Response(JSON.stringify({ error: 'AI not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { system, messages } = body;

  if (!messages || !messages.length) {
    return new Response(JSON.stringify({ error: 'Messages required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const result = await AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
      messages: [
        { role: 'system', content: system || 'You are a helpful assistant.' },
        ...messages,
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = result.response || result.result?.response || '';

    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('AI error:', e);
    return new Response(JSON.stringify({ error: 'AI inference failed', details: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
