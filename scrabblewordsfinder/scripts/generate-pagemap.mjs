#!/usr/bin/env node
/**
 * generate-pagemap.mjs
 * Scans all public .astro pages under src/pages/ (excluding admin/ and api/)
 * and extracts internal href links to produce src/data/pagemap-links.json.
 *
 * Run: node scripts/generate-pagemap.mjs
 * Wired as prebuild step in package.json.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, relative, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const PAGES_DIR = join(ROOT, 'src', 'pages');
const OUTPUT = join(ROOT, 'src', 'data', 'pagemap-links.json');

// Directories to exclude from the page map
const EXCLUDED_DIRS = ['admin', 'api'];

/**
 * Recursively collect all .astro files under a directory,
 * skipping excluded directories.
 */
async function collectAstroFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const relDir = relative(PAGES_DIR, fullPath).split('/')[0];
      if (EXCLUDED_DIRS.includes(relDir)) continue;
      await collectAstroFiles(fullPath, files);
    } else if (entry.name.endsWith('.astro')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Convert a file path to its public URL path (with trailing slash).
 * e.g. src/pages/blog/my-post.astro -> /blog/my-post/
 *      src/pages/index.astro -> /
 */
function fileToRoute(filePath) {
  let rel = relative(PAGES_DIR, filePath);
  // Remove .astro extension
  rel = rel.replace(/\.astro$/, '');
  // index files map to their directory
  if (rel === 'index') return '/';
  if (rel.endsWith('/index')) rel = rel.slice(0, -6);
  // Ensure leading and trailing slash
  return '/' + rel + '/';
}

/**
 * Extract all internal href links from file content.
 * Matches href="/..." patterns (internal links start with /).
 * Excludes anchors-only (#), external links, and static assets.
 */
function extractInternalLinks(content, currentRoute) {
  const links = new Set();
  // Match href="..." with internal paths
  const hrefRegex = /href="(\/[^"]*?)"/g;
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    let href = match[1];
    // Skip static assets (images, css, js, svg, etc.)
    if (/\.(svg|png|jpg|jpeg|gif|webp|css|js|ts|json|xml|txt|pdf|wav|mp3|ico)$/i.test(href)) continue;
    // Skip API and admin paths
    if (href.startsWith('/api/') || href.startsWith('/admin/')) continue;
    // Keep fragment links that have a page path (e.g. /activities/#section)
    // but skip pure fragment links like "#top"
    if (href === '#' || href.startsWith('/#')) continue;
    // Skip self-links (same page)
    if (href === currentRoute) continue;
    // Normalize: ensure trailing slash (before any fragment)
    const fragmentIdx = href.indexOf('#');
    if (fragmentIdx > 0) {
      const path = href.slice(0, fragmentIdx);
      const frag = href.slice(fragmentIdx);
      href = (path.endsWith('/') ? path : path + '/') + frag;
    } else if (!href.endsWith('/')) {
      href = href + '/';
    }
    links.add(href);
  }
  return [...links].sort();
}

async function main() {
  console.log('Generating pagemap-links.json...');
  const files = await collectAstroFiles(PAGES_DIR);
  console.log(`Found ${files.length} public .astro pages`);

  const linkMap = {};
  for (const file of files) {
    const route = fileToRoute(file);
    const content = await readFile(file, 'utf-8');
    const links = extractInternalLinks(content, route);
    if (links.length > 0) {
      linkMap[route] = links;
    }
  }

  // Sort by route for deterministic output
  const sorted = Object.fromEntries(
    Object.entries(linkMap).sort(([a], [b]) => a.localeCompare(b))
  );

  const pageCount = Object.keys(sorted).length;
  const linkCount = Object.values(sorted).reduce((sum, arr) => sum + arr.length, 0);

  // Ensure output directory exists
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(sorted, null, 2) + '\n');

  console.log(`✓ Written ${OUTPUT}`);
  console.log(`  Pages: ${pageCount}`);
  console.log(`  Links: ${linkCount}`);
}

main().catch(err => {
  console.error('Error generating pagemap:', err);
  process.exit(1);
});
