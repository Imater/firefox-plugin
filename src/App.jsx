import './chrome-mock';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';

// Themes
import lightTheme from './themes/lightTheme';
import darkTheme from './themes/darkTheme';

// Components
import Header from './components/Header';
import Settings from './components/Settings';
import ContentBox from './components/styled/ContentBox';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';

// Utils
import { renderMarkdown } from './utils/markdownRenderer';

// Services
import { loadCurrentPage } from './services/pageService';



function App() {
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState('index.md');
  const [showSettings, setShowSettings] = useState(false);
  
  const { isDarkMode, saveTheme } = useTheme();
  const { settings, setSettings, saveSettings } = useSettings();

  useEffect(() => {
    handleLoadCurrentPage();
  }, [currentPage]);

  useEffect(() => {
    handleLoadCurrentPage();
  }, []);

  const handleLoadCurrentPage = async () => {
    const text = await loadCurrentPage(currentPage);
    setContent(text);
  };

  const goHome = () => {
    setCurrentPage('index.md');
  };

  const handleWikiLinkClick = (pageName) => {
    setCurrentPage(encodeURIComponent(pageName) + '.md');
  };

  const handleBreadcrumbClick = (path) => {
    setCurrentPage(path);
  };

  const handleSaveSettings = async () => {
    await saveSettings(goHome);
    setShowSettings(false);
  };

      return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Box sx={{ 
        minHeight: '100vh',
        overflowX: 'hidden'
      }}>
        <Header 
          onRefresh={handleLoadCurrentPage}
          onToggleSettings={() => setShowSettings(!showSettings)}
          currentPage={currentPage}
          onBreadcrumbClick={handleBreadcrumbClick}
          isDarkMode={isDarkMode}
        />

        {showSettings && (
          <Settings 
            isDarkMode={isDarkMode}
            saveTheme={saveTheme}
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
          />
        )}

        <ContentBox>
          <div 
            dangerouslySetInnerHTML={renderMarkdown(content)}
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