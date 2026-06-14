#!/usr/bin/env node
/**
 * build-swfdict.mjs
 * 
 * Scrapes definitions for all Scrabble reference panel words from the
 * free dictionary API and saves them as public/data/swfdict.json.
 * 
 * Words that have no API definition get: "Scrabble-legal word (no standard definition available)"
 * 
 * Usage: node scripts/build-swfdict.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load all dictionary words from the JSON files
const sowpods27 = JSON.parse(readFileSync(resolve(ROOT, 'public/data/sowpods-2-7.json'), 'utf8'));
const sowpods815 = JSON.parse(readFileSync(resolve(ROOT, 'public/data/sowpods-8-15.json'), 'utf8'));
const WORDS = [...sowpods27, ...sowpods815];

// Scoring
const scores = { A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10 };
function wordScore(w) { return w.split('').reduce((s, c) => s + (scores[c.toUpperCase()] || 0), 0); }

// Collect all words that appear in reference panels
function collectWords() {
  const set = new Set();

  // Two-letter words (all ~127)
  WORDS.filter(w => w.length === 2).forEach(w => set.add(w.toLowerCase()));

  // Three-letter words (ALL — they're common and most have definitions)
  WORDS.filter(w => w.length === 3).forEach(w => set.add(w.toLowerCase()));

  // Four-letter words (top 100 by score)
  WORDS.filter(w => w.length === 4)
    .sort((a, b) => wordScore(b) - wordScore(a))
    .slice(0, 100)
    .forEach(w => set.add(w.toLowerCase()));

  // Five-letter words (top 80 by score)
  WORDS.filter(w => w.length === 5)
    .sort((a, b) => wordScore(b) - wordScore(a))
    .slice(0, 80)
    .forEach(w => set.add(w.toLowerCase()));

  // Six-letter words (top 50 by score)
  WORDS.filter(w => w.length === 6)
    .sort((a, b) => wordScore(b) - wordScore(a))
    .slice(0, 50)
    .forEach(w => set.add(w.toLowerCase()));

  // Seven-letter words (top 50 — bingo words)
  WORDS.filter(w => w.length === 7)
    .sort((a, b) => wordScore(b) - wordScore(a))
    .slice(0, 50)
    .forEach(w => set.add(w.toLowerCase()));

  // Q without U (all)
  WORDS.filter(w => w.includes('q') && !w.includes('u'))
    .forEach(w => set.add(w.toLowerCase()));

  // Rare letters: top 60 per letter (q, z, x, j)
  for (const letter of ['q', 'z', 'x', 'j']) {
    WORDS.filter(w => w.includes(letter))
      .sort((a, b) => wordScore(b) - wordScore(a))
      .slice(0, 60)
      .forEach(w => set.add(w.toLowerCase()));
  }

  // Top 100 high-scoring words overall
  [...WORDS].sort((a, b) => wordScore(b) - wordScore(a))
    .slice(0, 100)
    .forEach(w => set.add(w.toLowerCase()));

  // Common everyday words players often encounter (SATINE stems, common bingos)
  const commonWords = ['satine','retina','retain','trains','strain','nastier','antsier','retains','stainer','erasion','atonies','senator','treason'];
  commonWords.forEach(w => set.add(w.toLowerCase()));

  return [...set].sort();
}

async function fetchMeaning(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) return null;
    const data = await res.json();
    const meaning = data[0]?.meanings?.[0];
    const def = meaning?.definitions?.[0]?.definition || '';
    const pos = meaning?.partOfSpeech || '';
    return pos ? `(${pos}) ${def}` : def || null;
  } catch { return null; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const words = collectWords();
  console.log(`📖 Building SWF Dictionary for ${words.length} words...`);
  
  const dict = {};
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const meaning = await fetchMeaning(word);
    
    if (meaning) {
      dict[word] = meaning;
      found++;
    } else {
      dict[word] = 'Scrabble-legal word (no standard definition available)';
      notFound++;
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/${words.length} done (${found} found, ${notFound} no def)`);
    }

    // Rate limit: 200ms between requests
    await sleep(200);
  }

  const outPath = resolve(ROOT, 'public/data/swfdict.json');
  writeFileSync(outPath, JSON.stringify(dict, null, 0));

  const sizeKB = (Buffer.byteLength(JSON.stringify(dict)) / 1024).toFixed(1);
  console.log(`\n✅ Done! ${words.length} words → ${outPath}`);
  console.log(`   ${found} with definitions, ${notFound} without (marked as Scrabble-legal)`);
  console.log(`   File size: ${sizeKB} KB`);
}

main();
