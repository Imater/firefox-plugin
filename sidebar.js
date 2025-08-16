document.addEventListener('DOMContentLoaded', function() {
  // Load settings from storage
  loadSettings();
  
  // Load default page
  loadCurrentPage();

  // Button event listeners
  document.getElementById('refresh-btn').addEventListener('click', loadCurrentPage);
  document.getElementById('home-btn').addEventListener('click', goHome);
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
});

let currentPage = 'index.md';
const baseUrl = 'https://imater74.keenetic.link/webdav/imater-2024-2/bookmarks/';

function loadSettings() {
  browser.storage.local.get(['webdavUrl', 'username', 'password']).then(result => {
    const urlInput = document.getElementById('url-input');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    
    urlInput.value = result.webdavUrl || baseUrl;
    usernameInput.value = result.username || '';
    passwordInput.value = result.password || '';
  });
}

function saveSettings() {
  const urlInput = document.getElementById('url-input').value;
  const usernameInput = document.getElementById('username-input').value;
  const passwordInput = document.getElementById('password-input').value;
  
  browser.storage.local.set({
    webdavUrl: urlInput,
    username: usernameInput,
    password: passwordInput
  }).then(() => {
    toggleSettings();
    loadCurrentPage();
  });
}

function toggleSettings() {
  const settingsPanel = document.getElementById('settings-panel');
  settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
}

function goHome() {
  currentPage = 'index.md';
  loadCurrentPage();
}

function loadCurrentPage() {
  browser.storage.local.get(['webdavUrl', 'username', 'password']).then(result => {
    const url = (result.webdavUrl || baseUrl) + currentPage;
    const username = result.username || '';
    const password = result.password || '';
    
    fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(username + ':' + password)
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to load: ' + response.status);
      return response.text();
    })
    .then(text => {
      displayContent(text);
    })
    .catch(error => {
      document.getElementById('content').textContent = 'Error: ' + error.message;
    });
  });
}

function displayContent(text) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = ''; // Clear content
  
  const lines = text.split('\n');
  lines.forEach(line => {
    if (line.trim() === '') {
      contentDiv.appendChild(document.createElement('br'));
      return;
    }
    
    // Handle wiki links [[...]]
    const wikiLinkMatch = line.match(/\[\[([^\]]+)\]\]/);
    if (wikiLinkMatch) {
      const wikiLinkText = wikiLinkMatch[1];
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = wikiLinkText;
      a.className = 'wiki-link';
      a.onclick = () => {
        currentPage = encodeURIComponent(wikiLinkText) + '.md';
        loadCurrentPage();
      };
      contentDiv.appendChild(a);
      contentDiv.appendChild(document.createElement('br'));
      return;
    }
    
    // Handle regular URLs
    const urlMatch = line.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const url = urlMatch[0];
      const linkText = line.replace(url, '').trim() || url;
      const a = document.createElement('a');
      a.href = url;
      a.textContent = linkText;
      a.target = '_blank';
      contentDiv.appendChild(a);
    } else {
      const p = document.createElement('p');
      p.textContent = line;
      contentDiv.appendChild(p);
    }
  });
}