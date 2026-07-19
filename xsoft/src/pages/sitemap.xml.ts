import type { APIRoute } from 'astro';

export const prerender = true;

const SITE = 'https://www.xsoftlimited.com';
const BUILD_DATE = new Date().toISOString().split('T')[0];

// Auto-discover blog posts (directory-based: blog/<slug>/index.astro)
const blogDirs = import.meta.glob('./blog/*/index.astro');
const blogSlugs = Object.keys(blogDirs)
  .map(path => path.replace('./blog/', '').replace('/index.astro', ''))
  .filter(slug => slug !== '')
  .sort();

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/services/', priority: '0.9', changefreq: 'monthly' },
  { url: '/case-studies/', priority: '0.9', changefreq: 'monthly' },
  { url: '/case-studies/scrabblewordsfinder/', priority: '0.8', changefreq: 'monthly' },
  { url: '/case-studies/xconvert24/', priority: '0.8', changefreq: 'monthly' },
  { url: '/case-studies/xcrypto24/', priority: '0.8', changefreq: 'monthly' },
  { url: '/about/', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact/', priority: '0.8', changefreq: 'monthly' },
  { url: '/blog/', priority: '0.8', changefreq: 'weekly' },
  { url: '/tools/', priority: '0.7', changefreq: 'monthly' },
  { url: '/tech-stack/', priority: '0.6', changefreq: 'monthly' },
  { url: '/releases/', priority: '0.5', changefreq: 'weekly' },
  { url: '/privacy/', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms/', priority: '0.3', changefreq: 'yearly' },
];

export const GET: APIRoute = async () => {
  const urls = staticPages.map(page => `  <url>
    <loc>${SITE}${page.url}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);

  // Add all blog posts
  for (const slug of blogSlugs) {
    urls.push(`  <url>
    <loc>${SITE}/blog/${slug}/</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
