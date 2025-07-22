// lib/storage-manager.js
// Handles saving and retrieving user data, profiles, and settings from Chrome storage.
// Includes encryption, migration, import/export, and retention policies.

class StorageManager {
  constructor({ version = 1 } = {}) {
    this.version = version;
    this.profileKey = 'user_profiles';
    this.historyKey = 'form_history';
    this.prefsKey = 'user_prefs';
    this.mappingCacheKey = 'mapping_cache';
    this.metaKey = 'storage_meta';
    this.encryptionKey = 'quickfill-secret'; // For demo only; use secure key management in production
  }

  // --- Encryption/Decryption (simple, for demo) ---
  async encrypt(data) {
    // Use btoa for demo; replace with real crypto in production
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }
  async decrypt(data) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(data))));
    } catch (e) {
      return null;
    }
  }

  // --- User Profile Schema Example ---
  // {
  //   id: string,
  //   name: string,
  //   email: string,
  //   phone: string,
  //   address: string,
  //   created: timestamp,
  //   updated: timestamp,
  //   ...custom fields
  // }

  // --- User Profiles ---
  async saveProfile(profile) {
    const profiles = await this.getProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id);
    profile.updated = Date.now();
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profile.created = Date.now();
      profiles.push(profile);
    }
    const encrypted = await this.encrypt(profiles);
    await this.setLocal(this.profileKey, encrypted);
    return profile;
  }

  async getProfiles() {
    const encrypted = await this.getLocal(this.profileKey);
    if (!encrypted) return [];
    const profiles = await this.decrypt(encrypted);
    return profiles || [];
  }

  async deleteProfile(profileId) {
    let profiles = await this.getProfiles();
    profiles = profiles.filter(p => p.id !== profileId);
    const encrypted = await this.encrypt(profiles);
    await this.setLocal(this.profileKey, encrypted);
    return true;
  }

  // --- Form History ---
  async addFormHistory(entry) {
    let history = await this.getFormHistory();
    history.push({ ...entry, timestamp: Date.now() });
    // Retain only last 100 entries
    if (history.length > 100) history = history.slice(-100);
    await this.setLocal(this.historyKey, history);
  }
  async getFormHistory() {
    return (await this.getLocal(this.historyKey)) || [];
  }
  async clearFormHistory() {
    await this.setLocal(this.historyKey, []);
  }

  // --- Preferences & Settings ---
  async savePrefs(prefs) {
    await this.setLocal(this.prefsKey, prefs);
  }
  async getPrefs() {
    return (await this.getLocal(this.prefsKey)) || {};
  }

  // --- Mapping Cache ---
  async cacheMapping(formFingerprint, mapping) {
    let cache = await this.getMappingCache();
    cache[formFingerprint] = { mapping, timestamp: Date.now() };
    // Retain only last 50 cached mappings
    if (Object.keys(cache).length > 50) {
      const oldest = Object.entries(cache).sort((a, b) => a[1].timestamp - b[1].timestamp).slice(0, -50);
      for (const [key] of oldest) delete cache[key];
    }
    await this.setLocal(this.mappingCacheKey, cache);
  }
  async getMappingCache() {
    return (await this.getLocal(this.mappingCacheKey)) || {};
  }
  async clearMappingCache() {
    await this.setLocal(this.mappingCacheKey, {});
  }

  // --- Data Migration & Versioning ---
  async migrate() {
    const meta = (await this.getLocal(this.metaKey)) || {};
    if (meta.version !== this.version) {
      // Perform migration steps here
      // ...
      meta.version = this.version;
      await this.setLocal(this.metaKey, meta);
    }
  }

  // --- Import/Export ---
  async exportAll() {
    const profiles = await this.getProfiles();
    const history = await this.getFormHistory();
    const prefs = await this.getPrefs();
    const mappingCache = await this.getMappingCache();
    return { profiles, history, prefs, mappingCache };
  }
  async importAll(data) {
    if (data.profiles) await this.setLocal(this.profileKey, await this.encrypt(data.profiles));
    if (data.history) await this.setLocal(this.historyKey, data.history);
    if (data.prefs) await this.setLocal(this.prefsKey, data.prefs);
    if (data.mappingCache) await this.setLocal(this.mappingCacheKey, data.mappingCache);
  }

  // --- Data Cleanup & Retention ---
  async cleanup() {
    // Remove old history entries (> 90 days)
    let history = await this.getFormHistory();
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    history = history.filter(e => e.timestamp > cutoff);
    await this.setLocal(this.historyKey, history);
    // Remove old cached mappings (> 30 days)
    let cache = await this.getMappingCache();
    for (const key in cache) {
      if (cache[key].timestamp < Date.now() - 30 * 24 * 60 * 60 * 1000) {
        delete cache[key];
      }
    }
    await this.setLocal(this.mappingCacheKey, cache);
  }

  // --- Chrome Storage Wrappers ---
  async setLocal(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  }
  async getLocal(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(result[key]);
      });
    });
  }
  async setSync(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  }
  async getSync(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([key], (result) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(result[key]);
      });
    });
  }

  // --- Sync backup ---
  async backupToSync() {
    const all = await this.exportAll();
    await this.setSync('quickfill_backup', all);
  }
  async restoreFromSync() {
    const backup = await this.getSync('quickfill_backup');
    if (backup) await this.importAll(backup);
  }
}

// Export for use in other scripts
window.StorageManager = StorageManager; 