/**
 * Training Modes — Game Intelligence for Lex
 *
 * Provides data generators for:
 * - Bingo Trainer (generate bingo-friendly racks)
 * - Hook Quiz (find all valid front/back hooks for a word)
 * - Tile Countdown (track tiles remaining after N moves)
 * - Rack Leave Drill (generate candidate plays for comparison)
 */

/** Scrabble tile bag distribution */
const TILE_BAG_FULL: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1,
  L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2,
  W: 2, X: 1, Y: 2, Z: 1, '?': 2,
};

/** Total tiles in bag */
const TOTAL_TILES = 100;

/** Scrabble letter values */
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5,
  L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4,
  W: 4, X: 8, Y: 4, Z: 10, '?': 0,
};

/** Top bingo stems — 6-letter combos that anagram into many 7-letter words */
const BINGO_STEMS_WITH_ADDS = [
  { stem: 'SATIRE', adds: 'BCDGLMNPW', examples: ['BAITERS', 'MAESTRI', 'NASTIER', 'RETINAS', 'STAINER'] },
  { stem: 'RETAIN', adds: 'BCDEGLMOPS', examples: ['CERTAIN', 'TRAINED', 'PAINTER', 'DETRAIN', 'NASTIER'] },
  { stem: 'TISANE', adds: 'BCDGLMPRW', examples: ['BANDITS', 'INSTEAD', 'NASTIER', 'ANTSIER', 'STAINED'] },
  { stem: 'SALINE', adds: 'BCDGHKMRTW', examples: ['SALTINE', 'ELASTIC', 'SCANDAL', 'MINERAL', 'SLANDER'] },
  { stem: 'ORNATE', adds: 'BCDGILPS', examples: ['SENATOR', 'TREASON', 'DONATOR', 'OPERATE', 'NEGATOR'] },
  { stem: 'SENIOR', adds: 'CDGLMPTVW', examples: ['EROSION', 'TENSION', 'VERSION', 'PIONEER', 'REGIONS'] },
  { stem: 'ARISEN', adds: 'BCDGLMPTW', examples: ['REMAINS', 'SEMINAR', 'INSANER', 'SARDINE', 'TRAINED'] },
  { stem: 'TENORS', adds: 'BCDGHILMPW', examples: ['MONSTER', 'MENTORS', 'SNORTED', 'STONIER', 'HORNETS'] },
  { stem: 'ALERTS', adds: 'BCDGHIMNOPW', examples: ['SLATHER', 'LATHERS', 'HALTERS', 'SALTIER', 'REALIST'] },
  { stem: 'SORTIE', adds: 'BCDGLMNPW', examples: ['STORIES', 'STORIED', 'SOLDIER', 'EXPLOIT', 'LOITERS'] },
];

/**
 * Bingo Trainer — Generate a rack with known bingo(s).
 * Picks a random stem + add letter to create a guaranteed-solvable rack.
 */
export interface BingoTrainerChallenge {
  rack: string;
  stem: string;
  bingos: string[];
  hint: string;
}

export function generateBingoChallenge(): BingoTrainerChallenge {
  const stemData = BINGO_STEMS_WITH_ADDS[Math.floor(Math.random() * BINGO_STEMS_WITH_ADDS.length)];
  const addLetter = stemData.adds[Math.floor(Math.random() * stemData.adds.length)];
  const rackLetters = (stemData.stem + addLetter).split('');

  // Shuffle the rack so it's not obvious
  for (let i = rackLetters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rackLetters[i], rackLetters[j]] = [rackLetters[j], rackLetters[i]];
  }

  return {
    rack: rackLetters.join(''),
    stem: stemData.stem,
    bingos: stemData.examples.slice(0, 3), // Give top 3 bingos
    hint: `This rack contains the bingo stem ${stemData.stem.slice(0, 3)}...`,
  };
}

/**
 * Hook Quiz — Find all valid single-letter hooks for a word.
 * A "hook" is a single letter that can be added to the front or back
 * of a word to form a new valid word.
 *
 * This function needs a dictionary lookup function passed in.
 */
export interface HookQuizChallenge {
  word: string;
  frontHooks: string[];  // Letters that form valid words when prepended
  backHooks: string[];   // Letters that form valid words when appended
  totalHooks: number;
}

export function generateHookChallenge(
  word: string,
  isValidWord: (w: string) => boolean
): HookQuizChallenge {
  const upper = word.toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const frontHooks: string[] = [];
  const backHooks: string[] = [];

  for (const letter of alphabet) {
    if (isValidWord(letter + upper)) frontHooks.push(letter);
    if (isValidWord(upper + letter)) backHooks.push(letter);
  }

  return {
    word: upper,
    frontHooks,
    backHooks,
    totalHooks: frontHooks.length + backHooks.length,
  };
}

/** Common 3-5 letter words good for hook quizzes (many hooks available) */
export const HOOK_QUIZ_WORDS = [
  'CAT', 'DOG', 'RAT', 'BAT', 'HAT', 'MAT', 'FAT', 'SAT', 'PAT',
  'RAN', 'TAN', 'BAN', 'MAN', 'PAN', 'VAN', 'CAN', 'FAN',
  'ATE', 'OAT', 'EAR', 'ARC', 'OUR', 'OWL', 'IRE', 'ORE',
  'RAIN', 'TRAIN', 'LATE', 'RATE', 'LINE', 'TONE', 'PINE',
  'ROVE', 'LOVE', 'COVE', 'WOVE', 'DOVE', 'HOVE', 'MOVE',
  'HEAT', 'NEAT', 'BEAT', 'MEAT', 'SEAT', 'PEAT', 'FEAT',
  'LACE', 'RACE', 'PACE', 'FACE', 'MACE',
  'OVER', 'EVER', 'AVER',
  'LING', 'RING', 'SING', 'KING', 'WING', 'DING', 'PING',
];

/**
 * Tile Countdown — Calculate remaining tiles after a series of plays.
 */
export interface TileCountdownChallenge {
  wordsPlayed: string[];
  question: string;          // "How many E tiles remain?"
  targetLetter: string;
  correctAnswer: number;
  totalRemaining: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function generateTileCountdown(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): TileCountdownChallenge {
  // Generate random words that could have been played
  const commonPlays = [
    'RAIN', 'CAT', 'DOG', 'STONE', 'TRAIN', 'PLATE', 'REST', 'VINE',
    'QUOTE', 'JEST', 'FLAME', 'GRIND', 'SHOVE', 'BLAZE', 'CRISP',
    'WATER', 'PLANT', 'STONE', 'EARTH', 'FROST', 'LIGHT', 'DREAM',
    'QUEST', 'GRASP', 'TRICK', 'BLEND', 'SWING', 'CLOTH', 'FRESH',
  ];

  let numWords: number;
  if (difficulty === 'easy') numWords = 3;
  else if (difficulty === 'medium') numWords = 5;
  else numWords = 8;

  // Pick random words
  const shuffled = [...commonPlays].sort(() => Math.random() - 0.5);
  const wordsPlayed = shuffled.slice(0, numWords);

  // Count letters used
  const usedLetters: Record<string, number> = {};
  for (const word of wordsPlayed) {
    for (const letter of word.toUpperCase()) {
      usedLetters[letter] = (usedLetters[letter] || 0) + 1;
    }
  }

  // Pick a target letter to ask about (prefer common ones for easy, rare for hard)
  let targetPool: string[];
  if (difficulty === 'easy') targetPool = ['E', 'A', 'I', 'O', 'T', 'N', 'S', 'R'];
  else if (difficulty === 'medium') targetPool = ['E', 'A', 'I', 'D', 'L', 'S', 'T', 'R', 'N', 'U'];
  else targetPool = Object.keys(usedLetters); // Any letter that was actually used

  const targetLetter = targetPool[Math.floor(Math.random() * targetPool.length)];
  const used = usedLetters[targetLetter] || 0;
  const bagTotal = TILE_BAG_FULL[targetLetter] || 0;
  const remaining = Math.max(0, bagTotal - used);

  // Calculate total tiles remaining
  const totalUsed = Object.values(usedLetters).reduce((sum, n) => sum + n, 0);
  // Each player also drew 7 tiles for their rack (2 players)
  const totalRemaining = TOTAL_TILES - totalUsed - 14; // Approximate (14 tiles in racks)

  return {
    wordsPlayed,
    question: `After these ${numWords} words are played, how many ${targetLetter} tiles remain in the bag?`,
    targetLetter,
    correctAnswer: remaining,
    totalRemaining: Math.max(0, totalRemaining),
    difficulty,
  };
}

/**
 * Rack Leave Drill — Generate a scenario with 2-3 candidate plays.
 */
export interface RackLeaveDrillChallenge {
  rack: string;
  candidates: {
    word: string;
    score: number;
    leave: string;
  }[];
  bestChoice: number;  // Index of the best play (considering leave quality)
  explanation: string;
}

/** Pre-built rack leave drill scenarios (curated for interesting decisions) */
export const RACK_LEAVE_SCENARIOS: RackLeaveDrillChallenge[] = [
  {
    rack: 'AEINRST',
    candidates: [
      { word: 'NASTIER', score: 7, leave: '' },
      { word: 'RAIN', score: 4, leave: 'EST' },
      { word: 'STARE', score: 5, leave: 'IN' },
    ],
    bestChoice: 0,
    explanation: 'NASTIER is a bingo using all 7 tiles (+50 bonus = 57 points). Always play the bingo when available — the 50-point bonus outweighs any rack leave consideration.',
  },
  {
    rack: 'DEILORT',
    candidates: [
      { word: 'TOILED', score: 7, leave: 'R' },
      { word: 'IDOL', score: 5, leave: 'ERT' },
      { word: 'ROIL', score: 4, leave: 'DET' },
    ],
    bestChoice: 0,
    explanation: 'TOILED scores highest and leaves R — a flexible consonant. The other plays leave more tiles but score less, and their leaves (ERT, DET) are only marginally better than a single R.',
  },
  {
    rack: 'AAEIQU?',
    candidates: [
      { word: 'QUAI', score: 13, leave: 'AE?' },
      { word: 'AQUAE', score: 14, leave: 'I?' },
      { word: 'QI', score: 11, leave: 'AAEU?' },
    ],
    bestChoice: 0,
    explanation: 'QUAI dumps the Q while leaving AE? — a blank plus two flexible vowels gives excellent bingo potential next turn. AQUAE scores 1 more but leaves I? which is less flexible.',
  },
  {
    rack: 'BCEIRST',
    candidates: [
      { word: 'SCRIBE', score: 10, leave: 'T' },
      { word: 'TRIBES', score: 8, leave: 'C' },
      { word: 'CREST', score: 7, leave: 'BI' },
    ],
    bestChoice: 0,
    explanation: 'SCRIBE scores highest and leaves T — one of the best single-tile leaves. T combines with nearly everything drawn next. C is decent but T is statistically superior for forming words.',
  },
  {
    rack: 'EGINOST',
    candidates: [
      { word: 'STONING', score: 8, leave: 'E' },
      { word: 'TONES', score: 5, leave: 'GI' },
      { word: 'INGOTS', score: 7, leave: 'E' },
    ],
    bestChoice: 0,
    explanation: 'STONING scores 8 and leaves E — the single best letter to hold. With 12 Es in the bag already gone, holding one E gives you vowel security plus it hooks onto hundreds of words.',
  },
];

/**
 * Get a random rack leave drill challenge.
 */
export function getRandomDrill(): RackLeaveDrillChallenge {
  return RACK_LEAVE_SCENARIOS[Math.floor(Math.random() * RACK_LEAVE_SCENARIOS.length)];
}

/**
 * Calculate word score.
 */
export function wordScore(word: string): number {
  return [...word.toUpperCase()].reduce((s, c) => s + (LETTER_VALUES[c] || 0), 0);
}
