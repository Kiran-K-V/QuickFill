// content/ui-overlay.js
// Renders UI overlays on the web page for user interaction (e.g., voice input status, suggestions).

class UIOverlay {
  constructor() {
    this.overlay = null;
    this.transcript = '';
    this.isRecording = false;
    this.voiceProcessor = new window.VoiceProcessor();
    this.createOverlay();
    this.attachEvents();
  }

  createOverlay() {
    if (document.getElementById('voice-ui-overlay')) return;
    this.overlay = document.createElement('div');
    this.overlay.id = 'voice-ui-overlay';
    this.overlay.style = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 2147483647; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #0003;
      padding: 32px 28px 24px 28px; min-width: 320px; max-width: 90vw; text-align: center;
      font-family: 'Segoe UI', Arial, sans-serif; color: #222;
    `;
    this.overlay.innerHTML = `
      <div style="font-size:2.5rem; color:#e74c3c; margin-bottom:12px;">🎤</div>
      <div id="voice-status" style="margin-bottom:12px;">Click Start to record your voice</div>
      <button id="voice-start-btn" style="padding:8px 18px; font-size:1rem; border:none; border-radius:6px; background:#e74c3c; color:#fff; margin-right:8px;">Start Recording</button>
      <button id="voice-cancel-btn" style="padding:8px 18px; font-size:1rem; border:none; border-radius:6px; background:#bbb; color:#222;">Cancel</button>
      <div id="voice-transcript" style="margin:18px 0 8px 0; min-height:32px; background:#fafafa; border-radius:6px; padding:8px 10px; font-size:1rem; color:#333;"></div>
      <button id="voice-submit-btn" style="padding:8px 18px; font-size:1rem; border:none; border-radius:6px; background:#2ecc40; color:#fff; display:none;">Submit</button>
    `;
    document.body.appendChild(this.overlay);
  }

  attachEvents() {
    this.overlay.querySelector('#voice-cancel-btn').onclick = () => this.hide();
    this.overlay.querySelector('#voice-start-btn').onclick = () => this.startRecording();
    this.overlay.querySelector('#voice-submit-btn').onclick = () => this.submitTranscript();
  }

  show() {
    if (this.overlay) this.overlay.style.display = '';
  }
  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
    this.stopRecording();
  }

  async startRecording() {
    this.isRecording = true;
    this.overlay.querySelector('#voice-status').textContent = 'Listening...';
    this.overlay.querySelector('#voice-start-btn').disabled = true;
    this.overlay.querySelector('#voice-submit-btn').style.display = 'none';
    this.transcript = '';
    this.overlay.querySelector('#voice-transcript').textContent = '';
    try {
      const { transcript } = await this.voiceProcessor.start();
      this.transcript = transcript;
      this.overlay.querySelector('#voice-transcript').textContent = transcript;
      this.overlay.querySelector('#voice-status').textContent = 'Recording complete. Review and submit.';
      this.overlay.querySelector('#voice-submit-btn').style.display = '';
    } catch (err) {
      this.overlay.querySelector('#voice-status').textContent = 'Error: ' + err.message;
    }
    this.overlay.querySelector('#voice-start-btn').disabled = false;
    this.isRecording = false;
  }

  stopRecording() {
    if (this.isRecording) {
      this.voiceProcessor.stop();
      this.isRecording = false;
    }
  }

  async submitTranscript() {
    this.overlay.querySelector('#voice-status').textContent = 'Processing with Gemini...';
    try {
      const transcript = this.transcript;
      // 1. LLM extraction
      const profile = await window.extractProfileFromText(transcript);
      if (!profile) {
        this.overlay.querySelector('#voice-status').textContent = 'Could not extract profile from voice. Try again.';
        return;
      }
      // 2. Save profile
      if (window.StorageManager) {
        const storage = new window.StorageManager();
        await storage.saveProfile({ id: 'default', ...profile });
        this.overlay.querySelector('#voice-status').textContent = 'Profile saved from voice!';
      } else {
        this.overlay.querySelector('#voice-status').textContent = 'StorageManager not loaded!';
        return;
      }
      // 3. Autofill
      if (window.FormDetector && window.FieldMapper && window.FormFiller) {
        const detector = new window.FormDetector();
        const { forms, standaloneFields } = detector.scanForms();
        const fields = forms.length ? forms[0].fields : standaloneFields;
        const entities = Object.entries(profile).map(([type, value]) => ({ type, value, confidence: 1.0 }));
        const mapper = new window.FieldMapper(fields);
        const mappings = mapper.mapEntitiesToFields(entities).map(m => ({
          field: m.bestMatch.field,
          value: m.entity.value
        }));
        const filler = new window.FormFiller();
        await filler.fillFields(mappings);
        this.overlay.querySelector('#voice-status').textContent = 'Form filled and profile saved!';
      }
    } catch (err) {
      this.overlay.querySelector('#voice-status').textContent = 'Error: ' + (err.message || err);
      console.error('Voice-to-profile error:', err);
    }
  }
}

window.UIOverlay = UIOverlay; 