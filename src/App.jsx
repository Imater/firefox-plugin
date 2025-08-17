import './chrome-mock';
import './file-mock';
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { createRoot } from 'react-dom/client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Button, TextField, Typography, Paper, Switch, FormControlLabel, Breadcrumbs, Link } from '@mui/material';
import { styled } from '@mui/system';

// Создаем светлую и темную темы
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#000000',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
    },
  },
});

const ContentBox = styled(Box)(({ theme }) => ({
  overflowY: 'auto',
  height: '100%',
  padding: '10px',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  '& pre': {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  '& a': {
    color: theme.palette.mode === 'dark' ? '#64b5f6' : '#0066cc',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& .wiki-link': {
    color: theme.palette.mode === 'dark' ? '#81c784' : '#009688',
    fontWeight: 'bold',
  },
}));

const SettingsPanel = styled(Paper)(({ theme }) => ({
  padding: '16px',
  marginBottom: '16px',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
}));

function App() {
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState('index.md');
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settings, setSettings] = useState({
    webdavUrl: 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadSettings();
    loadCurrentPage();
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const result = await chrome.storage.local.get(['isDarkMode']);
    setIsDarkMode(result.isDarkMode || false);
  };

  const saveTheme = async (darkMode) => {
    await chrome.storage.local.set({ isDarkMode: darkMode });
    setIsDarkMode(darkMode);
  };

  const loadSettings = async () => {
    const result = await chrome.storage.local.get(['webdavUrl', 'username', 'password']);
    setSettings({
      webdavUrl: result.webdavUrl || 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks',
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
      const baseUrl = result.webdavUrl || 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks';
      const url = baseUrl + '/' + currentPage;
      
      const response = await fetch(url, {
        headers: url.startsWith('file://') ? {} : {
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

  const getBreadcrumbs = () => {
    if (currentPage === 'index.md') {
      return [{ name: 'Главная', path: 'index.md' }];
    }

    // Убираем .md и декодируем имя файла
    const pageName = decodeURIComponent(currentPage.replace('.md', ''));
    
    // Разбиваем путь по разделителям (/, \, -)
    const pathParts = pageName.split(/[\/\\-]/).filter(part => part.trim() !== '');
    
    const breadcrumbs = [{ name: 'Главная', path: 'index.md' }];
    
    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += (currentPath ? '/' : '') + part;
      breadcrumbs.push({
        name: part,
        path: encodeURIComponent(currentPath) + '.md'
      });
    });
    
    return breadcrumbs;
  };

  const handleBreadcrumbClick = (path) => {
    setCurrentPage(path);
    loadCurrentPage();
  };

  const renderMarkdown = () => {
    // Настраиваем marked для добавления target="_blank" к ссылкам
    const renderer = new marked.Renderer();
    renderer.link = (href, title, text) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };

    // Process wiki links first
    const withWikiLinks = content.replace(
      /\[\[([^\]]+)\]\]/g,
      (match, p1) => `<a href="#" class="wiki-link" data-page="${p1}">${p1}</a>`
    );

    // Then render markdown with custom renderer
    return { __html: marked.parse(withWikiLinks, { renderer }) };
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Box sx={{ 
        padding: '10px', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#000000'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Button onClick={loadCurrentPage} sx={{ minWidth: 'auto' }}>
            <img src="refresh.png" alt="Refresh" width="16" height="16" />
          </Button>
          <Button onClick={() => setShowSettings(!showSettings)} sx={{ minWidth: 'auto' }}>
            <img src="user.png" alt="Settings" width="16" height="16" />
          </Button>
        </Box>

        <Breadcrumbs 
          aria-label="breadcrumb" 
          sx={{ 
            marginBottom: '16px',
            '& .MuiBreadcrumbs-separator': {
              color: isDarkMode ? '#ffffff' : '#000000'
            }
          }}
        >
          {getBreadcrumbs().map((crumb, index) => (
            <Link
              key={index}
              color={index === getBreadcrumbs().length - 1 ? 'text.primary' : 'inherit'}
              underline="hover"
              onClick={() => handleBreadcrumbClick(crumb.path)}
              sx={{ 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                '&:first-child': {
                  '&::before': {
                    content: '""',
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    backgroundImage: 'url("home.png")',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    marginRight: '4px'
                  }
                }
              }}
            >
              {crumb.name}
            </Link>
          ))}
        </Breadcrumbs>

        {showSettings && (
          <SettingsPanel elevation={3}>
            <Typography variant="h6" gutterBottom>
              Настройки
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => saveTheme(e.target.checked)}
                  color="primary"
                />
              }
              label="Темная тема"
              sx={{ marginBottom: '16px' }}
            />
            
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
                e.stopPropagation();
                const pageName = e.target.getAttribute('data-page');
                if (pageName) {
                  handleWikiLinkClick(pageName);
                }
              }
            }}
          />
        </ContentBox>
      </Box>
    </ThemeProvider>
  );
};



const root = createRoot(document.getElementById('root'));
root.render(<App />);

export default App;