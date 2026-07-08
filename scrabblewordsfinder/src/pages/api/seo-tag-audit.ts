import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

/**
 * GET /api/seo-tag-audit/
 * Scans the seo_index DB table for tag presence counts.
 * Returns a summary of how many pages have each SEO element present vs missing.
 */
export const GET: APIRoute = async () => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  try {
    const result = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN seo_title != '' AND seo_title IS NOT NULL THEN 1 ELSE 0 END) as has_title,
        SUM(CASE WHEN seo_meta_description != '' AND seo_meta_description IS NOT NULL THEN 1 ELSE 0 END) as has_description,
        SUM(CASE WHEN seo_meta_keywords != '' AND seo_meta_keywords IS NOT NULL THEN 1 ELSE 0 END) as has_keywords,
        SUM(CASE WHEN seo_h1 != '' AND seo_h1 IS NOT NULL THEN 1 ELSE 0 END) as has_h1,
        SUM(CASE WHEN seo_h2_count > 0 THEN 1 ELSE 0 END) as has_h2,
        SUM(CASE WHEN seo_json_ld_article = 1 THEN 1 ELSE 0 END) as has_article_schema,
        SUM(CASE WHEN seo_json_ld_faq = 1 THEN 1 ELSE 0 END) as has_faq_schema,
        SUM(CASE WHEN seo_og_title != '' AND seo_og_title IS NOT NULL THEN 1 ELSE 0 END) as has_og_title,
        SUM(CASE WHEN seo_og_description != '' AND seo_og_description IS NOT NULL THEN 1 ELSE 0 END) as has_og_desc,
        SUM(CASE WHEN seo_og_image != '' AND seo_og_image IS NOT NULL THEN 1 ELSE 0 END) as has_og_image,
        SUM(CASE WHEN seo_canonical != '' AND seo_canonical IS NOT NULL THEN 1 ELSE 0 END) as has_canonical,
        SUM(CASE WHEN seo_internal_links > 0 THEN 1 ELSE 0 END) as has_internal_links,
        SUM(CASE WHEN seo_word_count >= 150 THEN 1 ELSE 0 END) as has_sufficient_content,
        SUM(CASE WHEN seo_title_length > 60 THEN 1 ELSE 0 END) as title_too_long,
        SUM(CASE WHEN seo_desc_length > 155 THEN 1 ELSE 0 END) as desc_too_long,
        ROUND(AVG(seo_word_count)) as avg_word_count,
        ROUND(AVG(seo_h2_count), 1) as avg_h2_count,
        ROUND(AVG(seo_internal_links), 1) as avg_internal_links
      FROM seo_index
      WHERE url != '/blog/wotd/[month]/'
    `).first();

    // Length statistics for text-based tags
    const lengths = await db.prepare(`
      SELECT
        ROUND(AVG(seo_title_length), 1) as avg_title_len,
        MIN(seo_title_length) as min_title_len,
        MAX(seo_title_length) as max_title_len,
        ROUND(AVG(seo_desc_length), 1) as avg_desc_len,
        MIN(seo_desc_length) as min_desc_len,
        MAX(seo_desc_length) as max_desc_len,
        ROUND(AVG(LENGTH(seo_meta_keywords)), 1) as avg_keywords_len,
        MIN(LENGTH(seo_meta_keywords)) as min_keywords_len,
        MAX(LENGTH(seo_meta_keywords)) as max_keywords_len,
        ROUND(AVG(LENGTH(seo_h1)), 1) as avg_h1_len,
        MIN(LENGTH(seo_h1)) as min_h1_len,
        MAX(LENGTH(seo_h1)) as max_h1_len,
        ROUND(AVG(seo_h2_count), 1) as avg_h2_count_val,
        MIN(seo_h2_count) as min_h2_count,
        MAX(seo_h2_count) as max_h2_count,
        ROUND(AVG(seo_word_count)) as avg_words,
        MIN(seo_word_count) as min_words,
        MAX(seo_word_count) as max_words,
        ROUND(AVG(seo_internal_links), 1) as avg_links,
        MIN(seo_internal_links) as min_links,
        MAX(seo_internal_links) as max_links,
        ROUND(AVG(LENGTH(seo_og_title)), 1) as avg_og_title_len,
        MIN(LENGTH(seo_og_title)) as min_og_title_len,
        MAX(LENGTH(seo_og_title)) as max_og_title_len,
        ROUND(AVG(LENGTH(seo_og_description)), 1) as avg_og_desc_len,
        MIN(LENGTH(seo_og_description)) as min_og_desc_len,
        MAX(LENGTH(seo_og_description)) as max_og_desc_len
      FROM seo_index
      WHERE url != '/blog/wotd/[month]/'
        AND seo_title != '' AND seo_title IS NOT NULL
    `).first();

    return new Response(JSON.stringify({ audit: result, lengths, timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
