# Blog Update Sprint — Feature Rollout Plan

Plan for updating all remaining ~1000 blogs with SEO, E-E-A-T, and quality features.

## Features to Add (in order)

| # | Feature | Scope | Method | Effort |
|---|---------|-------|--------|--------|
| 1 | **AuthorInfo component** | All 1000+ blogs | Script-based (insert import + `<AuthorInfo />` before `</article>`) | 1h |
| 2 | **dateModified update** | All 1000+ blogs | Script-based (stagger dates across Jun 5 - Jul 8 in varied batches) | 30min |
| 3 | **Author → Person schema** | Any blogs still using `"@type": "Organization"` in Article schema | Script find/replace | 30min |
| 4 | **BlogCrossLinks** | Any blogs missing the component | Script check + add | 30min |
| 5 | **6 icon links** (Solver, Quiz, Anagram, Rack, WOTD, 60s) | Any blogs missing them | Script check + add | 30min |
| 6 | **Citations** | 92 blogs discussing rules/gameplay | Manual per-blog (add citation block) | 4-6h |

## Citations — Priority List (92 blogs)

### Tier 1: Rules & Official Gameplay (must-cite)
- scrabble-rules-explained
- how-blank-tiles-work
- scrabble-board-game-rules
- tournament-rules-explained
- how-to-challenge-in-scrabble
- how-to-use-blank-tiles-strategically
- scrabble-etiquette

### Tier 2: Dictionaries & Word Validity (cite dictionary source)
- collins-official-dictionary
- sowpods-dictionary
- twl-naspa-dictionary
- official-scrabble-dictionary-guide
- how-scrabble-dictionaries-update
- sowpods-vs-twl-which-to-use
- words-only-in-sowpods
- words-only-in-twl
- words-removed-from-scrabble
- new-words-added-2026
- newly-added-scrabble-words
- controversial-scrabble-words

### Tier 3: Tournament & Competitive (cite NASPA/WESPA)
- competitive-scrabble-tournament-world
- how-scrabble-tournaments-work
- scrabble-complete-guide-to-tournaments
- scrabble-rating-system-explained
- scrabble-ratings-explained
- world-scrabble-championships
- highest-tournament-scores
- scrabble-tournament-calendar-2026
- becoming-a-tournament-player
- online-vs-tournament-scrabble
- scrabble-club-guide-beginners
- scrabble-crossword-game-notation-explained
- famous-scrabble-matches
- greatest-scrabble-players

### Tier 4: History & Culture (cite historical sources)
- scrabble-history-origins-great-depression
- scrabble-complete-history-from-depression-to-championships
- history-of-scrabble
- famous-scrabble-controversies
- celebrity-scrabble-players
- scrabble-around-the-world
- cognitive-benefits-of-scrabble

### Tier 5: Gameplay Strategy (cite where rules are referenced)
- average-game-length
- average-winning-score
- maximum-possible-scrabble-score
- scrabble-highest-possible-score
- oxyphenbutazone-highest-scoring-word
- scrabble-by-the-numbers
- counting-tiles-strategy
- endgame-strategy
- scrabble-time-pressure-tips
- coming-from-behind-scrabble
- dealing-with-bad-tiles

### Tier 6: Word Validity Pages (cite dictionary)
- is-qi-a-scrabble-word (and all 60+ "is-X-a-scrabble-word" pages)
- all-2-letter-scrabble-words
- best-two-letter-words-scrabble
- medical-terms-valid-scrabble
- common-illegal-words-scrabble

## Citation Format

Add a citation block at the bottom of relevant articles (before AuthorInfo):

```html
<div class="not-prose mt-8 p-4 rounded-xl border border-gray-700 bg-gray-800/30">
  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">📚 Sources & References</p>
  <ul class="space-y-1 text-xs text-gray-400">
    <li>• Official Scrabble Players Dictionary (OSPD6), Hasbro Inc.</li>
    <li>• Collins Scrabble Words (CSW), HarperCollins Publishers</li>
    <li>• NASPA Tournament Rules (2024 Edition)</li>
    <li>• WESPA Rules Committee Guidelines</li>
  </ul>
</div>
```

Tailor sources per article — not all articles need all sources.

## Authoritative Sources to Cite

| Source | URL | Use For |
|--------|-----|---------|
| NASPA | https://www.scrabbleplayers.org/ | Tournament rules, ratings, North American play |
| WESPA | https://www.wespa.org/ | International tournament rules, world championships |
| Collins Dictionary | https://www.collinsdictionary.com/scrabble | SOWPODS word validity |
| Hasbro | https://scrabble.hasbro.com/ | Official rules, game ownership |
| Mattel | (Mattel owns Scrabble outside North America) | International rights |

## Execution Order

1. Run script for features 1-5 (AuthorInfo, dateModified, Person schema, CrossLinks, icon links)
2. Manual citation pass on Tier 1-2 blogs (20 blogs, highest E-E-A-T impact)
3. Manual citation pass on Tier 3-4 (21 blogs)
4. Script-based citation for Tier 5-6 (generic citation block for gameplay/validity pages)

## Trigger

Say "Blog Sprint" or "Update All Blogs" to begin execution.

## Agent Attribution

This is a **kiro** steering document, created July 12, 2026.
