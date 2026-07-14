import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const result = await db.prepare('SELECT * FROM maintenance_tasks ORDER BY sort_order ASC').all();
  return new Response(JSON.stringify({ tasks: result.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const body = await request.json() as any;
  const { id, status } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  if (status === 1) {
    // Mark as completed — set last_completed to now, calculate next_due, reset status
    const task = await db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').bind(id).first() as any;
    if (!task) return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });

    const now = new Date();
    const lastCompleted = now.toISOString().split('T')[0];

    // Calculate next due based on frequency
    let nextDue = '';
    if (task.frequency === 'monthly') {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      nextDue = next.toISOString().split('T')[0];
    } else if (task.frequency === 'quarterly') {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 3);
      next.setDate(1);
      nextDue = next.toISOString().split('T')[0];
    } else if (task.frequency === 'annual') {
      const next = new Date(now);
      next.setFullYear(next.getFullYear() + 1);
      next.setMonth(0);
      next.setDate(1);
      nextDue = next.toISOString().split('T')[0];
    }

    await db.prepare(
      'UPDATE maintenance_tasks SET status = 0, last_completed = ?, next_due = ? WHERE id = ?'
    ).bind(lastCompleted, nextDue, id).run();

    return new Response(JSON.stringify({ success: true, last_completed: lastCompleted, next_due: nextDue }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
};
