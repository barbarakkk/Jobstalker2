// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'open_login') {
    chrome.tabs.create({ url: 'https://jobstalker.netlify.app/login' });
    sendResponse({ success: true });
  }
  if (request.action === 'store_token') {
    chrome.storage.sync.set({ jobstalker_token: request.token }, () => {
      sendResponse({ success: true });
    });
    // Return true to indicate async response
    return true;
  }
}); 