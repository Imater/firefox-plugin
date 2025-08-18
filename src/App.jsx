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
import MarkdownEditor from './components/MarkdownEditor';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';

// Utils
import { renderMarkdown } from './utils/markdownRenderer';

// Services
import { loadCurrentPage, saveCurrentPage } from './services/pageService';
import { activateOrCreateTab, resolveUrl, cleanupClosedTabs } from './services/tabService';



function App() {
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState('index.md');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { isDarkMode, saveTheme } = useTheme();
  const { settings, setSettings, saveSettings } = useSettings();

  useEffect(() => {
    handleLoadCurrentPage();
  }, [currentPage]);

  useEffect(() => {
    handleLoadCurrentPage();
  }, []);

  // Очистка записей о закрытых вкладках при загрузке приложения
  useEffect(() => {
    cleanupClosedTabs();
    
    // Слушаем события закрытия вкладок
    const handleTabRemoved = (tabId) => {
      // Удаляем запись о закрытой вкладке
      chrome.storage.local.remove([`tab_${tabId}`]);
    };
    
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    
    // Очистка слушателя при размонтировании компонента
    return () => {
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
    };
  }, []);

  const handleLoadCurrentPage = async () => {
    const text = await loadCurrentPage(currentPage);
    setContent(text);
  };

  const handleSavePage = async (newContent) => {
    await saveCurrentPage(currentPage, newContent);
    setContent(newContent);
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

  const handleExternalLinkClick = async (url) => {
    try {
      // Получаем базовый URL из настроек
      const result = await chrome.storage.local.get(['webdavUrl']);
      const baseUrl = result.webdavUrl || 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks';
      
      // Разрешаем URL (преобразуем относительные в абсолютные)
      const resolvedUrl = resolveUrl(baseUrl, url);
      
      // Активируем или создаём вкладку
      await activateOrCreateTab(resolvedUrl);
    } catch (error) {
      console.error('Error handling external link:', error);
      // Fallback: открываем в новой вкладке
      try {
        await chrome.tabs.create({ url: url, active: true });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
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
          onToggleEdit={() => setIsEditing(!isEditing)}
          isEditing={isEditing}
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

        <MarkdownEditor
          content={content}
          onSave={handleSavePage}
          onCancel={() => setIsEditing(false)}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
          currentPage={currentPage}
        />

        {!isEditing && (
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
                } else if (e.target.classList.contains('external-link')) {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = e.target.getAttribute('data-url');
                  if (url) {
                    handleExternalLinkClick(url);
                  }
                }
              }}
            />
          </ContentBox>
        )}
      </Box>
    </ThemeProvider>
  );
};



const root = createRoot(document.getElementById('root'));
root.render(<App />);

export default App;