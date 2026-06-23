#!/usr/bin/env python3
"""
Bulk SEO Fix Script for SWF Blog Posts
Fixes:
1. Missing FAQPage JSON-LD schema (63 posts)
2. Missing "Related Articles" aside section (110 posts)

Admin noindex is already handled by Layout.astro automatically.
Run from the SWF root directory.
"""

import os
import re
import random

BLOG_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'pages', 'blog')
BLOG_DIR = os.path.abspath(BLOG_DIR)

# ─── HELPERS ───────────────────────────────────────────────────────────────────

def get_all_blog_files():
    """Get all .astro blog files excluding index."""
    files = [f for f in os.listdir(BLOG_DIR) if f.endswith('.astro') and f != 'index.astro']
    return sorted(files)


def slug_to_title(slug):
    """Convert a slug to a readable title."""
    # Special prefix handling
    title = slug.replace('-', ' ').title()
    # Fix common words that should stay lowercase
    for word in ['In', 'Of', 'With', 'For', 'And', 'The', 'A', 'An', 'To', 'On', 'At', 'By', 'Or', 'Vs']:
        title = title.replace(f' {word} ', f' {word.lower()} ')
    # Always capitalize first word
    if title:
        title = title[0].upper() + title[1:]
    return title


def extract_title_from_file(filepath):
    """Extract the title from BlogLayout or Layout title prop."""
    with open(filepath, 'r') as f:
        content = f.read()
    # Match title="..." or title='...'
    m = re.search(r'title="([^"]+)"', content)
    if m:
        return m.group(1)
    m = re.search(r"title='([^']+)'", content)
    if m:
        return m.group(1)
    return slug_to_title(os.path.basename(filepath).replace('.astro', ''))


def extract_description_from_file(filepath):
    """Extract the description from the file."""
    with open(filepath, 'r') as f:
        content = f.read()
    m = re.search(r'description="([^"]+)"', content)
    if m:
        return m.group(1)
    return ""


# ─── FIX 1: FAQPage Schema ────────────────────────────────────────────────────

def generate_faq_for_slug(slug, title, description):
    """Generate 3 FAQ Q&A pairs based on the slug pattern."""
    
    # Words containing [XX] pattern
    m = re.match(r'words-containing-double-([a-z])', slug)
    if m:
        letter = m.group(1).upper()
        return [
            {"name": f"What are the best Scrabble words with double {letter}?",
             "answer": f"High-scoring words with double {letter} include common everyday words and bonus-scoring Scrabble plays. Double letters create opportunities for parallel plays and hook words."},
            {"name": f"Are words with double {letter} common in Scrabble?",
             "answer": f"Yes, words with double {letter} appear frequently in standard play. They're useful for rack management since they help use duplicate tiles effectively."},
            {"name": f"How many Scrabble-valid words contain double {letter}?",
             "answer": f"The SOWPODS dictionary contains hundreds of words with double {letter}, ranging from short 3-letter words to 7+ letter bingos worth 50+ points."}
        ]
    
    m = re.match(r'words-containing-([a-z]{2,3})$', slug)
    if m:
        combo = m.group(1).upper()
        return [
            {"name": f"What are the highest-scoring Scrabble words containing {combo}?",
             "answer": f"Words containing {combo} range from short tactical plays to full 7-letter bingos. The best scoring options depend on available premium squares and your remaining rack tiles."},
            {"name": f"How useful is the {combo} combination in Scrabble?",
             "answer": f"The {combo} combination appears in many common English words, making it a reliable pattern to recognise. Knowing {combo} words helps with rack reading and anagram spotting."},
            {"name": f"Can {combo} words help score bingos in Scrabble?",
             "answer": f"Yes — many 7-letter and 8-letter bingo words contain {combo}. Learning the most common {combo} bingo stems can significantly improve your scoring potential."}
        ]
    
    # Words ending with [suffix] pattern
    m = re.match(r'words-ending-with-([a-z]+)', slug)
    if m:
        suffix = m.group(1).upper()
        return [
            {"name": f"What are the best Scrabble words ending in -{suffix}?",
             "answer": f"Words ending in -{suffix} include both common everyday words and strategic Scrabble plays. The suffix helps with hook plays where you extend existing words on the board."},
            {"name": f"How many valid Scrabble words end with -{suffix}?",
             "answer": f"The SOWPODS dictionary contains many valid words ending in -{suffix}, from short 3-4 letter words to full 7-letter bingos. TWL has slightly fewer entries."},
            {"name": f"Are -{suffix} endings useful for Scrabble strategy?",
             "answer": f"Absolutely. Knowing -{suffix} words helps with back-hooking (adding letters after existing words) and improves rack leave when you spot the suffix pattern in your tiles."}
        ]
    
    # Words starting with [prefix] pattern
    m = re.match(r'words-starting-with-([a-z]+)', slug)
    if m:
        prefix = m.group(1).upper()
        return [
            {"name": f"What are the highest-scoring Scrabble words starting with {prefix}?",
             "answer": f"Words starting with {prefix} offer strong scoring potential, especially when placed on premium squares. The prefix creates opportunities for front-hooking existing board words."},
            {"name": f"How does knowing {prefix}- words help in Scrabble?",
             "answer": f"Recognising {prefix}- words improves your rack reading ability. When you spot these letters on your rack, you can quickly identify high-scoring plays without exhaustive searching."},
            {"name": f"Can {prefix}- words be used for bingos in Scrabble?",
             "answer": f"Yes — many 7-letter bingo words start with {prefix}. Learning common {prefix}- stems is a proven tournament strategy for increasing bingo frequency."}
        ]
    
    # Generic fallback
    return [
        {"name": f"What makes these words useful in Scrabble?",
         "answer": "These words cover a range of lengths and point values, giving you options for both high-scoring power plays and tactical board positioning moves."},
        {"name": f"Are all listed words valid in tournament Scrabble?",
         "answer": "All words are valid in SOWPODS (international) Scrabble. Most are also valid in TWL/NWL (North American). Always check your tournament's dictionary rules."},
        {"name": f"How can I memorise these Scrabble words effectively?",
         "answer": "Focus on the highest-scoring words first, then learn common short words for rack flexibility. Use spaced repetition and play practice games to reinforce your word knowledge."}
    ]


def fix_missing_faq_schema(dry_run=False):
    """Add FAQPage JSON-LD to posts missing it."""
    fixed = 0
    skipped = 0
    
    for filename in get_all_blog_files():
        filepath = os.path.join(BLOG_DIR, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        if 'FAQPage' in content:
            continue
        
        slug = filename.replace('.astro', '')
        title = extract_title_from_file(filepath)
        description = extract_description_from_file(filepath)
        
        faqs = generate_faq_for_slug(slug, title, description)
        
        # Build the FAQPage JSON-LD block
        faq_entries = ',\n      '.join([
            f'{{"@type": "Question", "name": "{q["name"]}", "acceptedAnswer": {{ "@type": "Answer", "text": "{q["answer"]}" }}}}'
            for q in faqs
        ])
        
        faq_block = f'''  <script type="application/ld+json" set:html={{JSON.stringify({{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {faq_entries}
    ]
  }})}} />'''
        
        # Insert after the Article JSON-LD block (after the first </script> that follows application/ld+json)
        # Find the closing of the Article JSON-LD script tag
        pattern = r'(  <script type="application/ld\+json"[^>]*>[\s\S]*?/>\s*\n)'
        match = re.search(pattern, content)
        
        if match:
            insert_pos = match.end()
            new_content = content[:insert_pos] + faq_block + '\n' + content[insert_pos:]
        else:
            # No existing JSON-LD — insert before the first <div
            div_match = re.search(r'(\s*<div class="max-w-3xl)', content)
            if div_match:
                insert_pos = div_match.start()
                new_content = content[:insert_pos] + '\n' + faq_block + '\n' + content[insert_pos:]
            else:
                print(f"  SKIP (no insertion point): {filename}")
                skipped += 1
                continue
        
        if not dry_run:
            with open(filepath, 'w') as f:
                f.write(new_content)
        
        fixed += 1
        if fixed <= 5:
            print(f"  ✓ {filename}")
    
    print(f"\n  FAQPage schema: {fixed} files fixed, {skipped} skipped")
    return fixed


# ─── FIX 2: Related Articles Section ──────────────────────────────────────────

def find_related_posts(slug, all_slugs):
    """Find 2-3 related posts based on slug pattern similarity."""
    related = []
    
    # Pattern: words-containing-XX → other words-containing-XX posts
    if slug.startswith('words-containing-'):
        suffix = slug.replace('words-containing-', '')
        candidates = [s for s in all_slugs if s.startswith('words-containing-') and s != slug]
        # Prefer similar length suffixes
        candidates.sort(key=lambda x: abs(len(x) - len(slug)))
        related = candidates[:3]
    
    elif slug.startswith('words-ending-with-'):
        suffix = slug.replace('words-ending-with-', '')
        candidates = [s for s in all_slugs if s.startswith('words-ending-with-') and s != slug]
        candidates.sort(key=lambda x: abs(len(x) - len(slug)))
        related = candidates[:3]
    
    elif slug.startswith('words-starting-with-'):
        suffix = slug.replace('words-starting-with-', '')
        candidates = [s for s in all_slugs if s.startswith('words-starting-with-') and s != slug]
        # Pick alphabetically adjacent
        try:
            idx = candidates.index(slug)
        except ValueError:
            idx = 0
        # Get neighbors
        neighbors = []
        if idx > 0:
            neighbors.append(candidates[idx - 1])
        if idx < len(candidates) - 1:
            neighbors.append(candidates[idx + 1] if idx + 1 < len(candidates) else candidates[0])
        # Add one more from same family
        remaining = [c for c in candidates if c not in neighbors]
        if remaining:
            neighbors.append(remaining[len(remaining)//2])
        related = neighbors[:3]
    
    elif slug.startswith('words-ending-in-'):
        candidates = [s for s in all_slugs if s.startswith('words-ending-in-') and s != slug]
        candidates.sort(key=lambda x: abs(len(x) - len(slug)))
        related = candidates[:3]
    
    # Fallback: find posts with overlapping words in slug
    if len(related) < 2:
        slug_words = set(slug.split('-'))
        scored = []
        for s in all_slugs:
            if s == slug or s in related:
                continue
            s_words = set(s.split('-'))
            overlap = len(slug_words & s_words)
            if overlap >= 2:
                scored.append((overlap, s))
        scored.sort(reverse=True)
        for _, s in scored[:3 - len(related)]:
            related.append(s)
    
    # Absolute fallback: add generic useful posts
    if len(related) < 2:
        fallbacks = ['high-scoring-short-words', 'best-two-letter-words-scrabble', 'scrabble-scoring-guide']
        for fb in fallbacks:
            if fb in all_slugs and fb != slug and fb not in related:
                related.append(fb)
            if len(related) >= 2:
                break
    
    return related[:3]


def build_related_articles_html(related_slugs):
    """Build the Related Articles aside HTML."""
    links = []
    for slug in related_slugs:
        title = slug_to_title(slug)
        links.append(
            f'          <a href="/blog/{slug}/" class="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-blue-700 hover:bg-blue-900/10 transition-all group">\n'
            f'            <span class="text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>\n'
            f'            <span class="text-sm text-gray-300 group-hover:text-blue-400 transition-colors">{title}</span>\n'
            f'          </a>'
        )
    
    links_html = '\n'.join(links)
    
    return (
        f'      <aside class="border-t border-gray-700 mt-12 pt-8 not-prose">\n'
        f'        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Related Articles</h3>\n'
        f'        <div class="grid gap-3">\n'
        f'{links_html}\n'
        f'        </div>\n'
        f'      </aside>\n'
    )


def fix_missing_related_articles(dry_run=False):
    """Add Related Articles aside to posts missing it."""
    all_slugs = [f.replace('.astro', '') for f in get_all_blog_files()]
    fixed = 0
    skipped = 0
    
    for filename in get_all_blog_files():
        filepath = os.path.join(BLOG_DIR, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        if 'Related Articles' in content:
            continue
        
        slug = filename.replace('.astro', '')
        
        # Skip category landing pages
        if slug in ['beginner-guides', 'two-letter-words', 'three-letter-words', 'strategy',
                    'tournament', 'bingos', 'high-scoring', 'letter-guides', 'dictionaries',
                    'tools-solvers', 'useful-links']:
            continue
        
        related = find_related_posts(slug, all_slugs)
        if len(related) < 2:
            print(f"  SKIP (< 2 related found): {filename}")
            skipped += 1
            continue
        
        aside_html = build_related_articles_html(related)
        
        # Insert before the CTA box or "Back to all articles" link
        # Look for the CTA box pattern
        cta_pattern = r'(\s*<div class="not-prose mt-10 p-5 bg-gradient-to-r)'
        back_pattern = r'(\s*<div class="not-prose mt-8 text-center">\s*\n\s*<a href="/blog/")'
        
        match = re.search(cta_pattern, content)
        if match:
            insert_pos = match.start()
            new_content = content[:insert_pos] + '\n\n' + aside_html + content[insert_pos:]
        else:
            # Try before "Back to all articles"
            match = re.search(back_pattern, content)
            if match:
                insert_pos = match.start()
                new_content = content[:insert_pos] + '\n\n' + aside_html + content[insert_pos:]
            else:
                # Last resort: insert before </article>
                match = re.search(r'(\s*</article>)', content)
                if match:
                    insert_pos = match.start()
                    new_content = content[:insert_pos] + '\n\n' + aside_html + content[insert_pos:]
                else:
                    print(f"  SKIP (no insertion point): {filename}")
                    skipped += 1
                    continue
        
        if not dry_run:
            with open(filepath, 'w') as f:
                f.write(new_content)
        
        fixed += 1
        if fixed <= 5:
            print(f"  ✓ {filename}")
    
    print(f"\n  Related Articles: {fixed} files fixed, {skipped} skipped")
    return fixed


# ─── MAIN ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import sys
    
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("═══ DRY RUN MODE (no files modified) ═══\n")
    else:
        print("═══ LIVE MODE (files will be modified) ═══\n")
    
    print(f"Blog directory: {BLOG_DIR}")
    print(f"Total blog files: {len(get_all_blog_files())}\n")
    
    print("─── Fix 1: FAQPage Schema ───")
    faq_count = fix_missing_faq_schema(dry_run=dry_run)
    
    print("\n─── Fix 2: Related Articles Section ───")
    ra_count = fix_missing_related_articles(dry_run=dry_run)
    
    print(f"\n═══ SUMMARY ═══")
    print(f"  FAQPage schema added: {faq_count}")
    print(f"  Related Articles added: {ra_count}")
    print(f"  Admin noindex: Already handled by Layout.astro (auto-applies to /admin/* paths)")
    
    if dry_run:
        print(f"\n  Run without --dry-run to apply changes.")
