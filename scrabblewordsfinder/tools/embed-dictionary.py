#!/usr/bin/env python3
"""
embed-dictionary.py — Embed SOWPODS dictionary words + scores into Cloudflare Vectorize.

Creates embeddings for word groups (batched by score range and letter) so Lex can
semantically search for "high scoring words with X" or "5-letter words with Z".

Usage:
    python3 tools/embed-dictionary.py                 # Embed all word groups
    python3 tools/embed-dictionary.py --limit 50      # Test with first 50 groups
    python3 tools/embed-dictionary.py --dry-run       # Preview without inserting
    python3 tools/embed-dictionary.py --live          # Use live endpoint instead of localhost

Requirements:
    pip3 install --break-system-packages requests

How it works:
    Uses the /api/embed/ endpoint on SWF (which uses the Worker AI + Vectorize bindings).
    No external API token needed — the Worker handles AI inference and Vectorize upsert.
"""
import argparse
import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("ERROR: pip3 install --break-system-packages requests")
    sys.exit(1)

# --- Config ---
EMBED_URL_LOCAL = "http://localhost:4321/api/embed/"
EMBED_URL_LIVE = "https://www.scrabblewordsfinder.com/api/embed/"
EMBED_URL_STAGING = "https://scrabblewordsfinder-staging.xconvert.workers.dev/api/embed/"
BATCH_SIZE = 20  # Texts per embed+upsert request

TILE_VALUES = {
    'A':1,'B':3,'C':3,'D':2,'E':1,'F':4,'G':2,'H':4,'I':1,'J':8,
    'K':5,'L':1,'M':3,'N':1,'O':1,'P':3,'Q':10,'R':1,'S':1,'T':1,
    'U':1,'V':4,'W':4,'X':8,'Y':4,'Z':10
}

def score_word(word):
    return sum(TILE_VALUES.get(c, 0) for c in word.upper())

def load_dictionary():
    """Load SOWPODS dictionary from JSON files."""
    base_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    words = []
    for fname in ['sowpods-2-7.json', 'sowpods-8-15.json']:
        fpath = os.path.join(base_path, fname)
        if os.path.exists(fpath):
            with open(fpath, 'r') as f:
                data = json.load(f)
                words.extend([w.upper() for w in data])
    return words

def create_word_groups(words):
    """Group words into semantically meaningful chunks for embedding."""
    groups = []
    
    # Group 1: Top scoring words by length
    for length in range(2, 16):
        len_words = [w for w in words if len(w) == length]
        if not len_words:
            continue
        scored = sorted([(w, score_word(w)) for w in len_words], key=lambda x: -x[1])
        top_20 = scored[:20]
        text = f"Top 20 highest-scoring {length}-letter Scrabble words (SOWPODS): " + \
               ", ".join(f"{w} ({s}pts)" for w, s in top_20)
        groups.append({"id": f"dict-top-{length}letter", "text": text})
    
    # Group 2: Words by starting letter (top scorers)
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        letter_words = [w for w in words if w.startswith(letter)]
        if not letter_words:
            continue
        scored = sorted([(w, score_word(w)) for w in letter_words], key=lambda x: -x[1])
        top_15 = scored[:15]
        text = f"Top 15 highest-scoring Scrabble words starting with {letter}: " + \
               ", ".join(f"{w} ({s}pts)" for w, s in top_15)
        groups.append({"id": f"dict-letter-{letter}", "text": text})
    
    # Group 3: Words containing high-value tiles
    for tile in ['Q', 'Z', 'X', 'J', 'K']:
        tile_words = [w for w in words if tile in w]
        scored = sorted([(w, score_word(w)) for w in tile_words], key=lambda x: -x[1])
        top_20 = scored[:20]
        text = f"Top 20 highest-scoring Scrabble words containing {tile} ({TILE_VALUES[tile]}pts): " + \
               ", ".join(f"{w} ({s}pts)" for w, s in top_20)
        groups.append({"id": f"dict-contains-{tile}", "text": text})
    
    # Group 4: Bingo words (7 letters) by score
    sevens = [w for w in words if len(w) == 7]
    scored_sevens = sorted([(w, score_word(w)) for w in sevens], key=lambda x: -x[1])
    # Top 50 bingos
    top_bingos = scored_sevens[:50]
    text = "Top 50 highest-scoring 7-letter bingo words in Scrabble (SOWPODS): " + \
           ", ".join(f"{w} ({s}pts)" for w, s in top_bingos)
    groups.append({"id": "dict-top-bingos", "text": text})
    
    # Group 5: Common 2-letter words
    twos = sorted([(w, score_word(w)) for w in words if len(w) == 2], key=lambda x: -x[1])
    text = f"All valid 2-letter Scrabble words ({len(twos)} total, SOWPODS), sorted by score: " + \
           ", ".join(f"{w} ({s}pts)" for w, s in twos)
    groups.append({"id": "dict-two-letter-all", "text": text})
    
    # Group 6: Score ranges
    for min_score, max_score in [(30, 99), (25, 29), (20, 24), (15, 19)]:
        range_words = [(w, score_word(w)) for w in words if min_score <= score_word(w) <= max_score]
        range_words.sort(key=lambda x: -x[1])
        top_30 = range_words[:30]
        if top_30:
            text = f"Top 30 Scrabble words scoring {min_score}-{max_score} points: " + \
                   ", ".join(f"{w} ({s}pts)" for w, s in top_30)
            groups.append({"id": f"dict-score-{min_score}-{max_score}", "text": text})
    
    return groups

def embed_and_upsert(groups, embed_url):
    """Embed texts and upsert to Vectorize via /api/embed/ endpoint."""
    texts = [g["text"][:512] for g in groups]
    ids = [g["id"] for g in groups]
    metadata = [{"text": g["text"][:1000], "source": "dictionary"} for g in groups]

    headers = {"Content-Type": "application/json"}
    embed_secret = os.environ.get("EMBED_SECRET", "")
    if embed_secret:
        headers["X-Embed-Key"] = embed_secret

    resp = requests.post(embed_url, headers=headers, json={
        "texts": texts,
        "ids": ids,
        "metadata": metadata,
    }, timeout=60)

    if resp.status_code != 200:
        print(f"  ERROR: {resp.status_code} {resp.text[:200]}")
        return False

    data = resp.json()
    if not data.get("success"):
        print(f"  ERROR: {data.get('error', 'Unknown')}")
        return False

    print(f"  ✓ Embedded {data.get('embedded', 0)}, upserted {data.get('upserted', 0)}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Embed SOWPODS dictionary into Vectorize")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of groups to embed")
    parser.add_argument("--dry-run", action="store_true", help="Preview without embedding")
    parser.add_argument("--live", action="store_true", help="Use live endpoint instead of localhost")
    parser.add_argument("--staging", action="store_true", help="Use staging endpoint")
    args = parser.parse_args()

    embed_url = EMBED_URL_LIVE if args.live else (EMBED_URL_STAGING if args.staging else EMBED_URL_LOCAL)

    print("Loading SOWPODS dictionary...")
    words = load_dictionary()
    print(f"  Loaded {len(words)} words")

    print("Creating word groups for embedding...")
    groups = create_word_groups(words)
    print(f"  Created {len(groups)} groups")

    if args.limit:
        groups = groups[:args.limit]
        print(f"  Limited to {args.limit} groups")

    if args.dry_run:
        print("\n--- DRY RUN ---")
        for g in groups[:10]:
            print(f"  {g['id']}: {g['text'][:100]}...")
        print(f"  ... and {len(groups) - 10} more")
        return

    print(f"\nEmbedding {len(groups)} groups via {embed_url}...")

    # Process in batches
    total_embedded = 0
    for i in range(0, len(groups), BATCH_SIZE):
        batch = groups[i:i + BATCH_SIZE]
        print(f"  Batch {i // BATCH_SIZE + 1} ({len(batch)} groups)...")
        success = embed_and_upsert(batch, embed_url)
        if success:
            total_embedded += len(batch)
        else:
            print(f"  ⚠ Batch failed, continuing...")
        time.sleep(0.5)  # Brief pause between batches

    print(f"\nDone! Embedded {total_embedded}/{len(groups)} dictionary groups into Vectorize.")

if __name__ == "__main__":
    main()
