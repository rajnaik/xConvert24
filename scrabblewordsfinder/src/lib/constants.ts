/**
 * Shared constants — single source of truth for magic strings used across the app.
 * Import these instead of hardcoding strings.
 */

// ── localStorage Keys ──
export const STORAGE_KEYS = {
  UID: 'swf-uid',
  ACHIEVEMENTS: 'scbAchievements',
  WOTD_CACHE: 'swf-wotd-cache',
  QUIZ_START: 'swf-quiz-start',
  QUIZ_SPLITS: 'swf-quiz-splits',
  FLASH_CARD_SPEED: 'swf-fc-speed',
  ANAGRAM_STREAK: 'swf-anagram-streak',
  ROADMAP_CACHE: 'swf-roadmap-cache',
  THEME: 'theme',
} as const;

// ── Cache TTLs (milliseconds) ──
export const CACHE_TTL = {
  WOTD: 24 * 60 * 60 * 1000,        // 24 hours
  ROADMAP: 5 * 60 * 1000,            // 5 minutes
  SHORT: 60 * 1000,                   // 1 minute
} as const;

// ── API Endpoints ──
export const API = {
  WOTD: '/api/wotd/',
  WORD_QUIZ: '/api/word-quiz/',
  QUIZ_SCORES: '/api/quiz-scores/',
  DAILY_RACK: '/api/daily-rack/',
  DAILY_ANAGRAM: '/api/daily-anagram/',
  ACHIEVEMENTS: '/api/achievements/',
  ROADMAP: '/api/roadmap-features/',
  WORDBENCH_PRACTICE: '/api/wordbench-practice/',
  BANNERS: '/api/banners',
} as const;

// ── Game Config ──
export const GAME = {
  MAX_ANAGRAM_GUESSES: 5,
  DEFAULT_QUIZ_COUNT: 7,
  DEFAULT_QUIZ_TIMER: 90,
  FLASH_CARD_DEFAULT_SPEED: 5,
  DAILY_RACK_TILES: 7,
} as const;

// ── Scrabble Tile Scores ──
export const TILE_SCORES: Record<string, number> = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1, J:8, K:5,
  L:1, M:3, N:1, O:1, P:3, Q:10, R:1, S:1, T:1, U:1, V:4,
  W:4, X:8, Y:4, Z:10,
};

// ── Progress Labels ──
export const PROGRESS_LABELS: Record<string, string> = {
  live: '✅ Live',
  'in-progress': '🔨 Building',
  planned: '📋 Planned',
};
