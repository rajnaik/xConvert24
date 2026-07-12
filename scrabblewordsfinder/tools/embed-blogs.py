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

# ── Embed endpoint (uses Worker AI + Vectorize bindings — no API token needed) ──
EMBED_URL_LOCAL = "http://localhost:4321/api/embed/"
EMBED_URL_LIVE = "https://www.scrabblewordsfinder.com/api/embed/"
EMBED_URL_STAGING = "https://scrabblewordsfinder-staging.xconvert.workers.dev/api/embed/"


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
    """Call /api/embed/ endpoint to generate embeddings (no direct API token needed)."""
    # This is not used anymore — embed_and_upsert does both in one call
    raise NotImplementedError("Use embed_and_upsert() instead")


def insert_vectors(vectors: list) -> bool:
    """Insert a batch of vectors into Vectorize index via /api/embed/ endpoint."""
    # This is not used anymore — embed_and_upsert does both in one call
    raise NotImplementedError("Use embed_and_upsert() instead")


def embed_and_upsert(chunks: list, embed_url: str) -> bool:
    """Embed texts and upsert to Vectorize via /api/embed/ endpoint in one call."""
    # Strip non-ASCII (emojis crash the AI model) before embedding
    import re
    def clean_text(t):
        # Remove emojis and non-ASCII, keep basic Latin
        return re.sub(r'[^\x00-\x7F]+', ' ', t).strip()

    texts = [clean_text(c['text'])[:512] for c in chunks]
    ids = [c['id'] for c in chunks]
    metadata = [c['metadata'] for c in chunks]

    headers = {"Content-Type": "application/json"}
    embed_secret = os.environ.get("EMBED_SECRET", "")
    if embed_secret:
        headers["X-Embed-Key"] = embed_secret

    try:
        resp = requests.post(embed_url, headers=headers, json={
            "texts": texts,
            "ids": ids,
            "metadata": metadata,
        }, timeout=60)

        if resp.status_code != 200:
            print(f"    ERROR: {resp.status_code} — {resp.text[:200]}")
            return False

        data = resp.json()
        if not data.get("success"):
            print(f"    ERROR: {data.get('error', 'Unknown')}")
            return False

        return True
    except Exception as e:
        print(f"    ERROR: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Embed SWF blogs into Vectorize for RAG')
    parser.add_argument('--limit', type=int, default=0, help='Limit number of blog files to process (0=all)')
    parser.add_argument('--dry-run', action='store_true', help='Preview without inserting')
    parser.add_argument('--skip-existing', action='store_true', help='Skip blogs already in the index')
    parser.add_argument('--live', action='store_true', help='Use live endpoint')
    parser.add_argument('--staging', action='store_true', help='Use staging endpoint')
    parser.add_argument('--retry', action='store_true', help='Only retry previously failed chunks')
    args = parser.parse_args()

    embed_url = EMBED_URL_LIVE if args.live else (EMBED_URL_STAGING if args.staging else EMBED_URL_LOCAL)

    # Retry mode: load failed chunks from previous run
    if args.retry:
        failed_file = os.path.join(PROJECT_DIR, 'tools', '.embed-failed.json')
        if not os.path.exists(failed_file):
            print("No failed chunks to retry (tools/.embed-failed.json not found).")
            return
        with open(failed_file, 'r') as f:
            all_chunks = json.load(f)
        print(f"\n{'='*60}")
        print(f"  RETRY MODE — {len(all_chunks)} failed chunks from previous run")
        print(f"  Endpoint: {embed_url}")
        print(f"{'='*60}\n")

        # Go straight to embedding
        success_count = 0
        failed_count = 0
        failed_chunks = []
        start_time = time.time()

        for i in range(0, len(all_chunks), BATCH_SIZE):
            batch = all_chunks[i:i + BATCH_SIZE]
            if embed_and_upsert(batch, embed_url):
                success_count += len(batch)
            else:
                failed_count += len(batch)
                failed_chunks.extend(batch)
                time.sleep(3)  # Longer backoff for retries
            time.sleep(1)  # Slower pace for retries

        elapsed = time.time() - start_time
        if failed_chunks:
            with open(failed_file, 'w') as f:
                json.dump(failed_chunks, f)
            print(f"\n  Still {len(failed_chunks)} failed. Saved for next retry.")
        else:
            os.remove(failed_file)
            print(f"\n  ✅ All retries succeeded!")
        print(f"  Embedded: {success_count} | Still failed: {failed_count} | Time: {elapsed:.0f}s")
        return

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
            # Vectorize max ID is 64 bytes — truncate slug if needed
            max_slug_len = 64 - len(f"blog--{j}")  # leave room for prefix + chunk index
            safe_slug = slug[:max_slug_len]
            chunk_id = f"blog-{safe_slug}-{j}"
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

    # Generate embeddings and upsert via /api/embed/ (does both in one call)
    print(f"\n[2/3] Embedding + upserting via {embed_url}...")
    success_count = 0
    failed_count = 0
    failed_chunks = []
    start_time = time.time()

    for i in range(0, len(all_chunks), BATCH_SIZE):
        batch = all_chunks[i:i + BATCH_SIZE]

        if embed_and_upsert(batch, embed_url):
            success_count += len(batch)
        else:
            failed_count += len(batch)
            failed_chunks.extend(batch)
            time.sleep(2)  # Back off on failure

        if (i // BATCH_SIZE + 1) % 10 == 0:
            elapsed = time.time() - start_time
            pct = success_count / len(all_chunks) * 100
            print(f"  [{pct:5.1f}%] Embedded {success_count}/{len(all_chunks)} chunks ({elapsed:.0f}s)")

        time.sleep(0.5)  # Rate limit

    # Save failed chunks for --retry
    failed_file = os.path.join(PROJECT_DIR, 'tools', '.embed-failed.json')
    if failed_chunks:
        with open(failed_file, 'w') as f:
            json.dump(failed_chunks, f)
        print(f"\n  Saved {len(failed_chunks)} failed chunks to tools/.embed-failed.json")
        print(f"  Re-run with: python3 tools/embed-blogs.py --live --retry")
    elif os.path.exists(failed_file):
        os.remove(failed_file)

    elapsed = time.time() - start_time

    # Summary
    print(f"\n{'='*60}")
    print(f"  COMPLETE")
    print(f"  Blog files processed: {len(blog_files)}")
    print(f"  Chunks embedded + upserted: {success_count}")
    print(f"  Failed: {failed_count}")
    print(f"  Time: {elapsed:.0f}s")
    print(f"  Index: {VECTORIZE_INDEX}")
    print(f"  Endpoint: {embed_url}")
    print(f"{'='*60}")

    if failed_count > 0:
        print(f"\n  ⚠️ {failed_count} chunks failed. Re-run to retry (duplicates are overwritten).")
    else:
        print(f"\n  ✅ All {success_count} chunks embedded successfully!")
        print(f"  Lex can now answer questions using real blog content.")


if __name__ == '__main__':
    main()
