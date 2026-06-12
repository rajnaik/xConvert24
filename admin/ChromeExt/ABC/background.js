// Background service worker — handles persistent auto-clicking via alarms

const ALARM_NAME = 'auto-clicker-tick';

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const data = await chrome.storage.local.get(['activeClicker']);
  if (!data.activeClicker) {
    // No active clicker — clear alarm
    chrome.alarms.clear(ALARM_NAME);
    return;
  }

  const { tabId, selector } = data.activeClicker;

  try {
    // Verify tab still exists
    const tab = await chrome.tabs.get(tabId);
    if (!tab) throw new Error('Tab gone');

    // Inject click into the stored tab
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.click();
          console.log('[Auto Clicker] Clicked:', sel, new Date().toLocaleTimeString());
        // Notify popup to reset countdown
        chrome.runtime.sendMessage({ action: "clicked", selector: sel }).catch(() => {});        } else {
          console.log('[Auto Clicker] Element not found:', sel);
        }
      },
      args: [selector],
    });
  } catch (err) {
    // Tab closed or navigated to restricted page — stop
    console.log('[Auto Clicker] Tab unavailable, stopping:', err.message);
    await chrome.storage.local.remove('activeClicker');
    chrome.alarms.clear(ALARM_NAME);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'start') {
    const { tabId, selector, interval } = msg;
    // Store active clicker with tab ID
    chrome.storage.local.set({
      activeClicker: { tabId, selector, interval, startedAt: Date.now() }
    });
    // Create repeating alarm (minimum 0.5 minutes for chrome.alarms)
    // For sub-30s intervals, we use a 0.5 min alarm and inject setInterval as backup
    if (interval >= 30) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: interval / 60 });
    } else {
      // For short intervals, use alarm every 0.5 min + inject setInterval in the tab
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });
      // Also inject persistent setInterval in the tab
      chrome.scripting.executeScript({
        target: { tabId },
        func: (sel, ms) => {
          if (window.__autoClickerInterval) clearInterval(window.__autoClickerInterval);
          window.__autoClickerInterval = setInterval(() => {
            const el = document.querySelector(sel);
            if (el) { el.click(); console.log('[Auto Clicker] Clicked:', sel, new Date().toLocaleTimeString()); }
        // Notify popup to reset countdown
        chrome.runtime.sendMessage({ action: "clicked", selector: sel }).catch(() => {});          }, ms);
        },
        args: [selector, interval * 1000],
      });
    }
    sendResponse({ success: true });
  }

  if (msg.action === 'stop') {
    chrome.storage.local.remove('activeClicker');
    chrome.alarms.clear(ALARM_NAME);
    // Also stop any injected interval in the tab
    if (msg.tabId) {
      chrome.scripting.executeScript({
        target: { tabId: msg.tabId },
        func: () => {
          if (window.__autoClickerInterval) { clearInterval(window.__autoClickerInterval); window.__autoClickerInterval = null; }
        },
      }).catch(() => {});
    }
    sendResponse({ success: true });
  }

  if (msg.action === 'status') {
    chrome.storage.local.get(['activeClicker'], (data) => {
      sendResponse(data.activeClicker || null);
    });
    return true; // async response
  }
});

// Clean up on tab close
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get(['activeClicker']);
  if (data.activeClicker && data.activeClicker.tabId === tabId) {
    await chrome.storage.local.remove('activeClicker');
    chrome.alarms.clear(ALARM_NAME);
    console.log('[Auto Clicker] Target tab closed, stopped.');
  }
});

// Clean up on tab navigate to restricted URL
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const data = await chrome.storage.local.get(['activeClicker']);
    if (data.activeClicker && data.activeClicker.tabId === tabId) {
      const url = changeInfo.url;
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
        await chrome.storage.local.remove('activeClicker');
        chrome.alarms.clear(ALARM_NAME);
        console.log('[Auto Clicker] Tab navigated to restricted page, stopped.');
      }
    }
  }
});
