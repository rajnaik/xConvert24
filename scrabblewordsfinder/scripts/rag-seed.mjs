/**
 * RAG Seed Script
 * 
 * Reads /tmp/swf-rag-chunks.json (output of rag-chunk-blogs.mjs)
 * and sends chunks in batches of 20 to the /api/rag-ingest/ endpoint.
 * 
 * Usage:
 *   node scripts/rag-seed.mjs [TARGET_URL]
 * 
 * Examples:
 *   node scripts/rag-seed.mjs                        # localhost:4321 (dev)
 *   node scripts/rag-seed.mjs https://www.scrabblewordsfinder.com  # live
 */

import { readFileSync } from 'fs';

const TARGET = process.argv[2] || 'http://localhost:4321';
const CHUNKS_FILE = '/tmp/swf-rag-chunks.json';
const BATCH_SIZE = 20;
const DELAY_MS = 1000; // 1 second between batches to avoid rate limits

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 RAG Seed Script');
  console.log(`   Target: ${TARGET}`);
  console.log(`   Chunks file: ${CHUNKS_FILE}`);
  console.log(`   Batch size: ${BATCH_SIZE}\n`);

  const data = JSON.parse(readFileSync(CHUNKS_FILE, 'utf-8'));
  const chunks = data.chunks;
  console.log(`   Total chunks to ingest: ${chunks.length}`);
  console.log(`   Batches needed: ${Math.ceil(chunks.length / BATCH_SIZE)}\n`);

  let totalInserted = 0;
  let errors = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

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
        console.log(`❌ HTTP ${res.status}: ${err.slice(0, 100)}`);
        errors++;
      }
    } catch (err) {
      console.log(`❌ Network error: ${err.message}`);
      errors++;
    }

    // Delay between batches
    if (i + BATCH_SIZE < chunks.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Total inserted: ${totalInserted}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Success rate: ${((totalInserted / chunks.length) * 100).toFixed(1)}%`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
