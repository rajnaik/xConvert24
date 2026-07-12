/**
 * Lex Query Classifier — Smart Model Routing
 *
 * Categorises incoming chat messages to route them to the appropriate model:
 * - SIMPLE → llama-3.1-8b-instruct-fast (low latency, cheap)
 * - COMPLEX → llama-3.3-70b-instruct-fp8-fast (high quality, deeper analysis)
 *
 * Criteria for COMPLEX:
 * - Multi-turn coaching (quiz, CaB, anagram coaching)
 * - Post-game analysis
 * - Training mode drills (bingo trainer, hook quiz, rack leave drill)
 * - Long messages (>200 chars) suggesting detailed questions
 * - Explicit strategy/analysis keywords
 * - Messages referencing game history or performance
 *
 * Everything else is SIMPLE (definitions, rules, short Q&A, word lookups)
 */

export type QueryComplexity = 'simple' | 'complex';

export interface ClassifierResult {
  complexity: QueryComplexity;
  model: string;
  maxTokens: number;
  reason: string;
}

const MODEL_FAST = '@cf/meta/llama-3.1-8b-instruct-fast';
const MODEL_POWERFUL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/** Keywords that signal complex analysis (case-insensitive) */
const COMPLEX_KEYWORDS = [
  // Strategy deep-dives
  'analyse', 'analyze', 'analysis', 'evaluate', 'assessment',
  'review my game', 'post-game', 'postgame', 'game review',
  // Training modes
  'bingo trainer', 'bingo training', 'train me', 'drill me',
  'hook quiz', 'test me on hooks', 'hook practice',
  'tile countdown', 'tiles remaining', 'what tiles are left',
  'rack leave drill', 'which play is better', 'compare these plays',
  // Coaching requests
  'coach me', 'coaching', 'improve my', 'my weakness',
  'what am i doing wrong', 'why do i keep losing',
  'my stats', 'my history', 'my performance',
  // Multi-step explanations
  'explain in detail', 'deep dive', 'comprehensive',
  'walk me through', 'step by step',
  // EV and advanced concepts
  'expected value', 'rack quality', 'rack ev', 'leave quality',
  'percentile', 'how good is my rack',
  // List/ranking requests (need unique generation without looping)
  'top 10', 'top 20', 'top 30', 'top 40', 'top 50',
  'list of', 'rank the', 'ranked list', 'highest scoring', 'high scoring',
  'best words for', 'give me 20', 'give me 30', 'give me 50',
  // Game transcript
  'here are my moves', 'game transcript', 'i played these words',
];

/** Keywords that signal simple queries (quick answers) */
const SIMPLE_SIGNALS = [
  // Word lookups (handled by dictionary enrichment, just need framing)
  /^(what|is|does|define|meaning)\b.{0,30}$/i,
  // Single words (looking up score/validity)
  /^[A-Za-z]{2,15}$/,
  // Short questions about rules
  /^(how many|what is the|can i|is it|are there)\b.{0,60}$/i,
  // Yes/no questions
  /\?$/,
];

/** Patterns that strongly indicate coaching/complex mode */
const COACHING_PATTERNS = [
  /\[QUIZ COACHING REQUEST\]/i,
  /\[COWS AND BULLS.*COACHING/i,
  /\[ANAGRAM COACHING/i,
  /\[TRAINING MODE/i,
  /\[POST-GAME/i,
  /\[GAME REVIEW/i,
];

/**
 * Classify a user message to determine model routing.
 *
 * @param message - The user's latest message
 * @param conversationLength - Number of messages in the conversation so far
 * @param hasGameContext - Whether the conversation includes game history/stats
 */
export function classifyQuery(
  message: string,
  conversationLength: number = 1,
  hasGameContext: boolean = false,
): ClassifierResult {
  const msg = message.trim();
  const msgLower = msg.toLowerCase();

  // Explicit coaching mode markers (always complex)
  for (const pattern of COACHING_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        complexity: 'complex',
        model: MODEL_POWERFUL,
        maxTokens: 1024,
        reason: 'coaching_mode_marker',
      };
    }
  }

  // Check for complex keywords
  const hasComplexKeyword = COMPLEX_KEYWORDS.some(kw => msgLower.includes(kw));
  if (hasComplexKeyword) {
    return {
      complexity: 'complex',
      model: MODEL_POWERFUL,
      maxTokens: 768,
      reason: 'complex_keyword',
    };
  }

  // Long messages with game context → complex (detailed question)
  if (msg.length > 200 && hasGameContext) {
    return {
      complexity: 'complex',
      model: MODEL_POWERFUL,
      maxTokens: 768,
      reason: 'long_message_with_context',
    };
  }

  // Deep conversations (>6 turns) suggest ongoing coaching → complex
  if (conversationLength > 6 && msg.length > 80) {
    return {
      complexity: 'complex',
      model: MODEL_POWERFUL,
      maxTokens: 768,
      reason: 'deep_conversation',
    };
  }

  // Simple signals — short, direct questions
  for (const pattern of SIMPLE_SIGNALS) {
    if (pattern.test(msg)) {
      return {
        complexity: 'simple',
        model: MODEL_POWERFUL,
        maxTokens: 384,
        reason: 'simple_pattern',
      };
    }
  }

  // Messages under 80 chars with no complex signals → simple
  if (msg.length <= 80) {
    return {
      complexity: 'simple',
      model: MODEL_POWERFUL,
      maxTokens: 384,
      reason: 'short_message',
    };
  }

  // Default: use 70B for ALL queries (better quality, accurate scores)
  return {
    complexity: 'complex',
    model: MODEL_POWERFUL,
    maxTokens: 768,
    reason: 'default_70b',
  };
}

/** Model display names for chatusage logging */
export function getModelDisplayName(model: string): string {
  if (model.includes('70b')) return 'llama-3.3-70b';
  if (model.includes('8b')) return 'llama-3.1-8b';
  return model;
}
