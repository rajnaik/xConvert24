#!/usr/bin/env node
/**
 * sync-seo-index.mjs
 * Scans all .astro pages, extracts SEO metadata from frontmatter/props,
 * and generates SQL UPDATE statements for the seo_index table.
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';

const PAGES_DIR = join(process.cwd(), 'src/pages');
const SKIP_DIRS = ['admin', 'api'];

async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name) || entry.name.startsWith('_')) continue;
      yield* walkDir(fullPath);
    } else if (entry.name.endsWith('.astro') && !entry.name.startsWith('_') && !entry.name.includes('[')) {
      yield fullPath;
    }
  }
}

function filePathToUrl(filePath) {
  let rel = relative(PAGES_DIR, filePath)
    .replace(/\\/g, '/')
    .replace(/index\.astro$/, '')
    .replace(/\.astro$/, '/');
  if (!rel.startsWith('/')) rel = '/' + rel;
  if (!rel.endsWith('/')) rel += '/';
  return rel;
}

function extractProp(content, propName) {
  // Match: propName="value" or propName = "value" or propName={'value'} or propName={`value`}
  // Also match: const propName = "value" or let propName = "value"
  
  // Try Layout/BlogLayout prop pass: title="..." description="..." keywords="..."
  const propRegex = new RegExp(`${propName}\\s*=\\s*["'\`{]([^"'\`}]+)["'\`}]`);
  const match = content.match(propRegex);
  if (match) return match[1].trim();
  
  // Try const/let assignment in frontmatter
  const assignRegex = new RegExp(`(?:const|let)\\s+${propName}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`);
  const assignMatch = content.match(assignRegex);
  if (assignMatch) return assignMatch[1].trim();
  
  return '';
}

function countH2(content) {
  const matches = content.match(/<h2[\s>]/gi);
  return matches ? matches.length : 0;
}

function hasJsonLd(content, type) {
  const regex = new RegExp(`"@type"\\s*:\\s*"${type}"`, 'i');
  return regex.test(content) ? 1 : 0;
}

function countInternalLinks(content) {
  const matches = content.match(/href=["']\/[^"']*/gi);
  return matches ? matches.length : 0;
}

function estimateWordCount(content) {
  // Strip frontmatter (between --- marks)
  const noFrontmatter = content.replace(/^---[\s\S]*?---/, '');
  // Strip HTML tags
  const noHtml = noFrontmatter.replace(/<[^>]+>/g, ' ');
  // Strip JS/script blocks
  const noScript = noHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Strip style blocks
  const noStyle = noScript.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Count words
  const words = noStyle.split(/\s+/).filter(w => w.length > 2);
  return words.length;
}

function escSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

async function main() {
  const updates = [];
  let count = 0;

  for await (const filePath of walkDir(PAGES_DIR)) {
    const content = await readFile(filePath, 'utf-8');
    const url = filePathToUrl(filePath);

    const title = extractProp(content, 'title');
    const description = extractProp(content, 'description');
    const keywords = extractProp(content, 'keywords');
    const h2Count = countH2(content);
    const hasArticle = hasJsonLd(content, 'Article');
    const hasFaq = hasJsonLd(content, 'FAQPage');
    const internalLinks = countInternalLinks(content);
    const wordCount = estimateWordCount(content);
    const titleLength = title.length;
    const descLength = description.length;

    // Only generate update if we have at least a title
    if (title) {
      updates.push(
        `UPDATE seo_index SET ` +
        `seo_title='${escSql(title)}', ` +
        `seo_meta_description='${escSql(description)}', ` +
        `seo_meta_keywords='${escSql(keywords)}', ` +
        `seo_h2_count=${h2Count}, ` +
        `seo_json_ld_article=${hasArticle}, ` +
        `seo_json_ld_faq=${hasFaq}, ` +
        `seo_internal_links=${internalLinks}, ` +
        `seo_word_count=${wordCount}, ` +
        `seo_title_length=${titleLength}, ` +
        `seo_desc_length=${descLength}, ` +
        `updated_at=datetime('now') ` +
        `WHERE url='${escSql(url)}';`
      );
      count++;
    }
  }

  // Output as SQL file
  console.log(`-- sync-seo-index: ${count} pages processed at ${new Date().toISOString()}`);
  console.log('BEGIN TRANSACTION;');
  for (const stmt of updates) {
    console.log(stmt);
  }
  console.log('COMMIT;');

  process.stderr.write(`✅ Generated ${count} UPDATE statements\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
