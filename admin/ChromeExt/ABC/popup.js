// Google Analytics — Measurement Protocol
const GA_ID = 'G-XDDRM8BN29';
const GA_SECRET = '';

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

trackEvent('extension_popup_opened');

const selectorInput = document.getElementById('selector');
const intervalHours = document.getElementById('interval-hours');
const intervalMins = document.getElementById('interval-mins');
const intervalSecs = document.getElementById('interval-secs');
function getIntervalSeconds() { return (parseInt(intervalHours.value) || 0) * 3600 + (parseInt(intervalMins.value) || 0) * 60 + (parseInt(intervalSecs.value) || 0); }
function setIntervalFields(secs) { intervalHours.value = Math.floor(secs / 3600); intervalMins.value = Math.floor((secs % 3600) / 60); intervalSecs.value = secs % 60; }
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
    if (data.lastInterval) setIntervalFields(data.lastInterval);

    savedList.innerHTML = clickers.map((c, i) => '<div class="saved-item" data-sel="' + c.selector.replace(/"/g, '&quot;') + '" data-int="' + c.interval + '" title="' + (c.url || 'No URL saved').replace(/"/g, '&quot;') + '"><span class="saved-label" style="cursor:pointer;flex:1">' + c.selector + ' (' + c.interval + 's)</span><span class="del" data-idx="' + i + '">&times;</span></div>').join('') || '<div style="color:#636366;font-size:11px;text-align:center">No saved items</div>';

    savedList.querySelectorAll('.saved-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('del')) return;
        const sel = item.getAttribute('data-sel');
        const int = item.getAttribute('data-int');
        if (sel) {
          selectorInput.value = sel;
          setIntervalFields(parseInt(int) || 5);
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
      setIntervalFields(data.activeClicker.interval);
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';

      // Show which tab it's running on
      try {
        chrome.tabs.get(data.activeClicker.tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            statusEl.textContent = 'Target tab closed';
            statusEl.className = 'status status-inactive';
            chrome.storage.local.remove('activeClicker');
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
          } else {
            const tabTitle = tab.title ? tab.title.slice(0, 30) : 'Tab #' + tab.id;
            statusEl.textContent = '✓ Running on: ' + tabTitle;
            statusEl.className = 'status status-active';
            startCountdown(data.activeClicker.interval);
          }
        });
      } catch {
        startCountdown(data.activeClicker.interval);
      }
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
  function formatTime(s) {
    if (s >= 3600) return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm ' + (s%60) + 's';
    if (s >= 60) return Math.floor(s/60) + 'm ' + (s%60) + 's';
    return s + 's';
  }
  function update() {
    const el = document.getElementById('status');
    if (el && el.className.includes('status-active')) {
      const base = el.textContent.split(' — ')[0];
      el.textContent = base + ' — next in ' + formatTime(remaining);
    }
    remaining--;
    if (remaining < 0) remaining = seconds;
  }
  update();
  countdownInterval = setInterval(update, 1000);
}

function stopCountdown() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

// Test click — resets state to new selector
testBtn.addEventListener('click', async () => {
  // Stop any active clicker first
  stopCountdown();
  const activeData = await chrome.storage.local.get(['activeClicker']);
  if (activeData.activeClicker) {
    chrome.runtime.sendMessage({ action: 'stop', tabId: activeData.activeClicker.tabId });
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    statusEl.textContent = 'Idle';
    statusEl.className = 'status status-inactive';
  }

  trackEvent('test_click', { selector: selectorInput.value });
  testResult.textContent = 'Testing...';
  testResult.className = 'test-result test-fail';
  testResult.style.display = 'block';
  const selector = selectorInput.value.trim();
  // Save interval when testing
  const testInterval = getIntervalSeconds() || 5;
  chrome.storage.local.set({ lastSelector: selector, lastInterval: testInterval });
  if (!selector) {
    selectorInput.classList.add('error');
    selectorInput.focus();
    testResult.textContent = '[X] Enter a selector first';
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
  } else if (result.clicked) {
    testResult.textContent = '[OK] Click successful! Found <' + result.tag.toLowerCase() + '> "' + result.text + '"';
    testResult.className = 'test-result test-pass';
    selectorInput.classList.remove('error');
    const pageUrl = tab.url || '';
    const int = getIntervalSeconds() || 5;
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

// Start clicking — sends to background worker
startBtn.addEventListener('click', async () => {
  trackEvent('start_click', { selector: selectorInput.value, interval: getIntervalSeconds() });
  const selector = selectorInput.value.trim();
  const interval = getIntervalSeconds() || 5;

  if (!selector) { selectorInput.classList.add('error'); selectorInput.focus(); return; }
  if (interval < 1 || interval > 86400) { alert('Interval must be 1 second to 24 hours'); return; }

  let tab;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = tabs[0];
    if (!tab || !tab.id) throw new Error('No active tab');
    const url = tab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
      testResult.textContent = '[FAIL] Cannot run on this page';
      testResult.className = 'test-result test-fail';
      testResult.style.display = 'block';
      return;
    }
  } catch (err) {
    testResult.textContent = '[FAIL] Navigate to a webpage first';
    testResult.className = 'test-result test-fail';
    testResult.style.display = 'block';
    return;
  }

  // Verify element exists
  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel) => { const el = document.querySelector(sel); if (!el) return null; return el.textContent?.trim().slice(0, 40) || el.tagName; },
      args: [selector],
    });
  } catch (err) {
    testResult.textContent = '[FAIL] Cannot access this page';
    testResult.className = 'test-result test-fail';
    testResult.style.display = 'block';
    return;
  }

  const elText = results[0]?.result;
  if (!elText) {
    testResult.textContent = '[FAIL] Element not found: "' + selector + '"';
    testResult.className = 'test-result test-fail';
    testResult.style.display = 'block';
    selectorInput.classList.add('error');
    return;
  }

  selectorInput.classList.remove('error');

  // Save to clickers list
  chrome.storage.local.get(['clickers'], (data) => {
    const clickers = data.clickers || [];
    if (!clickers.find(c => c.selector === selector)) {
      clickers.push({ selector, interval, url: tab.url || '' });
      chrome.storage.local.set({ clickers });
    }
  });

  // Tell background worker to start
  chrome.runtime.sendMessage({ action: 'start', tabId: tab.id, selector, interval }, () => {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    const tabTitle = tab.title ? tab.title.slice(0, 30) : 'Tab #' + tab.id;
    statusEl.textContent = '✓ Running on: ' + tabTitle;
    statusEl.className = 'status status-active';
    testResult.textContent = '[OK] Running — clicking "' + (elText || selector) + '" every ' + interval + 's';
    testResult.className = 'test-result test-pass';
    testResult.style.display = 'block';
    startCountdown(interval);
    chrome.storage.local.set({ lastSelector: selector, lastInterval: interval });
    loadSaved();
  });
});

// Stop
stopBtn.addEventListener('click', async () => {
  stopCountdown();
  const data = await chrome.storage.local.get(['activeClicker']);
  const tabId = data.activeClicker?.tabId;
  chrome.runtime.sendMessage({ action: 'stop', tabId }, () => {
    statusEl.textContent = 'Stopped';
    statusEl.className = 'status status-inactive';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    testResult.style.display = 'none';
    loadSaved();
  });
});

// Clear error on input
selectorInput.addEventListener('input', () => { selectorInput.classList.remove('error'); });

// Auto-save on blur
selectorInput.addEventListener('blur', () => {
  const sel = selectorInput.value.trim();
  const int = getIntervalSeconds() || 5;
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

// Sync countdown with actual clicks from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "clicked") {
    chrome.storage.local.get(["activeClicker"], (data) => {
      if (data.activeClicker) {
        stopCountdown();
        startCountdown(data.activeClicker.interval);
      }
    });
  }
});loadSaved();
