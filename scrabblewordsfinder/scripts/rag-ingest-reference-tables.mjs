/**
 * RAG Ingest — Reference Tables & Word Lists
 * 
 * Chunks and ingests the 54 reference table blog pages not yet in the RAG index.
 * These are word-list pages (ending-in-X, starting-with-X, N-letter-words, 
 * hook words, best-words, highest-scoring, etc.)
 * 
 * Usage:
 *   node scripts/rag-ingest-reference-tables.mjs [TARGET_URL]
 * 
 * Examples:
 *   node scripts/rag-ingest-reference-tables.mjs                              # localhost (dev)
 *   node scripts/rag-ingest-reference-tables.mjs https://www.scrabblewordsfinder.com  # live
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const TARGET = process.argv[2] || 'http://localhost:4321';
const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'src/pages/blog');
const BATCH_SIZE = 20;
const DELAY_MS = 1500; // 1.5s between batches (Workers AI rate limit)

// Target chunk size in characters (~500 tokens ≈ 2000 chars)
const CHUNK_SIZE = 1800;

// The 54 reference table pages to ingest
const REFERENCE_PAGES = [
  { slug: '6-letter-words-with-x', category: 'Letter Guides' },
  { slug: '6-letter-words-with-z', category: 'Letter Guides' },
  { slug: '7-letter-words-with-x', category: 'Letter Guides' },
  { slug: '7-letter-words-with-z', category: 'Letter Guides' },
  { slug: '8-letter-words-with-x', category: 'Letter Guides' },
  { slug: '8-letter-words-with-z', category: 'Letter Guides' },
  { slug: 'best-3-letter-scrabble-words', category: 'High-Scoring Words' },
  { slug: 'best-4-letter-scrabble-words', category: 'High-Scoring Words' },
  { slug: 'best-5-letter-scrabble-words', category: 'High-Scoring Words' },
  { slug: 'best-scrabble-words-under-5-letters', category: 'High-Scoring Words' },
  { slug: 'highest-scoring-2-letter-words', category: 'High-Scoring Words' },
  { slug: 'scrabble-10-letter-words', category: 'Word Lists' },
  { slug: 'scrabble-best-defensive-words', category: 'Strategy' },
  { slug: 'scrabble-hook-words-complete-guide', category: 'Strategy' },
  { slug: 'scrabble-hook-words-guide', category: 'Strategy' },
  { slug: 'scrabble-words-ending-in-able', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-al', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ant', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ary', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ate', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ed', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ence', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-er', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ful', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-fy', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-gy', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ible', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ic', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ing', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ism', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ist', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ity', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ive', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ize', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-j', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-less', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ly', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ment', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ness', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ny', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ory', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ous', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-q', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ry', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-tion', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-tion-guide', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ty', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-ure', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-x', category: 'Suffix Guides' },
  { slug: 'scrabble-words-ending-in-z', category: 'Suffix Guides' },
  { slug: 'scrabble-words-starting-with-j', category: 'Letter Guides' },
  { slug: 'scrabble-words-starting-with-q', category: 'Letter Guides' },
  { slug: 'scrabble-words-starting-with-x', category: 'Letter Guides' },
  { slug: 'scrabble-words-starting-with-z', category: 'Letter Guides' },
];

// --- Text extraction functions (from rag-chunk-blogs.mjs) ---

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n*/m, '');
}

function stripJsonLd(content) {
  return content.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
}

function stripScriptsAndStyles(content) {
  let cleaned = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  return cleaned;
}

function stripHtml(content) {
  let text = content.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|h[1-6]|li|div|tr|td|th|article|section|aside|nav|blockquote)>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  text = text.replace(/set:html=\{[^}]*\}/g, '');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  return text.trim();
}

function extractText(rawContent) {
  let content = stripFrontmatter(rawContent);
  content = stripJsonLd(content);
  content = stripScriptsAndStyles(content);
  content = stripHtml(content);
  
  const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(class=|href=|src=|alt=)/.test(trimmed)) return false;
    if (trimmed.length < 5) return false;
    if (/^← Blog$|^Back to all articles$|^› /.test(trimmed)) return false;
    return true;
  });
  
  return lines.join('\n').trim();
}

function extractTitle(content, slug) {
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) return h1Match[1].replace(/<[^>]+>/g, '').trim();
  const titleMatch = content.match(/title="([^"]+)"/);
  if (titleMatch) return titleMatch[1].replace(/\s*—.*$/, '').trim();
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function chunkText(text, title, slug, category) {
  const chunks = [];
  const prefix = `Title: ${title}\n\n`;
  
  if (text.length <= CHUNK_SIZE) {
    chunks.push({ slug, title, category, chunk_index: 0, content: prefix + text });
    return chunks;
  }
  
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 0);
  let currentChunk = prefix;
  let chunkIndex = 0;
  let lastSentences = [];
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE && currentChunk.length > 200) {
      chunks.push({ slug, title, category, chunk_index: chunkIndex, content: currentChunk.trim() });
      chunkIndex++;
      const overlapText = lastSentences.slice(-3).join(' ');
      currentChunk = prefix + overlapText + ' ';
      lastSentences = lastSentences.slice(-3);
    }
    currentChunk += sentence + ' ';
    lastSentences.push(sentence);
    if (lastSentences.length > 5) lastSentences.shift();
  }
  
  if (currentChunk.trim().length > 100) {
    chunks.push({ slug, title, category, chunk_index: chunkIndex, content: currentChunk.trim() });
  }
  
  return chunks;
}

// --- Main ---

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function main() {
  console.log('📚 RAG Ingest — Reference Tables & Word Lists');
  console.log('==============================================');
  console.log(`   Target: ${TARGET}`);
  console.log(`   Pages to process: ${REFERENCE_PAGES.length}\n`);

  // Step 1: Chunk all pages
  const allChunks = [];
  let processed = 0;
  let skipped = 0;

  for (const page of REFERENCE_PAGES) {
    const filePath = join(BLOG_DIR, `${page.slug}.astro`);
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const title = extractTitle(raw, page.slug);
      const text = extractText(raw);
      
      if (text.length < 50) {
        console.log(`   ⚠️  Skipping ${page.slug} — too little content (${text.length} chars)`);
        skipped++;
        continue;
      }
      
      const chunks = chunkText(text, title, page.slug, page.category);
      allChunks.push(...chunks);
      processed++;
    } catch (err) {
      console.log(`   ❌ Error reading ${page.slug}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n   ✅ Chunking complete`);
  console.log(`   Processed: ${processed} pages`);
  console.log(`   Skipped: ${skipped} pages`);
  console.log(`   Total chunks: ${allChunks.length}`);
  console.log(`   Avg chunks/page: ${(allChunks.length / Math.max(processed, 1)).toFixed(1)}\n`);

  if (allChunks.length === 0) {
    console.log('   No chunks to ingest. Exiting.');
    return;
  }

  // Step 2: Send batches to /api/rag-ingest/
  console.log(`   Sending ${Math.ceil(allChunks.length / BATCH_SIZE)} batches to ${TARGET}...\n`);
  
  let totalInserted = 0;
  let errors = 0;

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allChunks.length / BATCH_SIZE);

    process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${batch.length} chunks)... `);

    try {
      const res = await fetch(`${TARGET}/api/rag-ingest/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks: batch })
      });

      if (res.ok) {
        const result = await res.json();
        totalInserted += result.inserted;
        console.log(`✅ ${result.inserted} inserted`);
      } else {
        const err = await res.text();
        console.log(`❌ HTTP ${res.status}: ${err.slice(0, 150)}`);
        errors++;
      }
    } catch (err) {
      console.log(`❌ Network error: ${err.message}`);
      errors++;
    }

    if (i + BATCH_SIZE < allChunks.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n🎉 Done!`);
  console.log(`   Total inserted: ${totalInserted}`);
  console.log(`   Errors: ${errors}`);
  if (allChunks.length > 0) {
    console.log(`   Success rate: ${((totalInserted / allChunks.length) * 100).toFixed(1)}%`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
