// lib/voice-processor.js
// Handles voice recognition, processing, and entity extraction using the Web Speech API

class VoiceProcessor {
  constructor({ lang = 'en-US', interimResults = true } = {}) {
    this.lang = lang;
    this.interimResults = interimResults;
    this.recognition = null;
    this.isSupported = this.checkSupport();
    this.isRecording = false;
    this.transcript = '';
    this.entities = [];
    this.abortController = null;
  }

  // Check browser compatibility for Web Speech API
  checkSupport() {
    return (
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  // Request microphone permissions and user consent
  async requestPermission() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported');
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      console.error('[VoiceProcessor] Microphone permission denied:', err);
      throw err;
    }
  }

  // Initialize the SpeechRecognition instance
  initRecognition() {
    if (!this.isSupported) throw new Error('Speech recognition not supported');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.lang;
    this.recognition.interimResults = this.interimResults;
    this.recognition.maxAlternatives = 1;
  }

  // Start recording and return transcript and entities
  async start({ lang } = {}) {
    if (!this.isSupported) throw new Error('Speech recognition not supported');
    if (this.isRecording) await this.stop();
    if (lang) this.lang = lang;
    await this.requestPermission();
    this.initRecognition();
    this.transcript = '';
    this.entities = [];
    this.isRecording = true;
    this.abortController = new AbortController();
    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      this.recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        this.transcript = finalTranscript + interim;
        // Optionally emit interim results here
      };
      this.recognition.onerror = (event) => {
        this.isRecording = false;
        reject(new Error(`[VoiceProcessor] Speech recognition error: ${event.error}`));
      };
      this.recognition.onend = async () => {
        this.isRecording = false;
        try {
          const entities = await this.extractEntities(this.transcript);
          resolve({ transcript: this.transcript, entities });
        } catch (err) {
          reject(err);
        }
      };
      this.recognition.start();
      // Support aborting via AbortController
      this.abortController.signal.addEventListener('abort', () => {
        this.recognition.abort();
        this.isRecording = false;
        reject(new Error('[VoiceProcessor] Recording aborted'));
      });
    });
  }

  // Stop recording
  async stop() {
    if (this.isRecording && this.recognition) {
      this.recognition.stop();
      this.isRecording = false;
      if (this.abortController) this.abortController.abort();
    }
  }

  // Extract entities from transcript (names, emails, phones, addresses)
  async extractEntities(transcript) {
    // Simple regex-based extraction; replace with NLP for production
    const entities = [];
    if (!transcript) return entities;
    // Email
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match;
    while ((match = emailRegex.exec(transcript))) {
      entities.push({
        type: 'email',
        value: match[1],
        confidence: 0.95
      });
    }
    // Phone
    const phoneRegex = /(\+?\d[\d\s\-()]{7,}\d)/g;
    while ((match = phoneRegex.exec(transcript))) {
      entities.push({
        type: 'phone',
        value: match[1],
        confidence: 0.9
      });
    }
    // Name (very basic: look for 'my name is ...' or 'I am ...')
    const nameRegex = /(?:my name is|I am|this is) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i;
    const nameMatch = transcript.match(nameRegex);
    if (nameMatch) {
      entities.push({
        type: 'name',
        value: nameMatch[1],
        confidence: 0.8
      });
    }
    // Address (very basic: look for 'address is ...')
    const addressRegex = /address is ([\w\d\s,.-]+)/i;
    const addressMatch = transcript.match(addressRegex);
    if (addressMatch) {
      entities.push({
        type: 'address',
        value: addressMatch[1],
        confidence: 0.7
      });
    }
    return entities;
  }

  // Set language for recognition
  setLanguage(lang) {
    this.lang = lang;
    if (this.recognition) this.recognition.lang = lang;
  }

  // Get supported languages (limited by browser)
  static getSupportedLanguages() {
    // Web Speech API does not provide a list; return common ones
    return [
      'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-PT', 'zh-CN', 'ja-JP', 'ko-KR'
    ];
  }
}

// Export for use in other scripts
window.VoiceProcessor = VoiceProcessor; 