// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
  const micIcon = document.querySelector('.mic-icon');
  const voiceBtn = document.getElementById('voice-fill-btn');
  const status = document.getElementById('status');
  const settingsBtn = document.getElementById('settings-toggle-btn');
  const settingsContainer = document.getElementById('settings-container');
  const profileFillBtn = document.getElementById('profile-fill-btn');
  const profileDataDiv = document.createElement('div');
  profileDataDiv.id = 'profile-data';
  document.getElementById('popup-root').appendChild(profileDataDiv);

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

  // Show stored profile data in the popup
  async function showProfileData() {
    if (!window.StorageManager) {
      profileDataDiv.innerHTML = '<div style="margin-top:10px; color:#e74c3c;">StorageManager not loaded!</div>';
      console.error('[Popup] StorageManager not loaded!');
      return;
    }
    try {
      const storage = new window.StorageManager();
      const profile = await storage.getProfile();
      if (profile) {
        let html = '<div style="margin-top:10px;"><b>Stored Profile:</b><ul style="padding-left:18px;">';
        for (const key of ['name','email','phone','address']) {
          if (profile[key]) html += `<li><b>${key}:</b> ${profile[key]}</li>`;
        }
        html += '</ul></div>';
        profileDataDiv.innerHTML = html;
      } else {
        profileDataDiv.innerHTML = '<div style="margin-top:10px; color:#888;">No profile data stored.</div>';
      }
    } catch (err) {
      profileDataDiv.innerHTML = '<div style="margin-top:10px; color:#e74c3c;">Error loading profile!</div>';
      console.error('[Popup] Error loading profile:', err);
    }
  }

  // Show profile data on popup load
  showProfileData();

  micIcon.addEventListener('click', triggerVoiceFill);
  voiceBtn.addEventListener('click', triggerVoiceFill);

  // Fill From Profile logic
  profileFillBtn.addEventListener('click', () => {
    status.textContent = 'Filling from profile...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'triggerProfileFill' },
          (response) => {
            if (chrome.runtime.lastError) {
              status.textContent = 'Could not fill from profile.';
            } else if (response?.status === 'Profile fill complete') {
              status.textContent = 'Form filled from profile!';
            } else if (response?.status === 'Profile fill error') {
              status.textContent = 'Profile fill error: ' + (response.error || 'Unknown error');
            } else {
              status.textContent = 'Unknown response.';
            }
            setTimeout(() => { status.textContent = ''; }, 2000);
          }
        );
      }
    });
  });

  // Settings toggle logic
  settingsBtn.addEventListener('click', async () => {
    if (settingsContainer.style.display === 'none') {
      // Load settings UI if not already loaded
      if (!settingsContainer.innerHTML) {
        // Fetch the settings HTML from options/options.html (main#options-root)
        const resp = await fetch('../options/options.html');
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const main = doc.querySelector('#options-root');
        if (main) {
          settingsContainer.innerHTML = main.innerHTML;
        }
        // Optionally, load settings CSS
        if (!document.getElementById('settings-css')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '../options/options.css';
          link.id = 'settings-css';
          document.head.appendChild(link);
        }
        // Reuse/adapt options.js logic for popup
        if (!window._settingsScriptLoaded) {
          const script = document.createElement('script');
          script.src = '../options/options.js';
          script.onload = () => { window._settingsScriptLoaded = true; };
          document.body.appendChild(script);
        }
      }
      settingsContainer.style.display = '';
      settingsBtn.textContent = 'Close Settings';
      // After settings are shown, re-show profile data after a delay (in case user saves)
      setTimeout(() => {
        // Listen for profile save in settings
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
          profileForm.addEventListener('submit', () => {
            setTimeout(showProfileData, 500);
          });
        }
      }, 1000);
    } else {
      settingsContainer.style.display = 'none';
      settingsBtn.textContent = 'Settings';
    }
  });
}); 