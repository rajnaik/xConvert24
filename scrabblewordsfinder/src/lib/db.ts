/**
 * Shared database helper — single import for all API endpoints.
 * Avoids repeating `import { env } from 'cloudflare:workers'` and the cast everywhere.
 */
import { env } from 'cloudflare:workers';

export function getDB() {
  return (env as any).DB;
}

/**
 * Returns a JSON error response with proper headers.
 */
export function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Returns a JSON success response.
 */
export function jsonOk(data: Record<string, any>) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
