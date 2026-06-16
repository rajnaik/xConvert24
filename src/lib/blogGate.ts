/**
 * Blog publishing gate — checks D1 BlogPosts table for publish status.
 * Returns true if the post is published (status=1), false otherwise.
 */

export async function isBlogPublished(slug: string): Promise<boolean> {
  try {
    const { env } = await import('cloudflare:workers');
    const db = (env as any).BUGS_DB;
    if (!db) return true; // If no DB (local dev), allow all

    const result = await db.prepare(
      'SELECT status FROM BlogPosts WHERE blogid = ?'
    ).bind(slug).first();

    if (!result) return true;
    return result.status === 1;
  } catch {
    return true;
  }
}

/**
 * Get all published blog slugs for the blog index page.
 * Maps DB blogids (blog-01, blog-02...) to an index for position-based matching.
 */
export async function getPublishedSlugs(): Promise<string[]> {
  try {
    const { env } = await import('cloudflare:workers');
    const db = (env as any).BUGS_DB;
    if (!db) return [];

    const { results } = await db.prepare(
      'SELECT blogid FROM BlogPosts WHERE status = 1 ORDER BY pub_date ASC'
    ).all();

    return results.map((r: any) => r.blogid);
  } catch {
    return [];
  }
}

/**
 * Get the count of published posts (for position-based filtering).
 */
export async function getPublishedCount(): Promise<number> {
  try {
    const { env } = await import('cloudflare:workers');
    const db = (env as any).BUGS_DB;
    if (!db) return 0;

    const row = await db.prepare(
      'SELECT COUNT(*) as cnt FROM BlogPosts WHERE status = 1'
    ).first();

    return row?.cnt ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Generate BlogPosting JSON-LD for a blog post.
 */
export function getBlogPostingSchema(title: string, slug: string, datePublished: string, description: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "datePublished": datePublished,
    "dateModified": datePublished,
    "author": { "@type": "Organization", "name": "xConvert24.com" },
    "publisher": { "@type": "Organization", "name": "xConvert24.com", "url": "https://www.xconvert24.com" },
    "mainEntityOfPage": `https://www.xconvert24.com/blog/${slug}`,
    "description": description,
  });
}
