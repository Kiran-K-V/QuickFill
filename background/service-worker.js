// background/service-worker.js
// Service worker for Voice Form Filler extension
// Handles keyboard commands, messaging, and lifecycle events

// Listen for extension lifecycle events
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ServiceWorker] Extension installed:', details);
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[ServiceWorker] Extension started');
});

// Listen for keyboard shortcut commands
debugger;
chrome.commands.onCommand.addListener((command) => {
  if (command === 'trigger-voice-fill') {
    console.log('[ServiceWorker] Voice fill command triggered');
    // Send a message to all tabs to trigger voice fill
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('[ServiceWorker] Error querying tabs:', chrome.runtime.lastError);
        return;
      }
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'triggerVoiceFill' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[ServiceWorker] Error sending message to tab', tab.id, chrome.runtime.lastError);
            } else {
              console.log('[ServiceWorker] Message sent to tab', tab.id, response);
            }
          });
        }
      });
    });
  }
});

// Basic message passing between components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ServiceWorker] Received message:', message, 'from', sender);
  try {
    if (message && message.type === 'ping') {
      sendResponse({ type: 'pong', from: 'service-worker' });
    } else if (message && message.type === 'log') {
      console.log('[ServiceWorker] Log:', message.data);
      sendResponse({ status: 'logged' });
    } else {
      sendResponse({ status: 'unknown message type' });
    }
  } catch (err) {
    console.error('[ServiceWorker] Error handling message:', err);
    sendResponse({ status: 'error', error: err.toString() });
  }
  // Return true if you want to send a response asynchronously
  return false;
}); 