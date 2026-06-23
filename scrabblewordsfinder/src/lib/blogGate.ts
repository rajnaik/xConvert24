/**
 * Blog publishing gate — checks D1 blog_posts table for publish status.
 * Returns true if the post is published (status=1), false otherwise.
 * Falls back to true (allow) if DB is unavailable (local dev without blog_posts table).
 */

export async function isBlogPublished(slug: string): Promise<boolean> {
  try {
    const { env } = await import('cloudflare:workers');
    const db = (env as any).DB;
    if (!db) return true; // No DB binding = local dev, allow all

    const result = await db.prepare(
      'SELECT status FROM blog_posts WHERE slug = ?'
    ).bind(slug).first();

    // If no row found, allow the page (not gated)
    if (!result) return true;
    return result.status === 1;
  } catch {
    // On any error (table doesn't exist, etc.), allow the page
    return true;
  }
}
