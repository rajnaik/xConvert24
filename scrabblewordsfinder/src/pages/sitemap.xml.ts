import type { APIRoute } from 'astro';

export const prerender = true;

// Build date — used as lastmod for all pages (updates each deploy)
const BUILD_DATE = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Auto-discover all blog posts from the filesystem
const blogFiles = import.meta.glob('./blog/*.astro');
const blogSlugs = Object.keys(blogFiles)
  .map(path => path.replace('./blog/', '').replace('.astro', ''))
  .filter(slug => slug !== 'index')
  .sort();

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily', lastmod: BUILD_DATE },
  { url: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/guide', priority: '0.7', changefreq: 'monthly', lastmod: '2026-06-14' },
  { url: '/faq', priority: '0.6', changefreq: 'monthly', lastmod: '2026-06-14' },
  { url: '/achievements', priority: '0.6', changefreq: 'weekly', lastmod: '2026-06-14' },
  { url: '/tech-stack', priority: '0.5', changefreq: 'monthly', lastmod: '2026-06-14' },
  { url: '/releases', priority: '0.5', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/about', priority: '0.5', changefreq: 'monthly', lastmod: '2026-06-10' },
  { url: '/suggest', priority: '0.4', changefreq: 'monthly', lastmod: '2026-06-10' },
  { url: '/contact', priority: '0.4', changefreq: 'yearly', lastmod: '2026-06-10' },
  { url: '/settings', priority: '0.4', changefreq: 'yearly', lastmod: '2026-06-13' },
  { url: '/activities', priority: '0.7', changefreq: 'daily', lastmod: BUILD_DATE },
  { url: '/sixty-seconds', priority: '0.7', changefreq: 'daily', lastmod: BUILD_DATE },
  { url: '/stats', priority: '0.6', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/anagram-history', priority: '0.5', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/quiz-history', priority: '0.5', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/wordbench-practice', priority: '0.5', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/workbench-data', priority: '0.5', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/roadmap', priority: '0.5', changefreq: 'monthly', lastmod: BUILD_DATE },
  { url: '/profile-data', priority: '0.4', changefreq: 'monthly', lastmod: BUILD_DATE },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly', lastmod: '2026-06-10' },
  { url: '/disclaimer', priority: '0.3', changefreq: 'yearly', lastmod: '2026-06-10' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly', lastmod: '2026-06-10' },
  { url: '/blog/useful-links', priority: '0.5', changefreq: 'monthly', lastmod: BUILD_DATE },
  // Blog category landing pages
  { url: '/blog/beginner-guides', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/two-letter-words', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/three-letter-words', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/strategy', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/tournament', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/bingos', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/high-scoring', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/letter-guides', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/dictionaries', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
  { url: '/blog/tools-solvers', priority: '0.7', changefreq: 'weekly', lastmod: BUILD_DATE },
];

// Generate blog entries from discovered files (excluding category landing pages already in staticPages)
const staticSlugs = new Set(staticPages.filter(p => p.url.startsWith('/blog/')).map(p => p.url.replace('/blog/', '')));
const blogPages = blogSlugs
  .filter(slug => !staticSlugs.has(slug))
  .map(slug => ({
    url: `/blog/${slug}`,
    priority: '0.6',
    changefreq: 'monthly' as const,
    lastmod: BUILD_DATE,
  }));

const allPages = [...staticPages, ...blogPages];

export const GET: APIRoute = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => {
    const url = p.url === '/' ? '/' : p.url.endsWith('/') ? p.url : p.url + '/';
    return `  <url>
    <loc>https://www.scrabblewordsfinder.com${url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
  }).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
