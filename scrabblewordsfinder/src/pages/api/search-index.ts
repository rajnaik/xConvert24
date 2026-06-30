import type { APIRoute } from 'astro';

export const prerender = true;

/**
 * /api/search-index/ — Returns a JSON array of all searchable pages
 * for the client-side search widget. Prerendered at build time.
 *
 * Each entry: { t: title, u: url, d: description }
 */

// Load all blog .astro files as raw text at build time
// Path is relative to this file: src/pages/api/search-index.ts → ../blog/*.astro
const blogRaw = import.meta.glob('../blog/*.astro', { as: 'raw', eager: true }) as Record<string, string>;

// Landing pages to exclude (they have their own category entries)
const LANDING_PAGES = new Set([
  'index', 'beginner-guides', 'two-letter-words', 'three-letter-words',
  'strategy', 'high-scoring', 'bingos', 'tournament',
  'letter-guides', 'dictionaries', 'word-of-the-day-series', 'tools-solvers',
  'useful-links',
]);

// Static site pages (always included)
const SITE_PAGES = [
  { t: 'Word Solver', u: '/', d: 'Find all words from your tiles' },
  { t: 'Blog', u: '/blog/', d: 'Scrabble tips, strategy & word lists' },
  { t: 'Guide', u: '/guide/', d: 'How to use the word finder' },
  { t: 'About', u: '/about/', d: 'About ScrabbleWordsFinder' },
  { t: 'Privacy', u: '/privacy/', d: 'Privacy policy & data practices' },
  { t: 'Contact', u: '/contact/', d: 'Get in touch or report a bug' },
  { t: 'Suggest', u: '/suggest/', d: 'Suggest a feature' },
  { t: 'FAQ', u: '/faq/', d: 'Frequently asked questions' },
  { t: 'Settings', u: '/settings/', d: 'Your preferences, UUID & data' },
  { t: 'Releases', u: '/releases/', d: 'Version changelog' },
  { t: 'Achievements', u: '/achievements/', d: 'Track your word-finding milestones' },
  { t: 'Activities', u: '/activities/', d: 'Word of the Day, Daily Rack, Anagram' },
  { t: 'Roadmap', u: '/roadmap/', d: 'Upcoming features' },
  { t: 'Disclaimer', u: '/disclaimer/', d: 'Legal disclaimer' },
  { t: 'Terms', u: '/terms/', d: 'Terms of use' },
  { t: 'Stats', u: '/stats/', d: 'Your solver statistics' },
  { t: '60-Second Challenge', u: '/sixty-seconds/', d: 'Speed word-finding game' },
  { t: 'WordBench Practice', u: '/wordbench-practice/', d: 'Memory training for Scrabble' },
  { t: 'Tech Stack', u: '/tech-stack/', d: 'Built with Astro, Cloudflare Workers, D1' },
  // Blog category landing pages
  { t: 'Beginner Guides', u: '/blog/beginner-guides/', d: 'Learn Scrabble from scratch' },
  { t: 'Two-Letter Words', u: '/blog/two-letter-words/', d: 'Essential 2-letter word guides' },
  { t: 'Three-Letter Words', u: '/blog/three-letter-words/', d: '3-letter word strategy & lists' },
  { t: 'Strategy', u: '/blog/strategy/', d: 'Offensive, defensive & endgame tactics' },
  { t: 'High-Scoring Words', u: '/blog/high-scoring/', d: 'Maximum points from every play' },
  { t: 'Bingos', u: '/blog/bingos/', d: '7 and 8-letter bonus words' },
  { t: 'Tournament & Competitive', u: '/blog/tournament/', d: 'Tournament prep & competitive play' },
  { t: 'Letter Guides', u: '/blog/letter-guides/', d: 'Words by starting letter, ending, or pattern' },
  { t: 'Dictionaries', u: '/blog/dictionaries/', d: 'SOWPODS, TWL, Collins & dictionary guides' },
  { t: 'Word of the Day Series', u: '/blog/word-of-the-day-series/', d: 'Daily word learning' },
];

function extractTitle(content: string): string {
  // Try title="..." from Layout/BlogLayout props
  const match = content.match(/title="([^"]+)"/);
  if (match) {
    return match[1]
      .replace(/ — Scrabble.*$/, '')
      .replace(/ — ScrabbleWordsFinder.*$/, '')
      .replace(/ \| Scrabble.*$/, '')
      .replace(/ \(2026\)/g, '')
      .trim();
  }
  return '';
}

function extractDescription(content: string): string {
  // Try description="..." from Layout/BlogLayout props
  const match = content.match(/description="([^"]+)"/);
  if (match) {
    const desc = match[1];
    return desc.length > 55 ? desc.substring(0, 52) + '...' : desc;
  }
  return '';
}

// Build the blog entries from raw file content
const blogEntries: { t: string; u: string; d: string }[] = [];

for (const [path, content] of Object.entries(blogRaw)) {
  const slug = path.replace('../pages/blog/', '').replace('.astro', '');
  if (LANDING_PAGES.has(slug)) continue;

  const title = extractTitle(content as string);
  if (!title) continue;

  const desc = extractDescription(content as string) || title;
  blogEntries.push({ t: title, u: `/blog/${slug}/`, d: desc });
}

// Sort blog entries alphabetically
blogEntries.sort((a, b) => a.t.localeCompare(b.t));

// Combine all entries
const ALL_PAGES = [...SITE_PAGES, ...blogEntries];

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(ALL_PAGES), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // cache 24h
    },
  });
};
