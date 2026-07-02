/**
 * EV Scoring Engine — Rack Quality Evaluator
 *
 * Pure function: takes a 7-tile rack string, returns a quality score (0-100).
 *
 * Factors:
 *  1. Vowel/Consonant ratio (ideal 2-3 vowels : 4-5 consonants)
 *  2. Power tile presence (S, blank ?, J, Q, X, Z)
 *  3. Bingo stem overlap (SATIRE, RETINA, NASTIER, etc.)
 *  4. Duplicate tile penalty
 *  5. Synergy bonuses (common letter combos: -ING, -TION, -ED, -ER, -EST, etc.)
 */

// --- Constants ---

/** Common 6- and 7-letter bingo stems (high probability of forming bingos) */
const BINGO_STEMS: string[] = [
  'SATIRE', 'RETINA', 'NASTIER', 'TISANE', 'ARSINE',
  'SENIOR', 'LINERS', 'SALINE', 'TENORS', 'STONER',
  'ORNATE', 'ATONES', 'SERIAL', 'RAILES', 'SALTIE',
  'STERNA', 'ANTRES', 'ESTRIN', 'INSERT', 'INERTS',
  'LEARNT', 'RENTAL', 'LASTER', 'ALERTS', 'ALTERS',
  'STEARIN', 'ANESTRI', 'NASTIER', 'RATINES', 'RETINAS',
  'ANTSIER', 'STAINER', 'RETSINA',
];

/** Letter combos that synergise well together */
const SYNERGY_PATTERNS: { letters: string; bonus: number }[] = [
  { letters: 'ING', bonus: 8 },
  { letters: 'TION', bonus: 7 },
  { letters: 'ED', bonus: 4 },
  { letters: 'ER', bonus: 4 },
  { letters: 'EST', bonus: 5 },
  { letters: 'RE', bonus: 3 },
  { letters: 'UN', bonus: 3 },
  { letters: 'LY', bonus: 3 },
  { letters: 'NESS', bonus: 5 },
  { letters: 'ABLE', bonus: 6 },
  { letters: 'MENT', bonus: 5 },
  { letters: 'ATE', bonus: 4 },
  { letters: 'STER', bonus: 5 },
  { letters: 'IEST', bonus: 5 },
];

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const POWER_TILES = new Set(['S', '?']); // S and blank
const HIGH_VALUE_TILES = new Set(['J', 'Q', 'X', 'Z']);

// --- Helper functions ---

function countLetters(rack: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ch of rack.toUpperCase()) {
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  return counts;
}

/** Check if all letters in `pattern` can be found in the rack letter counts */
function rackContainsPattern(counts: Map<string, number>, pattern: string): boolean {
  const needed = new Map<string, number>();
  for (const ch of pattern) {
    needed.set(ch, (needed.get(ch) || 0) + 1);
  }
  for (const [ch, qty] of needed) {
    if ((counts.get(ch) || 0) < qty) return false;
  }
  return true;
}

/** Count how many letters from a stem are present in the rack */
function stemOverlap(counts: Map<string, number>, stem: string): number {
  const used = new Map<string, number>();
  let overlap = 0;
  for (const ch of stem) {
    const usedCount = used.get(ch) || 0;
    const available = counts.get(ch) || 0;
    if (usedCount < available) {
      overlap++;
      used.set(ch, usedCount + 1);
    }
  }
  return overlap;
}

// --- Scoring components ---

/**
 * Score vowel/consonant balance (0-25 points).
 * Ideal: 2-3 vowels with 4-5 consonants in a 7-tile rack.
 */
function scoreVowelBalance(rack: string): number {
  const upper = rack.toUpperCase();
  let vowelCount = 0;
  let consonantCount = 0;

  for (const ch of upper) {
    if (ch === '?') continue; // blank doesn't count
    if (VOWELS.has(ch)) vowelCount++;
    else consonantCount++;
  }

  // Ideal vowel count: 2 or 3 out of 7
  if (vowelCount >= 2 && vowelCount <= 3) return 25;
  if (vowelCount === 4) return 18;
  if (vowelCount === 1) return 14;
  if (vowelCount === 5) return 8;
  if (vowelCount === 0 || vowelCount >= 6) return 2;
  return 10;
}

/**
 * Score power tile presence (0-20 points).
 * S = +8, blank (?) = +10, high-value tiles (J/Q/X/Z) = +4 each but capped.
 */
function scorePowerTiles(counts: Map<string, number>): number {
  let score = 0;

  // S tiles (very valuable for hooks and plurals)
  const sCount = counts.get('S') || 0;
  score += Math.min(sCount, 2) * 8; // max 16 from S

  // Blank tiles
  const blankCount = counts.get('?') || 0;
  score += Math.min(blankCount, 2) * 10; // max 20 from blanks

  // High-value tiles (useful but can be hard to play)
  for (const tile of HIGH_VALUE_TILES) {
    if (counts.has(tile)) score += 4;
  }

  return Math.min(score, 20); // cap at 20
}

/**
 * Score bingo stem overlap (0-25 points).
 * Higher overlap with known bingo stems = higher chance of a bingo.
 */
function scoreBingoStems(counts: Map<string, number>, rackLen: number): number {
  let bestOverlap = 0;

  for (const stem of BINGO_STEMS) {
    const overlap = stemOverlap(counts, stem);
    const ratio = overlap / Math.min(stem.length, rackLen);
    if (ratio > bestOverlap) bestOverlap = ratio;
  }

  // Scale: 100% overlap of a 6-letter stem in 7 tiles = 25 pts
  return Math.round(bestOverlap * 25);
}

/**
 * Duplicate tile penalty (0 to -15 points).
 * Having 2 of the same tile is mildly bad; 3+ is very bad.
 */
function penaltyDuplicates(counts: Map<string, number>): number {
  let penalty = 0;

  for (const [_ch, qty] of counts) {
    if (qty === 2) penalty += 3;
    else if (qty === 3) penalty += 7;
    else if (qty >= 4) penalty += 12;
  }

  return Math.min(penalty, 15); // cap penalty at 15
}

/**
 * Score synergy patterns (0-15 points).
 * Checks if the rack contains useful letter combinations.
 */
function scoreSynergy(counts: Map<string, number>): number {
  let totalBonus = 0;

  for (const { letters, bonus } of SYNERGY_PATTERNS) {
    if (rackContainsPattern(counts, letters)) {
      totalBonus += bonus;
    }
  }

  return Math.min(totalBonus, 15); // cap at 15
}

// --- Main function ---

export interface EVScoreResult {
  score: number;
  label: string;
  breakdown: {
    vowelBalance: number;
    powerTiles: number;
    bingoStems: number;
    duplicatePenalty: number;
    synergy: number;
  };
}

/**
 * Compute the Expected Value (EV) quality score for a Scrabble rack.
 *
 * @param rack - A string of up to 7 letters (A-Z) and optionally '?' for blanks.
 * @returns EVScoreResult with score (0-100), label, and breakdown.
 */
export function computeEVScore(rack: string): EVScoreResult {
  // Normalise: uppercase, strip non-alpha/non-? chars
  const cleaned = rack.toUpperCase().replace(/[^A-Z?]/g, '');

  if (cleaned.length === 0) {
    return { score: 0, label: 'No tiles', breakdown: { vowelBalance: 0, powerTiles: 0, bingoStems: 0, duplicatePenalty: 0, synergy: 0 } };
  }

  const counts = countLetters(cleaned);

  const vowelBalance = scoreVowelBalance(cleaned);
  const powerTiles = scorePowerTiles(counts);
  const bingoStems = scoreBingoStems(counts, cleaned.length);
  const duplicatePenalty = penaltyDuplicates(counts);
  const synergy = scoreSynergy(counts);

  // Raw score: sum of positives minus penalty
  const raw = vowelBalance + powerTiles + bingoStems + synergy - duplicatePenalty;

  // Clamp to 0-100
  const score = Math.max(0, Math.min(100, raw));

  // Assign a label
  let label: string;
  if (score >= 80) label = 'Excellent';
  else if (score >= 65) label = 'Strong';
  else if (score >= 45) label = 'Decent';
  else if (score >= 25) label = 'Weak';
  else label = 'Poor';

  return {
    score,
    label,
    breakdown: {
      vowelBalance,
      powerTiles,
      bingoStems,
      duplicatePenalty,
      synergy,
    },
  };
}
