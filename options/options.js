// options/options.js
// Options page logic for Voice Form Filler Chrome extension
// Handles user profile, preferences, history, import/export, privacy, shortcuts, and accessibility

// Assumes StorageManager is available globally
const storage = new window.StorageManager();

document.addEventListener('DOMContentLoaded', () => {
  // Profile
  const profileForm = document.getElementById('profile-form');
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const addressInput = document.getElementById('profile-address');

  // Preferences
  const autofillCheckbox = document.getElementById('pref-autofill');
  const historyCheckbox = document.getElementById('pref-history');
  const themeSelect = document.getElementById('theme-select');
  const fontSizeRange = document.getElementById('font-size');

  // Shortcut
  const shortcutInput = document.getElementById('shortcut-input');
  const changeShortcutBtn = document.getElementById('change-shortcut');

  // History
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');

  // Import/Export
  const exportBtn = document.getElementById('export-data');
  const importBtn = document.getElementById('import-data');
  const importFile = document.getElementById('import-file');

  // Privacy
  const deleteProfileBtn = document.getElementById('delete-profile');
  const deleteAllDataBtn = document.getElementById('delete-all-data');

  // Accessibility
  const highContrastCheckbox = document.getElementById('high-contrast');
  const screenReaderCheckbox = document.getElementById('screen-reader');

  // --- Load Data ---
  async function loadProfile() {
    const profiles = await storage.getProfiles();
    if (profiles.length > 0) {
      const profile = profiles[0];
      nameInput.value = profile.name || '';
      emailInput.value = profile.email || '';
      phoneInput.value = profile.phone || '';
      addressInput.value = profile.address || '';
    }
  }
  async function loadPrefs() {
    const prefs = await storage.getPrefs();
    autofillCheckbox.checked = !!prefs.autofill;
    historyCheckbox.checked = !!prefs.saveHistory;
    themeSelect.value = prefs.theme || 'light';
    fontSizeRange.value = prefs.fontSize || 16;
    highContrastCheckbox.checked = !!prefs.highContrast;
    screenReaderCheckbox.checked = !!prefs.screenReader;
  }
  async function loadHistory() {
    historyList.innerHTML = '';
    const history = await storage.getFormHistory();
    history.slice().reverse().forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}: ${entry.formName || entry.formId || 'Form'} - ${entry.status || ''}`;
      historyList.appendChild(li);
    });
  }
  async function loadShortcut() {
    // Chrome commands API is limited; show static value for now
    shortcutInput.value = 'Ctrl+Shift+V';
  }

  // --- Save Handlers ---
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profile = {
      id: 'default',
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      address: addressInput.value
    };
    await storage.saveProfile(profile);
    alert('Profile saved!');
  });
  autofillCheckbox.addEventListener('change', async () => {
    const prefs = await storage.getPrefs();
    prefs.autofill = autofillCheckbox.checked;
    await storage.savePrefs(prefs);
  });
  historyCheckbox.addEventListener('change', async () => {
    const prefs = await storage.getPrefs();
    prefs.saveHistory = historyCheckbox.checked;
    await storage.savePrefs(prefs);
  });
  themeSelect.addEventListener('change', async () => {
    const prefs = await storage.getPrefs();
    prefs.theme = themeSelect.value;
    await storage.savePrefs(prefs);
    document.body.setAttribute('data-theme', themeSelect.value);
  });
  fontSizeRange.addEventListener('input', async () => {
    const prefs = await storage.getPrefs();
    prefs.fontSize = fontSizeRange.value;
    await storage.savePrefs(prefs);
    document.body.style.fontSize = fontSizeRange.value + 'px';
  });
  highContrastCheckbox.addEventListener('change', async () => {
    const prefs = await storage.getPrefs();
    prefs.highContrast = highContrastCheckbox.checked;
    await storage.savePrefs(prefs);
    document.body.classList.toggle('high-contrast', highContrastCheckbox.checked);
  });
  screenReaderCheckbox.addEventListener('change', async () => {
    const prefs = await storage.getPrefs();
    prefs.screenReader = screenReaderCheckbox.checked;
    await storage.savePrefs(prefs);
  });

  // --- History Management ---
  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Clear all form history?')) {
      await storage.clearFormHistory();
      await loadHistory();
    }
  });

  // --- Import/Export ---
  exportBtn.addEventListener('click', async () => {
    const data = await storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-form-filler-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  importBtn.addEventListener('click', () => {
    importFile.click();
  });
  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await storage.importAll(data);
      alert('Data imported!');
      await loadProfile();
      await loadPrefs();
      await loadHistory();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  });

  // --- Privacy Controls ---
  deleteProfileBtn.addEventListener('click', async () => {
    if (confirm('Delete your profile? This cannot be undone.')) {
      await storage.deleteProfile('default');
      await loadProfile();
    }
  });
  deleteAllDataBtn.addEventListener('click', async () => {
    if (confirm('Delete ALL extension data? This cannot be undone.')) {
      await storage.clearFormHistory();
      await storage.clearMappingCache();
      await storage.setLocal(storage.profileKey, null);
      await storage.setLocal(storage.prefsKey, null);
      await loadProfile();
      await loadPrefs();
      await loadHistory();
    }
  });

  // --- Keyboard Shortcut Customization (UI only) ---
  changeShortcutBtn.addEventListener('click', () => {
    alert('To change the shortcut, go to chrome://extensions/shortcuts');
  });

  // --- Theme & Accessibility ---
  function applyTheme() {
    const theme = themeSelect.value;
    document.body.setAttribute('data-theme', theme);
    document.body.style.fontSize = fontSizeRange.value + 'px';
    document.body.classList.toggle('high-contrast', highContrastCheckbox.checked);
  }

  // --- Initial Load ---
  (async function init() {
    await loadProfile();
    await loadPrefs();
    await loadHistory();
    await loadShortcut();
    applyTheme();
  })();

  // Accessibility: keyboard navigation
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      // Trap focus in main
      const focusable = document.querySelectorAll('input, button, select, textarea, [tabindex]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
}); 