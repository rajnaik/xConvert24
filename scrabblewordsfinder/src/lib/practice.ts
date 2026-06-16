/**
 * WordBench Practice — Logging utility
 * Logs practiced words to the server DB during auto-play sessions.
 */

import { ACHIEVEMENTS_KEY } from './wordbench';

/**
 * Log a practiced word to the server.
 * Tries to get the latest meaning from localStorage if the provided one is empty.
 */
export function logPracticeWord(word: string, meaning: string = ''): void {
  const uid = localStorage.getItem('swf-uid') || '';
  if (!word || !uid) return;

  // If meaning is empty, try fetching from localStorage
  let finalMeaning = meaning;
  if (!finalMeaning) {
    try {
      const saved = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
      const match = saved.find((a: any) => a.word === word);
      if (match?.meaning) finalMeaning = match.meaning;
    } catch {}
  }

  fetch('/api/wordbench-practice/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: uid, word, meaning: finalMeaning })
  }).catch(() => {});
}

/**
 * Get the auto-play speed from localStorage (in milliseconds).
 * Falls back to 5000ms (5 seconds) if not set.
 */
export function getAutoPlaySpeed(): number {
  const saved = localStorage.getItem('swf-fc-speed');
  return saved ? parseInt(saved) * 1000 : 5000;
}

/**
 * Save auto-play speed to localStorage.
 */
export function saveAutoPlaySpeed(seconds: number): void {
  localStorage.setItem('swf-fc-speed', String(seconds));
}
