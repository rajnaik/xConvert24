/**
 * EV Scoring Engine — Rack Quality Score (0-100)
 *
 * Pure function that evaluates a 7-tile Scrabble rack and returns a quality score.
 * Factors: vowel/consonant ratio, power tiles, bingo stem overlap,
 * duplicate penalty, synergy bonuses (common combos).
 *
 * Usage: rackEV('SATIREN') → 92
 */

// ── Constants ──────────────────────────────────────────────────────────────

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/** Tiles that earn bonus points for rack quality */
const POWER_TILES: Record<string, number> = {
  S: 8,    // pluralise or hook — most valuable tile
  '?': 10, // blank — ultimate flexibility
  J: 3,    // high score but hard to use
  Q: 2,    // high score, needs U
  X: 4,    // high score, many 2-letter words (AX, EX, OX, XI, XU)
  Z: 4,    // high score, decent 2-letter words (ZA, ZO)
};

/** Top bingo stems — racks containing these letter sets have high bingo potential */
const BINGO_STEMS: string[] = [
  'SATIRE', 'RETINA', 'SATINE', 'ARSINE', 'TISANE',
  'AIREST', 'STERNA', 'NASTIE', 'RETAIN', 'RENTAL',
  'SALINE', 'DETAIN', 'INSTAR', 'TENAIL', 'ENTAIL',
  'EOLIAN', 'TONIER', 'SENIOR', 'NOSIER', 'IRONES',
  'SORTIE', 'TORIES', 'OATERS', 'ORNATE', 'ATONER',
];

/** Common letter combos that work well together (synergy pairs/triples) */
const SYNERGY_PATTERNS: { pattern: string; bonus: number }[] = [
  { pattern: 'ING', bonus: 6 },
  { pattern: 'TION', bonus: 5 },
  { pattern: 'ED', bonus: 3 },
  { pattern: 'ER', bonus: 3 },
  { pattern: 'RE', bonus: 3 },
  { pattern: 'UN', bonus: 2 },
  { pattern: 'EST', bonus: 4 },
  { pattern: 'LY', bonus: 3 },
  { pattern: 'NESS', bonus: 4 },
  { pattern: 'ABLE', bonus: 4 },
  { pattern: 'MENT', bonus: 3 },
  { pattern: 'IGHT', bonus: 3 },
  { pattern: 'OUGH', bonus: 2 },
  { pattern: 'TH', bonus: 2 },
  { pattern: 'SH', bonus: 2 },
  { pattern: 'CH', bonus: 2 },
];

// ── Helper: check if rack letters contain all letters of a pattern ──────

function containsAll(rackLetters: string[], pattern: string): boolean {
  const available = [...rackLetters];
  for (const ch of pattern) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

// ── Scoring Components ─────────────────────────────────────────────────────

/**
 * Vowel/consonant ratio score (max 25 points).
 * Ideal: 2-3 vowels in a 7-tile rack (ratio 2:5 to 3:4).
 * Penalties: 0-1 vowels (too dry), 4+ vowels (too wet).
 */
function vowelConsonantScore(letters: string[]): number {
  const vowelCount = letters.filter(l => VOWELS.has(l)).length;
  const total = letters.length;

  if (total === 0) return 0;

  // Ideal: 2-3 vowels out of 7
  if (vowelCount === 2 || vowelCount === 3) return 25;
  if (vowelCount === 4) return 18; // slightly wet
  if (vowelCount === 1) return 15; // slightly dry
  if (vowelCount === 5) return 10; // very wet
  if (vowelCount === 0) return 5;  // all consonants — very bad
  if (vowelCount >= 6) return 3;   // almost all vowels — terrible
  return 12;
}

/**
 * Power tile bonus (max 20 points).
 * S, blank (?) earn the most. J/Q/X/Z earn smaller bonuses.
 * Capped at 20.
 */
function powerTileScore(letters: string[]): number {
  let score = 0;
  for (const l of letters) {
    if (l in POWER_TILES) {
      score += POWER_TILES[l];
    }
  }
  return Math.min(score, 20);
}

/**
 * Bingo stem overlap (max 25 points).
 * Checks how many of the top bingo stems' letters are present in the rack.
 * A 6-letter match out of 6 = full bingo potential.
 * Best match wins.
 */
function bingoStemScore(letters: string[]): number {
  let bestMatch = 0;

  for (const stem of BINGO_STEMS) {
    const stemLetters = stem.split('');
    const available = [...letters];
    let matched = 0;

    for (const ch of stemLetters) {
      const idx = available.indexOf(ch);
      if (idx !== -1) {
        matched++;
        available.splice(idx, 1);
      }
    }

    const matchRatio = matched / stemLetters.length;
    if (matchRatio > bestMatch) {
      bestMatch = matchRatio;
    }
  }

  // Full stem match (6/6) = 25 pts, 5/6 = 18, 4/6 = 12, etc.
  if (bestMatch >= 1.0) return 25;
  if (bestMatch >= 0.83) return 20; // 5/6
  if (bestMatch >= 0.67) return 14; // 4/6
  if (bestMatch >= 0.5) return 8;   // 3/6
  return 3;
}

/**
 * Duplicate penalty (max -15 points).
 * Duplicate letters reduce flexibility. More dupes = worse rack.
 * Exception: having 2 of a common letter (E, S, T) is less penalised.
 */
function duplicatePenalty(letters: string[]): number {
  const freq: Record<string, number> = {};
  for (const l of letters) {
    freq[l] = (freq[l] || 0) + 1;
  }

  const commonLetters = new Set(['E', 'S', 'T', 'A', 'R', 'N', 'I']);
  let penalty = 0;

  for (const [letter, count] of Object.entries(freq)) {
    if (count >= 2) {
      const extraDupes = count - 1;
      const perDupePenalty = commonLetters.has(letter) ? 3 : 5;
      penalty += extraDupes * perDupePenalty;
    }
  }

  return Math.min(penalty, 15);
}

/**
 * Synergy bonus (max 15 points).
 * Checks if rack letters can form common useful combos (ING, TION, ED, etc.).
 * Multiple combos stack but cap at 15.
 */
function synergyScore(letters: string[]): number {
  let score = 0;

  for (const { pattern, bonus } of SYNERGY_PATTERNS) {
    if (containsAll(letters, pattern)) {
      score += bonus;
    }
  }

  return Math.min(score, 15);
}

// ── Main Function ──────────────────────────────────────────────────────────

export interface EVResult {
  score: number;
  breakdown: {
    vowelConsonant: number;
    powerTiles: number;
    bingoStem: number;
    duplicatePenalty: number;
    synergy: number;
  };
  grade: string;
}

/**
 * Compute the Expected Value (quality) score for a Scrabble rack.
 *
 * @param rack - String of 1-7 uppercase letters (use ? for blank tiles)
 * @returns EVResult with score (0-100), breakdown, and letter grade
 *
 * Score composition:
 * - Vowel/Consonant ratio: 0-25 pts
 * - Power tiles (S, ?, J, Q, X, Z): 0-20 pts
 * - Bingo stem overlap: 0-25 pts
 * - Duplicate penalty: 0 to -15 pts
 * - Synergy bonus (ING, TION, etc.): 0-15 pts
 * - Theoretical max: 85, normalised to 0-100
 */
export function rackEV(rack: string): EVResult {
  const letters = rack.toUpperCase().replace(/[^A-Z?]/g, '').split('').slice(0, 7);

  if (letters.length === 0) {
    return { score: 0, breakdown: { vowelConsonant: 0, powerTiles: 0, bingoStem: 0, duplicatePenalty: 0, synergy: 0 }, grade: '-' };
  }

  const vc = vowelConsonantScore(letters);
  const pt = powerTileScore(letters);
  const bs = bingoStemScore(letters);
  const dp = duplicatePenalty(letters);
  const sy = synergyScore(letters);

  // Raw score: sum of positives minus penalty
  const raw = vc + pt + bs - dp + sy;
  // Theoretical max is ~85 (25+20+25+15 with 0 penalty), normalise to 0-100
  const normalised = Math.max(0, Math.min(100, Math.round((raw / 85) * 100)));

  // Letter grade
  let grade: string;
  if (normalised >= 90) grade = 'A+';
  else if (normalised >= 80) grade = 'A';
  else if (normalised >= 70) grade = 'B+';
  else if (normalised >= 60) grade = 'B';
  else if (normalised >= 50) grade = 'C+';
  else if (normalised >= 40) grade = 'C';
  else if (normalised >= 30) grade = 'D';
  else grade = 'F';

  return {
    score: normalised,
    breakdown: {
      vowelConsonant: vc,
      powerTiles: pt,
      bingoStem: bs,
      duplicatePenalty: dp,
      synergy: sy,
    },
    grade,
  };
}

/**
 * Detect if a string looks like a Scrabble rack (1-7 uppercase letters, maybe with ?).
 * Used by the chat UI to decide whether to show the EV score.
 */
export function looksLikeRack(input: string): boolean {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z?]/g, '');
  return cleaned.length >= 2 && cleaned.length <= 7 && cleaned === input.trim().toUpperCase().replace(/\s/g, '');
}
