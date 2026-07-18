#!/usr/bin/env python3
"""
Magic Squares Generator — ScrabbleWordsFinder
Generates valid word square puzzles from the SOWPODS dictionary.

Two variants:
  1. Classic Word Square — rows and columns are identical words
  2. Cross Grid — all rows are valid words AND all columns are valid words (independent)

Usage:
  python3 tools/generate-magic-squares.py --size 4 --variant classic --count 50
  python3 tools/generate-magic-squares.py --size 4 --variant cross --count 50
  python3 tools/generate-magic-squares.py --size 5 --variant classic --count 20
  python3 tools/generate-magic-squares.py --size 6 --variant cross --count 10

Output: SQL INSERT statements to /tmp/magic_squares_NxN.sql
"""

import json
import sys
import os
import random
import argparse
from collections import defaultdict
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DICT_FILE = os.path.join(PROJECT_DIR, 'public/data/sowpods-2-7.json')
DICT_FILE_LONG = os.path.join(PROJECT_DIR, 'public/data/sowpods-8-15.json')


def load_words(size):
    """Load all words of the given length from SOWPODS."""
    words = set()
    
    if size <= 7:
        with open(DICT_FILE, 'r') as f:
            all_words = json.load(f)
        for w in all_words:
            if len(w) == size:
                words.add(w.upper())
    else:
        with open(DICT_FILE_LONG, 'r') as f:
            all_words = json.load(f)
        for w in all_words:
            if len(w) == size:
                words.add(w.upper())
    
    return words


class TrieNode:
    __slots__ = ['children', 'is_word']
    def __init__(self):
        self.children = {}
        self.is_word = False


def build_trie(words):
    """Build a prefix trie from a set of words."""
    root = TrieNode()
    for word in words:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_word = True
    return root


def has_prefix(trie, prefix):
    """Check if any word in the trie starts with this prefix."""
    node = trie
    for ch in prefix:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return True


def is_word_in_trie(trie, word):
    """Check if a complete word is in the trie."""
    node = trie
    for ch in word:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return node.is_word


# ─────────────────────────────────────────────────
# CLASSIC WORD SQUARE GENERATOR
# Rows = Columns (symmetric)
# ─────────────────────────────────────────────────

def generate_classic_squares(words, trie, size, count, max_attempts=500000):
    """Generate classic word squares where rows == columns."""
    word_list = sorted(words)
    results = []
    attempts = 0
    
    # Index words by prefix for faster lookup
    by_prefix = defaultdict(list)
    for w in word_list:
        for i in range(1, size):
            by_prefix[w[:i]].append(w)
    
    def solve(grid, row):
        nonlocal attempts
        attempts += 1
        if attempts > max_attempts:
            return False
        
        if row == size:
            results.append(list(grid))
            return len(results) >= count
        
        # Build the column prefix constraint for position `row`
        # Column i at position `row` must equal grid[row][i]
        # But also: grid[row][i] must equal grid[i][row] (symmetry)
        # So we need: the prefix of column `row` = characters from grid[0][row], grid[1][row], ..., grid[row-1][row]
        col_prefix = ''.join(grid[i][row] for i in range(row))
        
        # Find all words that start with col_prefix
        candidates = by_prefix.get(col_prefix, [])
        if not candidates:
            return False
        
        # Shuffle for variety
        random.shuffle(candidates)
        
        for word in candidates[:200]:  # Limit branching
            # This word becomes row `row`
            # Check that all columns still have valid prefixes
            valid = True
            for c in range(size):
                if c == row:
                    continue
                # Column c prefix so far = grid[0][c], grid[1][c], ..., grid[row-1][c], word[c]
                prefix = ''.join(grid[i][c] for i in range(row)) + word[c]
                if not has_prefix(trie, prefix):
                    valid = False
                    break
            
            if valid:
                grid.append(word)
                if solve(grid, row + 1):
                    return True
                grid.pop()
                
                if len(results) >= count:
                    return True
        
        return False
    
    # Try multiple starting words
    starters = list(word_list)
    random.shuffle(starters)
    
    for start_word in starters[:500]:
        if len(results) >= count:
            break
        grid = [start_word]
        solve(grid, 1)
    
    return results


# ─────────────────────────────────────────────────
# CROSS GRID GENERATOR
# All rows are valid words, all columns are valid words
# Rows and columns are independent (not symmetric)
# ─────────────────────────────────────────────────

def generate_cross_grids(words, trie, size, count, max_attempts=500000):
    """Generate cross grids where all rows AND all columns are valid words."""
    word_list = sorted(words)
    results = []
    attempts = 0
    
    def solve(grid, row):
        nonlocal attempts
        attempts += 1
        if attempts > max_attempts:
            return False
        
        if row == size:
            # Verify all columns are valid words
            for c in range(size):
                col_word = ''.join(grid[r][c] for r in range(size))
                if col_word not in words:
                    return False
            results.append(list(grid))
            return len(results) >= count
        
        # Get column prefixes so far
        col_prefixes = []
        for c in range(size):
            prefix = ''.join(grid[r][c] for r in range(row))
            col_prefixes.append(prefix)
        
        # Find candidate words for this row
        # Each character at position c must extend col_prefix[c] to a valid prefix
        candidates = list(word_list)
        random.shuffle(candidates)
        
        tried = 0
        for word in candidates:
            if tried > 300:  # Limit branching per row
                break
            
            # Check all column prefixes remain valid
            valid = True
            for c in range(size):
                new_prefix = col_prefixes[c] + word[c]
                if row == size - 1:
                    # Last row — column must be a complete word
                    if new_prefix not in words:
                        valid = False
                        break
                else:
                    # Not last row — column prefix must still be extendable
                    if not has_prefix(trie, new_prefix):
                        valid = False
                        break
            
            if not valid:
                tried += 1
                continue
            
            tried += 1
            grid.append(word)
            if solve(grid, row + 1):
                return True
            grid.pop()
            
            if len(results) >= count:
                return True
        
        return False
    
    # Try multiple starting words for variety
    starters = list(word_list)
    random.shuffle(starters)
    
    for start_word in starters[:1000]:
        if len(results) >= count:
            break
        grid = [start_word]
        solve(grid, 1)
    
    return results


def score_difficulty(grid, words, size):
    """Score a grid's difficulty based on multiple factors. Returns (label, numeric_score)."""
    rare_letters = set('QXZJK')
    uncommon_starts = set('QXZJKVW')
    # Common 4-6 letter words most people know
    common_words = {'BALL','AREA','LEAD','STAR','TONE','FISH','BIRD','GAME','PLAY','WORD',
                    'HELP','RACE','FIRE','COLD','WARM','RAIN','SNOW','TREE','HILL','LAKE',
                    'EARTH','WATER','LIGHT','STONE','WORLD','HEART','HOUSE','PLANT','SOUND',
                    'CASTLE','PLANET','GARDEN','STREAM','BRIDGE','SILVER','GOLDEN','MARKET'}
    
    score = 0
    for word in grid:
        # Rare letters: +3 per occurrence
        score += sum(1 for c in word if c in rare_letters) * 3
        # Uncommon starting letter: +2
        if word[0] in uncommon_starts:
            score += 2
        # Double letters: +1 per double pair
        for i in range(len(word) - 1):
            if word[i] == word[i+1]:
                score += 1
        # Word commonality: common = 0, unknown = +2
        if word not in common_words:
            score += 2
        else:
            score -= 1  # bonus for easy words
    
    # Grid size bonus (bigger = harder inherently)
    score += (size - 4) * 3
    
    # Clamp to 0 minimum
    score = max(0, score)
    
    if score <= 6:
        label = 'easy'
    elif score <= 12:
        label = 'medium'
    elif score <= 18:
        label = 'hard'
    else:
        label = 'expert'
    
    return label, score


def grid_to_sql(grid, size, variant, difficulty, difficulty_score):
    """Convert a grid to an SQL INSERT OR IGNORE statement (dedup safe)."""
    table = f'magic_squares_{size}x{size}'
    
    # Compute columns
    cols = []
    for c in range(size):
        col_word = ''.join(grid[r][c] for r in range(size))
        cols.append(col_word)
    
    row_cols = ', '.join(f'row{i+1}' for i in range(size))
    col_cols = ', '.join(f'col{i+1}' for i in range(size))
    row_vals = ', '.join(f"'{grid[i]}'" for i in range(size))
    col_vals = ', '.join(f"'{cols[i]}'" for i in range(size))
    
    return f"INSERT OR IGNORE INTO {table} (variant, {row_cols}, {col_cols}, difficulty, difficulty_score) VALUES ('{variant}', {row_vals}, {col_vals}, '{difficulty}', {difficulty_score});"


def main():
    parser = argparse.ArgumentParser(description='Generate Magic Square puzzles')
    parser.add_argument('--size', type=int, default=4, choices=[4, 5, 6], help='Grid size')
    parser.add_argument('--variant', default='both', choices=['classic', 'cross', 'both'], help='Variant type')
    parser.add_argument('--count', type=int, default=50, help='Number of puzzles to generate per variant')
    parser.add_argument('--output', default=None, help='Output SQL file path')
    args = parser.parse_args()
    
    size = args.size
    target_count = args.count
    output_file = args.output or f'/tmp/magic_squares_{size}x{size}.sql'
    
    print(f"Loading SOWPODS dictionary ({size}-letter words)...")
    words = load_words(size)
    print(f"  Found {len(words)} words of length {size}")
    
    print("Building prefix trie...")
    trie = build_trie(words)
    
    all_sql = []
    seen_grids = set()  # Dedup: track grid fingerprints to avoid duplicates
    
    if args.variant in ('classic', 'both'):
        print(f"\n{'='*50}")
        print(f"Generating CLASSIC word squares ({size}x{size})...")
        print(f"Target: {target_count} puzzles")
        start = time.time()
        
        classics = generate_classic_squares(words, trie, size, target_count)
        elapsed = time.time() - start
        
        print(f"  Generated {len(classics)} classic squares in {elapsed:.1f}s")
        
        for grid in classics:
            fingerprint = '|'.join(grid)
            if fingerprint in seen_grids:
                continue
            seen_grids.add(fingerprint)
            difficulty, diff_score = score_difficulty(grid, words, size)
            sql = grid_to_sql(grid, size, 'classic', difficulty, diff_score)
            all_sql.append(sql)
        
        # Show a few examples
        if classics:
            print(f"\n  Example classic square:")
            for row in classics[0]:
                print(f"    {row}")
    
    if args.variant in ('cross', 'both'):
        print(f"\n{'='*50}")
        print(f"Generating CROSS grids ({size}x{size})...")
        print(f"Target: {target_count} puzzles")
        start = time.time()
        
        crosses = generate_cross_grids(words, trie, size, target_count)
        elapsed = time.time() - start
        
        print(f"  Generated {len(crosses)} cross grids in {elapsed:.1f}s")
        
        for grid in crosses:
            fingerprint = '|'.join(grid)
            if fingerprint in seen_grids:
                continue
            seen_grids.add(fingerprint)
            difficulty, diff_score = score_difficulty(grid, words, size)
            sql = grid_to_sql(grid, size, 'cross', difficulty, diff_score)
            all_sql.append(sql)
        
        # Show examples
        if crosses:
            print(f"\n  Example cross grid:")
            for row in crosses[0]:
                print(f"    {row}")
            cols = [''.join(crosses[0][r][c] for r in range(size)) for c in range(size)]
            print(f"  Columns: {', '.join(cols)}")
    
    # Write SQL output
    if all_sql:
        with open(output_file, 'w') as f:
            f.write(f"-- Magic Squares {size}x{size} — Generated {time.strftime('%Y-%m-%d %H:%M')}\n")
            f.write(f"-- Total puzzles: {len(all_sql)}\n\n")
            for sql in all_sql:
                f.write(sql + '\n')
        
        print(f"\n{'='*50}")
        print(f"✅ Wrote {len(all_sql)} puzzles to {output_file}")
        print(f"   Apply with: npx wrangler d1 execute DB --local --file={output_file}")
    else:
        print("\n❌ No puzzles generated. Try increasing --count or reducing constraints.")


if __name__ == '__main__':
    main()
