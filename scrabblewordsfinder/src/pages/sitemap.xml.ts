import type { APIRoute } from 'astro';

export const prerender = true;

// Auto-discover all blog posts from the filesystem
const blogFiles = import.meta.glob('./blog/*.astro');
const blogSlugs = Object.keys(blogFiles)
  .map(path => path.replace('./blog/', '').replace('.astro', ''))
  .filter(slug => slug !== 'index')
  .sort();

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/guide', priority: '0.7', changefreq: 'monthly' },
  { url: '/faq', priority: '0.6', changefreq: 'monthly' },
  { url: '/achievements', priority: '0.6', changefreq: 'weekly' },
  { url: '/tech-stack', priority: '0.5', changefreq: 'monthly' },
  { url: '/releases', priority: '0.5', changefreq: 'weekly' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/suggest', priority: '0.4', changefreq: 'monthly' },
  { url: '/contact', priority: '0.4', changefreq: 'yearly' },
  { url: '/settings', priority: '0.4', changefreq: 'yearly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  // Blog category landing pages
  { url: '/blog/beginner-guides', priority: '0.7', changefreq: 'weekly' },
  { url: '/blog/two-letter-words', priority: '0.7', changefreq: 'weekly' },
  { url: '/blog/three-letter-words', priority: '0.7', changefreq: 'weekly' },
];

// Generate blog entries from discovered files
const blogPages = blogSlugs.map(slug => ({
  url: `/blog/${slug}`,
  priority: '0.6',
  changefreq: 'monthly' as const,
}));

const allPages = [...staticPages, ...blogPages];

export const GET: APIRoute = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => {
    const url = p.url === '/' ? '/' : p.url.endsWith('/') ? p.url : p.url + '/';
    return `  <url>
    <loc>https://www.scrabblewordsfinder.com${url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
  }).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
