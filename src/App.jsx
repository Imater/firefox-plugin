import './chrome-mock';
import React, { useState, useEffect, useRef } from 'react';
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
import { renderMarkdown, countHotkeyTargets } from './utils/markdownRenderer';

// Services
import { loadCurrentPage, saveCurrentPage } from './services/pageService';
import { activateOrCreateTab, resolveUrl, cleanupClosedTabs } from './services/tabService';
import { 
  loadDailyNote, 
  saveDailyNote, 
  savePeriodicNote
} from './services/dailyNotesService';



function App() {
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState('index.md');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDailyNotesEditing, setIsDailyNotesEditing] = useState(false);
  const [dailyNotesPanelOpen, setDailyNotesPanelOpen] = useState(false);
  const [dailyNoteContent, setDailyNoteContent] = useState('');
  const [currentDailyDate, setCurrentDailyDate] = useState(new Date());
  const [currentNoteType] = useState('daily');

  
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

  // Слушаем сообщения от background script для обновления содержимого и горячих клавиш
  useEffect(() => {
    const handleMessage = async (message, sender, sendResponse) => {
      console.log('Получено сообщение в App.jsx:', message);
      
      if (message?.type === 'refresh_content' && message?.action === 'reload_bookmarks') {
        if (currentPage === 'index.md') {
          await handleLoadCurrentPage();
        }
      }

      if (message?.type === 'hotkeys') {
        console.log('Обрабатываем сообщение hotkeys:', message.action);
        if (message.action === 'activate' && typeof message.key === 'string') {
          const key = String(message.key).toLowerCase();
          const elements = document.querySelectorAll('[data-hotkey]');
          for (const element of elements) {
            if (element.getAttribute('data-hotkey') === key) {
              if (element.classList.contains('wiki-link')) {
                const pageName = element.getAttribute('data-page');
                if (pageName) handleWikiLinkClick(pageName);
              } else if (element.classList.contains('external-link')) {
                const url = element.getAttribute('data-url');
                if (url) handleExternalLinkClick(url);
              }
              break;
            }
          }
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [currentPage]);



  // Обработка нажатия горячих клавиш (внутри панели)
  useEffect(() => {
    let buffer = '';
    let bufferTimeoutId = null;

    const resetBuffer = () => {
      buffer = '';
      if (bufferTimeoutId) {
        clearTimeout(bufferTimeoutId);
        bufferTimeoutId = null;
      }
    };

    const handleHotkeyPress = (e) => {
      if (isEditing || isDailyNotesEditing) return; // Не обрабатываем горячие клавиши в режиме редактирования
      
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target && e.target.tagName) || '') || e.target.isContentEditable;
      if (isInput) return;

      let key = e.key.toLowerCase();
      
      // Обработка клавиши 0 для перехода домой
      if (key === '0') {
        e.preventDefault();
        goHome();
        return;
      }
      
      // Игнорируем модификаторы
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Принимаем только латиницу и цифры
      if (!/^[a-z0-9]$/.test(key)) return;

      // Буфер до 2 символов
      buffer = (buffer + key).slice(-2);
      if (bufferTimeoutId) clearTimeout(bufferTimeoutId);
      bufferTimeoutId = setTimeout(resetBuffer, 1000);
      
      const hotkeyElements = document.querySelectorAll('[data-hotkey]');
      
      // Пытаемся найти полное совпадение с буфером, если нет — пробуем последний символ
      const tryKeys = [buffer, key];
      for (const candidate of tryKeys) {
        const match = Array.from(hotkeyElements).find(el => el.getAttribute('data-hotkey') === candidate);
        if (match) {
          e.preventDefault();
          if (match.classList.contains('wiki-link')) {
            const pageName = match.getAttribute('data-page');
            if (pageName) {
              handleWikiLinkClick(pageName);
            }
          } else if (match.classList.contains('external-link')) {
            const url = match.getAttribute('data-url');
            if (url) {
              handleExternalLinkClick(url);
            }
          }
          resetBuffer();
          break;
        }
      }
    };

    if (!isEditing && !isDailyNotesEditing) {
      document.addEventListener('keydown', handleHotkeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleHotkeyPress);
    };
  }, [isEditing, isDailyNotesEditing]);



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
      const noteContent = await loadDailyNote(date);
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
          isDailyNotesEditing={isDailyNotesEditing}
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
              dangerouslySetInnerHTML={renderMarkdown(content, !isEditing && !isDailyNotesEditing, 0)} // Основной редактор начинается с индекса 0
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
          showHotkeys={!isEditing && !isDailyNotesEditing} // Показываем метки когда оба редактора не в режиме редактирования
          startIndex={!isEditing && !isDailyNotesEditing ? countHotkeyTargets(content) : 0}
          onEditingChange={setIsDailyNotesEditing} // Передаем функцию для обновления состояния редактирования
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