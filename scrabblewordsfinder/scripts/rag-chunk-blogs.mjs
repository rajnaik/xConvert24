/**
 * RAG Blog Chunking Script
 * 
 * Reads the 100 selected blog posts from rag-blog-list.json,
 * extracts text content from Astro files, and produces chunks
 * suitable for embedding with Workers AI.
 * 
 * Output: /tmp/swf-rag-chunks.json
 * 
 * Usage: node scripts/rag-chunk-blogs.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'src/pages/blog');
const RAG_LIST = join(ROOT, 'rag-blog-list.json');
const OUTPUT = '/tmp/swf-rag-chunks.json';

// Target chunk size in characters (~500 tokens ≈ 2000 chars)
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 200;

/**
 * Strip Astro frontmatter (--- ... ---)
 */
function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n*/m, '');
}

/**
 * Strip JSON-LD script blocks
 */
function stripJsonLd(content) {
  return content.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
}

/**
 * Strip all script and style tags
 */
function stripScriptsAndStyles(content) {
  let cleaned = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  return cleaned;
}

/**
 * Strip HTML tags but keep text content
 */
function stripHtml(content) {
  // Replace <br> and block-level closings with newlines
  let text = content.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|h[1-6]|li|div|tr|td|th|article|section|aside|nav|blockquote)>/gi, '\n');
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  // Remove Astro expressions like set:html={...}
  text = text.replace(/set:html=\{[^}]*\}/g, '');
  // Collapse multiple whitespace/newlines
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();
  return text;
}

/**
 * Clean and extract meaningful text from an Astro blog file
 */
function extractText(rawContent) {
  let content = stripFrontmatter(rawContent);
  content = stripJsonLd(content);
  content = stripScriptsAndStyles(content);
  content = stripHtml(content);
  
  // Remove lines that are purely Tailwind class strings or short noise
  const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Skip lines that are just class references or emoji-only
    if (/^(class=|href=|src=|alt=)/.test(trimmed)) return false;
    // Skip very short lines (likely UI artifacts)
    if (trimmed.length < 5) return false;
    // Skip lines that are just "← Blog" or "Back to all articles"
    if (/^← Blog$|^Back to all articles$|^› /.test(trimmed)) return false;
    return true;
  });
  
  return lines.join('\n').trim();
}

/**
 * Split text into overlapping chunks using sentence boundaries
 */
function chunkText(text, title, slug) {
  const chunks = [];
  const prefix = `Title: ${title}\n\n`;
  
  // If text is small enough, return as single chunk
  if (text.length <= CHUNK_SIZE) {
    chunks.push({
      slug,
      title,
      chunk_index: 0,
      content: prefix + text
    });
    return chunks;
  }
  
  // Split by sentences (period/question/exclamation followed by space or newline)
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 0);
  
  let currentChunk = prefix;
  let chunkIndex = 0;
  let lastSentences = []; // For overlap
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed the limit, save current chunk
    if (currentChunk.length + sentence.length > CHUNK_SIZE && currentChunk.length > 200) {
      chunks.push({
        slug,
        title,
        chunk_index: chunkIndex,
        content: currentChunk.trim()
      });
      chunkIndex++;
      
      // Start new chunk with overlap (last 2-3 sentences)
      const overlapText = lastSentences.slice(-3).join(' ');
      currentChunk = prefix + overlapText + ' ';
      lastSentences = lastSentences.slice(-3);
    }
    
    currentChunk += sentence + ' ';
    lastSentences.push(sentence);
    
    // Keep lastSentences manageable
    if (lastSentences.length > 5) lastSentences.shift();
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length > 100) {
    chunks.push({
      slug,
      title,
      chunk_index: chunkIndex,
      content: currentChunk.trim()
    });
  }
  
  return chunks;
}

/**
 * Extract the title from an Astro file
 */
function extractTitle(content, slug) {
  // Try to find h1 tag content
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, '').trim();
  }
  // Try BlogLayout/Layout title prop
  const titleMatch = content.match(/title="([^"]+)"/);
  if (titleMatch) {
    return titleMatch[1].replace(/\s*—.*$/, '').trim();
  }
  // Fallback: slug to title
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Main
console.log('📚 RAG Blog Chunking Script');
console.log('===========================\n');

const ragList = JSON.parse(readFileSync(RAG_LIST, 'utf-8'));
const allChunks = [];
let processed = 0;
let skipped = 0;

for (const blog of ragList.blogs) {
  const filePath = join(BLOG_DIR, `${blog.slug}.astro`);
  
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const title = extractTitle(raw, blog.slug);
    const text = extractText(raw);
    
    if (text.length < 100) {
      console.log(`⚠️  Skipping ${blog.slug} — too little content (${text.length} chars)`);
      skipped++;
      continue;
    }
    
    const chunks = chunkText(text, title, blog.slug);
    
    for (const chunk of chunks) {
      chunk.category = blog.category;
      allChunks.push(chunk);
    }
    
    processed++;
    if (processed % 10 === 0) {
      console.log(`   Processed ${processed}/${ragList.blogs.length} blogs...`);
    }
  } catch (err) {
    console.log(`❌ Error reading ${blog.slug}: ${err.message}`);
    skipped++;
  }
}

console.log(`\n✅ Done!`);
console.log(`   Processed: ${processed} blogs`);
console.log(`   Skipped: ${skipped} blogs`);
console.log(`   Total chunks: ${allChunks.length}`);
console.log(`   Avg chunks per blog: ${(allChunks.length / processed).toFixed(1)}`);
console.log(`   Output: ${OUTPUT}`);

writeFileSync(OUTPUT, JSON.stringify({ 
  generated: new Date().toISOString(),
  total_blogs: processed,
  total_chunks: allChunks.length,
  chunks: allChunks 
}, null, 2));

console.log('\n📝 Chunk size distribution:');
const sizes = allChunks.map(c => c.content.length);
console.log(`   Min: ${Math.min(...sizes)} chars`);
console.log(`   Max: ${Math.max(...sizes)} chars`);
console.log(`   Avg: ${Math.round(sizes.reduce((a,b) => a+b, 0) / sizes.length)} chars`);
