// Scrabble tile scores
const TILE_SCORES = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};

function scoreWord(word) {
  let s = 0;
  for (const c of word.toUpperCase()) s += TILE_SCORES[c] || 0;
  return s;
}

// Load dictionary
let WORDS = [];
fetch(chrome.runtime.getURL('data/sowpods-2-7.json'))
  .then(r => r.json())
  .then(w => { WORDS = w; })
  .catch(() => {});

// Find all valid words from given letters
function findWords(letters) {
  const rack = letters.toUpperCase().split('');
  const blanks = rack.filter(c => c === '?').length;
  const realTiles = rack.filter(c => c !== '?');
  
  const results = [];
  
  for (const word of WORDS) {
    if (canMakeWord(word.toUpperCase(), realTiles, blanks)) {
      results.push({ word, score: scoreWord(word) });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 50); // Top 50
}

function canMakeWord(word, tiles, blanks) {
  const available = [...tiles];
  let blanksUsed = 0;
  
  for (const letter of word) {
    const idx = available.indexOf(letter);
    if (idx !== -1) {
      available.splice(idx, 1);
    } else if (blanksUsed < blanks) {
      blanksUsed++;
    } else {
      return false;
    }
  }
  return true;
}
