// lib/storage-manager.js
// Handles saving and retrieving user data, profiles, and settings from Chrome storage.
// Uses plain JSON storage for reliability and debuggability.

class StorageManager {
  constructor() {
    this.profileKey = 'profile';
    this.prefsKey = 'prefs';
    this.historyKey = 'history';
  }

  // --- Profile ---
  async saveProfile(profile) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.profileKey]: profile }, () => {
        if (chrome.runtime.lastError) {
          console.error('[StorageManager] Error saving profile:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('[StorageManager] Profile saved:', profile);
          resolve(profile);
        }
      });
    });
  }

  async getProfile() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.profileKey], (result) => {
        if (chrome.runtime.lastError) {
          console.error('[StorageManager] Error loading profile:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('[StorageManager] Loaded profile:', result[this.profileKey]);
          resolve(result[this.profileKey] || null);
        }
      });
    });
  }

  // --- Preferences ---
  async savePrefs(prefs) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.prefsKey]: prefs }, () => {
        if (chrome.runtime.lastError) {
          console.error('[StorageManager] Error saving prefs:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(prefs);
        }
      });
    });
  }

  async getPrefs() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.prefsKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[this.prefsKey] || {});
        }
      });
    });
  }

  // --- History (optional, for completeness) ---
  async addFormHistory(entry) {
    const history = await this.getFormHistory();
    history.push({ ...entry, timestamp: Date.now() });
    // Retain only last 100 entries
    if (history.length > 100) history.splice(0, history.length - 100);
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.historyKey]: history }, () => {
        if (chrome.runtime.lastError) {
          console.error('[StorageManager] Error saving history:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(history);
        }
      });
    });
  }

  async getFormHistory() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.historyKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[this.historyKey] || []);
        }
      });
    });
  }

  async clearFormHistory() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.historyKey]: [] }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

// Attach to window
window.StorageManager = StorageManager; 