// background/voice-processor.js
// Handles voice recognition, processing, and communication with content scripts or popup using the Web Speech API.

class VoiceProcessor {
  constructor({ lang = 'en-US', interimResults = true } = {}) {
    this.lang = lang;
    this.interimResults = interimResults;
    this.recognition = null;
    this.isSupported = this.checkSupport();
    this.isRecording = false;
    this.transcript = '';
  }

  // Check browser compatibility for Web Speech API
  checkSupport() {
    return (
      typeof globalThis !== 'undefined' &&
      (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition)
    );
  }

  // Initialize the SpeechRecognition instance
  initRecognition() {
    if (!this.isSupported) throw new Error('Speech recognition not supported');
    const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.lang;
    this.recognition.interimResults = this.interimResults;
    this.recognition.maxAlternatives = 1;
  }

  // Start recording and return transcript
  async start({ lang } = {}) {
    if (!this.isSupported) throw new Error('Speech recognition not supported');
    if (this.isRecording) await this.stop();
    if (lang) this.lang = lang;
    this.initRecognition();
    this.transcript = '';
    this.isRecording = true;
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
      };
      this.recognition.onerror = (event) => {
        this.isRecording = false;
        reject(new Error(`[VoiceProcessor] Speech recognition error: ${event.error}`));
      };
      this.recognition.onend = () => {
        this.isRecording = false;
        resolve({ transcript: this.transcript });
      };
      this.recognition.start();
    });
  }

  // Stop recording
  async stop() {
    if (this.isRecording && this.recognition) {
      this.recognition.stop();
      this.isRecording = false;
    }
  }
}

// Expose for use in background
if (typeof globalThis !== 'undefined') {
  globalThis.VoiceProcessor = VoiceProcessor;
} 