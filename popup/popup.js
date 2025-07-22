// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
  const micIcon = document.querySelector('.mic-icon');
  const voiceBtn = document.getElementById('voice-fill-btn');
  const status = document.getElementById('status');

  async function triggerVoiceFill() {
    status.textContent = 'Requesting voice fill...';
    // Send a message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'triggerVoiceFill' },
          (response) => {
            if (chrome.runtime.lastError) {
              status.textContent = 'Could not start voice fill on this page.';
            } else {
              status.textContent = 'Voice fill started!';
            }
            setTimeout(() => { status.textContent = ''; }, 1500);
          }
        );
      }
    });
  }

  micIcon.addEventListener('click', triggerVoiceFill);
  voiceBtn.addEventListener('click', triggerVoiceFill);
}); 