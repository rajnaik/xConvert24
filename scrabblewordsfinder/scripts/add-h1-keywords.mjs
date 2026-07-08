#!/usr/bin/env node
/**
 * add-h1-keywords.mjs
 * Adds an H1 tag with the page title + a random keyword suffix 
 * to all .astro blog/pages that are missing an <h1> tag.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';

const PAGES_DIR = join(process.cwd(), 'src/pages');
const SKIP_DIRS = ['admin', 'api'];

const KEYWORDS = [
  'Scrabble Words Finder',
  'English Solver',
  'Dictionary',
  'Quiz',
  'Bingo',
  'Anagram',
  'Word of the Day',
  '2-letter words',
  '3-letter words',
];

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

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

function extractTitle(content) {
  // Get the title from the Layout/BlogLayout title prop
  const match = content.match(/title="([^"]+)"/);
  if (match) {
    // Take just the main part before " — " or " | "
    let title = match[1];
    title = title.split(' — ')[0].split(' | ')[0].trim();
    return title;
  }
  return '';
}

function buildH1(title) {
  // Pick 2-3 random keywords to append
  const count = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const selected = pickRandom(KEYWORDS, count);
  const suffix = selected.join(' · ');
  
  // H1 styled consistently with the site's amber heading style
  return `<h1 class="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">${title}</h1>\n<p class="text-sm text-gray-400 mb-8 not-prose">${suffix}</p>`;
}

async function main() {
  let modified = 0;
  let skipped = 0;

  for await (const filePath of walkDir(PAGES_DIR)) {
    const content = await readFile(filePath, 'utf-8');
    
    // Skip files that already have an h1
    if (/<h1[\s>]/i.test(content)) continue;
    
    const title = extractTitle(content);
    if (!title) {
      skipped++;
      continue;
    }

    const h1Block = buildH1(title);
    
    let newContent;
    
    // Strategy: insert H1 after the date/read-time div if present
    // Pattern: after the "not-prose mb-8 flex items-center gap-3 text-sm text-gray-400" div
    const dateBlockEnd = '</div>\n<p class="text-lg';
    if (content.includes(dateBlockEnd)) {
      newContent = content.replace(dateBlockEnd, `</div>\n${h1Block}\n<p class="text-lg`);
    }
    // Alt: after BlogCrossLinks line
    else if (content.includes('<BlogCrossLinks')) {
      const crossLinksRegex = /(<BlogCrossLinks[^/]*\/>)/;
      const match = content.match(crossLinksRegex);
      if (match) {
        newContent = content.replace(match[0], `${match[0]}\n${h1Block}`);
      }
    }
    // Alt: after the breadcrumb nav closing </nav>
    else if (content.includes('</nav>')) {
      // Find the last </nav> before main content
      const navEndIdx = content.indexOf('</nav>');
      if (navEndIdx !== -1) {
        const insertPoint = navEndIdx + '</nav>'.length;
        newContent = content.slice(0, insertPoint) + '\n' + h1Block + '\n' + content.slice(insertPoint);
      }
    }
    // Fallback: after opening <article> or first <div class="max-w-3xl
    else if (content.includes('<article')) {
      const articleMatch = content.match(/<article[^>]*>/);
      if (articleMatch) {
        const idx = content.indexOf(articleMatch[0]) + articleMatch[0].length;
        newContent = content.slice(0, idx) + '\n' + h1Block + '\n' + content.slice(idx);
      }
    }
    // Last fallback: after first <div class="max-w-
    else if (content.includes('<div class="max-w-')) {
      const divMatch = content.match(/<div class="max-w-[^"]*">/);
      if (divMatch) {
        const idx = content.indexOf(divMatch[0]) + divMatch[0].length;
        newContent = content.slice(0, idx) + '\n' + h1Block + '\n' + content.slice(idx);
      }
    }

    if (newContent && newContent !== content) {
      await writeFile(filePath, newContent, 'utf-8');
      modified++;
      const rel = relative(process.cwd(), filePath);
      process.stderr.write(`✅ ${rel}\n`);
    } else {
      skipped++;
      const rel = relative(process.cwd(), filePath);
      process.stderr.write(`⚠️  No insertion point found: ${rel}\n`);
    }
  }

  console.log(`\nDone: ${modified} files modified, ${skipped} skipped`);
}

main().catch(err => { console.error(err); process.exit(1); });
