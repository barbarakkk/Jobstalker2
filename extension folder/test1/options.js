// Load saved settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});

// Load settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get(['openai_api_key'], (result) => {
    if (result.openai_api_key) {
      document.getElementById('openai-key').value = result.openai_api_key;
    }
  });
}

// Save settings to Chrome storage
function saveSettings() {
  const openaiKey = document.getElementById('openai-key').value.trim();
  
  if (!openaiKey) {
    showStatus('Please enter your OpenAI API key.', 'error');
    return;
  }
  
  if (!openaiKey.startsWith('sk-')) {
    showStatus('Please enter a valid OpenAI API key (should start with sk-).', 'error');
    return;
  }
  
  chrome.storage.sync.set({
    openai_api_key: openaiKey
  }, () => {
    showStatus('Settings saved successfully!', 'success');
  });
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  
  // Clear status after 3 seconds
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
}

// Add event listener to save button
document.getElementById('save').addEventListener('click', saveSettings); 