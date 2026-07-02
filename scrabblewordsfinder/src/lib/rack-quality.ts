/**
 * Rack Quality Scoring — EV Engine for Scrabble Racks
 *
 * Assigns a quality score (0-100) to any 2-7 tile rack based on:
 * - Vowel/consonant balance (ideal: 2-3 vowels in a 7-tile rack)
 * - Power tile presence (S, blank, high-value J/Q/X/Z)
 * - Bingo stem overlap (SATIRE, RETINA, etc.)
 * - Duplicate tile penalty
 * - Synergy bonuses (common letter combos like -ING, -TION, -ED)
 * - Rack leave comparison after candidate plays
 * - Historical percentile via sampling
 */

/** Scrabble letter point values */
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5,
  L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4,
  W: 4, X: 8, Y: 4, Z: 10,
};

/** Standard Scrabble tile bag distribution (100 tiles) */
const TILE_BAG = 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ??';

/** Top bingo stems (6-letter combos that form many 7-letter words) */
const BINGO_STEMS = [
  'SATIRE', 'RETINA', 'RETAIN', 'TISANE', 'SALINE', 'SENIOR',
  'TENORS', 'ARISEN', 'ORNATE', 'RETSINA', 'NASTIER', 'ANTSIER',
  'AEINST', 'AEINRS', 'AEILNR', 'AEINRT', 'AEIRST', 'EINRST',
  'ADEINR', 'AELRST', 'EINORS', 'AELINS',
];

/** Letter frequencies considered "good" to have (flexible, common in many words) */
const FLEXIBLE_CONSONANTS = new Set(['R', 'S', 'T', 'N', 'L', 'D']);
const FLEXIBLE_VOWELS = new Set(['E', 'A', 'I']);

/** Common synergy patterns that appear in many valid words */
const SYNERGY_PATTERNS = [
  'ING', 'TION', 'ED', 'ER', 'EST', 'LY', 'RE', 'UN', 'IN',
  'TH', 'ST', 'ND', 'NT', 'RS', 'TR', 'SH', 'CH',
];

/** "Problem" tiles — hard to use, especially together */
const PROBLEM_TILES = new Set(['Q', 'V', 'W', 'K']);

export interface RackQualityResult {
  score: number;           // 0-100 overall quality
  breakdown: {
    balance: number;       // 0-25 vowel/consonant balance
    power: number;         // 0-20 power tiles (S, blank, high-value)
    bingo: number;         // 0-25 bingo potential (stem overlap)
    synergy: number;       // 0-15 common letter combos
    penalty: number;       // 0 to -15 negative factors (dupes, problem tiles)
  };
  analysis: string;        // Human-readable one-liner
  percentile?: number;     // 0-100 percentile vs random racks
}

export interface RackLeaveResult {
  play: string;
  leave: string;
  leaveScore: number;
  leaveAnalysis: string;
}

/**
 * Score a rack's quality on a 0-100 scale.
 */
export function scoreRack(rack: string): RackQualityResult {
  const tiles = rack.toUpperCase().replace(/[^A-Z?]/g, '').split('');
  const rackLen = tiles.length;

  if (rackLen < 2) {
    return { score: 0, breakdown: { balance: 0, power: 0, bingo: 0, synergy: 0, penalty: 0 }, analysis: 'Rack too short to evaluate' };
  }

  const vowels = tiles.filter(t => 'AEIOU'.includes(t));
  const consonants = tiles.filter(t => t !== '?' && !'AEIOU'.includes(t));
  const blanks = tiles.filter(t => t === '?');

  // --- BALANCE SCORE (0-25) ---
  let balance = 0;
  if (rackLen === 7) {
    const vowelCount = vowels.length;
    // Ideal: 2-3 vowels in a 7-tile rack
    if (vowelCount === 2 || vowelCount === 3) balance = 25;
    else if (vowelCount === 1 || vowelCount === 4) balance = 15;
    else if (vowelCount === 0 || vowelCount === 5) balance = 5;
    else balance = 0; // 6-7 vowels = terrible
  } else {
    // Proportional for shorter racks
    const ratio = vowels.length / Math.max(1, rackLen);
    if (ratio >= 0.25 && ratio <= 0.45) balance = 25;
    else if (ratio >= 0.15 && ratio <= 0.55) balance = 15;
    else balance = 5;
  }

  // --- POWER SCORE (0-20) ---
  let power = 0;
  if (blanks.length > 0) power += 10 * blanks.length; // Blanks are incredibly powerful
  if (tiles.includes('S')) power += 5; // S hooks onto almost everything
  const highValueTiles = tiles.filter(t => 'JXZQ'.includes(t));
  if (highValueTiles.length === 1) power += 4; // One power tile is good
  if (highValueTiles.length >= 2) power += 2; // Multiple = harder to use
  power = Math.min(20, power);

  // --- BINGO POTENTIAL (0-25) ---
  let bingo = 0;
  if (rackLen >= 6) {
    const rackSorted = tiles.filter(t => t !== '?').sort().join('');

    // Check overlap with known bingo stems
    for (const stem of BINGO_STEMS) {
      const stemLetters = stem.split('');
      let matched = 0;
      const available = [...tiles];
      for (const letter of stemLetters) {
        const idx = available.indexOf(letter);
        if (idx >= 0) {
          matched++;
          available.splice(idx, 1);
        } else if (available.indexOf('?') >= 0) {
          matched++;
          available.splice(available.indexOf('?'), 1);
        }
      }
      const overlap = matched / stemLetters.length;
      if (overlap >= 1.0) { bingo = 25; break; }
      if (overlap >= 0.83) { bingo = Math.max(bingo, 20); }
      if (overlap >= 0.67) { bingo = Math.max(bingo, 12); }
    }

    // Flexible letters bonus (letters that appear in many 7-letter words)
    const flexConsonants = consonants.filter(c => FLEXIBLE_CONSONANTS.has(c)).length;
    const flexVowels = vowels.filter(v => FLEXIBLE_VOWELS.has(v)).length;
    const flexBonus = Math.min(8, (flexConsonants + flexVowels) * 2);
    bingo = Math.min(25, bingo + flexBonus);
  } else {
    // Shorter racks — can't bingo, but flexible letters still matter
    const flexLetters = tiles.filter(t => FLEXIBLE_CONSONANTS.has(t) || FLEXIBLE_VOWELS.has(t)).length;
    bingo = Math.min(15, flexLetters * 3);
  }

  // --- SYNERGY SCORE (0-15) ---
  let synergy = 0;
  const rackStr = tiles.join('');
  for (const pattern of SYNERGY_PATTERNS) {
    // Check if all letters of the pattern exist in the rack
    const patternLetters = pattern.split('');
    const available = [...tiles];
    let allFound = true;
    for (const letter of patternLetters) {
      const idx = available.indexOf(letter);
      if (idx >= 0) {
        available.splice(idx, 1);
      } else {
        allFound = false;
        break;
      }
    }
    if (allFound) synergy += 3;
  }
  synergy = Math.min(15, synergy);

  // --- PENALTY (0 to -15) ---
  let penalty = 0;

  // Duplicate penalty
  const letterCounts: Record<string, number> = {};
  for (const t of tiles) {
    if (t !== '?') {
      letterCounts[t] = (letterCounts[t] || 0) + 1;
    }
  }
  for (const [letter, count] of Object.entries(letterCounts)) {
    if (count >= 3) penalty -= 6; // Triple letter = very bad
    else if (count === 2) penalty -= 2; // Double is slightly bad
  }

  // Problem tile penalty (Q without U, multiple problem tiles)
  const problemCount = tiles.filter(t => PROBLEM_TILES.has(t)).length;
  if (tiles.includes('Q') && !tiles.includes('U')) penalty -= 5;
  if (problemCount >= 2) penalty -= 3;

  penalty = Math.max(-15, penalty);

  // --- TOTAL SCORE ---
  const rawScore = balance + power + bingo + synergy + penalty;
  const score = Math.max(0, Math.min(100, rawScore));

  // --- ANALYSIS ---
  let analysis = '';
  if (score >= 85) analysis = 'Excellent rack — strong bingo potential with great balance';
  else if (score >= 70) analysis = 'Good rack — solid options with decent flexibility';
  else if (score >= 55) analysis = 'Average rack — playable but limited bingo chances';
  else if (score >= 35) analysis = 'Below average — consider exchanging problem tiles';
  else analysis = 'Poor rack — strongly consider exchanging or dumping tiles';

  return {
    score,
    breakdown: { balance, power, bingo, synergy, penalty },
    analysis,
  };
}

/**
 * Compare rack leaves for multiple candidate plays.
 * Returns each play's resulting leave scored and analysed.
 */
export function compareLeaves(rack: string, plays: string[]): RackLeaveResult[] {
  const rackTiles = rack.toUpperCase().replace(/[^A-Z?]/g, '').split('');

  return plays.map(play => {
    const playLetters = play.toUpperCase().replace(/[^A-Z]/g, '').split('');
    const remaining = [...rackTiles];

    for (const letter of playLetters) {
      const idx = remaining.indexOf(letter);
      if (idx >= 0) {
        remaining.splice(idx, 1);
      } else {
        // Use blank for missing letter
        const blankIdx = remaining.indexOf('?');
        if (blankIdx >= 0) remaining.splice(blankIdx, 1);
      }
    }

    const leave = remaining.join('');
    const leaveResult = scoreRack(leave);

    return {
      play: play.toUpperCase(),
      leave,
      leaveScore: leaveResult.score,
      leaveAnalysis: leaveResult.analysis,
    };
  });
}

/**
 * Estimate historical percentile for a rack using Monte Carlo sampling.
 * Draws N random 7-tile racks from the bag, scores them, and reports where
 * the given rack falls in the distribution.
 *
 * @param rack - The rack to evaluate
 * @param samples - Number of random racks to generate (default 1000)
 */
export function rackPercentile(rack: string, samples: number = 1000): number {
  const rackScore = scoreRack(rack).score;
  let belowCount = 0;

  const bag = TILE_BAG.split('');

  for (let i = 0; i < samples; i++) {
    // Draw 7 random tiles from bag (with replacement for speed — close enough)
    const randomRack: string[] = [];
    for (let j = 0; j < 7; j++) {
      randomRack.push(bag[Math.floor(Math.random() * bag.length)]);
    }
    const randomScore = scoreRack(randomRack.join('')).score;
    if (randomScore < rackScore) belowCount++;
  }

  return Math.round((belowCount / samples) * 100);
}

/**
 * Generate a human-friendly summary of rack quality for Lex's coaching response.
 */
export function rackQualitySummary(rack: string): string {
  const result = scoreRack(rack);
  const percentile = rackPercentile(rack, 500);

  const parts: string[] = [];
  parts.push(`Rack ${rack.toUpperCase()}: ${result.score}/100 quality (top ${100 - percentile}% of possible draws).`);
  parts.push(result.analysis + '.');

  if (result.breakdown.power >= 15) parts.push('Strong power tiles present.');
  if (result.breakdown.bingo >= 20) parts.push('High bingo potential — look for 7-letter words.');
  if (result.breakdown.penalty <= -8) parts.push('Watch out — duplicate or problem tiles dragging you down.');

  return parts.join(' ');
}
