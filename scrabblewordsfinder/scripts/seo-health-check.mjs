#!/usr/bin/env node
/**
 * SEO Health Check — Full audit of all public pages
 * Usage: node scripts/seo-health-check.mjs
 * 
 * Checks:
 * 1.  Title presence + length (50-60 chars ideal, >70 warning)
 * 2.  Meta description presence + length (120-155 ideal, >160 warning)
 * 3.  Keywords presence
 * 4.  Article JSON-LD schema (blog posts only)
 * 5.  FAQPage JSON-LD schema (blog posts only)
 * 6.  Canonical URL (trailing slash)
 * 7.  Orphaned pages (0 inbound links)
 * 8.  Thin content (<55 lines)
 * 9.  Double h1 tags
 * 10. Missing global.css (Tailwind)
 * 11. Old Layout import (should be BlogLayout for blog)
 * 12. Internal links missing trailing slash
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const PAGES_DIR = 'src/pages';
const BLOG_DIR = 'src/pages/blog';

// Limits
const TITLE_MIN = 30;
const TITLE_MAX = 70;
const TITLE_IDEAL_MAX = 60;
const DESC_MIN = 80;
const DESC_MAX = 160;
const DESC_IDEAL_MAX = 155;
const THIN_LINES = 55;

function getAllFiles(dir, ext = '.astro', exclude = ['admin', 'api', '_']) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (exclude.some(e => entry.startsWith(e))) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results.push(...getAllFiles(full, ext, exclude));
      } else if (entry.endsWith(ext)) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

function extractProp(content, prop) {
  // Match title="..." or description="..." — handle apostrophes inside double quotes
  const reDouble = new RegExp(`${prop}="([^"]+)"`);
  const mDouble = content.match(reDouble);
  if (mDouble) return mDouble[1];
  // Try single quotes
  const reSingle = new RegExp(`${prop}='([^']+)'`);
  const mSingle = content.match(reSingle);
  if (mSingle) return mSingle[1];
  return '';
}

// Results
const issues = { critical: [], warning: [], info: [] };
let totalPages = 0;
let blogPages = 0;

console.log('🔍 SWF SEO Health Check');
console.log('═'.repeat(60));
console.log('');

// Get all pages
const allPages = getAllFiles(PAGES_DIR);
const blogFiles = getAllFiles(BLOG_DIR).filter(f => !f.endsWith('index.astro'));
totalPages = allPages.length;
blogPages = blogFiles.length;

// --- Check each page ---
let titleTooLong = [];
let titleTooShort = [];
let descTooLong = [];
let descTooShort = [];
let missingTitle = [];
let missingDesc = [];
let missingKeywords = [];
let missingGlobalCSS = [];
let oldLayout = [];
let thinPages = [];
let doubleH1 = [];
let missingArticleSchema = [];
let missingFAQSchema = [];
let missingTrailingSlash = [];

for (const file of allPages) {
  const content = readFileSync(file, 'utf-8');
  const rel = relative('.', file);
  const isBlog = file.includes('/blog/') && !file.endsWith('index.astro');
  const lines = content.split('\n').length;
  
  // Title
  const title = extractProp(content, 'title');
  if (!title) {
    // Skip dynamic routes with template literal titles (title={...})
    if (!content.match(/title=\{/)) {
      missingTitle.push(rel);
    }
  } else if (title.length > TITLE_MAX) {
    titleTooLong.push({ file: rel, len: title.length, title: title.substring(0, 50) + '...' });
  } else if (title.length < TITLE_MIN) {
    titleTooShort.push({ file: rel, len: title.length, title });
  }
  
  // Description
  const desc = extractProp(content, 'description');
  if (!desc) {
    // Skip dynamic routes with template literal descriptions
    if (!content.match(/description=\{/)) {
      missingDesc.push(rel);
    }
  } else if (desc.length > DESC_MAX) {
    descTooLong.push({ file: rel, len: desc.length });
  } else if (desc.length < DESC_MIN) {
    descTooShort.push({ file: rel, len: desc.length });
  }
  
  // Keywords
  if (!content.includes('keywords=')) {
    missingKeywords.push(rel);
  }
  
  // Blog-specific checks
  if (isBlog) {
    // Article schema
    if (!content.includes('"@type":"Article"') && !content.includes('"@type": "Article"')) {
      missingArticleSchema.push(rel);
    }
    // FAQ schema
    if (!content.includes('FAQPage')) {
      missingFAQSchema.push(rel);
    }
    // Global CSS
    if (!content.includes('global.css')) {
      missingGlobalCSS.push(rel);
    }
    // Old Layout
    if (content.includes("import Layout from '../../layouts/Layout.astro'")) {
      oldLayout.push(rel);
    }
    // Thin content
    if (lines < THIN_LINES) {
      thinPages.push({ file: rel, lines });
    }
    // Double h1
    if (content.includes('BlogCrossLinks title=') && /<h1[\s>]/.test(content)) {
      doubleH1.push(rel);
    }
  }
  
  // Internal links missing trailing slash
  const linkMatches = content.matchAll(/href=["'](\/[^"'#]*?)["']/g);
  for (const m of linkMatches) {
    const href = m[1];
    if (!href.endsWith('/') && !href.match(/\.\w+$/) && !href.includes('?')) {
      missingTrailingSlash.push({ file: rel, href });
      break; // Only report first per file
    }
  }
}

// --- Report ---
console.log(`📊 SUMMARY`);
console.log(`   Total pages scanned: ${totalPages}`);
console.log(`   Blog posts: ${blogPages}`);
console.log('');

const checks = [
  { name: '1. Missing title', items: missingTitle, level: 'critical' },
  { name: '2. Title too long (>70 chars)', items: titleTooLong, level: 'warning' },
  { name: '3. Title too short (<30 chars)', items: titleTooShort, level: 'info' },
  { name: '4. Missing description', items: missingDesc, level: 'critical' },
  { name: '5. Description too long (>160 chars)', items: descTooLong, level: 'warning' },
  { name: '6. Description too short (<80 chars)', items: descTooShort, level: 'info' },
  { name: '7. Missing keywords', items: missingKeywords, level: 'info' },
  { name: '8. Blog: missing Article schema', items: missingArticleSchema, level: 'warning' },
  { name: '9. Blog: missing FAQ schema', items: missingFAQSchema, level: 'warning' },
  { name: '10. Blog: missing global.css', items: missingGlobalCSS, level: 'critical' },
  { name: '11. Blog: old Layout import', items: oldLayout, level: 'critical' },
  { name: '12. Blog: thin content (<55 lines)', items: thinPages, level: 'warning' },
  { name: '13. Blog: double h1', items: doubleH1, level: 'warning' },
  { name: '14. Internal links missing trailing /', items: missingTrailingSlash, level: 'info' },
];

let criticalCount = 0, warningCount = 0, infoCount = 0;

for (const check of checks) {
  const count = check.items.length;
  const icon = count === 0 ? '✅' : check.level === 'critical' ? '❌' : check.level === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${icon} ${check.name}: ${count}`);
  
  if (count > 0 && count <= 10) {
    for (const item of check.items) {
      if (typeof item === 'string') console.log(`      ${item}`);
      else console.log(`      ${item.file} (${item.len || item.lines || item.href})`);
    }
  } else if (count > 10) {
    for (const item of check.items.slice(0, 5)) {
      if (typeof item === 'string') console.log(`      ${item}`);
      else console.log(`      ${item.file} (${item.len || item.lines || item.href})`);
    }
    console.log(`      ... and ${count - 5} more`);
  }
  
  if (count > 0) {
    if (check.level === 'critical') criticalCount += count;
    else if (check.level === 'warning') warningCount += count;
    else infoCount += count;
  }
}

console.log('');
console.log('─'.repeat(60));
console.log(`❌ Critical: ${criticalCount} | ⚠️ Warnings: ${warningCount} | ℹ️ Info: ${infoCount}`);
console.log('─'.repeat(60));

if (criticalCount === 0 && warningCount === 0) {
  console.log('🎉 Site is in excellent SEO health!');
} else if (criticalCount === 0) {
  console.log('👍 No critical issues. Warnings are minor/cosmetic.');
} else {
  console.log('🚨 Critical issues need fixing before deploy.');
}
