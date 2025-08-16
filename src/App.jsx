import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import ReactDOM from 'react-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { styled } from '@mui/system';

const theme = createTheme();

const ContentBox = styled(Box)({
  overflowY: 'auto',
  height: '100%',
  padding: '10px',
  '& pre': {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  '& a': {
    color: '#0066cc',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& .wiki-link': {
    color: '#009688',
    fontWeight: 'bold',
  },
});

const SettingsPanel = styled(Paper)({
  padding: '16px',
  marginBottom: '16px',
});

function App() {
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState('index.md');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    webdavUrl: 'https://imater74.keenetic.link/webdav/imater-2024-2/bookmarks/',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadSettings();
    loadCurrentPage();
  }, []);

  const loadSettings = async () => {
    const result = await chrome.storage.local.get(['webdavUrl', 'username', 'password']);
    setSettings({
      webdavUrl: result.webdavUrl || 'https://imater74.keenetic.link/webdav/imater-2024-2/bookmarks/',
      username: result.username || '',
      password: result.password || '',
    });
  };

  const saveSettings = async () => {
    const normalizedUrl = settings.webdavUrl.endsWith('/') ? settings.webdavUrl : settings.webdavUrl + '/';
    await chrome.storage.local.set({
      webdavUrl: normalizedUrl,
      username: settings.username,
      password: settings.password,
    });
    setShowSettings(false);
    goHome();
  };

  const loadCurrentPage = async () => {
    try {
      const result = await chrome.storage.local.get(['webdavUrl', 'username', 'password']);
      const baseUrl = result.webdavUrl || 'https://imater74.keenetic.link/webdav/imater-2024-2/bookmarks/';
      const url = baseUrl + currentPage;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + btoa(
            (result.username || '') + ':' + (result.password || '')
          )
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      setContent(text);
    } catch (error) {
      setContent(`Error: ${error.message}${error.message.includes('401') ? '\nPlease check your credentials in settings' : ''}`);
    }
  };

  const goHome = () => {
    setCurrentPage('index.md');
    loadCurrentPage();
  };

  const handleWikiLinkClick = (pageName) => {
    setCurrentPage(encodeURIComponent(pageName) + '.md');
    loadCurrentPage();
  };

  const renderMarkdown = () => {
    // Process wiki links first
    const withWikiLinks = content.replace(
      /\[\[([^\]]+)\]\]/g, 
      (match, p1) => `<a href="#" class="wiki-link" onclick="event.preventDefault(); window.handleWikiLinkClick('${p1}')">${p1}</a>`
    );
    
    // Then render markdown
    return { __html: marked(withWikiLinks) };
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ padding: '10px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Box>
            <Button onClick={goHome} disabled={currentPage === 'index.md'} sx={{ minWidth: 'auto' }}>
              <img src="home.png" alt="Home" width="16" height="16" />
            </Button>
            <Button onClick={loadCurrentPage} sx={{ minWidth: 'auto', marginLeft: '8px' }}>
              <img src="refresh.png" alt="Refresh" width="16" height="16" />
            </Button>
          </Box>
          <Button onClick={() => setShowSettings(!showSettings)} sx={{ minWidth: 'auto' }}>
            <img src="user.png" alt="Settings" width="16" height="16" />
          </Button>
        </Box>

        {showSettings && (
          <SettingsPanel elevation={3}>
            <TextField
              label="WebDAV URL"
              value={settings.webdavUrl}
              onChange={(e) => setSettings({...settings, webdavUrl: e.target.value})}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Username"
              value={settings.username}
              onChange={(e) => setSettings({...settings, username: e.target.value})}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Password"
              type="password"
              value={settings.password}
              onChange={(e) => setSettings({...settings, password: e.target.value})}
              fullWidth
              margin="dense"
            />
            <Button 
              onClick={saveSettings} 
              variant="contained" 
              color="primary"
              sx={{ marginTop: '8px' }}
            >
              Save
            </Button>
          </SettingsPanel>
        )}

        <ContentBox>
          <div 
            dangerouslySetInnerHTML={renderMarkdown()}
            onClick={(e) => {
              if (e.target.classList.contains('wiki-link')) {
                e.preventDefault();
                handleWikiLinkClick(e.target.textContent);
              }
            }}
          />
        </ContentBox>
      </Box>
    </ThemeProvider>
  );
};

// Expose function to window for inline event handlers
window.handleWikiLinkClick = (pageName) => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
  const app = root._internalRoot.current.child.stateNode;
  app.handleWikiLinkClick(pageName);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

export default App;