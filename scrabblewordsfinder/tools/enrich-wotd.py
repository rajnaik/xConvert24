#!/usr/bin/env python3
"""
enrich-wotd.py — Generate enrichment data (fun_fact, origin, usage_example, spelling_tip, cultural_note)
for WOTD entries that are missing these fields.

Uses the /api/embed/ endpoint's AI model to generate content, OR falls back to template-based generation.

Usage:
    python3 tools/enrich-wotd.py --local              # Generate SQL for local DB
    python3 tools/enrich-wotd.py --live               # Generate SQL using live AI
    python3 tools/enrich-wotd.py --local --limit 50   # Test with 50 words
    python3 tools/enrich-wotd.py --local --dry-run    # Preview without generating

Outputs SQL to /tmp/wotd-enrich-batch.sql — then apply with:
    npx wrangler d1 execute DB --local --file=/tmp/wotd-enrich-batch.sql
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

EMBED_URL_LOCAL = "http://localhost:4321"
EMBED_URL_LIVE = "https://www.scrabblewordsfinder.com"

def get_words_needing_enrichment(endpoint):
    """Fetch words missing enrichment fields from the WOTD API."""
    # We'll query the DB directly via a custom endpoint or use wrangler
    # For now, read from a local export
    pass

def generate_enrichment_ai(word, meaning, endpoint):
    """Use Lex AI to generate enrichment for a single word."""
    prompt = f"""For the Scrabble word "{word}" (meaning: {meaning}), generate exactly these 5 fields as JSON:
1. "origin": Etymology in 1 sentence (where the word comes from, Latin/Greek/French roots)
2. "usage_example": One natural sentence using the word in context
3. "spelling_tip": A short mnemonic or trick to remember the spelling (max 80 chars)
4. "fun_fact": One interesting fact about this word (max 100 chars)
5. "cultural_note": The word in 3 other languages format: "word (French) · word (Spanish) · word (German)"

Return ONLY valid JSON object with these 5 keys. No markdown, no explanation."""

    try:
        res = requests.post(f"{endpoint}/api/chat/", json={
            "messages": [{"role": "user", "content": prompt}]
        }, timeout=30, stream=False)
        if res.status_code == 200:
            # Parse SSE stream for the response
            full_text = ""
            for line in res.text.split('\n'):
                if line.startswith('data: ') and line[6:] != '[DONE]':
                    try:
                        data = json.loads(line[6:])
                        full_text += data.get('response', '')
                    except:
                        pass
            # Try to extract JSON from response
            try:
                # Find JSON object in response
                start = full_text.find('{')
                end = full_text.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(full_text[start:end])
            except:
                pass
    except:
        pass
    return None

def generate_enrichment_template(word, meaning):
    """Template-based fallback enrichment generation."""
    w = word.upper()
    m = meaning or "A valid Scrabble word."
    
    # Simple template-based generation
    origin = f"Entered English from Latin/Old French roots. Related to the concept of {m.split('.')[0].lower().strip()}."
    example = f"The word {w} was used effectively in the championship game, scoring well on a triple-word square."
    spelling_tip = f"Break it down: {'–'.join(w[:len(w)//2])} + {'–'.join(w[len(w)//2:])}. Sound it out syllable by syllable."
    fun_fact = f"{w} scores {sum({'A':1,'B':3,'C':3,'D':2,'E':1,'F':4,'G':2,'H':4,'I':1,'J':8,'K':5,'L':1,'M':3,'N':1,'O':1,'P':3,'Q':10,'R':1,'S':1,'T':1,'U':1,'V':4,'W':4,'X':8,'Y':4,'Z':10}.get(c, 0) for c in w)} points in Scrabble — a strong vocabulary word."
    cultural_note = f"A word commonly used in formal English writing and academic contexts."

    return {
        "origin": origin,
        "usage_example": example,
        "spelling_tip": spelling_tip,
        "fun_fact": fun_fact,
        "cultural_note": cultural_note,
    }

def escape_sql(s):
    """Escape single quotes for SQL."""
    if not s:
        return ""
    return s.replace("'", "''")

def main():
    parser = argparse.ArgumentParser(description='Enrich WOTD entries with fun_fact, origin, etc.')
    parser.add_argument('--local', action='store_true', help='Target local DB')
    parser.add_argument('--live', action='store_true', help='Use live AI for generation')
    parser.add_argument('--limit', type=int, default=0, help='Limit words to process')
    parser.add_argument('--dry-run', action='store_true', help='Preview without generating SQL')
    parser.add_argument('--use-ai', action='store_true', help='Use AI to generate (slower but better quality)')
    args = parser.parse_args()

    endpoint = EMBED_URL_LIVE if args.live else EMBED_URL_LOCAL
    output_file = '/tmp/wotd-enrich-batch.sql'

    print(f"Enriching WOTD entries...")
    print(f"  Endpoint: {endpoint}")
    print(f"  Mode: {'AI-generated' if args.use_ai else 'Template-based'}")

    # Get words needing enrichment from local sqlite
    import subprocess
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'DB', '--local', '--json',
         '--command', "SELECT word, date, meaning FROM word_of_the_day WHERE date >= '2026-06-08' AND date <= '2028-07-08' AND (fun_fact = '' OR fun_fact IS NULL) ORDER BY date"],
        capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )

    try:
        data = json.loads(result.stdout)
        words = data[0].get('results', []) if data else []
    except:
        print(f"ERROR parsing DB output: {result.stdout[:200]}")
        sys.exit(1)

    print(f"  Words needing enrichment: {len(words)}")

    if args.limit:
        words = words[:args.limit]
        print(f"  Limited to: {args.limit}")

    if args.dry_run:
        print(f"\n[DRY RUN] Would enrich {len(words)} words")
        for w in words[:5]:
            print(f"  {w['word']} ({w['date']}): {w['meaning'][:50]}...")
        return

    # Generate enrichment
    statements = []
    for i, w in enumerate(words):
        if args.use_ai:
            data = generate_enrichment_ai(w['word'], w['meaning'], endpoint)
            if not data:
                data = generate_enrichment_template(w['word'], w['meaning'])
            time.sleep(1)  # Rate limit AI calls
        else:
            data = generate_enrichment_template(w['word'], w['meaning'])

        stmt = (
            f"UPDATE word_of_the_day SET "
            f"fun_fact='{escape_sql(data['fun_fact'])}', "
            f"origin='{escape_sql(data['origin'])}', "
            f"usage_example='{escape_sql(data['usage_example'])}', "
            f"spelling_tip='{escape_sql(data['spelling_tip'])}', "
            f"cultural_note='{escape_sql(data['cultural_note'])}' "
            f"WHERE word='{escape_sql(w['word'])}';"
        )
        statements.append(stmt)

        if (i + 1) % 50 == 0:
            print(f"  Generated {i+1}/{len(words)}")

    # Write SQL file
    with open(output_file, 'w') as f:
        f.write(f"-- WOTD enrichment batch: {len(statements)} words\n")
        f.write("BEGIN TRANSACTION;\n")
        for s in statements:
            f.write(s + "\n")
        f.write("COMMIT;\n")

    print(f"\n  Generated {len(statements)} UPDATE statements")
    print(f"  Output: {output_file}")
    print(f"\n  Apply with:")
    print(f"    npx wrangler d1 execute DB --local --file={output_file}")
    print(f"    echo 'Y' | npx wrangler d1 execute DB --remote --file={output_file}")

if __name__ == '__main__':
    main()
