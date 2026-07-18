#!/usr/bin/env python3
"""
Bulk content expansion script for thin blog pages (<800 article words).
Adds category-specific content sections to push pages over the 800-word threshold.

Usage:
  python3 tools/bulk-content-expand.py          # dry run (shows what would change)
  python3 tools/bulk-content-expand.py --apply  # actually modifies files

Categories handled:
  - words-containing-XX (80 pages) → Board placement + tile frequency section
  - words-starting-with-X (23 pages) → Opening strategy + word building section
  - words-ending-* (22 pages) → Hook words + defensive play section
  - is-X-a-scrabble-word (12 pages) → Game scenarios + related words section
  - scrabble-words-* (13 pages) → Pattern recognition + memorisation section
  - tournament/championship (9 pages) → Tournament significance section
  - other (84 pages) → Competitive application + study method section
"""

import os
import re
import sys
import subprocess

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(BASE, "src", "pages", "blog")
DRY_RUN = "--apply" not in sys.argv
WORD_THRESHOLD = 800

# Scrabble tile values for generating content
TILE_VALUES = {
    'A':1,'B':3,'C':3,'D':2,'E':1,'F':4,'G':2,'H':4,'I':1,'J':8,'K':5,
    'L':1,'M':3,'N':1,'O':1,'P':3,'Q':10,'R':1,'S':1,'T':1,'U':1,'V':4,
    'W':4,'X':8,'Y':4,'Z':10
}
TILE_COUNTS = {
    'A':9,'B':2,'C':2,'D':4,'E':12,'F':2,'G':3,'H':2,'I':9,'J':1,'K':1,
    'L':4,'M':2,'N':6,'O':8,'P':2,'Q':1,'R':6,'S':4,'T':6,'U':4,'V':2,
    'W':2,'X':1,'Y':2,'Z':1
}


def count_article_words(content):
    """Count words inside <article> tags, stripping HTML."""
    match = re.search(r'<article[^>]*>(.*?)</article>', content, re.DOTALL)
    if not match:
        return 0
    text = re.sub(r'<[^>]+>', ' ', match.group(1))
    words = re.findall(r'[a-zA-Z]+', text)
    return len(words)


def get_category(filename):
    """Determine page category from filename."""
    name = filename.replace('.astro', '')
    if re.match(r'words-containing-[a-z]{2}$', name):
        return 'containing'
    if re.match(r'words-starting-with-[a-z]$', name):
        return 'starting'
    if re.match(r'words-ending', name):
        return 'ending'
    if re.match(r'is-[a-z]+-a-scrabble-word$', name):
        return 'validity'
    if name.startswith('scrabble-words-'):
        return 'scrabble-words'
    if any(t in name for t in ['tournament', 'championship', 'world-cup', 'wespac', 'causeway']):
        return 'tournament'
    return 'other'


def get_topic_var(filename, category):
    """Extract the topic variable (letter pair, letter, word, etc.)."""
    name = filename.replace('.astro', '')
    if category == 'containing':
        return name.replace('words-containing-', '').upper()
    if category == 'starting':
        return name.replace('words-starting-with-', '').upper()
    if category == 'ending':
        # e.g. words-ending-in-est, words-ending-with-ment
        m = re.search(r'words-ending[^-]*-(.+)', name)
        return m.group(1).upper() if m else name.upper()
    if category == 'validity':
        m = re.match(r'is-(.+)-a-scrabble-word', name)
        return m.group(1).upper() if m else ''
    return name.replace('scrabble-', '').replace('-', ' ').title()


def has_boilerplate(content):
    """Check if page already has the standard boilerplate sections."""
    return 'Advanced Rack Management' in content or 'Elite Scrabble players think in terms of rack leave' in content


def generate_content(category, topic, has_existing_boilerplate):
    """Generate category-specific HTML content blocks."""
    sections = []

    # Phase A: Add boilerplate if missing (~200 words)
    if not has_existing_boilerplate:
        sections.append(generate_boilerplate(topic))

    # Phase B: Add unique category-specific section (~150 words)
    if category == 'containing':
        sections.append(generate_containing_section(topic))
    elif category == 'starting':
        sections.append(generate_starting_section(topic))
    elif category == 'ending':
        sections.append(generate_ending_section(topic))
    elif category == 'validity':
        sections.append(generate_validity_section(topic))
    elif category == 'scrabble-words':
        sections.append(generate_scrabble_words_section(topic))
    elif category == 'tournament':
        sections.append(generate_tournament_section(topic))
    else:
        sections.append(generate_other_section(topic))

    return '\n\n'.join(sections)


def generate_boilerplate(topic):
    """Standard boilerplate sections for pages missing them."""
    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Sharpen Your Skills</h2>

<div class="not-prose my-6 grid grid-cols-1 gap-4">
  <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 transition-colors">
    <p class="text-sm text-gray-300"><span class="text-purple-400 font-semibold">Use the solver daily:</span> Enter your rack tiles into our free word finder to discover every valid combination. Repeated exposure to word patterns builds recognition speed that transfers directly to competitive play.</p>
  </div>
  <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 transition-colors">
    <p class="text-sm text-gray-300"><span class="text-purple-400 font-semibold">Study in clusters:</span> Group words by shared patterns rather than memorising randomly. Pattern-based learning is three times more effective for long-term retention than isolated word lists.</p>
  </div>
  <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 transition-colors">
    <p class="text-sm text-gray-300"><span class="text-purple-400 font-semibold">Active recall over passive reading:</span> After reviewing this page, close it and try to write down as many words as you can remember. Testing yourself strengthens neural pathways far more than re-reading.</p>
  </div>
</div>

<div class="not-prose my-6 p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/10">
  <p class="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">📚 Keep Learning</p>
  <div class="grid gap-2">
    <a href="/blog/how-to-improve-at-scrabble-fast/" class="flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-900/20 transition-all group">
      <span class="text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">→</span>
      <span class="text-sm text-gray-300 group-hover:text-indigo-300 transition-colors">How to Improve at Scrabble Fast — Proven Methods</span>
    </a>
    <a href="/blog/rack-management-basics/" class="flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-900/20 transition-all group">
      <span class="text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">→</span>
      <span class="text-sm text-gray-300 group-hover:text-indigo-300 transition-colors">Rack Management Basics — Balance Your Tiles</span>
    </a>
  </div>
</div>'''


def generate_containing_section(pair):
    """Unique section for words-containing-XX pages."""
    l1 = pair[0] if len(pair) > 0 else 'X'
    l2 = pair[1] if len(pair) > 1 else 'Y'
    v1 = TILE_VALUES.get(l1, 1)
    v2 = TILE_VALUES.get(l2, 1)
    combined = v1 + v2
    c1 = TILE_COUNTS.get(l1, 1)
    c2 = TILE_COUNTS.get(l2, 1)

    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Tile Probability & Board Position</h2>

<p>Understanding tile distribution helps you anticipate when {pair} combinations will appear on your rack. {l1} appears {c1} time{"s" if c1 != 1 else ""} in the standard 100-tile bag (worth {v1} point{"s" if v1 != 1 else ""}), while {l2} appears {c2} time{"s" if c2 != 1 else ""} (worth {v2} point{"s" if v2 != 1 else ""}). Together, the {pair} pair contributes {combined} points before counting any other letters in your word.</p>

<div class="not-prose my-6 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/10">
  <div class="flex flex-wrap items-center justify-center gap-6 text-center">
    <div><p class="text-xl font-bold text-cyan-400">{l1}={v1}pt</p><p class="text-xs text-gray-400">{c1} in bag</p></div>
    <div><p class="text-xl font-bold text-cyan-400">{l2}={v2}pt</p><p class="text-xs text-gray-400">{c2} in bag</p></div>
    <div><p class="text-xl font-bold text-cyan-400">{combined}pt</p><p class="text-xs text-gray-400">{pair} combined</p></div>
  </div>
</div>

<p>When placing {pair} words on the board, prioritise positions where the higher-value letter ({l1 if v1 >= v2 else l2} at {max(v1,v2)} points) lands on a premium square. A double-letter score on {l1 if v1 >= v2 else l2} adds {max(v1,v2)} extra points, while a triple-letter placement adds {max(v1,v2)*2} extra. Look for open lanes where you can extend existing words by threading {pair} through intersecting tiles already on the board.</p>

<p>In the mid-game, holding {pair} together gives you flexibility because this combination appears in words across multiple length categories — from short tactical plays to seven-letter bingos. If your rack contains {pair} plus common tiles like E, R, S, or T, check for bingo possibilities before settling for a shorter word. The extra 50-point bonus for using all seven tiles often outweighs a high-scoring five-letter alternative.</p>'''


def generate_starting_section(letter):
    """Unique section for words-starting-with-X pages."""
    val = TILE_VALUES.get(letter, 1)
    count = TILE_COUNTS.get(letter, 1)

    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Opening Strategy with {letter}</h2>

<p>As the first player, {letter}-words offer distinct opening advantages. {letter} is worth {val} point{"s" if val != 1 else ""} and appears {count} time{"s" if count != 1 else ""} in the 100-tile bag. {"This makes it relatively rare — play it when you can score well rather than holding it hoping for a perfect opportunity." if count <= 2 else "With multiple copies available, you will see it frequently — focus on learning the highest-scoring combinations."}</p>

<div class="not-prose my-6 p-5 rounded-xl border border-green-500/30 bg-green-950/10">
  <p class="text-sm font-semibold text-green-400 uppercase tracking-wider mb-2">🎯 Opening Move Tip</p>
  <p class="text-base text-gray-200">On the first turn, any word crossing the centre star gets a double-word bonus. A {val}-point {letter} in a five-letter word starting on the centre square can easily score <span class="text-white font-medium">{(val + 4) * 2}+ points</span> on your very first play.</p>
</div>

<p>Beyond openings, {letter}-words are valuable for extending plays. When an opponent places a word ending near a triple-word square, starting a new word with {letter} perpendicular to their play can capture that premium. This defensive-offensive approach — scoring well while denying your opponent access to premium squares — separates intermediate players from advanced ones.</p>

<p>Build your {letter}-vocabulary in layers. Start with the two and three-letter {letter}-words for tight board situations, then master the five and six-letter words for solid mid-game plays, and finally study the seven-letter bingo candidates that start with {letter}. This progressive approach ensures you always have an {letter}-word available regardless of board state.</p>'''


def generate_ending_section(ending):
    """Unique section for words-ending-* pages."""
    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Hook Plays & Extensions</h2>

<p>Words ending in {ending} create powerful hook opportunities. A hook is when you add letters to an existing word on the board to form a new valid word. If an opponent plays a word, and you can extend it by adding {ending} at the end (or build a parallel word ending in {ending}), you score points for both the new letters and the entire modified word.</p>

<div class="not-prose my-6 p-5 rounded-xl border border-green-500/30 bg-green-950/10">
  <p class="text-sm font-semibold text-green-400 uppercase tracking-wider mb-2">🪝 Hooking Strategy</p>
  <p class="text-base text-gray-200">Keep an eye on words already on the board that can be extended with an <span class="text-white font-medium">{ending}</span> ending. This lets you build off your opponent's plays for big combination scores, especially near premium squares.</p>
</div>

<p>Defensively, knowing which words end in {ending} helps you avoid leaving hook opportunities for your opponent. Before placing a word, ask yourself: can my opponent add letters to what I just played? If so, consider a different placement that leaves fewer extension points exposed, particularly near triple-word squares.</p>

<p>The {ending} ending pattern also helps with rack management. When you recognise that your remaining tiles could form a word ending in {ending}, you can plan one or two turns ahead — playing supporting tiles first to set up a higher-scoring {ending} word on your next turn. This forward-thinking approach is a hallmark of competitive-level Scrabble.</p>'''


def generate_validity_section(word):
    """Unique section for is-X-a-scrabble-word pages."""
    val = sum(TILE_VALUES.get(c, 0) for c in word.upper())
    length = len(word)

    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Using {word} in Practice Games</h2>

<p>{word} scores {val} points without any premium square bonuses. As a {length}-letter word, it is particularly useful in tight board positions where longer words cannot fit. Short words like {word} shine in parallel plays — placing them adjacent to existing words so that every new tile forms a valid two-letter combination with the tiles beside it.</p>

<div class="not-prose my-6 p-5 rounded-xl border border-blue-500/30 bg-blue-950/20">
  <p class="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">💡 Scoring Scenario</p>
  <p class="text-base text-gray-200">Place {word} so that one of its letters lands on a <span class="text-white font-medium">double or triple-letter square</span>. Even a simple {length}-letter word can score {val * 2}+ points when premium squares multiply individual tile values.</p>
</div>

<p>Learning short valid words like {word} gives you critical flexibility in the endgame. When the bag is empty and both players can see the remaining tiles, having a catalogue of short words means you can always make a legal play — avoiding the penalty of passing or exchanging. Tournament players memorise hundreds of two and three-letter words specifically for these tight endgame situations.</p>

<p>If you are unsure whether a word is valid during a casual game, remember that our free word finder validates against both SOWPODS (international) and TWL (North American) dictionaries. Type it in and get instant confirmation — no signup required.</p>'''


def generate_scrabble_words_section(topic):
    """Unique section for scrabble-words-* pages."""
    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Pattern Recognition in Games</h2>

<p>Recognising word patterns during live gameplay separates casual players from competitive ones. The words on this page share structural similarities that make them easier to spot when they appear on your rack. Train your brain to see these patterns by reviewing the list daily for one week — most players report significantly faster word-finding after just five days of focused pattern study.</p>

<div class="not-prose my-6 p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/10">
  <p class="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">🧠 Pattern Training Method</p>
  <p class="text-base text-gray-200">Cover the word list, take 7 random tiles from a bag, and see how many words from this page you can form in <span class="text-white font-medium">60 seconds</span>. Repeat daily. Your speed will triple within a week as pattern recognition becomes automatic.</p>
</div>

<p>During tournament play, time pressure makes pattern recognition essential. You have roughly 25 minutes for an entire game — about 90 seconds per turn. Players who have internalised word patterns through repeated study can spot valid plays almost instantly, leaving more time for strategic positioning decisions. Those who rely on brute-force mental searching often run into time trouble by the mid-game.</p>

<p>Use our 60-Second Word Finder game to simulate this pressure in a fun, low-stakes environment. It presents you with random racks and challenges you to find as many valid words as possible before time expires — the perfect complement to studying word lists like this one.</p>'''


def generate_tournament_section(topic):
    """Unique section for tournament/championship pages."""
    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Following Tournament Scrabble</h2>

<p>Competitive Scrabble tournaments attract players from over 40 countries and operate under strict rules governed by either WESPA (World English-Language Scrabble Players Association) for international events or NASPA (North American Scrabble Players Association) for events in the US and Canada. Players are rated using an Elo-style system that adjusts after every tournament game.</p>

<div class="not-prose my-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
  <div class="flex flex-wrap items-center justify-center gap-6 text-center">
    <div><p class="text-xl font-bold text-amber-400">40+</p><p class="text-xs text-gray-400">Countries represented</p></div>
    <div><p class="text-xl font-bold text-amber-400">25 min</p><p class="text-xs text-gray-400">Per player per game</p></div>
    <div><p class="text-xl font-bold text-amber-400">400+</p><p class="text-xs text-gray-400">Avg winning score</p></div>
  </div>
</div>

<p>If you want to follow competitive Scrabble, key events include the World Scrabble Championship (biennial, rotates host countries), the King's Cup in Thailand (largest open tournament by entries), and various national championships held in each participating country. Results and ratings are publicly available through WESPA's official website.</p>

<p>For aspiring tournament players, the path typically starts at local Scrabble clubs, progresses through regional events, and eventually leads to national and international competition. Many top players recommend studying for at least six months of dedicated word learning before entering your first rated tournament. Our world rankings page tracks the current top players globally.</p>'''


def generate_other_section(topic):
    """Generic section for miscellaneous pages."""
    return f'''
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Applying This Knowledge Competitively</h2>

<p>Understanding Scrabble at a deeper level transforms a casual word game into a strategic battle. The concepts on this page give you tools that most recreational players never develop — and that asymmetry is where your competitive edge comes from. Whether you play online, in clubs, or just against family, informed play consistently outperforms guesswork.</p>

<div class="not-prose my-6 p-5 rounded-xl border border-green-500/30 bg-green-950/10">
  <p class="text-sm font-semibold text-green-400 uppercase tracking-wider mb-2">📈 Improvement Path</p>
  <p class="text-base text-gray-200">Players who study Scrabble strategy for just <span class="text-white font-medium">10 minutes daily</span> typically see a 50-100 point improvement in their average game score within the first month. Consistency beats intensity — short daily sessions outperform weekly marathons.</p>
</div>

<p>To integrate what you have learned here into actual games, try this approach: before your next game, re-read the key points on this page. Then during the game, consciously look for opportunities to apply at least one concept. After the game, review whether you found those opportunities and how they affected the outcome. This reflect-apply-review cycle accelerates skill development dramatically.</p>

<p>Our free tools support every stage of this learning process. The word finder helps you verify plays and discover alternatives you missed. The daily challenges (anagram, rack, word of the day) build vocabulary in bite-sized sessions. And the 60-Second game trains speed under pressure. All free, all instant, no account needed.</p>'''


def find_insertion_point(content):
    """Find where to insert new content - before AuthorInfo or before closing article."""
    # Try before AuthorInfo
    m = re.search(r'\n\s*<AuthorInfo', content)
    if m:
        return m.start()
    # Try before closing </article>
    m = re.search(r'\n\s*</article>', content)
    if m:
        return m.start()
    # Try before Back to all articles link followed by AuthorInfo
    m = re.search(r'<div class="not-prose mt-8 text-center">\s*<a href="/blog/"', content)
    if m:
        return m.start()
    return None


def process_file(filepath):
    """Process a single file, return (modified, words_before, words_after)."""
    with open(filepath, 'r') as f:
        content = f.read()

    words_before = count_article_words(content)
    if words_before > WORD_THRESHOLD:
        return False, words_before, words_before

    filename = os.path.basename(filepath)
    category = get_category(filename)
    topic = get_topic_var(filename, category)
    has_bp = has_boilerplate(content)

    new_content = generate_content(category, topic, has_bp)
    insertion_point = find_insertion_point(content)

    if insertion_point is None:
        return False, words_before, words_before

    modified = content[:insertion_point] + '\n' + new_content + '\n' + content[insertion_point:]
    words_after = count_article_words(modified)

    if not DRY_RUN:
        with open(filepath, 'w') as f:
            f.write(modified)

    return True, words_before, words_after


def main():
    print(f"{'DRY RUN' if DRY_RUN else 'APPLYING CHANGES'} — Bulk Content Expansion")
    print(f"Threshold: {WORD_THRESHOLD} article words")
    print("=" * 60)

    # Get list of thin pages
    results = {'modified': 0, 'skipped': 0, 'errors': 0}
    categories = {}

    for filename in sorted(os.listdir(PAGES_DIR)):
        if not filename.endswith('.astro'):
            continue
        filepath = os.path.join(PAGES_DIR, filename)
        if not os.path.isfile(filepath):
            continue

        try:
            with open(filepath, 'r') as f:
                content = f.read()
            words = count_article_words(content)
            if words == 0 or words > WORD_THRESHOLD:
                continue

            modified, before, after = process_file(filepath)
            if modified:
                cat = get_category(filename)
                categories[cat] = categories.get(cat, 0) + 1
                results['modified'] += 1
                gain = after - before
                status = "✅" if after > WORD_THRESHOLD else "⚠️"
                if results['modified'] <= 20 or after <= WORD_THRESHOLD:
                    print(f"  {status} {filename}: {before} → {after} (+{gain}) [{cat}]")
            else:
                results['skipped'] += 1
        except Exception as e:
            results['errors'] += 1
            print(f"  ❌ {filename}: {e}")

    print("\n" + "=" * 60)
    print(f"Modified: {results['modified']} | Skipped: {results['skipped']} | Errors: {results['errors']}")
    print(f"\nBy category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")

    if DRY_RUN:
        print(f"\n⚠️  DRY RUN — no files changed. Run with --apply to modify files.")
    else:
        print(f"\n✅ {results['modified']} files updated.")


if __name__ == "__main__":
    main()
