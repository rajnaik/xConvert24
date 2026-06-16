/**
 * Memory WordBench — Core utility functions
 * Extracted from index.astro for maintainability.
 * These are pure functions that operate on localStorage data.
 */

export const ACHIEVEMENTS_KEY = 'scbAchievements';

export interface Achievement {
  word: string;
  meaning: string;
  category?: string;
  dateAdded?: string;
}

/** Scrabble letter scores */
export const LETTER_SCORES: Record<string, number> = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
  N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10
};

/** Calculate Scrabble score for a word */
export function wordScore(word: string): number {
  return word.split('').reduce((sum, ch) => sum + (LETTER_SCORES[ch.toUpperCase()] || 0), 0);
}

/** Escape HTML special characters */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Get achievements from localStorage with migration support */
export function getAchievements(): Achievement[] {
  try {
    const data = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
    if (data.length > 0 && typeof data[0] === 'string') {
      const migrated = data.map((w: string) => ({ word: w, meaning: '', category: 'manual', dateAdded: '' })).reverse();
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    let needsMigration = false;
    const migrated = data.map((a: any) => {
      if (!a.category) { needsMigration = true; return { ...a, category: 'manual' }; }
      return a;
    });
    if (needsMigration) localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(migrated));
    return migrated;
  } catch { return []; }
}

/** Get list of saved words */
export function getAchievedWords(): string[] {
  return getAchievements().map(a => a.word);
}

/** Get category counts */
export function getCategories(): { name: string; count: number }[] {
  const all = getAchievements();
  const cats: Record<string, number> = {};
  all.forEach(a => { const c = a.category || 'manual'; cats[c] = (cats[c] || 0) + 1; });
  return Object.entries(cats).map(([name, count]) => ({ name, count }));
}

/** Get or create anonymous UID */
export function getOrCreateUid(): string {
  let uid = localStorage.getItem('swf-uid');
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem('swf-uid', uid);
  }
  return uid;
}

/** Save achievements to localStorage and sync to server */
export function saveAchievements(achievements: Achievement[], dictionary: string = 'sowpods'): void {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  const uid = getOrCreateUid();
  fetch('/api/scrabble-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, achievements, dictionary }),
  }).catch(() => {});
}

/** Fetch word meaning from local dict or DictionaryAPI */
export async function fetchMeaning(word: string, localDict: Record<string, string> = {}): Promise<string> {
  const key = word.toLowerCase();
  if (localDict[key]) return localDict[key];
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${key}`);
    if (!res.ok) return 'Scrabble-legal word (no standard definition available)';
    const data = await res.json();
    const meaning = data[0]?.meanings?.[0];
    const def = meaning?.definitions?.[0]?.definition || '';
    const pos = meaning?.partOfSpeech || '';
    return pos ? `(${pos}) ${def}` : def || 'Scrabble-legal word (no standard definition available)';
  } catch { return 'Scrabble-legal word (no standard definition available)'; }
}

/** Check if a meaning is "real" (not a template/generic meaning) */
export function isRealMeaning(meaning: string): boolean {
  if (!meaning || !meaning.trim()) return false;
  const m = meaning.toLowerCase();
  if (m === 'no meaning saved') return false;
  if (m.includes('scrabble-legal word')) return false;
  if (m.includes('no standard definition')) return false;
  const templates = ['a type of plant found in tropical regions','to move swiftly in a specified direction','a container used for storage','relating to the process of growth','a sound made by striking two objects','to arrange in a particular order','a feeling of deep satisfaction','the outer covering of a seed','to reduce in size or quantity','a tool used for cutting','relating to water or moisture','a method of preparation','to express disapproval strongly','the quality of being bright','a passage between rooms or buildings','to combine separate elements','relating to the earth or soil','a measurement of distance','to make a continuous low sound','a type of fabric or textile'];
  return !templates.includes(m);
}
