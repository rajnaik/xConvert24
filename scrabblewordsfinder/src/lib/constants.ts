/**
 * Server-side constants helper.
 * Reads constants from KV CACHE (fast) with DB fallback.
 * Use in Astro frontmatter for SSR pages.
 */
import { env } from 'cloudflare:workers';

interface ConstantRow {
  id: number;
  name: string;
  text: string;
  description: string;
  category: string;
  status: number;
  updated_at: string;
  updated_by: string;
  created_at: string;
}

const CACHE_TTL = 3600;

// --- Static fallbacks for prerendered pages ---
// These are used when the page is statically built and runtime bindings aren't available.
export const TAGLINE = 'Free, Fun, Fast & No Sign-up';
export const HERO_HEADING = 'Find Any Scrabble Word Instantly';
export const SITE_NAME = 'ScrabbleWordsFinder.com';
export const SITE_DOMAIN = 'scrabblewordsfinder.com';
export const SITE_DESCRIPTION = 'Free Scrabble Word Finder — find the highest-scoring words from your tiles instantly. No sign-up needed.';
export const COPYRIGHT_YEAR = '2026';
export const OG_IMAGE_PATH = '/social-card.svg';
export const FOOTER_TEXT = 'Made with ♟️ for word game lovers';
export const CONTACT_EMAIL = 'contact@scrabblewordsfinder.com';
export const DICTIONARY_VERSION = 'SOWPODS + TWL06';
export const MAX_SAVED_WORDS = '100';
export const PRIVACY_TRACKING_DISCLOSURE = 'We collect anonymous click data to improve features. No personal information is stored.';
export const DAILY_ACTIVITIES_ENABLED = '1';

/**
 * Get a single constant value by name.
 * Returns the text value or the provided fallback.
 */
export async function getConstant(name: string, fallback: string = ''): Promise<string> {
  const kv = (env as any).CACHE as KVNamespace | undefined;
  const db = (env as any).DB;

  // Try KV cache first
  if (kv) {
    try {
      const raw = await kv.get(`const:name:${name}`, 'text');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.constant?.text) return parsed.constant.text;
      }
    } catch { /* fall through */ }
  }

  // Fallback to DB
  if (db) {
    try {
      const row = await db.prepare('SELECT text FROM constants WHERE name = ? AND status = 1').bind(name).first() as ConstantRow | null;
      if (row?.text) {
        // Warm cache for next time
        if (kv) {
          try { await kv.put(`const:name:${name}`, JSON.stringify({ constant: row }), { expirationTtl: CACHE_TTL }); } catch {}
        }
        return row.text;
      }
    } catch { /* fall through */ }
  }

  return fallback;
}

/**
 * Get multiple constants at once. Returns a map of name → value.
 * More efficient than calling getConstant() multiple times.
 */
export async function getConstants(names: string[], fallbacks: Record<string, string> = {}): Promise<Record<string, string>> {
  const kv = (env as any).CACHE as KVNamespace | undefined;
  const db = (env as any).DB;
  const result: Record<string, string> = {};
  const missing: string[] = [];

  // Try KV cache for each
  if (kv) {
    const reads = names.map(async (name) => {
      try {
        const raw = await kv.get(`const:name:${name}`, 'text');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.constant?.text) {
            result[name] = parsed.constant.text;
            return;
          }
        }
      } catch { /* miss */ }
      missing.push(name);
    });
    await Promise.all(reads);
  } else {
    missing.push(...names);
  }

  // Fetch missing from DB
  if (missing.length > 0 && db) {
    try {
      const placeholders = missing.map(() => '?').join(',');
      const { results } = await db.prepare(
        `SELECT name, text FROM constants WHERE name IN (${placeholders}) AND status = 1`
      ).bind(...missing).all();

      for (const row of results as ConstantRow[]) {
        result[row.name] = row.text;
        // Warm cache
        if (kv) {
          try { await kv.put(`const:name:${row.name}`, JSON.stringify({ constant: row }), { expirationTtl: CACHE_TTL }); } catch {}
        }
      }
    } catch { /* fall through */ }
  }

  // Fill in fallbacks for any still missing
  for (const name of names) {
    if (!result[name]) {
      result[name] = fallbacks[name] || '';
    }
  }

  return result;
}
