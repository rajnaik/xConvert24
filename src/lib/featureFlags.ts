/**
 * Feature Flags utility
 * 
 * Usage in Astro pages:
 *   import { isFeatureEnabled, getEnvironment } from '../lib/featureFlags';
 *   const showLeaderboard = await isFeatureEnabled('leaderboard', Astro.url);
 * 
 * Usage in client-side JS:
 *   fetch('/api/feature-flags').then(r => r.json()).then(d => {
 *     const flag = d.flags.find(f => f.id === 'leaderboard');
 *     if (flag?.enabled) { ... }
 *   });
 */

export function getEnvironment(url: URL): 'dev' | 'staging' | 'live' {
  const host = url.hostname;
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'dev';
  if (host.includes('staging')) return 'staging';
  return 'live';
}

/**
 * Check if a feature flag is enabled for the current environment.
 * Falls back to checking environment from URL if DB is unavailable.
 */
export async function isFeatureEnabled(flagId: string, url: URL): Promise<boolean> {
  const environment = getEnvironment(url);

  try {
    const { env } = await import('cloudflare:workers');
    const db = (env as any).BUGS_DB;
    if (!db) return environment !== 'live'; // Default: show on dev/staging, hide on live

    const flag = await db.prepare('SELECT * FROM feature_flags WHERE id = ?').bind(flagId).first();
    if (!flag) return environment !== 'live';

    if (environment === 'dev') return !!flag.enabled_dev;
    if (environment === 'staging') return !!flag.enabled_staging;
    return !!flag.enabled_live;
  } catch {
    // If cloudflare:workers not available, use URL-based check
    return environment !== 'live';
  }
}

/**
 * Get all feature flags for the current environment.
 */
export async function getAllFlags(url: URL): Promise<Array<{ id: string; name: string; enabled: boolean }>> {
  const environment = getEnvironment(url);

  try {
    const { env } = await import('cloudflare:workers');
    const db = (env as any).BUGS_DB;
    if (!db) return [];

    const rows = await db.prepare('SELECT * FROM feature_flags ORDER BY name ASC').all();
    return (rows?.results || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      enabled: environment === 'dev' ? !!f.enabled_dev : environment === 'staging' ? !!f.enabled_staging : !!f.enabled_live,
    }));
  } catch {
    return [];
  }
}
