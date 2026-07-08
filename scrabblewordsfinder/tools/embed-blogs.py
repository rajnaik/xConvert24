#!/usr/bin/env python3
"""
embed-blogs.py — Embed all SWF blog pages into Cloudflare Vectorize for RAG.

Reads blog .astro files, strips HTML to plain text, chunks into ~400-word segments,
generates embeddings via Cloudflare Workers AI, and inserts into the swf-blog-rag index.

Usage:
    python3 tools/embed-blogs.py                    # Embed all blogs
    python3 tools/embed-blogs.py --limit 10         # Test with first 10 blogs
    python3 tools/embed-blogs.py --dry-run          # Preview without inserting
    python3 tools/embed-blogs.py --skip-existing    # Only embed new/changed blogs

Requirements:
    pip3 install --break-system-packages requests

Environment variables (set in terminal before running):
    CLOUDFLARE_ACCOUNT_ID   — Your Cloudflare account ID
    CLOUDFLARE_API_TOKEN    — API token with Workers AI + Vectorize permissions
"""

import argparse
import json
import os
import re
import sys
import time
import glob

try:
    import requests
except ImportError:
    print("ERROR: 'requests' module not found. Install with:")
    print("  pip3 install --break-system-packages requests")
    sys.exit(1)

# ── Config ──
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(PROJECT_DIR, 'src', 'pages', 'blog')
VECTORIZE_INDEX = 'swf-blog-rag'
EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'
CHUNK_SIZE = 400  # words per chunk
CHUNK_OVERLAP = 50  # word overlap between chunks
BATCH_SIZE = 20  # vectors per insert batch

# ── Cloudflare API ──
ACCOUNT_ID = os.environ.get('CLOUDFLARE_ACCOUNT_ID', '')
API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN', '')

CF_BASE = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}'


def get_headers():
    return {
        'Authorization': f'Bearer {API_TOKEN}',
        'Content-Type': 'application/json',
    }


def strip_astro_to_text(content: str) -> str:
    """Strip Astro frontmatter, HTML tags, scripts, styles to get plain text."""
    # Remove frontmatter (--- ... ---)
    content = re.sub(r'^---[\s\S]*?---', '', content)
    # Remove <script> blocks
    content = re.sub(r'<script[\s\S]*?</script>', '', content, flags=re.IGNORECASE)
    # Remove <style> blocks
    content = re.sub(r'<style[\s\S]*?</style>', '', content, flags=re.IGNORECASE)
    # Remove JSON-LD schema blocks
    content = re.sub(r'<script type="application/ld\+json"[\s\S]*?</script>', '', content, flags=re.IGNORECASE)
    # Remove HTML tags
    content = re.sub(r'<[^>]+>', ' ', content)
    # Remove Astro expressions {... }
    content = re.sub(r'\{[^}]*\}', ' ', content)
    # Decode HTML entities
    content = content.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    content = content.replace('&quot;', '"').replace('&#39;', "'").replace('&nbsp;', ' ')
    # Collapse whitespace
    content = re.sub(r'\s+', ' ', content).strip()
    return content


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list:
    """Split text into chunks respecting sentence and paragraph boundaries.
    
    Strategy:
    1. Split by paragraphs first (double newline or period-space patterns)
    2. Group paragraphs into chunks of ~chunk_size words
    3. Never break mid-sentence — always end on a sentence boundary
    """
    # Split into sentences (respecting abbreviations and decimals)
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    
    if not sentences or len(text.split()) < 30:
        return []
    
    chunks = []
    current_chunk = []
    current_word_count = 0
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        sentence_words = len(sentence.split())
        
        # If adding this sentence exceeds chunk_size, start a new chunk
        if current_word_count + sentence_words > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            # Keep last few sentences as overlap for context continuity
            overlap_sentences = []
            overlap_words = 0
            for s in reversed(current_chunk):
                if overlap_words + len(s.split()) > overlap:
                    break
                overlap_sentences.insert(0, s)
                overlap_words += len(s.split())
            current_chunk = overlap_sentences
            current_word_count = overlap_words
        
        current_chunk.append(sentence)
        current_word_count += sentence_words
    
    # Don't forget the last chunk
    if current_chunk and current_word_count > 20:
        chunks.append(' '.join(current_chunk))
    
    return chunks


def generate_embeddings(texts: list) -> list:
    """Call Cloudflare Workers AI to generate embeddings for a batch of texts."""
    # URL-encode the model path (@ needs to be %40)
    model_path = EMBEDDING_MODEL.replace('@', '%40')
    url = f'{CF_BASE}/ai/run/{model_path}'
    payload = {'text': texts}

    resp = requests.post(url, headers=get_headers(), json=payload, timeout=60)
    if resp.status_code != 200:
        print(f"    ERROR embedding: {resp.status_code} — {resp.text[:200]}")
        return []

    data = resp.json()
    if not data.get('success'):
        print(f"    ERROR: {data.get('errors', 'Unknown error')}")
        return []

    return data.get('result', {}).get('data', [])


def insert_vectors(vectors: list) -> bool:
    """Insert a batch of vectors into Vectorize index."""
    url = f'{CF_BASE}/vectorize/v2/indexes/{VECTORIZE_INDEX}/insert'

    # Format for Vectorize API
    ndjson_lines = []
    for v in vectors:
        ndjson_lines.append(json.dumps({
            'id': v['id'],
            'values': v['values'],
            'metadata': v['metadata'],
        }))

    payload = '\n'.join(ndjson_lines)

    resp = requests.post(
        url,
        headers={'Authorization': f'Bearer {API_TOKEN}', 'Content-Type': 'application/x-ndjson'},
        data=payload,
        timeout=60,
    )

    if resp.status_code != 200:
        print(f"    ERROR inserting: {resp.status_code} — {resp.text[:200]}")
        return False

    data = resp.json()
    if not data.get('success'):
        print(f"    ERROR: {data.get('errors', 'Unknown')}")
        return False

    return True


def main():
    parser = argparse.ArgumentParser(description='Embed SWF blogs into Vectorize for RAG')
    parser.add_argument('--limit', type=int, default=0, help='Limit number of blog files to process (0=all)')
    parser.add_argument('--dry-run', action='store_true', help='Preview without inserting')
    parser.add_argument('--skip-existing', action='store_true', help='Skip blogs already in the index')
    args = parser.parse_args()

    # Validate credentials
    if not args.dry_run:
        if not ACCOUNT_ID:
            print("ERROR: Set CLOUDFLARE_ACCOUNT_ID environment variable")
            print("  export CLOUDFLARE_ACCOUNT_ID='your-account-id'")
            sys.exit(1)
        if not API_TOKEN:
            print("ERROR: Set CLOUDFLARE_API_TOKEN environment variable")
            print("  export CLOUDFLARE_API_TOKEN='your-api-token'")
            sys.exit(1)

    # Find all blog files
    blog_files = sorted(glob.glob(os.path.join(BLOG_DIR, '*.astro')))
    blog_files = [f for f in blog_files if not f.endswith('index.astro')]

    print(f"\n{'='*60}")
    print(f"  SWF Blog Embedder → Vectorize ({VECTORIZE_INDEX})")
    print(f"  Embedding model: {EMBEDDING_MODEL} (768 dimensions)")
    print(f"  Blog files found: {len(blog_files)}")
    print(f"  Chunk size: {CHUNK_SIZE} words, overlap: {CHUNK_OVERLAP}")
    if args.limit > 0:
        blog_files = blog_files[:args.limit]
        print(f"  Limited to: {args.limit} files")
    print(f"{'='*60}\n")

    # Process blogs
    all_chunks = []
    total_words = 0

    print("[1/3] Extracting and chunking blog content...")
    for i, filepath in enumerate(blog_files):
        slug = os.path.basename(filepath).replace('.astro', '')

        with open(filepath, 'r', encoding='utf-8') as f:
            raw = f.read()

        text = strip_astro_to_text(raw)
        word_count = len(text.split())
        total_words += word_count

        if word_count < 30:
            continue  # Skip stub pages

        chunks = chunk_text(text)
        for j, chunk in enumerate(chunks):
            chunk_id = f"blog-{slug}-{j}"
            all_chunks.append({
                'id': chunk_id,
                'text': chunk,
                'metadata': {
                    'slug': slug,
                    'url': f'/blog/{slug}/',
                    'chunk_index': j,
                    'total_chunks': len(chunks),
                    'text': chunk[:500],  # Store first 500 chars for RAG retrieval
                },
            })

        if (i + 1) % 100 == 0:
            print(f"  Processed {i+1}/{len(blog_files)} files ({len(all_chunks)} chunks so far)")

    print(f"  Done: {len(blog_files)} files → {len(all_chunks)} chunks ({total_words:,} total words)")

    if args.dry_run:
        print(f"\n[DRY RUN] Would embed {len(all_chunks)} chunks into {VECTORIZE_INDEX}")
        print(f"  Sample chunk (first 200 chars): {all_chunks[0]['text'][:200]}...")
        print(f"  Sample ID: {all_chunks[0]['id']}")
        print(f"  Estimated API calls: {(len(all_chunks) // BATCH_SIZE) + 1} embedding batches")
        return

    # Generate embeddings and insert
    print(f"\n[2/3] Generating embeddings ({len(all_chunks)} chunks in batches of {BATCH_SIZE})...")
    vectors_to_insert = []
    embedded_count = 0
    failed_count = 0
    start_time = time.time()

    for i in range(0, len(all_chunks), BATCH_SIZE):
        batch = all_chunks[i:i + BATCH_SIZE]
        texts = [c['text'] for c in batch]

        embeddings = generate_embeddings(texts)
        if not embeddings or len(embeddings) != len(batch):
            failed_count += len(batch)
            print(f"  ❌ Batch {i//BATCH_SIZE + 1} failed — skipping")
            time.sleep(2)  # Back off on failure
            continue

        for j, emb in enumerate(embeddings):
            vectors_to_insert.append({
                'id': batch[j]['id'],
                'values': emb,
                'metadata': batch[j]['metadata'],
            })

        embedded_count += len(batch)

        if (i // BATCH_SIZE + 1) % 10 == 0:
            elapsed = time.time() - start_time
            pct = embedded_count / len(all_chunks) * 100
            print(f"  [{pct:5.1f}%] Embedded {embedded_count}/{len(all_chunks)} chunks ({elapsed:.0f}s)")

        time.sleep(0.5)  # Rate limit: ~2 requests/sec

    print(f"  Embedded: {embedded_count} | Failed: {failed_count}")

    # Insert into Vectorize
    print(f"\n[3/3] Inserting {len(vectors_to_insert)} vectors into Vectorize...")
    insert_success = 0
    insert_failed = 0

    for i in range(0, len(vectors_to_insert), BATCH_SIZE):
        batch = vectors_to_insert[i:i + BATCH_SIZE]
        if insert_vectors(batch):
            insert_success += len(batch)
        else:
            insert_failed += len(batch)
            time.sleep(2)

        if (i // BATCH_SIZE + 1) % 20 == 0:
            print(f"  Inserted {insert_success} vectors...")

        time.sleep(0.3)

    elapsed = time.time() - start_time

    # Summary
    print(f"\n{'='*60}")
    print(f"  COMPLETE")
    print(f"  Blog files processed: {len(blog_files)}")
    print(f"  Chunks embedded: {embedded_count}")
    print(f"  Vectors inserted: {insert_success}")
    print(f"  Failed: {insert_failed}")
    print(f"  Time: {elapsed:.0f}s")
    print(f"  Index: {VECTORIZE_INDEX}")
    print(f"{'='*60}")

    if insert_failed > 0:
        print(f"\n  ⚠️ {insert_failed} vectors failed. Re-run to retry (duplicates are overwritten).")
    else:
        print(f"\n  ✅ All {insert_success} vectors inserted successfully!")
        print(f"  Lex can now answer questions using real blog content.")


if __name__ == '__main__':
    main()
