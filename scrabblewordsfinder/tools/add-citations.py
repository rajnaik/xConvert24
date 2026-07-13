#!/usr/bin/env python3
"""
add-citations.py — Add Citations component to 92 blogs that discuss rules/gameplay.

Each blog gets tier-appropriate sources based on its content.

Usage:
    python3 tools/add-citations.py --dry-run    # Preview
    python3 tools/add-citations.py              # Apply
"""

import os
import re
import sys

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(PROJECT_DIR, 'src', 'pages', 'blog')

# Source strings
SRC_HASBRO = "Official Scrabble Rules, Hasbro Inc. (scrabble.hasbro.com)"
SRC_NASPA = "NASPA Official Tournament Rules, North American Scrabble Players Association (scrabbleplayers.org)"
SRC_WESPA = "WESPA Rules & Tournament Regulations, World English-Language Scrabble Players Association (wespa.org)"
SRC_COLLINS = "Collins Scrabble Words (CSW), HarperCollins Publishers (collinsdictionary.com/scrabble)"
SRC_OSPD = "Official Scrabble Players Dictionary (OSPD6), Merriam-Webster / Hasbro"
SRC_TWL = "Tournament Word List (TWL06), NASPA Word List Committee"
SRC_SOWPODS = "SOWPODS International Dictionary (267,751 words), Collins + TWL combined"
SRC_HISTORY = "Scrabble: The Complete History by Stefan Fatsis (2001)"
SRC_STATS = "Statistical analysis based on SOWPODS tile distribution and letter frequency data"

# Tier assignments: blog slug -> list of sources
TIER_1_RULES = {
    "scrabble-rules-explained": [SRC_HASBRO, SRC_NASPA, SRC_WESPA],
    "how-blank-tiles-work": [SRC_HASBRO, SRC_NASPA],
    "scrabble-board-game-rules": [SRC_HASBRO, SRC_NASPA],
    "tournament-rules-explained": [SRC_NASPA, SRC_WESPA],
    "how-to-challenge-in-scrabble": [SRC_NASPA, SRC_WESPA, SRC_HASBRO],
    "how-to-use-blank-tiles-strategically": [SRC_HASBRO, SRC_NASPA],
    "scrabble-etiquette": [SRC_NASPA, SRC_WESPA],
}

TIER_2_DICTIONARIES = {
    "collins-official-dictionary": [SRC_COLLINS, SRC_SOWPODS],
    "sowpods-dictionary": [SRC_SOWPODS, SRC_COLLINS, SRC_TWL],
    "twl-naspa-dictionary": [SRC_TWL, SRC_NASPA, SRC_OSPD],
    "official-scrabble-dictionary-guide": [SRC_OSPD, SRC_COLLINS, SRC_TWL, SRC_SOWPODS],
    "how-scrabble-dictionaries-update": [SRC_COLLINS, SRC_NASPA, SRC_WESPA],
    "sowpods-vs-twl-which-to-use": [SRC_SOWPODS, SRC_TWL, SRC_NASPA],
    "words-only-in-sowpods": [SRC_SOWPODS, SRC_COLLINS],
    "words-only-in-twl": [SRC_TWL, SRC_NASPA],
    "words-removed-from-scrabble": [SRC_NASPA, SRC_COLLINS, SRC_WESPA],
    "new-words-added-2026": [SRC_COLLINS, SRC_NASPA],
    "newly-added-scrabble-words": [SRC_COLLINS, SRC_NASPA],
    "controversial-scrabble-words": [SRC_NASPA, SRC_WESPA, SRC_COLLINS],
}

TIER_3_TOURNAMENT = {
    "competitive-scrabble-tournament-world": [SRC_NASPA, SRC_WESPA],
    "how-scrabble-tournaments-work": [SRC_NASPA, SRC_WESPA],
    "scrabble-complete-guide-to-tournaments": [SRC_NASPA, SRC_WESPA, SRC_HASBRO],
    "scrabble-rating-system-explained": [SRC_NASPA, SRC_WESPA],
    "scrabble-ratings-explained": [SRC_NASPA, SRC_WESPA],
    "world-scrabble-championships": [SRC_WESPA, SRC_NASPA],
    "highest-tournament-scores": [SRC_NASPA, SRC_WESPA],
    "scrabble-tournament-calendar-2026": [SRC_NASPA, SRC_WESPA],
    "becoming-a-tournament-player": [SRC_NASPA, SRC_WESPA],
    "online-vs-tournament-scrabble": [SRC_NASPA, SRC_WESPA],
    "scrabble-club-guide-beginners": [SRC_NASPA],
    "scrabble-crossword-game-notation-explained": [SRC_NASPA, SRC_WESPA],
    "famous-scrabble-matches": [SRC_NASPA, SRC_WESPA, SRC_HISTORY],
    "greatest-scrabble-players": [SRC_NASPA, SRC_WESPA, SRC_HISTORY],
}

TIER_4_HISTORY = {
    "scrabble-history-origins-great-depression": [SRC_HISTORY, SRC_HASBRO],
    "scrabble-complete-history-from-depression-to-championships": [SRC_HISTORY, SRC_HASBRO, SRC_NASPA, SRC_WESPA],
    "history-of-scrabble": [SRC_HISTORY, SRC_HASBRO],
    "famous-scrabble-controversies": [SRC_NASPA, SRC_WESPA, SRC_HISTORY],
    "celebrity-scrabble-players": [SRC_HISTORY],
    "scrabble-around-the-world": [SRC_WESPA, SRC_HISTORY],
    "cognitive-benefits-of-scrabble": [SRC_STATS, SRC_HISTORY],
}

TIER_5_STRATEGY = {
    "average-game-length": [SRC_NASPA, SRC_STATS],
    "average-winning-score": [SRC_NASPA, SRC_STATS],
    "maximum-possible-scrabble-score": [SRC_STATS, SRC_SOWPODS],
    "scrabble-highest-possible-score": [SRC_STATS, SRC_SOWPODS],
    "oxyphenbutazone-highest-scoring-word": [SRC_SOWPODS, SRC_STATS],
    "scrabble-by-the-numbers": [SRC_STATS, SRC_SOWPODS, SRC_NASPA],
    "counting-tiles-strategy": [SRC_HASBRO, SRC_STATS],
    "endgame-strategy": [SRC_NASPA, SRC_STATS],
    "scrabble-time-pressure-tips": [SRC_NASPA, SRC_WESPA],
    "coming-from-behind-scrabble": [SRC_STATS, SRC_NASPA],
    "dealing-with-bad-tiles": [SRC_STATS, SRC_SOWPODS],
}

# Tier 6: word validity pages — generic sources
TIER_6_VALIDITY_GENERIC = [SRC_SOWPODS, SRC_TWL, SRC_COLLINS]
TIER_6_PAGES = [
    "all-2-letter-scrabble-words",
    "best-two-letter-words-scrabble",
    "medical-terms-valid-scrabble",
    "common-illegal-words-scrabble",
    "are-scrabble-solvers-fair",
    "best-online-scrabble-sites",
    "best-scrabble-boards-to-buy",
    "best-scrabble-solver-tools",
    "best-scrabble-training-tools",
    "best-q-words-scrabble",
    "best-z-words-scrabble",
    "best-words-for-premium-squares",
    "best-words-for-triple-letter-squares",
    "bingo-probability",
    "bingo-training-methods",
    "bird-names-accepted-in-scrabble",
    "classroom-scrabble-activities",
    "common-bingo-prefixes",
    "dealing-with-bad-tiles",
    "dictionaries",
    "fish-names-accepted-in-scrabble",
    "fishing-for-bingos",
    "five-letter-words-that-score-high",
    "four-consonant-words",
    "four-letter-words-every-player-should-know",
    "four-vowel-words",
    "front-hooks-vs-back-hooks",
    "high-scoring-short-words",
    "high-scoring",
    "hook-words-advanced",
    "hotspots-and-dead-zones",
    "how-to-play-scrabble-videos",
    "how-to-use-blank-tiles-scrabble",
    "is-using-a-scrabble-word-finder-cheating",
    "lex-ai-scrabble-coach",
    "online-scrabble-communities",
    "online-vs-board-scrabble",
    "roadmap-to-being-a-pro-player",
    "scrabble-go-tips",
    "scrabble-highest-possible-score",
    "scrabble-offensive-vs-defensive-play-styles",
    "scrabble-playing-the-endgame-like-a-pro",
    "scrabble-power-of-two-letter-words",
    "scrabble-study-plans",
    "scrabble-vs-words-with-friends",
    "scrabble-word-checker-tools",
    "tools-solvers",
    "twl-vs-sowpods",
    "ultimate-scrabble-resource-guide",
    "useful-links",
    "weird-scrabble-facts",
    "words-with-friends-dictionary",
]

# Also add "is-X-a-scrabble-word" pages
IS_WORD_PAGES = [
    "is-bi-a-scrabble-word", "is-ch-a-scrabble-word", "is-di-a-scrabble-word",
    "is-ew-a-scrabble-word", "is-gi-a-scrabble-word", "is-ky-a-scrabble-word",
    "is-na-a-scrabble-word", "is-oi-a-scrabble-word", "is-qat-a-scrabble-word",
    "is-qi-a-scrabble-word", "is-ug-a-scrabble-word", "is-wo-a-scrabble-word",
    "is-ya-a-scrabble-word", "is-za-a-scrabble-word", "is-ze-a-scrabble-word",
    "is-zo-a-scrabble-word",
]


def get_sources_for_slug(slug):
    """Return the appropriate sources list for a given blog slug."""
    if slug in TIER_1_RULES:
        return TIER_1_RULES[slug]
    if slug in TIER_2_DICTIONARIES:
        return TIER_2_DICTIONARIES[slug]
    if slug in TIER_3_TOURNAMENT:
        return TIER_3_TOURNAMENT[slug]
    if slug in TIER_4_HISTORY:
        return TIER_4_HISTORY[slug]
    if slug in TIER_5_STRATEGY:
        return TIER_5_STRATEGY[slug]
    if slug in TIER_6_PAGES or slug in IS_WORD_PAGES:
        return TIER_6_VALIDITY_GENERIC
    return None


def escape_astro(s):
    """Escape strings for Astro template literals."""
    return s.replace('"', '&quot;').replace("'", "\\'")


def build_sources_array(sources):
    """Build the Astro sources prop array string."""
    items = ', '.join(f'"{s}"' for s in sources)
    return '{[' + items + ']}'


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    # Combine all slugs
    all_slugs = (
        list(TIER_1_RULES.keys()) +
        list(TIER_2_DICTIONARIES.keys()) +
        list(TIER_3_TOURNAMENT.keys()) +
        list(TIER_4_HISTORY.keys()) +
        list(TIER_5_STRATEGY.keys()) +
        TIER_6_PAGES +
        IS_WORD_PAGES
    )
    # Deduplicate
    all_slugs = list(dict.fromkeys(all_slugs))

    print(f"Adding Citations to {len(all_slugs)} blogs...")
    count = 0
    skipped = 0
    missing = 0

    for slug in all_slugs:
        fpath = os.path.join(BLOG_DIR, slug + '.astro')
        if not os.path.exists(fpath):
            missing += 1
            continue

        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'Citations' in content:
            skipped += 1
            continue

        sources = get_sources_for_slug(slug)
        if not sources:
            continue

        # Add import
        if "import AuthorInfo" in content:
            content = content.replace(
                "import AuthorInfo from '../../components/AuthorInfo.astro';",
                "import AuthorInfo from '../../components/AuthorInfo.astro';\nimport Citations from '../../components/Citations.astro';"
            )
        elif "import BlogCrossLinks" in content:
            content = content.replace(
                "import BlogCrossLinks from '../../components/BlogCrossLinks.astro';",
                "import BlogCrossLinks from '../../components/BlogCrossLinks.astro';\nimport Citations from '../../components/Citations.astro';"
            )
        elif "import '../../styles/global.css';" in content:
            content = content.replace(
                "import '../../styles/global.css';",
                "import '../../styles/global.css';\nimport Citations from '../../components/Citations.astro';"
            )
        else:
            continue

        # Build the sources array as Astro JSX
        sources_jsx = '{[' + ', '.join(f'"{s}"' for s in sources) + ']}'

        # Insert <Citations /> before <AuthorInfo /> if it exists, else before </article>
        if '<AuthorInfo' in content:
            # Insert before AuthorInfo
            author_idx = content.find('<AuthorInfo')
            if author_idx != -1:
                insert = f'      <Citations sources={sources_jsx} />\n\n'
                content = content[:author_idx] + insert + content[author_idx:]
        else:
            # Insert before </article>
            last_article = content.rfind('</article>')
            if last_article != -1:
                insert = f'\n      <Citations sources={sources_jsx} />\n\n    '
                content = content[:last_article] + insert + content[last_article:]
            else:
                continue

        if not args.dry_run:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)

        count += 1

    print(f"\n  Added: {count}")
    print(f"  Skipped (already has Citations): {skipped}")
    print(f"  Missing files: {missing}")
    print(f"  Total targeted: {len(all_slugs)}")

    if args.dry_run:
        print("\n  [DRY RUN] No files modified.")

    # Print URLs for verification
    if not args.dry_run:
        print(f"\n  URLs to verify (localhost:4321):")
        for slug in all_slugs:
            fpath = os.path.join(BLOG_DIR, slug + '.astro')
            if os.path.exists(fpath):
                print(f"  http://localhost:4321/blog/{slug}/")


if __name__ == '__main__':
    main()
