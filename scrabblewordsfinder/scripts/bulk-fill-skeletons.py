#!/usr/bin/env python3
"""
Bulk Fill Skeleton Blog Posts with Real Content
Loads SOWPODS dictionary, finds matching words, scores them,
and generates full HTML content for each skeleton blog post.
"""

import os
import sys
import json
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BLOG_DIR = os.path.join(PROJECT_ROOT, 'src', 'pages', 'blog')
DATA_DIR = os.path.join(PROJECT_ROOT, 'public', 'data')

# Scrabble letter values
LETTER_VALUES = {
    'A':1,'B':3,'C':3,'D':2,'E':1,'F':4,'G':2,'H':4,'I':1,'J':8,
    'K':5,'L':1,'M':3,'N':1,'O':1,'P':3,'Q':10,'R':1,'S':1,'T':1,
    'U':1,'V':4,'W':4,'X':8,'Y':4,'Z':10
}


def word_score(word):
    """Calculate Scrabble score for a word."""
    return sum(LETTER_VALUES.get(c, 0) for c in word.upper())


def load_dictionary():
    """Load all SOWPODS words."""
    with open(os.path.join(DATA_DIR, 'sowpods-2-7.json')) as f:
        short = json.load(f)
    with open(os.path.join(DATA_DIR, 'sowpods-8-15.json')) as f:
        long = json.load(f)
    return [w.upper() for w in short + long]


ALL_WORDS = None

def get_words():
    global ALL_WORDS
    if ALL_WORDS is None:
        ALL_WORDS = load_dictionary()
    return ALL_WORDS


def find_words_containing(pattern):
    """Find words containing a letter pattern."""
    pattern_upper = pattern.upper()
    return [w for w in get_words() if pattern_upper in w]


def find_words_starting_with(prefix):
    """Find words starting with a prefix."""
    prefix_upper = prefix.upper()
    return [w for w in get_words() if w.startswith(prefix_upper)]


def find_words_ending_with(suffix):
    """Find words ending with a suffix."""
    suffix_upper = suffix.upper()
    return [w for w in get_words() if w.endswith(suffix_upper)]


def find_words_with_double(letter):
    """Find words containing double letter."""
    double = (letter * 2).upper()
    return [w for w in get_words() if double in w]


def get_top_words(words, n=15):
    """Get top N words by score, preferring shorter common words."""
    scored = [(w, word_score(w), len(w)) for w in words]
    scored.sort(key=lambda x: (-x[1], x[2]))
    return scored[:n]


def get_length_distribution(words):
    """Get count of words by length."""
    dist = {}
    for w in words:
        l = len(w)
        dist[l] = dist.get(l, 0) + 1
    return dict(sorted(dist.items()))


def generate_table_html(top_words):
    """Generate the scoring table HTML."""
    rows = []
    for i, (word, score, length) in enumerate(top_words, 1):
        bg = 'bg-gray-900' if i % 2 == 1 else 'bg-gray-800/50'
        rows.append(
            f'            <tr class="{bg}">'
            f'<td class="px-4 py-3 text-gray-400">{i}</td>'
            f'<td class="px-4 py-3 text-white font-medium">{word}</td>'
            f'<td class="px-4 py-3 text-blue-400">{score}</td>'
            f'<td class="px-4 py-3 text-gray-400">{length}</td></tr>'
        )
    return '\n'.join(rows)


def generate_stat_strip(total_count, top_score, avg_len, bingo_count):
    """Generate a stat strip visual block."""
    return f'''      <div class="not-prose my-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
        <div class="flex flex-wrap items-center justify-center gap-6 text-center">
          <div><p class="text-xl font-bold text-amber-400">{total_count:,}</p><p class="text-xs text-gray-400">Total Words</p></div>
          <div><p class="text-xl font-bold text-amber-400">{top_score}</p><p class="text-xs text-gray-400">Top Score</p></div>
          <div><p class="text-xl font-bold text-amber-400">{avg_len:.1f}</p><p class="text-xs text-gray-400">Avg Length</p></div>
          <div><p class="text-xl font-bold text-amber-400">{bingo_count}</p><p class="text-xs text-gray-400">Bingos (7+ letters)</p></div>
        </div>
      </div>'''


def generate_strategy_tips(pattern_type, pattern):
    """Generate strategy tips based on pattern type."""
    tips = {
        'containing': [
            f'<strong>Spot the pattern:</strong> When you see {pattern.upper()} on your rack, immediately think of common words. The faster you recognise these combinations, the less time you spend searching.',
            f'<strong>Premium square targeting:</strong> Place the highest-value letter in your {pattern.upper()} word on a DLS or TLS for maximum impact. Even a 1-point letter on a TLS adds 2 bonus points.',
            f'<strong>Hook potential:</strong> Many {pattern.upper()} words can be extended with S, ED, ING, or ER. Look for these extensions to score on two words simultaneously.',
            f'<strong>Rack balance:</strong> After playing a {pattern.upper()} word, assess your remaining tiles. Aim to keep a mix of vowels and consonants for your next turn.',
        ],
        'ending': [
            f'<strong>Back-hooking:</strong> Words ending in -{pattern.upper()} are perfect for extending existing board words. If a word on the board ends where you can attach -{pattern.upper()}, you score for both.',
            f'<strong>Suffix awareness:</strong> Recognise -{pattern.upper()} as a common English suffix. This helps you spot plays faster when tiles on your rack form this ending.',
            f'<strong>Bingo hunting:</strong> Many 7-letter bingos end in -{pattern.upper()}. When you have these letters plus a balanced rack, look for the 50-point bonus play.',
            f'<strong>Defensive play:</strong> Be aware that your opponent can also extend words with -{pattern.upper()}. Block premium squares that enable high-scoring extensions.',
        ],
        'starting': [
            f'<strong>Front-hooking:</strong> Words starting with {pattern.upper()}- can be placed before existing board words. If a word starts where you can prepend {pattern.upper()}-, score for the combined word.',
            f'<strong>Opening plays:</strong> {pattern.upper()}- words work well as opening moves because they provide multiple hook points for subsequent turns.',
            f'<strong>Rack reading:</strong> When you spot {pattern.upper()} at the start of your rack, immediately search your memory for high-scoring words with this prefix.',
            f'<strong>Length variety:</strong> Know both short {pattern.upper()}- words (for tight board positions) and long ones (for open boards where bingos are possible).',
        ],
    }
    selected = tips.get(pattern_type, tips['containing'])
    html_tips = []
    for tip in selected:
        html_tips.append(
            f'        <li class="flex items-start gap-2 text-sm text-gray-300">'
            f'<span class="text-blue-500 mt-0.5 shrink-0">▶</span>'
            f'<span>{tip}</span></li>'
        )
    return '\n'.join(html_tips)


def generate_short_words_section(words, pattern):
    """Generate a section showing useful short words (2-5 letters)."""
    short = [(w, word_score(w)) for w in words if len(w) <= 5]
    short.sort(key=lambda x: -x[1])
    short = short[:12]
    if not short:
        return ''
    
    pills = []
    for w, s in short:
        pills.append(
            f'        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg '
            f'bg-gray-800 border border-gray-700 text-sm">'
            f'<span class="text-white font-bold">{w}</span>'
            f'<span class="text-blue-400 text-xs">{s}pts</span></span>'
        )
    return f'''      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Quick-Play Short Words (2-5 Letters)</h2>
      <p>These short words are essential for tight board positions, parallel plays, and using up awkward tile combinations quickly.</p>
      <div class="not-prose my-6 flex flex-wrap items-center justify-center gap-3">
{chr(10).join(pills)}
      </div>'''


def generate_bingo_section(words):
    """Generate a section about 7+ letter bingo words."""
    bingos = [(w, word_score(w)) for w in words if len(w) >= 7]
    bingos.sort(key=lambda x: -x[1])
    bingos = bingos[:8]
    if not bingos:
        return ''
    
    cards = []
    for w, s in bingos:
        cards.append(
            f'        <div class="p-4 rounded-xl border border-green-500/30 bg-green-950/10">'
            f'<p class="text-green-400 font-semibold text-sm mb-1">{w}</p>'
            f'<p class="text-xs text-gray-400">{s} + 50 bonus = {s+50} points</p></div>'
        )
    cols = 'grid-cols-1 sm:grid-cols-2' if len(cards) >= 4 else 'grid-cols-1 sm:grid-cols-2'
    return f'''      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Bingo Words (7+ Letters, +50 Bonus)</h2>
      <p>These words use all 7 tiles from your rack, earning the 50-point bingo bonus on top of the word's base score.</p>
      <div class="not-prose my-6 grid {cols} gap-4">
{chr(10).join(cards)}
      </div>'''


def classify_skeleton(slug):
    """Classify a skeleton slug into its pattern type and extract the pattern."""
    # words-containing-double-X
    m = re.match(r'words-containing-double-([a-z])$', slug)
    if m:
        return 'double', m.group(1)
    
    # words-containing-XX (digraphs like ch, th, sh, etc.)
    m = re.match(r'words-containing-([a-z]{2,3})$', slug)
    if m:
        return 'containing', m.group(1)
    
    # words-ending-with-SUFFIX
    m = re.match(r'words-ending-with-([a-z]+)$', slug)
    if m:
        return 'ending', m.group(1)
    
    # words-starting-with-PREFIX
    m = re.match(r'words-starting-with-([a-z]+)$', slug)
    if m:
        return 'starting', m.group(1)
    
    # words-only-in-X
    m = re.match(r'words-only-in-([a-z]+)$', slug)
    if m:
        return 'topic', slug
    
    # words-with-X / words-using-X
    m = re.match(r'words-(with|using)-', slug)
    if m:
        return 'topic', slug
    
    # Everything else is a topic post
    return 'topic', slug


def find_matching_words(pattern_type, pattern):
    """Find matching words based on pattern type."""
    if pattern_type == 'double':
        return find_words_with_double(pattern)
    elif pattern_type == 'containing':
        return find_words_containing(pattern)
    elif pattern_type == 'ending':
        return find_words_ending_with(pattern)
    elif pattern_type == 'starting':
        return find_words_starting_with(pattern)
    return []


def generate_letter_guide_content(slug, pattern_type, pattern, title):
    """Generate full content for a letter-pattern blog post."""
    words = find_matching_words(pattern_type, pattern)
    if not words:
        return None
    
    top_words = get_top_words(words, 15)
    total_count = len(words)
    top_score = top_words[0][1] if top_words else 0
    avg_len = sum(len(w) for w in words) / len(words) if words else 0
    bingo_count = sum(1 for w in words if len(w) >= 7)
    
    # Map pattern_type for strategy tips
    strategy_type = 'containing'
    if pattern_type == 'ending':
        strategy_type = 'ending'
    elif pattern_type == 'starting':
        strategy_type = 'starting'
    
    pattern_display = pattern.upper()
    if pattern_type == 'double':
        pattern_display = f'Double {pattern.upper()}'
    
    # Build content sections
    stat_strip = generate_stat_strip(total_count, top_score, avg_len, bingo_count)
    table_rows = generate_table_html(top_words)
    strategy_tips = generate_strategy_tips(strategy_type, pattern)
    short_words_section = generate_short_words_section(words, pattern)
    bingo_section = generate_bingo_section(words)
    
    # Lead paragraph
    if pattern_type == 'double':
        lead = f'Words with double {pattern.upper()} offer unique scoring opportunities in Scrabble. The repeated letter creates distinctive word patterns that experienced players learn to recognise instantly. From short tactical plays to full bingos, mastering double-{pattern.upper()} words gives you an edge when these tiles appear on your rack.'
    elif pattern_type == 'containing':
        lead = f'The letter combination {pattern_display} appears in hundreds of valid Scrabble words, from short tactical plays to high-scoring bingos. Recognising {pattern_display} patterns on your rack helps you find plays faster and score higher. This guide covers the top-scoring {pattern_display} words with strategy tips for competitive play.'
    elif pattern_type == 'ending':
        lead = f'Words ending in -{pattern_display} are among the most useful patterns in Scrabble. This suffix enables back-hooking (extending existing board words), helps with rack management, and opens up bingo opportunities. Master these words to score consistently and control the board.'
    elif pattern_type == 'starting':
        lead = f'Words starting with {pattern_display}- give you powerful opening options and front-hooking opportunities in Scrabble. Whether you need a short tactical play or a full 7-letter bingo, {pattern_display}- words deliver consistent scoring across all game phases.'
    else:
        lead = f'This guide covers the most useful Scrabble words matching this pattern, ranked by score with strategy tips for competitive play.'
    
    content = f'''
      <p class="text-lg leading-relaxed text-gray-300 mb-8">{lead}</p>

{stat_strip}

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Top 15 Highest-Scoring Words</h2>
      <p>These are the most valuable words matching this pattern, ranked by base Scrabble score. Place these on premium squares for devastating point totals.</p>

      <div class="overflow-x-auto not-prose my-6">
        <table class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden shadow-sm">
          <thead class="bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-300">#</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-300">Word</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-300">Points</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-300">Length</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
{table_rows}
          </tbody>
        </table>
      </div>

{short_words_section}

{bingo_section}

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Strategy Tips</h2>
      <p>Apply these tactics when you spot this pattern on your rack or on the board:</p>
      <ul class="not-prose space-y-2 my-4">
{strategy_tips}
      </ul>

      <div class="not-prose my-6 p-5 rounded-xl border border-blue-500/30 bg-blue-950/20">
        <p class="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">💡 Key Insight</p>
        <p class="text-base text-gray-200">With <span class="text-white font-medium">{total_count:,} valid words</span> matching this pattern and <span class="text-white font-medium">{bingo_count} potential bingos</span>, learning even the top 10-15 words gives you a significant advantage over opponents who haven\'t studied this pattern.</p>
      </div>'''
    
    return content


# Topic-specific content for non-letter-pattern posts
TOPIC_CONTENT = {
    'ai-scrabble-opponents': {
        'lead': 'AI opponents have transformed how we practice Scrabble. From basic computer players that make random valid moves to sophisticated engines that calculate optimal plays every turn, digital opponents offer unlimited practice at every skill level. Understanding how AI Scrabble works helps you train more effectively and improve faster.',
        'sections': [
            ('How AI Scrabble Engines Work', 'Modern Scrabble AI uses three core components: a complete dictionary lookup (checking all valid words), a move generator (finding every possible play on the current board), and an evaluation function (scoring each move considering both immediate points and rack leave quality). The best engines like Quackle also consider future turn equity — how your remaining tiles position you for subsequent plays.'),
            ('Skill Levels in AI Opponents', 'Most Scrabble apps offer adjustable difficulty. Easy AI makes suboptimal choices deliberately — playing shorter words, ignoring premium squares, or keeping poor rack leaves. Medium AI plays the highest-scoring move it can find but doesn\'t consider strategy. Expert AI calculates rack leave, tracks tiles, and makes positional plays — mimicking tournament-level human players.'),
            ('Training Effectively Against AI', 'The best training approach uses AI at a level slightly above your current skill. If you win every game, increase difficulty. If you lose badly, step back. After each game, use the analysis feature to see what plays you missed. Focus on positions where the AI found plays you didn\'t — these reveal gaps in your word knowledge.'),
        ]
    },
    'archaic-words-still-valid': {
        'lead': 'Scrabble dictionaries preserve hundreds of archaic English words that have fallen out of everyday use but remain perfectly legal plays. These forgotten gems — from medieval terms to obsolete scientific vocabulary — can score big points because opponents rarely challenge words they don\'t recognise. Knowing archaic vocabulary gives you access to unique letter combinations unavailable in modern English.',
        'sections': [
            ('Why Archaic Words Survive in Scrabble', 'The SOWPODS and TWL dictionaries include words from all periods of English usage. Once a word enters the official word list, it stays unless specifically removed during a revision cycle. This preserves medieval, Shakespearean, and Victorian-era vocabulary that modern dictionaries might mark as obsolete. For Scrabble players, this is an advantage — these words often use unusual letter combinations.'),
            ('High-Scoring Archaic Words to Learn', 'QUIXOTIC (26 pts) meaning "exceedingly idealistic" comes from Don Quixote. ZEPHYR (23 pts) is an archaic term for a westerly wind. FYTTE (11 pts) is an old word for a section of a poem. WYVERN (15 pts) means a two-legged dragon. SENNIGHT (11 pts) means a week (seven nights). These words use high-value tiles in common positions.'),
            ('Strategy for Playing Obscure Words', 'The challenge rule is your protection. In tournament Scrabble, if you play an obscure word and your opponent challenges incorrectly, they lose their turn. Play archaic words confidently — hesitation invites challenges. Only play obscure words when the point gain justifies the risk. A 30-point archaic word is worth the bluff; an 8-point one probably isn\'t.'),
        ]
    },
    'celebrity-scrabble-players': {
        'lead': 'Scrabble attracts enthusiasts from all walks of life, including some surprising celebrity fans. From award-winning actors to musicians and politicians, many famous figures are devoted Scrabble players. Their passion for the game highlights its universal appeal as both entertainment and intellectual challenge.',
        'sections': [
            ('Famous Scrabble Enthusiasts', 'Keanu Reeves is a known Scrabble fan who plays between film takes. Sting reportedly plays competitive Scrabble on tour. Former US President Richard Nixon was an avid player. Mel Gibson has spoken about family Scrabble nights. Queen Elizabeth II was reportedly fond of word games. These celebrities enjoy the same strategic depth that attracts millions of everyday players.'),
            ('Why Creative People Love Scrabble', 'Writers, musicians, and actors work with language professionally, making Scrabble a natural extension of their skills. The game rewards vocabulary breadth, pattern recognition, and creative thinking — all qualities that serve creative professionals. It\'s also a screen-free activity that exercises the mind differently from their day jobs.'),
            ('Celebrity Scrabble Tournaments', 'Several charity tournaments have attracted celebrity players. The National Scrabble Championship has drawn media attention when well-known figures participate. These events help popularise competitive Scrabble and introduce new audiences to tournament-level play. Celebrity endorsement has also boosted sales of Scrabble sets and apps.'),
        ]
    },
    'common-illegal-words-scrabble': {
        'lead': 'Every Scrabble player has confidently placed a word only to face a successful challenge. Some words that seem perfectly valid are not in the official dictionary — proper nouns, abbreviations, and recent slang are common traps. Learning which common words are illegal saves you from losing turns and helps you challenge opponents effectively.',
        'sections': [
            ('Proper Nouns and Brand Names', 'GOOGLE, UBER, XEROX, and JACUZZI (the brand — though JACUZZI the word is valid in some dictionaries) are never allowed. Country names (FRANCE, CHINA), city names (LONDON), and people\'s names (SHAKESPEARE) are always illegal. The rule is absolute: if it requires a capital letter in standard usage, it\'s not valid in Scrabble.'),
            ('Abbreviations and Acronyms', 'LOL, OMG, WIFI, DNA, and GPS are all illegal. Abbreviations like DR, MR, and ST are not valid. However, some words that originated as abbreviations have become standalone words: RADAR, LASER, and SCUBA are all valid because they\'ve entered common usage as lowercase words in their own right.'),
            ('Slang That Hasn\'t Made the Dictionary', 'New slang takes years to enter official Scrabble dictionaries. Words must demonstrate sustained, widespread usage before inclusion. YEET, SLAY (in its modern slang sense), BUSSIN, and most internet slang are not yet valid. However, dictionaries do update — ZEN, EMOJI, and TWERK were all added in recent revisions.'),
        ]
    },
    'controversial-scrabble-words': {
        'lead': 'The Scrabble dictionary has always contained words that spark debate. From offensive slurs to obscure technical terms that no one has heard of, the question of what belongs in the official word list is contentious. Recent years have seen significant removals and additions that reflect changing social norms and linguistic evolution.',
        'sections': [
            ('The Great Purge of Offensive Words', 'In 2020, Hasbro removed over 200 offensive slurs from the official tournament word list. This followed years of debate within the competitive community about whether allowing slurs in a family game was appropriate. Players who had memorised these words for competitive advantage had to adapt, while others celebrated the change as long overdue.'),
            ('Words Nobody Knows Are Valid', 'QI (a Chinese concept of life force, 11 pts) shocked many players when it was added. ZA (slang for pizza, 11 pts) is controversial because it feels too informal. KWELA (a type of music, 12 pts) and ZOEAE (plural of zoea, a larval stage, 14 pts) are valid but unknown to most English speakers. These obscure entries make purists uncomfortable.'),
            ('The Debate Over Dictionary Authority', 'Who decides what\'s a valid Scrabble word? In North America, NASPA manages the TWL/NWL list. Internationally, Collins manages SOWPODS. These bodies add and remove words periodically, creating situations where a word is valid in one dictionary but not the other. Tournament players must know which dictionary their competition uses.'),
        ]
    },
    'famous-scrabble-controversies': {
        'lead': 'Competitive Scrabble has seen its share of scandals, disputes, and dramatic moments. From accusations of cheating to controversial rule changes and disputed championship results, the game\'s competitive scene is more heated than outsiders might expect. These controversies have shaped modern tournament rules and player behaviour.',
        'sections': [
            ('The Blank Tile Scandal', 'Multiple tournaments have dealt with players accused of palming blank tiles — slipping them from a previous game into the current tile bag. Because blanks are the most powerful tiles in Scrabble (they can represent any letter), having an extra one provides enormous advantage. Modern tournaments now count tiles before and after games to prevent this.'),
            ('Clock Disputes and Time Pressure', 'Time management is critical in tournament Scrabble (typically 25 minutes per player per game). Disputes arise when players allege opponents deliberately play slowly to pressure them, or when clock malfunctions affect game outcomes. The introduction of digital clocks with move-by-move recording has reduced but not eliminated these issues.'),
            ('Dictionary Challenges Gone Wrong', 'The challenge rule — where an incorrect challenge costs a turn — has created dramatic moments. Players have bluffed fake words successfully, while others have challenged valid obscure words and lost crucial turns. The 2015 World Championship saw a game decided by a challenge on BRAVURE (valid) that cost the challenger the match.'),
        ]
    },
}


def generate_topic_content(slug, title):
    """Generate content for topic posts (not letter-pattern)."""
    topic = TOPIC_CONTENT.get(slug)
    
    if topic:
        lead = topic['lead']
        sections_html = []
        for heading, body in topic['sections']:
            sections_html.append(
                f'      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">{heading}</h2>\n'
                f'      <p>{body}</p>'
            )
        return f'''
      <p class="text-lg leading-relaxed text-gray-300 mb-8">{lead}</p>

{chr(10).join(sections_html)}

      <div class="not-prose my-6 p-5 rounded-xl border border-purple-500/30 bg-purple-950/20">
        <p class="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">🎯 Key Takeaway</p>
        <p class="text-base text-gray-200">Understanding the broader context of Scrabble — its culture, controversies, and community — makes you a more complete player and enriches your enjoyment of the game.</p>
      </div>'''
    
    # Generic topic content for posts without specific TOPIC_CONTENT
    clean_title = title.replace(' — ScrabbleWordsFinder', '').replace(' — Scrabble Blog', '')
    lead = f'This comprehensive guide covers everything you need to know about {clean_title.lower()}. Whether you\'re a casual player or aspiring tournament competitor, understanding this aspect of Scrabble deepens your appreciation of the game and may give you a competitive edge.'
    
    return f'''
      <p class="text-lg leading-relaxed text-gray-300 mb-8">{lead}</p>

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Understanding the Fundamentals</h2>
      <p>Scrabble combines vocabulary knowledge, strategic thinking, and probability assessment into a uniquely challenging board game. Every aspect of the game — from tile distribution to board geometry — rewards players who invest time in understanding the underlying systems. This topic is one piece of that larger strategic puzzle.</p>

      <div class="not-prose my-6 p-5 rounded-xl border border-blue-500/30 bg-blue-950/20">
        <p class="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">💡 Why This Matters</p>
        <p class="text-base text-gray-200">Players who understand the <span class="text-white font-medium">full context</span> of Scrabble — not just individual word knowledge — consistently outperform those who rely on vocabulary alone. Strategy, psychology, and game theory all play a role.</p>
      </div>

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Practical Applications</h2>
      <p>Knowledge becomes powerful when applied at the board. The concepts covered in this guide translate directly into better decision-making during games. Focus on one new concept per game session rather than trying to implement everything at once — incremental improvement compounds over time into significant skill gains.</p>

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Taking Your Game Further</h2>
      <p>The best Scrabble players never stop learning. Tournament champions study for hours daily, analyse past games, and continuously expand their word knowledge. Even if you play casually, dedicating 10 minutes per day to learning new words or studying a strategic concept will noticeably improve your results within weeks.</p>

      <div class="not-prose my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl border border-green-500/30 bg-green-950/10">
          <p class="text-green-400 font-semibold text-sm mb-1">✓ Do This</p>
          <p class="text-xs text-gray-400">Study one new concept per session. Apply it in your next game. Review the result.</p>
        </div>
        <div class="p-4 rounded-xl border border-red-500/30 bg-red-950/10">
          <p class="text-red-400 font-semibold text-sm mb-1">✗ Avoid This</p>
          <p class="text-xs text-gray-400">Trying to memorise everything at once. Information overload leads to paralysis during actual play.</p>
        </div>
      </div>'''


def inject_content_into_file(filepath, new_content):
    """Replace the skeleton content with rich content while preserving structure."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find the lead paragraph (the first <p> after article meta)
    # and replace everything between it and the Related Articles / CTA section
    
    # Strategy: find the insertion zone
    # Start: after the article meta div (the date/read time bar)
    # End: before Related Articles, CTA, or "Back to all articles"
    
    # Find start of content zone (after the last </div> of the meta section)
    meta_end = re.search(
        r'(<div class="not-prose mb-8 flex items-center.*?</div>)\s*\n',
        content, re.DOTALL
    )
    
    if not meta_end:
        # Try alternate: after h1
        meta_end = re.search(r'(</h1>)\s*\n', content)
    
    if not meta_end:
        return False
    
    start_pos = meta_end.end()
    
    # Find end of content zone (before Related Articles, CTA, or back link)
    end_markers = [
        r'\s*<!-- Related Articles -->',
        r'\s*<aside class="border-t',
        r'\s*<div class="not-prose mt-10 p-5 bg-gradient-to-r',
        r'\s*<div class="not-prose mt-8 text-center">',
    ]
    
    end_pos = None
    for marker in end_markers:
        m = re.search(marker, content[start_pos:])
        if m:
            candidate = start_pos + m.start()
            if end_pos is None or candidate < end_pos:
                end_pos = candidate
    
    if end_pos is None:
        # Last resort: before </article>
        m = re.search(r'\s*</article>', content[start_pos:])
        if m:
            end_pos = start_pos + m.start()
        else:
            return False
    
    # Replace the content zone
    new_file = content[:start_pos] + '\n' + new_content + '\n\n' + content[end_pos:]
    
    with open(filepath, 'w') as f:
        f.write(new_file)
    
    return True


def get_skeleton_files():
    """Get all skeleton blog files (< 100 lines)."""
    skeletons = []
    for f in sorted(os.listdir(BLOG_DIR)):
        if not f.endswith('.astro') or f == 'index.astro':
            continue
        filepath = os.path.join(BLOG_DIR, f)
        with open(filepath, 'r') as fh:
            line_count = sum(1 for _ in fh)
        if line_count < 100:
            skeletons.append(f)
    return skeletons


def main():
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("═══ DRY RUN MODE ═══\n")
    else:
        print("═══ LIVE MODE ═══\n")
    
    skeletons = get_skeleton_files()
    print(f"Found {len(skeletons)} skeleton files\n")
    
    # Load dictionary once
    print("Loading SOWPODS dictionary...")
    get_words()
    print(f"  Loaded {len(ALL_WORDS):,} words\n")
    
    filled = 0
    skipped = 0
    errors = []
    
    for filename in skeletons:
        slug = filename.replace('.astro', '')
        filepath = os.path.join(BLOG_DIR, filename)
        
        pattern_type, pattern = classify_skeleton(slug)
        
        # Extract title from file
        with open(filepath, 'r') as f:
            file_content = f.read()
        title_match = re.search(r'title="([^"]+)"', file_content)
        title = title_match.group(1) if title_match else slug
        
        # Generate content
        if pattern_type in ('containing', 'ending', 'starting', 'double'):
            content = generate_letter_guide_content(slug, pattern_type, pattern, title)
        else:
            content = generate_topic_content(slug, title)
        
        if content is None:
            print(f"  SKIP (no words found): {filename}")
            skipped += 1
            continue
        
        if dry_run:
            filled += 1
            if filled <= 3:
                print(f"  WOULD FILL: {filename} ({pattern_type}: {pattern})")
            continue
        
        # Inject content
        success = inject_content_into_file(filepath, content)
        if success:
            filled += 1
            if filled <= 5:
                print(f"  ✓ {filename} ({pattern_type}: {pattern})")
        else:
            errors.append(filename)
            print(f"  ✗ FAILED: {filename}")
    
    print(f"\n═══ SUMMARY ═══")
    print(f"  Filled: {filled}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {len(errors)}")
    if errors:
        print(f"  Failed files: {', '.join(errors[:10])}")
    
    if dry_run:
        print("\n  Run without --dry-run to apply changes.")


if __name__ == '__main__':
    main()
