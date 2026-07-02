/**
 * Download 50 DiceBear Bottts SVGs using Scrabble terms as seeds.
 * Saves to public/avatars/avatar-{1..50}.svg
 * 
 * Run: node scripts/download-bottts.mjs
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

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

const outDir = join(import.meta.dirname, '..', 'public', 'avatars');

async function downloadAvatar(index, seed) {
  const url = `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}&size=128`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch avatar for seed "${seed}": ${res.status}`);
  const svg = await res.text();
  const filePath = join(outDir, `avatar-${index}.svg`);
  writeFileSync(filePath, svg);
  console.log(`✓ avatar-${index}.svg (seed: ${seed})`);
}

async function main() {
  console.log(`Downloading ${SCRABBLE_TERMS.length} Bottts avatars...\n`);
  
  // Download in batches of 5 to avoid rate limiting
  for (let i = 0; i < SCRABBLE_TERMS.length; i += 5) {
    const batch = SCRABBLE_TERMS.slice(i, i + 5).map((seed, j) => 
      downloadAvatar(i + j + 1, seed)
    );
    await Promise.all(batch);
    // Small delay between batches
    if (i + 5 < SCRABBLE_TERMS.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  console.log(`\n✅ Done — ${SCRABBLE_TERMS.length} Bottts SVGs saved to public/avatars/`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
