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
  async init() {
    console.log('[VoiceFormFiller] Initializing on page:', window.location.href);
    this.setupMessageListener();
    // Autofill with profile data if enabled
    try {
      if (window.StorageManager && window.FormDetector && window.FieldMapper && window.FormFiller) {
        const storage = new window.StorageManager();
        const profile = await storage.getProfile();
        if (profile) {
          const entities = profileToEntities(profile);
          const detector = new window.FormDetector();
          const { forms, standaloneFields } = detector.scanForms();
          const fields = forms.length ? forms[0].fields : standaloneFields;
          const mapper = new window.FieldMapper(fields);
          const mappings = mapper.mapEntitiesToFields(entities).map(m => ({
            field: m.bestMatch.field,
            value: m.entity.value
          }));
          const filler = new window.FormFiller();
          await filler.fillFields(mappings);
          console.log('[VoiceFormFiller] Autofilled form with profile data.');
        }
      } else {
        console.error('[VoiceFormFiller] Required modules not loaded in init');
      }
    } catch (err) {
      console.error('[VoiceFormFiller] Autofill error:', err);
    }
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
        if (message && message.action === 'triggerProfileFill') {
          this.fillFromProfile().then(() => {
            sendResponse({ status: 'Profile fill complete' });
          }).catch((err) => {
            sendResponse({ status: 'Profile fill error', error: err?.toString() });
          });
          return true; // async
        }
      });
    } catch (err) {
      console.error('[VoiceFormFiller] Error setting up message listener:', err);
    }
  }

  // Fill form from stored profile data (regardless of autofill preference)
  async fillFromProfile() {
    try {
      if (window.StorageManager && window.FormDetector && window.FieldMapper && window.FormFiller) {
        const storage = new window.StorageManager();
        const profile = await storage.getProfile();
        console.log('[VoiceFormFiller] Profile loaded for fill:', profile);
        if (profile) {
          const entities = profileToEntities(profile);
          const detector = new window.FormDetector();
          const { forms, standaloneFields } = detector.scanForms();
          const fields = forms.length ? forms[0].fields : standaloneFields;
          const mapper = new window.FieldMapper(fields);
          const mappings = mapper.mapEntitiesToFields(entities).map(m => ({
            field: m.bestMatch.field,
            value: m.entity.value
          }));
          const filler = new window.FormFiller();
          await filler.fillFields(mappings);
          console.log('[VoiceFormFiller] Filled form from profile data (manual trigger).');
        } else {
          throw new Error('No profile data found');
        }
      } else {
        throw new Error('Required modules not loaded');
      }
    } catch (err) {
      console.error('[VoiceFormFiller] fillFromProfile error:', err);
      throw err;
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

// Utility: Convert profile object to entities for FieldMapper
function profileToEntities(profile) {
  if (!profile) return [];
  const fields = ['name', 'email', 'phone', 'address'];
  return fields.filter(f => profile[f]).map(f => ({
    type: f,
    value: profile[f],
    confidence: 1.0
  }));
}

// Initialize the VoiceFormFiller when the script is injected
(() => {
  window.voiceFormFiller = new VoiceFormFiller();
})(); 