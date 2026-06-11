// Context menu — right-click highlighted text to find Scrabble words
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "swf-find-words",
    title: "Find Scrabble words with \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "swf-find-words" && info.selectionText) {
    const letters = info.selectionText.replace(/[^a-zA-Z?]/g, '').slice(0, 7);
    chrome.storage.local.set({ prefillLetters: letters });
    chrome.action.openPopup();
  }
});
