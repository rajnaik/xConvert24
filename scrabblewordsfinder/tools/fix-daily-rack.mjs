#!/usr/bin/env node
/**
 * fix-daily-rack.mjs
 * 
 * Re-solves all daily_rack entries from a given start date onwards.
 * Checks each rack against the SOWPODS dictionary and finds the actual
 * highest-scoring word that can be made from the rack's letters.
 * 
 * Usage:
 *   node tools/fix-daily-rack.mjs
 * 
 * Then apply the generated SQL:
 *   npx wrangler d1 execute DB --remote --file=/tmp/fix-daily-rack.sql
 */

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

// Scrabble letter values
const LETTER_VALUES = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1, J:8, K:5, L:1, M:3,
  N:1, O:1, P:3, Q:10, R:1, S:1, T:1, U:1, V:4, W:4, X:8, Y:4, Z:10
};

function wordScore(word) {
  return [...word.toUpperCase()].reduce((sum, c) => sum + (LETTER_VALUES[c] || 0), 0);
}

function canMake(word, rack) {
  const available = [...rack.toUpperCase()];
  for (const letter of word.toUpperCase()) {
    const idx = available.indexOf(letter);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

// Load dictionary
console.log('Loading SOWPODS dictionary...');
const dict2to7 = JSON.parse(readFileSync('public/data/sowpods-2-7.json', 'utf8'));
const dict8to15 = JSON.parse(readFileSync('public/data/sowpods-8-15.json', 'utf8'));
const allWords = [...dict2to7, ...dict8to15];
console.log(`Loaded ${allWords.length} words`);

// Read the rack data exported from DB
// Run this first:
//   cd scrabblewordsfinder
//   npx wrangler d1 execute DB --remote --command "SELECT id, date, rack, best_word, best_score FROM daily_rack WHERE date >= '2026-07-19' ORDER BY date;" --json > /tmp/daily-rack-export.json
const exportFile = '/tmp/daily-rack-export.json';
let rows;
try {
  const raw = readFileSync(exportFile, 'utf8');
  const parsed = JSON.parse(raw);
  // wrangler --json format: array of { results: [...] }
  rows = parsed[0]?.results || parsed;
  console.log(`Loaded ${rows.length} rack entries to fix`);
} catch (e) {
  console.error(`\nERROR: Could not read ${exportFile}`);
  console.error('First export the data:\n');
  console.error('  cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder');
  console.error('  npx wrangler d1 execute DB --remote --command "SELECT id, date, rack, best_word, best_score FROM daily_rack WHERE date >= \'2026-07-19\' ORDER BY date;" --json > /tmp/daily-rack-export.json\n');
  process.exit(1);
}

// Simple meanings for common words (fallback)
function getMeaning(word) {
  const meanings = {
    'VOLUME': 'The amount of space occupied by a substance',
    'MOVER': 'A person or thing that moves',
    'LOVER': 'A person who loves someone',
    'VOMIT': 'To eject matter from the stomach',
    'QUAY': 'A wharf for loading and unloading ships',
  };
  return meanings[word.toUpperCase()] || 'A valid word in the SOWPODS Scrabble dictionary';
}

// Solve each rack
const fixes = [];
let fixed = 0, alreadyCorrect = 0, unsolvable = 0;

for (const row of rows) {
  const { id, date, rack, best_word, best_score } = row;
  
  if (!rack || rack.length < 2) {
    unsolvable++;
    continue;
  }

  // Check if current best_word actually can be made from rack
  if (best_word && best_word !== 'N/A' && canMake(best_word, rack)) {
    // Verify it's in dictionary
    if (allWords.includes(best_word.toUpperCase())) {
      alreadyCorrect++;
      continue;
    }
  }

  // Find the actual best word
  let bestWord = '';
  let bestScore = 0;

  for (const word of allWords) {
    if (word.length > rack.length) continue;
    if (canMake(word, rack)) {
      const score = wordScore(word);
      if (score > bestScore) {
        bestScore = score;
        bestWord = word.toUpperCase();
      }
    }
  }

  if (bestWord) {
    const meaning = getMeaning(bestWord);
    const escapedMeaning = meaning.replace(/'/g, "''");
    fixes.push(`UPDATE daily_rack SET best_word = '${bestWord}', best_score = ${bestScore}, meaning = '${escapedMeaning}' WHERE date = '${date}';`);
    fixed++;
    console.log(`  ${date}: ${rack} → ${bestWord} (${bestScore} pts) [was: ${best_word || 'empty'}]`);
  } else {
    // Truly unsolvable rack
    fixes.push(`UPDATE daily_rack SET best_word = 'N/A', best_score = 0, meaning = '' WHERE date = '${date}';`);
    unsolvable++;
    console.log(`  ${date}: ${rack} → N/A (unsolvable)`);
  }
}

// Write SQL file
const sql = fixes.join('\n');
writeFileSync('/tmp/fix-daily-rack.sql', sql);

console.log(`\n--- Summary ---`);
console.log(`Already correct: ${alreadyCorrect}`);
console.log(`Fixed: ${fixed}`);
console.log(`Unsolvable (N/A): ${unsolvable}`);
console.log(`Total processed: ${rows.length}`);
console.log(`\nSQL written to: /tmp/fix-daily-rack.sql`);
console.log(`\nTo apply:`);
console.log(`  cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder`);
console.log(`  echo "Y" | npx wrangler d1 execute DB --remote --file=/tmp/fix-daily-rack.sql`);
