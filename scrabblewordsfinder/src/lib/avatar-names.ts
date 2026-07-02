/**
 * Avatar Display Name Generator
 * Generates unique-sounding names from adjective + Scrabble term combos.
 * Maps avatar_id (1-50) to a specific Scrabble term, paired with a random adjective.
 */

const ADJECTIVES = [
  'Blue', 'Red', 'Silver', 'Golden', 'Amber',
  'Jade', 'Coral', 'Ivory', 'Crimson', 'Violet',
  'Azure', 'Rusty', 'Misty', 'Shadow', 'Storm',
  'Frost', 'Ember', 'Dusty', 'Lucky', 'Swift',
  'Bold', 'Clever', 'Brave', 'Wild', 'Noble',
  'Cosmic', 'Lunar', 'Solar', 'Star', 'Iron',
  'Copper', 'Bronze', 'Steel', 'Crystal', 'Velvet',
  'Thunder', 'Mystic', 'Arctic', 'Tropical', 'Midnight',
];

const SCRABBLE_TERMS = [
  'Bingo', 'Hook', 'Rack', 'Triple', 'Double',
  'Blank', 'Swap', 'Block', 'Stem', 'Leave',
  'Bridge', 'Phoney', 'Tile', 'Bonus', 'Opener',
  'Endgame', 'Crossword', 'Parallel', 'Float', 'Dump',
  'Anchor', 'Premium', 'Exchange', 'Challenge', 'Pass',
  'Vowel', 'Scoring', 'Ladder', 'Stack', 'Spread',
  'Hotspot', 'Turnover', 'Setup', 'Blocker', 'Outplay',
  'Extend', 'Counter', 'Suffix', 'Prefix', 'Anagram',
  'Unplay', 'Overlap', 'Flanker', 'Keeper', 'Burner',
  'Sleeper', 'Clincher', 'Sniper', 'Joker', 'Ace',
];

/**
 * Generate a display name for a given avatar_id.
 * Uses a deterministic-ish approach: the Scrabble term is fixed by avatar_id,
 * the adjective is randomly selected to add variety.
 */
export function generateDisplayName(avatarId: number): string {
  const term = SCRABBLE_TERMS[(avatarId - 1) % SCRABBLE_TERMS.length];
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  return `${adjective} ${term}`;
}

/**
 * Get the Scrabble term name for a given avatar_id (1-indexed).
 */
export function getAnimalName(avatarId: number): string {
  return SCRABBLE_TERMS[(avatarId - 1) % SCRABBLE_TERMS.length];
}

/**
 * Total number of available avatars.
 */
export const TOTAL_AVATARS = 50;
