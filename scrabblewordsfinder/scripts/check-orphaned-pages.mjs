#!/usr/bin/env node
/**
 * CheckOrphanedPages — Find pages with 0 inbound links
 * Usage: node scripts/check-orphaned-pages.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const BASE = 'src/pages';

function getAllPages(dir, pages = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!entry.startsWith('_') && entry !== 'api' && entry !== 'admin') {
        getAllPages(full, pages);
      }
    } else if (entry.endsWith('.astro') && !entry.startsWith('_')) {
      let urlPath = '/' + relative(BASE, full).replace(/\.astro$/, '/').replace(/index\/$/, '');
      if (!urlPath.endsWith('/')) urlPath += '/';
      pages.push({ file: full, url: urlPath });
    }
  }
  return pages;
}

const pages = getAllPages(BASE);
const inboundCounts = {};
pages.forEach(p => { inboundCounts[p.url] = 0; });

// Scan all pages for internal links
for (const page of pages) {
  try {
    const content = readFileSync(page.file, 'utf-8');
    const re = /href=["'](\/[^"'#]*?)["']/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      let target = m[1];
      if (!target.endsWith('/')) target += '/';
      if (inboundCounts[target] !== undefined && target !== page.url) {
        inboundCounts[target]++;
      }
    }
  } catch {}
}

const orphans = Object.entries(inboundCounts)
  .filter(([, count]) => count === 0)
  .map(([url]) => url)
  .sort();

const blogOrphans = orphans.filter(u => u.startsWith('/blog/'));
const otherOrphans = orphans.filter(u => !u.startsWith('/blog/'));

console.log('=== ORPHANED PAGES (0 inbound links) ===');
console.log(`Total pages scanned: ${pages.length}`);
console.log(`Total orphaned: ${orphans.length}`);
console.log(`  Blog orphans: ${blogOrphans.length}`);
console.log(`  Other orphans: ${otherOrphans.length}`);
console.log('');
console.log('--- Non-Blog Orphans ---');
otherOrphans.forEach(u => console.log('  ' + u));
console.log('');
console.log('--- Blog Orphans (first 50) ---');
blogOrphans.slice(0, 50).forEach(u => console.log('  ' + u));
if (blogOrphans.length > 50) console.log(`  ... and ${blogOrphans.length - 50} more`);
