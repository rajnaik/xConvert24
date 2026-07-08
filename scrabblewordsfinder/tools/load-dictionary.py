#!/usr/bin/env python3
"""
load-dictionary.py — Load the full SOWPODS dictionary into D1's dictionary table.

Reads sowpods-2-7.json and sowpods-8-15.json, computes Scrabble scores,
and inserts all words into the D1 dictionary table via wrangler CLI.

Usage:
    python3 tools/load-dictionary.py --env dev       # Local miniflare DB
    python3 tools/load-dictionary.py --env staging   # Remote staging DB
    python3 tools/load-dictionary.py --env live      # Remote live DB

Options:
    --env       Target environment: dev, staging, live (required)
    --batch     Batch size for INSERT statements (default: 200)
    --dry-run   Print stats without executing SQL
    --skip-existing  Skip words already in the table (slower but safe for incremental loads)
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time

# Scrabble letter values
LETTER_VALUES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10,
}

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, 'public', 'data')

# Environment config
ENV_CONFIG = {
    'dev': {
        'flags': '--local',
        'binding': 'DB',
        'config': None,
        'description': 'Local miniflare SQLite',
    },
    'staging': {
        'flags': '--remote',
        'binding': 'DB',
        'config': 'wrangler.staging.jsonc',
        'description': 'Remote staging D1 (scrabble-staging)',
    },
    'live': {
        'flags': '--remote',
        'binding': 'DB',
        'config': None,
        'description': 'Remote live D1 (scrabble-live)',
    },
}


def score_word(word: str) -> int:
    """Calculate Scrabble score for a word."""
    return sum(LETTER_VALUES.get(c, 0) for c in word.upper())


def load_words() -> list[str]:
    """Load all words from both SOWPODS JSON files."""
    short_path = os.path.join(DATA_DIR, 'sowpods-2-7.json')
    long_path = os.path.join(DATA_DIR, 'sowpods-8-15.json')

    with open(short_path) as f:
        short = json.load(f)
    with open(long_path) as f:
        long = json.load(f)

    print(f"  Loaded {len(short):,} words (2-7 letters)")
    print(f"  Loaded {len(long):,} words (8-15 letters)")

    all_words = short + long
    print(f"  Total: {len(all_words):,} words")
    return all_words


def build_sql_batches(words: list[str], batch_size: int) -> list[str]:
    """Build batch INSERT SQL statements."""
    batches = []
    for i in range(0, len(words), batch_size):
        chunk = words[i:i + batch_size]
        values = []
        for w in chunk:
            word_upper = w.upper()
            pts = score_word(w)
            # Escape single quotes in word (shouldn't happen but be safe)
            safe_word = word_upper.replace("'", "''")
            values.append(f"('{safe_word}', '', '', '', '', {pts})")

        sql = f"INSERT OR IGNORE INTO dictionary (word, meaning, fun_fact, origin, spelling_tip, points) VALUES {', '.join(values)};"
        batches.append(sql)

    return batches


def execute_wrangler(sql: str, env: str) -> bool:
    """Execute a SQL statement via wrangler d1 execute."""
    config = ENV_CONFIG[env]
    cmd = ['npx', 'wrangler', 'd1', 'execute', config['binding']]

    if config['config']:
        cmd.extend(['--config', config['config']])

    cmd.extend([config['flags'], '--command', sql])

    try:
        result = subprocess.run(
            cmd,
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=60,
            input='Y\n' if config['flags'] == '--remote' else None,
        )
        if result.returncode != 0:
            print(f"    ERROR: {result.stderr[:200]}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print("    ERROR: Command timed out (60s)")
        return False
    except Exception as e:
        print(f"    ERROR: {e}")
        return False


def execute_via_file(sql_file: str, env: str) -> bool:
    """Execute SQL from a file via wrangler d1 execute --file."""
    config = ENV_CONFIG[env]
    cmd = ['npx', 'wrangler', 'd1', 'execute', config['binding']]

    if config['config']:
        cmd.extend(['--config', config['config']])

    cmd.extend([config['flags'], f'--file={sql_file}'])

    try:
        result = subprocess.run(
            cmd,
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=120,
            input='Y\n' if config['flags'] == '--remote' else None,
        )
        if result.returncode != 0:
            print(f"    ERROR: {result.stderr[:300]}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print("    ERROR: Command timed out (120s)")
        return False
    except Exception as e:
        print(f"    ERROR: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Load SOWPODS dictionary into D1')
    parser.add_argument('--env', required=True, choices=['dev', 'staging', 'live'],
                        help='Target environment')
    parser.add_argument('--batch', type=int, default=200,
                        help='Words per INSERT statement (default: 200)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Print stats without executing')
    parser.add_argument('--limit', type=int, default=0,
                        help='Limit number of words to process (0 = all, useful with --dry-run)')
    parser.add_argument('--skip-existing', action='store_true',
                        help='Uses INSERT OR IGNORE (default behaviour)')

    args = parser.parse_args()
    env = args.env
    config = ENV_CONFIG[env]

    print(f"\n{'='*60}")
    print(f"  SOWPODS Dictionary Loader")
    print(f"  Target: {env.upper()} — {config['description']}")
    print(f"  Batch size: {args.batch} words per INSERT")
    print(f"{'='*60}\n")

    # Load words
    print("[1/4] Loading dictionary files...")
    words = load_words()

    # Apply limit if specified
    if args.limit > 0:
        words = words[:args.limit]
        print(f"  Limited to first {args.limit:,} words")

    # Build SQL
    print(f"\n[2/4] Building SQL batches...")
    batches = build_sql_batches(words, args.batch)
    print(f"  Generated {len(batches)} batch statements")

    if args.dry_run:
        print(f"\n[DRY RUN] Would execute {len(batches)} batches against {env}")
        print(f"  Sample SQL (first 200 chars): {batches[0][:200]}...")
        print(f"\n  Score stats:")
        scores = [score_word(w) for w in words]
        print(f"    Min score: {min(scores)}")
        print(f"    Max score: {max(scores)}")
        print(f"    Avg score: {sum(scores)/len(scores):.1f}")
        return

    # Execute
    print(f"\n[3/4] Executing against {env.upper()}...")
    print(f"  This will take a few minutes for {len(words):,} words...\n")

    success = 0
    failed = 0
    start_time = time.time()

    for i, batch_sql in enumerate(batches):
        # Write batch to temp file (avoids shell escaping issues with large SQL)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
            f.write(batch_sql)
            tmp_path = f.name

        ok = execute_via_file(tmp_path, env)
        os.unlink(tmp_path)

        if ok:
            success += 1
        else:
            failed += 1

        # Progress
        if (i + 1) % 50 == 0 or i == len(batches) - 1:
            elapsed = time.time() - start_time
            pct = (i + 1) / len(batches) * 100
            rate = (i + 1) / elapsed if elapsed > 0 else 0
            eta = (len(batches) - i - 1) / rate if rate > 0 else 0
            print(f"  [{pct:5.1f}%] Batch {i+1}/{len(batches)} | "
                  f"✅ {success} | ❌ {failed} | "
                  f"⏱ {elapsed:.0f}s | ETA {eta:.0f}s")

    elapsed = time.time() - start_time

    # Summary
    print(f"\n[4/4] Complete!")
    print(f"  {'='*40}")
    print(f"  Environment: {env.upper()}")
    print(f"  Total words: {len(words):,}")
    print(f"  Batches OK:  {success}/{len(batches)}")
    print(f"  Batches ERR: {failed}/{len(batches)}")
    print(f"  Time taken:  {elapsed:.1f}s")
    print(f"  {'='*40}")

    if failed > 0:
        print(f"\n  ⚠️  {failed} batches failed. Run with --env {env} again to retry (INSERT OR IGNORE skips duplicates).")
    else:
        print(f"\n  ✅ All {len(words):,} words loaded successfully!")


if __name__ == '__main__':
    main()
