/**
 * Post-process AI coaching output to fix impossible challenges.
 * The AI sometimes generates challenges like "solve in 1 attempt or fewer"
 * which is impossible in a deduction game. This function catches and replaces them.
 */
export function sanitizeChallenge(text: string): string {
  // Pattern: "N puzzles/games in 1 attempt/guess or fewer/less"
  text = text.replace(
    /(\d+)\s*(puzzles?|games?|anagrams?|rounds?)\s+in\s+[12]\s+(attempt|guess|try)(s?)\s+(or\s+fewer|or\s+less)/gi,
    '$1 $2 in 3 or fewer attempts each'
  );

  // Pattern: "in 1 attempt or fewer" / "in 2 attempts or fewer" (standalone)
  text = text.replace(
    /in\s+[12]\s+(attempt|guess|try)(s?)\s+(or\s+fewer|or\s+less)/gi,
    'in 3 or fewer attempts'
  );

  // Pattern: "1 or fewer attempts/guesses"
  text = text.replace(
    /[12]\s+or\s+fewer\s+(attempts?|guesses?|tries)/gi,
    '3 or fewer attempts'
  );

  // Pattern: "solve in 1 attempt" / "solve in 1 guess" (without "or fewer")
  text = text.replace(
    /solve\s+(.*?)in\s+1\s+(attempt|guess|try)\b/gi,
    'solve $1in 3 or fewer attempts'
  );

  // Pattern: "Reward: +P Stars" (broken placeholder)
  text = text.replace(
    /Reward:\s*\+P\s+Stars/gi,
    'Reward: ⭐ Stars'
  );

  return text;
}
