const tilesRow = document.getElementById('tiles-row');
const resultsArea = document.getElementById('results-area');

// Create 7 tile input boxes
for (let i = 0; i < 7; i++) {
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 1;
  input.className = 'tile-input';
  input.dataset.idx = i;
  tilesRow.appendChild(input);
}

const inputs = tilesRow.querySelectorAll('.tile-input');

// Navigation between tiles
inputs.forEach((input, idx) => {
  input.addEventListener('input', () => {
    if (input.value && idx < 6) inputs[idx + 1].focus();
    solve();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && idx > 0) {
      inputs[idx - 1].focus();
    }
  });
});

// Check for prefilled letters from context menu
chrome.storage.local.get(['prefillLetters'], (data) => {
  if (data.prefillLetters) {
    const letters = data.prefillLetters.split('');
    letters.forEach((l, i) => { if (i < 7) inputs[i].value = l; });
    chrome.storage.local.remove('prefillLetters');
    solve();
  }
});

function getLetters() {
  return Array.from(inputs).map(i => i.value.toUpperCase()).join('');
}

function solve() {
  const letters = getLetters();
  if (letters.length < 2) {
    resultsArea.innerHTML = '<div class="empty">Enter at least 2 letters</div>';
    return;
  }

  if (WORDS.length === 0) {
    resultsArea.innerHTML = '<div class="empty">Loading dictionary...</div>';
    setTimeout(solve, 500);
    return;
  }

  const results = findWords(letters);
  
  if (results.length === 0) {
    resultsArea.innerHTML = '<div class="empty">No words found with those letters</div>';
    return;
  }

  resultsArea.innerHTML = `
    <div class="results-header">${results.length} words found (top 50 by score)</div>
    <div class="results">
      ${results.map(r => `
        <div class="word-row" title="Click to copy">
          <span class="word-text">${r.word}</span>
          <span class="word-score">${r.score} pts</span>
        </div>
      `).join('')}
    </div>
  `;

  // Click to copy
  resultsArea.querySelectorAll('.word-row').forEach(row => {
    row.addEventListener('click', () => {
      const word = row.querySelector('.word-text').textContent;
      navigator.clipboard.writeText(word.toUpperCase());
      row.style.background = '#065f46';
      setTimeout(() => row.style.background = '', 500);
    });
  });
}

// Focus first input on open
inputs[0].focus();
