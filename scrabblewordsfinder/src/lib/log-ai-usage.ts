/**
 * Log an AI usage event to the chatusage table.
 * Called from coaching endpoints to ensure all AI calls are counted.
 * Fire-and-forget — errors are silently ignored.
 */
export async function logAiUsage(db: any, opts: {
  userId: string;
  source: string; // 'quiz-coach' | 'rack-coach' | 'anagram-coach' | 'cab-coach'
  model: string;
  responseLength: number;
}): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO chatusage (user_id, user_message, bot_response, model, tokens_used, response_ms, ip_address, session_id, success, keyword)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      opts.userId,
      `[${opts.source}] Coaching request`,
      `[${opts.source}] ${opts.responseLength} chars`,
      opts.model,
      0,
      0,
      '',
      '',
      1,
      opts.source
    ).run();
  } catch {
    // Non-critical — don't block the response
  }
}
