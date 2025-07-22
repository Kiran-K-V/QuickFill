// content/content-script.js
// Injected into web pages to interact with forms, listen for messages, and trigger form filling.

class VoiceFormFiller {
  constructor() {
    try {
      this.init();
    } catch (err) {
      console.error('[VoiceFormFiller] Initialization error:', err);
    }
  }

  // Initialize the class when injected
  init() {
    console.log('[VoiceFormFiller] Initializing on page:', window.location.href);
    this.setupMessageListener();
    // Placeholder: Initialize other components if needed
  }

  // Listen for messages from the background script
  setupMessageListener() {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[VoiceFormFiller] Received message:', message, 'from', sender);
        if (message && message.action === 'triggerVoiceFill') {
          console.log('[VoiceFormFiller] Voice fill shortcut triggered (Ctrl+Shift+V)');
          this.handleVoiceTrigger();
          sendResponse({ status: 'Voice trigger handled' });
        }
        // Add more message handlers as needed
      });
    } catch (err) {
      console.error('[VoiceFormFiller] Error setting up message listener:', err);
    }
  }

  // Stub: Detect forms on the page
  detectForms() {
    // Placeholder: Implement form detection logic
    console.log('[VoiceFormFiller] detectForms() called');
    return [];
  }

  // Create and manage UI overlays
  showOverlay(message = 'Listening...') {
    try {
      // Remove existing overlay if present
      this.removeOverlay();
      const overlay = document.createElement('div');
      overlay.id = 'voice-form-filler-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '20px';
      overlay.style.right = '20px';
      overlay.style.zIndex = '9999';
      overlay.style.background = 'rgba(0,0,0,0.8)';
      overlay.style.color = '#fff';
      overlay.style.padding = '12px 24px';
      overlay.style.borderRadius = '8px';
      overlay.style.fontSize = '16px';
      overlay.textContent = message;
      document.body.appendChild(overlay);
    } catch (err) {
      console.error('[VoiceFormFiller] Error showing overlay:', err);
    }
  }

  removeOverlay() {
    try {
      const overlay = document.getElementById('voice-form-filler-overlay');
      if (overlay) {
        overlay.remove();
      }
    } catch (err) {
      console.error('[VoiceFormFiller] Error removing overlay:', err);
    }
  }

  // Handle the voice recording trigger
  handleVoiceTrigger() {
    try {
      console.log('[VoiceFormFiller] Voice trigger received');
      if (!window.voiceOverlay) {
        window.voiceOverlay = new window.UIOverlay();
      }
      window.voiceOverlay.show();
    } catch (err) {
      console.error('[VoiceFormFiller] Error handling voice trigger:', err);
    }
  }
}

// Initialize the VoiceFormFiller when the script is injected
(() => {
  window.voiceFormFiller = new VoiceFormFiller();
})(); 