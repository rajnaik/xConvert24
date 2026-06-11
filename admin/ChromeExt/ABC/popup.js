// Google Analytics — Measurement Protocol (no cookies, privacy-friendly)
const GA_ID = 'G-XDDRM8BN29'; // Replace with your GA4 Measurement ID
const GA_SECRET = ''; // Replace with API secret from GA4 admin

function trackEvent(eventName, params = {}) {
  try {
    if (!GA_ID || GA_ID === 'G-XXXXXXXXXX' || !GA_SECRET) return;
    const clientId = localStorage.getItem('abc_ga_cid') || (() => {
      const id = crypto.randomUUID();
      localStorage.setItem('abc_ga_cid', id);
      return id;
    })();
    fetch('https://www.google-analytics.com/mp/collect?measurement_id=' + GA_ID + '&api_secret=' + GA_SECRET, {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, events: [{ name: eventName, params }] }),
    }).catch(() => {});
  } catch {}
}

// Track popup open
trackEvent('extension_popup_opened');

const selectorInput = document.getElementById('selector');
const intervalInput = document.getElementById('interval');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const testBtn = document.getElementById('test-btn');
const testResult = document.getElementById('test-result');
const statusEl = document.getElementById('status');
const savedList = document.getElementById('saved-list');

let countdownInterval = null;

function loadSaved() {
  chrome.storage.local.get(['clickers', 'activeClicker', 'lastSelector', 'lastInterval'], (data) => {
    const clickers = data.clickers || [];

    if (data.lastSelector) selectorInput.value = data.lastSelector;
    if (data.lastInterval) intervalInput.value = data.lastInterval;

    savedList.innerHTML = clickers.map((c, i) => '<div class="saved-item" data-sel="' + c.selector.replace(/"/g, '&quot;') + '" data-int="' + c.interval + '" title="' + (c.url || 'No URL saved').replace(/"/g, '&quot;') + '"><span class="saved-label" style="cursor:pointer;flex:1">' + c.selector + ' (' + c.interval + 's)</span><span class="del" data-idx="' + i + '">&times;</span></div>').join('') || '<div style="color:#636366;font-size:11px;text-align:center">No saved items</div>';

    // Click saved item to load into selector
    savedList.querySelectorAll('.saved-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('del')) return;
        const sel = item.getAttribute('data-sel');
        const int = item.getAttribute('data-int');
        if (sel) {
          selectorInput.value = sel;
          intervalInput.value = int || '5';
          chrome.storage.local.set({ lastSelector: sel, lastInterval: parseInt(int) || 5 });
        }
      });
    });

    savedList.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        clickers.splice(idx, 1);
        chrome.storage.local.set({ clickers }, loadSaved);
      });
    });

    if (data.activeClicker) {
      selectorInput.value = data.activeClicker.selector;
      intervalInput.value = data.activeClicker.interval;
      // Check if current tab is accessible
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url || '';
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
          statusEl.textContent = 'Active (switch to target page)';
          statusEl.className = 'status status-inactive';
          startBtn.style.display = 'none';
          stopBtn.style.display = 'block';
        } else {
          startBtn.style.display = 'none';
          stopBtn.style.display = 'block';
          startCountdown(data.activeClicker.interval);
        }
      });
    } else {
      statusEl.textContent = 'Idle';
      statusEl.className = 'status status-inactive';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
    }
  });
}

function startCountdown(seconds) {
  let remaining = seconds;
  if (countdownInterval) clearInterval(countdownInterval);
  function update() {
    statusEl.textContent = `✓ Next click in ${remaining}s`;
    statusEl.className = 'status status-active';
    remaining--;
    if (remaining < 0) remaining = seconds;
  }
  update();
  countdownInterval = setInterval(update, 1000);
}

function stopCountdown() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

// Test click
testBtn.addEventListener('click', async () => {
  trackEvent('test_click', { selector: selectorInput.value });
  testResult.textContent = 'Testing...';
  testResult.className = 'test-result test-fail';
  testResult.style.display = 'block';
  const selector = selectorInput.value.trim();
  if (!selector) {
    selectorInput.classList.add('error');
    selectorInput.focus();
    testResult.textContent = '[X] Enter a selector first';
    testResult.className = 'test-result test-fail';
    return;
  }

  selectorInput.classList.remove('error');

  let tab, results;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = tabs[0];
    if (!tab || !tab.id) throw new Error('no tab');
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel) => {
        const el = document.querySelector(sel);
        if (!el) return { found: false };
        try {
          el.click();
          return { found: true, clicked: true, tag: el.tagName, text: el.textContent?.trim().slice(0, 40) || '', id: el.id || '' };
        } catch (e) {
          return { found: true, clicked: false, error: e.message };
        }
      },
      args: [selector],
    });
  } catch (err) {
    testResult.textContent = '[FAIL] Navigate to a normal webpage first';
    testResult.className = 'test-result test-fail';
    return;
  }

  const result = results[0]?.result;

  if (!result || !result.found) {
    testResult.textContent = '[FAIL] Element NOT found: "' + selector + '"';
    testResult.className = 'test-result test-fail';
    selectorInput.classList.add('error');
    selectorInput.focus();
  } else if (result.clicked) {
    testResult.textContent = '[OK] Click successful! Found <' + result.tag.toLowerCase() + '> "' + result.text + '"';
    testResult.className = 'test-result test-pass';
    selectorInput.classList.remove('error');
    // Save to clickers list only after successful test
    const pageUrl = tab.url || '';
    const int = parseInt(intervalInput.value) || 5;
    chrome.storage.local.get(['clickers'], (data) => {
      const clickers = data.clickers || [];
      if (!clickers.find(c => c.selector === selector)) {
        clickers.push({ selector, interval: int, url: pageUrl });
        chrome.storage.local.set({ clickers, lastSelector: selector, lastInterval: int }, loadSaved);
      } else {
        chrome.storage.local.set({ lastSelector: selector, lastInterval: int });
      }
    });
  } else {
    testResult.textContent = '[FAIL] Found but click failed: ' + result.error;
    testResult.className = 'test-result test-fail';
  }
});

// Start clicking
startBtn.addEventListener('click', async () => {
  trackEvent('start_click', { selector: selectorInput.value, interval: intervalInput.value });
  const selector = selectorInput.value.trim();
  const interval = parseInt(intervalInput.value) || 5;

  if (!selector) { selectorInput.classList.add('error'); selectorInput.focus(); return; }
  if (interval < 1 || interval > 60) { alert('Interval must be 1-60 seconds'); return; }

  let tab;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = tabs[0];
    if (!tab || !tab.id) throw new Error('No active tab');
  } catch (err) {
    testResult.textContent = '[FAIL] Navigate to a webpage first';
    testResult.className = 'test-result test-fail';
    return;
  }

  // Verify element exists first
  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel) => { return !!document.querySelector(sel); },
      args: [selector],
    });
  } catch (err) {
    testResult.textContent = '[FAIL] Cannot access this page (try a normal website)';
    testResult.className = 'test-result test-fail';
    return;
  }

  if (!results[0]?.result) {
    testResult.textContent = '[FAIL] Cannot start — element not found: "' + selector + '"';
    testResult.className = 'test-result test-fail';
    selectorInput.classList.add('error');
    selectorInput.focus();
    return;
  }

  selectorInput.classList.remove('error');
  

  // Save with URL
  const clicker = { selector, interval, url: tab.url || '' };
  chrome.storage.local.get(['clickers'], (data) => {
    const clickers = data.clickers || [];
    if (!clickers.find(c => c.selector === selector)) {
      clickers.push(clicker);
    }
    chrome.storage.local.set({ clickers, activeClicker: clicker, lastSelector: selector, lastInterval: interval });
  });

  // Inject
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: startAutoClick,
    args: [selector, interval * 1000],
  });

  startBtn.style.display = 'none';
  stopBtn.style.display = 'block';
  testResult.textContent = '[OK] Running — clicking "' + selector + '" every ' + interval + 's';
  testResult.className = 'test-result test-pass';
  setTimeout(() => startCountdown(interval), 500);
  loadSaved();
});

// Stop
stopBtn.addEventListener('click', async () => {
  chrome.storage.local.remove('activeClicker');
  stopCountdown();
  try { const tabs = await chrome.tabs.query({ active: true, currentWindow: true }); if(tabs[0]) chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: stopAutoClick }); } catch {}
  statusEl.textContent = 'Stopped';
  statusEl.className = 'status status-inactive';
  startBtn.style.display = 'block';
  stopBtn.style.display = 'none';
  testResult.className = 'test-result';
  testResult.style.display = 'none';
  loadSaved();
});

// Injected functions
function startAutoClick(selector, intervalMs) {
  if (window.__autoClickerInterval) clearInterval(window.__autoClickerInterval);
  window.__autoClickerInterval = setInterval(() => {
    const el = document.querySelector(selector);
    if (el) { el.click(); console.log('[Auto Clicker] Clicked:', selector, new Date().toLocaleTimeString()); }
    else { console.log('[Auto Clicker] Not found:', selector); }
  }, intervalMs);
  console.log('[Auto Clicker] Started:', selector, 'every', intervalMs/1000, 's');
}

function stopAutoClick() {
  if (window.__autoClickerInterval) { clearInterval(window.__autoClickerInterval); window.__autoClickerInterval = null; console.log('[Auto Clicker] Stopped'); }
}

// Clear error on input
selectorInput.addEventListener('input', () => { selectorInput.classList.remove('error'); });

// Auto-save on blur (no duplicates)
selectorInput.addEventListener('blur', () => {
  const sel = selectorInput.value.trim();
  const int = parseInt(intervalInput.value) || 5;
  if (!sel) return;
  chrome.storage.local.set({ lastSelector: sel, lastInterval: int });
  chrome.storage.local.get(['clickers'], (data) => {
    const clickers = data.clickers || [];
    if (!clickers.find(c => c.selector === sel)) {
      clickers.push({ selector: sel, interval: int, url: '' });
      chrome.storage.local.set({ clickers }, loadSaved);
    }
  });
});

loadSaved();
