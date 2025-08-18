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
import Footer from './components/Footer';
import DailyNotesPanel from './components/DailyNotesPanel';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';

// Utils
import { renderMarkdown } from './utils/markdownRenderer';

// Services
import { loadCurrentPage, saveCurrentPage } from './services/pageService';
import { activateOrCreateTab, resolveUrl, cleanupClosedTabs } from './services/tabService';
import { 
  loadDailyNote, 
  saveDailyNote, 
  loadWeeklyNote, 
  loadMonthlyNote, 
  loadYearlyNote,
  savePeriodicNote
} from './services/dailyNotesService';



function App() {
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState('index.md');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dailyNotesPanelOpen, setDailyNotesPanelOpen] = useState(false);
  const [dailyNoteContent, setDailyNoteContent] = useState('');
  const [currentDailyDate, setCurrentDailyDate] = useState(new Date());
  const [currentNoteType, setCurrentNoteType] = useState('daily');
  
  const { isDarkMode, saveTheme } = useTheme();
  const { settings, setSettings, saveSettings } = useSettings();

  useEffect(() => {
    handleLoadCurrentPage();
  }, [currentPage]);

  // Сохраняем активную страницу для использования в background.js
  useEffect(() => {
    chrome.storage.local.set({ currentPage: currentPage });
  }, [currentPage]);

  useEffect(() => {
    handleLoadCurrentPage();
  }, []);

  // Загружаем заметку при изменении даты или типа
  useEffect(() => {
    if (dailyNotesPanelOpen) {
      handleLoadDailyNote(currentDailyDate, currentNoteType);
    }
  }, [currentDailyDate, currentNoteType, dailyNotesPanelOpen]);

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

  // Слушаем сообщения от background script для обновления содержимого
  useEffect(() => {
    const handleMessage = async (message, sender, sendResponse) => {
      if (message.type === 'refresh_content' && message.action === 'reload_bookmarks') {
        // Обновляем содержимое закладок
        if (currentPage === 'index.md') {
          await handleLoadCurrentPage();
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Очистка слушателя при размонтировании компонента
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [currentPage]);

  const handleLoadCurrentPage = async () => {
    const text = await loadCurrentPage(currentPage);
    setContent(text);
  };

  const handleSavePage = async (newContent) => {
    await saveCurrentPage(currentPage, newContent);
    setContent(newContent);
  };

  const handleLoadDailyNote = async (date, type = currentNoteType) => {
    try {
      let noteContent;
      switch (type) {
        case 'daily':
          noteContent = await loadDailyNote(date);
          break;
        case 'weekly':
          noteContent = await loadWeeklyNote(date);
          break;
        case 'monthly':
          noteContent = await loadMonthlyNote(date);
          break;
        case 'yearly':
          noteContent = await loadYearlyNote(date);
          break;
        default:
          noteContent = await loadDailyNote(date);
      }
      setDailyNoteContent(noteContent);
    } catch (error) {
      console.error(`Ошибка загрузки ${type} заметки:`, error);
      setDailyNoteContent('');
    }
  };

  const handleSaveDailyNote = async (newContent) => {
    await savePeriodicNote(currentDailyDate, newContent, currentNoteType);
    setDailyNoteContent(newContent);
  };

  const handleNoteTypeChange = async (newType) => {
    setCurrentNoteType(newType);
    await handleLoadDailyNote(currentDailyDate, newType);
  };

  const handleDailyDateChange = async (newDate) => {
    setCurrentDailyDate(newDate);
    await handleLoadDailyNote(newDate);
  };

  const handleDailyNotesPanelHeightChange = (newHeight) => {
    setSettings({ ...settings, dailyNotesPanelHeight: newHeight });
    chrome.storage.local.set({ dailyNotesPanelHeight: newHeight });
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
          <ContentBox hasFooter={true}>
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

        <DailyNotesPanel
          isOpen={dailyNotesPanelOpen}
          height={settings.dailyNotesPanelHeight}
          onHeightChange={handleDailyNotesPanelHeightChange}
          onDateChange={handleDailyDateChange}
          currentDate={currentDailyDate}
          content={dailyNoteContent}
          onSave={handleSaveDailyNote}
          noteType={currentNoteType}
          onNoteTypeChange={handleNoteTypeChange}
        />

        <Footer
          isOpen={dailyNotesPanelOpen}
          onToggle={() => setDailyNotesPanelOpen(!dailyNotesPanelOpen)}
          height={settings.dailyNotesPanelHeight}
          noteType={currentNoteType}
        />
      </Box>
    </ThemeProvider>
  );
};



const root = createRoot(document.getElementById('root'));
root.render(<App />);

export default App;