import type { APIRoute } from 'astro';

/**
 * GET /api/public/statistics/ — Scrabble Statistics (public, read-only)
 *
 * Returns pre-computed Scrabble statistics: tile distribution, scoring data,
 * probability reference, and game facts.
 *
 * Cached for 24 hours (static data).
 */

export const prerender = false;

export const GET: APIRoute = async () => {
  const stats = {
    source: 'ScrabbleWordsFinder.com',
    dictionary: {
      sowpods_total_words: 279496,
      twl_total_words: 191852,
      two_letter_words: 127,
      three_letter_words: 1347,
      q_without_u_words: 33,
      longest_word_length: 15,
    },
    tile_bag: {
      total_tiles: 100,
      total_points_in_bag: 187,
      vowels: 42,
      consonants: 56,
      blanks: 2,
      most_common_letter: { letter: 'E', count: 12 },
      rarest_letters: [
        { letter: 'J', count: 1, value: 8 },
        { letter: 'K', count: 1, value: 5 },
        { letter: 'Q', count: 1, value: 10 },
        { letter: 'X', count: 1, value: 8 },
        { letter: 'Z', count: 1, value: 10 },
      ],
    },
    scoring: {
      highest_single_word_theoretical: 1778,
      highest_single_word_theoretical_word: 'OXYPHENBUTAZONE',
      highest_single_turn_recorded: 392,
      average_game_score: 350,
      average_winning_score: 380,
      bingo_bonus: 50,
      highest_2_letter_word: { word: 'QI', score: 11 },
      highest_3_letter_word: { word: 'ZAX', score: 19 },
    },
    probability: {
      chance_of_bingo_rack: 0.12,
      chance_of_drawing_blank: 0.14,
      chance_of_drawing_s: 0.28,
      average_rack_ev_score: 45,
      vowel_ratio_in_bag: 0.42,
    },
    game_facts: {
      board_size: '15x15',
      total_squares: 225,
      premium_squares: {
        triple_word: 8,
        double_word: 17,
        triple_letter: 12,
        double_letter: 24,
      },
      average_game_turns: 12,
      average_game_length_minutes: 45,
      tiles_per_rack: 7,
    },
  };

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
