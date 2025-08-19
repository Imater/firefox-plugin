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
import LinkPreview from './components/LinkPreview';
import CalendarPanel from './components/CalendarPanel';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';

// Utils
import { renderMarkdown, countHotkeyTargets } from './utils/markdownRenderer';

// Services
import { loadCurrentPage, saveCurrentPage } from './services/pageService';
import { activateOrCreateTab, resolveUrl, cleanupClosedTabs, closeAllTabsExceptCurrent } from './services/tabService';
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
  const [isWaitingForSecondKey, setIsWaitingForSecondKey] = useState(false);
  const [currentHotkeyBuffer, setCurrentHotkeyBuffer] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredLink, setHoveredLink] = useState('');
  const [openTabs, setOpenTabs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  
  const { isDarkMode, saveTheme } = useTheme();
  const { settings, setSettings, saveSettings } = useSettings();

  // Функция для получения открытых вкладок
  const getOpenTabs = async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const tabUrls = tabs.map(tab => tab.url).filter(url => url && url !== 'chrome://newtab/');
      setOpenTabs(tabUrls);
    } catch (error) {
      console.error('Error getting open tabs:', error);
      setOpenTabs([]);
    }
  };

  // Инициализация - загружаем последнюю открытую страницу и состояние ежедневных заметок
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const result = await chrome.storage.local.get(['lastOpenedPage', 'dailyNotesPanelOpen', 'showCalendarPanel']);
        const lastPage = result.lastOpenedPage || 'index.md';
        const dailyNotesOpen = result.dailyNotesPanelOpen || false;
        
        // Устанавливаем календарную панель по умолчанию, если настройка не найдена
        if (result.showCalendarPanel === undefined) {
          await chrome.storage.local.set({ showCalendarPanel: true });
        }
        
        setCurrentPage(lastPage);
        setDailyNotesPanelOpen(dailyNotesOpen);
        setIsInitialized(true);
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        setCurrentPage('index.md');
        setDailyNotesPanelOpen(false);
        setIsInitialized(true);
      }
    };
    
    initializeApp();
  }, []);

  // Получаем открытые вкладки при загрузке и при изменении вкладок
  useEffect(() => {
    getOpenTabs();
    
    // Слушаем изменения вкладок
    const handleTabUpdated = () => getOpenTabs();
    const handleTabRemoved = () => getOpenTabs();
    const handleTabCreated = () => getOpenTabs();
    
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onCreated.addListener(handleTabCreated);
    
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
      chrome.tabs.onCreated.removeListener(handleTabCreated);
    };
  }, []);

  useEffect(() => {
    if (isInitialized) {
      handleLoadCurrentPage();
    }
  }, [currentPage, isInitialized]);

  // Сохраняем активную страницу для использования в background.js и запоминаем последнюю открытую
  useEffect(() => {
    if (isInitialized) {
      chrome.storage.local.set({ 
        currentPage: currentPage,
        lastOpenedPage: currentPage 
      });
    }
  }, [currentPage, isInitialized]);

  // Сохраняем состояние панели ежедневных заметок
  useEffect(() => {
    if (isInitialized) {
      chrome.storage.local.set({ 
        dailyNotesPanelOpen: dailyNotesPanelOpen 
      });
    }
  }, [dailyNotesPanelOpen, isInitialized]);

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
          let key = String(message.key).toLowerCase();
          
                     // Преобразуем русские буквы в английские по раскладке клавиатуры
           const russianToEnglishMap = {
             'а': 'f', 'б': ',', 'в': 'd', 'г': 'u', 'д': 'l', 'е': 't', 'ё': '`',
             'ж': ';', 'з': 'p', 'и': 'b', 'й': 'q', 'к': 'r', 'л': 'k', 'м': 'v',
             'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c', 'т': 'n', 'у': 'e',
             'ф': 'a', 'х': '[', 'ц': 'w', 'ч': 'x', 'ш': 'i', 'щ': 'o',
             'ъ': ']', 'ы': 's', 'ь': 'm', 'э': "'", 'ю': '.', 'я': 'z'
           };
          
          if (russianToEnglishMap[key]) {
            key = russianToEnglishMap[key];
          }
          
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
         const hotkeyBufferRef = { current: '' };
     
         // Маппинг русских букв на английские по раскладке клавиатуры
         const russianToEnglishMap = {
           'а': 'f', 'б': ',', 'в': 'd', 'г': 'u', 'д': 'l', 'е': 't', 'ё': '`',
           'ж': ';', 'з': 'p', 'и': 'b', 'й': 'q', 'к': 'r', 'л': 'k', 'м': 'v',
           'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c', 'т': 'n', 'у': 'e',
           'ф': 'a', 'х': '[', 'ц': 'w', 'ч': 'x', 'ш': 'i', 'щ': 'o',
           'ъ': ']', 'ы': 's', 'ь': 'm', 'э': "'", 'ю': '.', 'я': 'z'
         };
     
         const resetBuffer = () => {
           hotkeyBufferRef.current = '';
           setIsWaitingForSecondKey(false);
           setCurrentHotkeyBuffer('');
         };
     
         const handleHotkeyPress = (e) => {
           if (isEditing || isDailyNotesEditing) return; // Не обрабатываем горячие клавиши в режиме редактирования
           if (!settings.enableHotkeys) return; // Проверяем, включены ли горячие клавиши
           
           const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target && e.target.tagName) || '') || e.target.isContentEditable;
           if (isInput) return;
     
           let key = e.key.toLowerCase();
           const originalKey = key;
           
           // Преобразуем русские буквы в английские
           if (russianToEnglishMap[key]) {
             key = russianToEnglishMap[key];
             console.log(`Русская буква "${originalKey}" преобразована в "${key}"`);
           }
      
           // Обработка клавиши ESC для отмены двойной метки
           if (key === 'escape') {
             e.preventDefault();
             resetBuffer();
             return;
           }
           
           // Обработка клавиши 0 для перехода домой
           if (key === '0') {
             e.preventDefault();
             goHome();
             resetBuffer();
             return;
           }
           
           // Обработка клавиши + для переключения ежедневных заметок
           if (key === '+' || key === '=') {
             e.preventDefault();
             setDailyNotesPanelOpen(prev => !prev);
             resetBuffer();
             return;
           }
           
           // Обработка клавиши - для закрытия всех вкладок кроме текущей
           if (key === '-') {
             e.preventDefault();
             handleCloseAllTabs();
             resetBuffer();
             return;
           }
      
           // Игнорируем модификаторы
           if (e.ctrlKey || e.metaKey || e.altKey) return;

           // Проверяем допустимые символы в зависимости от настроек
           const validPattern = settings.lettersOnlyHotkeys ? /^[a-z]$/ : /^[a-z0-9]$/;
           if (!validPattern.test(key)) {
             console.log(`Ключ "${key}" (изначально "${originalKey}") не прошел проверку`);
             return;
           }

           // Обновляем буфер
           hotkeyBufferRef.current = (hotkeyBufferRef.current + key).slice(-2);
           setCurrentHotkeyBuffer(hotkeyBufferRef.current);
           
           const hotkeyElements = document.querySelectorAll('[data-hotkey]');
           console.log(`Найдено элементов с горячими клавишами: ${hotkeyElements.length}`);

           const bufferVal = hotkeyBufferRef.current;
           const elementsArr = Array.from(hotkeyElements);
           console.log(`Текущий буфер: "${bufferVal}", ищем точное совпадение`);
           
           // Выводим все доступные горячие клавиши для отладки
           elementsArr.forEach(el => {
             const hotkey = el.getAttribute('data-hotkey');
             const text = el.textContent?.trim().substring(0, 20);
             console.log(`Элемент с горячей клавишей "${hotkey}": "${text}"`);
           });
           
           const exactMatch = elementsArr.find(el => (el.getAttribute('data-hotkey') || '') === bufferVal);
           console.log(`Точное совпадение найдено: ${exactMatch ? 'ДА' : 'НЕТ'}`);
           
           const hasLongerPrefix = elementsArr.some(el => {
             const hk = el.getAttribute('data-hotkey') || '';
             return hk.startsWith(bufferVal) && hk.length > bufferVal.length;
           });
           console.log(`Есть более длинные префиксы: ${hasLongerPrefix ? 'ДА' : 'НЕТ'}`);

           const triggerElement = (el) => {
             e.preventDefault();
             if (el.classList.contains('wiki-link')) {
               const pageName = el.getAttribute('data-page');
               if (pageName) handleWikiLinkClick(pageName);
             } else if (el.classList.contains('external-link')) {
               const url = el.getAttribute('data-url');
               if (url) handleExternalLinkClick(url);
             }
             resetBuffer();
           };

           // Если есть точное совпадение - срабатываем сразу
           if (exactMatch) {
             triggerElement(exactMatch);
             return;
           }
           
           // Если нет точного совпадения, но есть более длинный префикс - ждем следующую клавишу
           if (hasLongerPrefix) {
             setIsWaitingForSecondKey(true);
             return;
           }
           
           // Если нет точного совпадения и нет более длинного префикса - сбрасываем буфер
           resetBuffer();
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

  const handleCloseAllTabs = async () => {
    await closeAllTabsExceptCurrent();
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentDailyDate(date);
    setDailyNotesPanelOpen(true);
  };

  const handleWikiLinkClick = (pageName) => {
    setHoveredLink(null); // Скрываем панель при переходе
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
      setHoveredLink(null); // Скрываем панель при переходе
          // Получаем базовый URL из настроек API
    const result = await chrome.storage.local.get(['apiUrl']);
    const baseUrl = result.apiUrl || 'http://127.0.0.1:27123/vault';
      
      // Разрешаем URL (преобразуем относительные в абсолютные)
      const resolvedUrl = resolveUrl(baseUrl, url);
      
      // Активируем или создаём вкладку с учетом настроек
      await activateOrCreateTab(resolvedUrl, {
        openInCurrentTab: settings.openInCurrentTab,
        singleTabMode: settings.singleTabMode
      });
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

  // Добавляем функции в глобальный объект для доступа из DailyNotesPanel
  useEffect(() => {
    window.handleWikiLinkClick = handleWikiLinkClick;
    window.handleExternalLinkClick = handleExternalLinkClick;
    
    return () => {
      delete window.handleWikiLinkClick;
      delete window.handleExternalLinkClick;
    };
  }, [handleWikiLinkClick, handleExternalLinkClick]);

      return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
                   <Box sx={{
               height: '100vh',
               display: 'flex',
               flexDirection: 'column',
               overflowX: 'hidden',
               overflowY: 'hidden',
               marginRight: settings.showCalendarPanel ? '50px' : '0px' // Отступ для календарной панели
             }}>
        <Header 
          onRefresh={handleLoadCurrentPage}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onCloseAllTabs={handleCloseAllTabs}
          isEditing={isEditing}
          isDailyNotesEditing={isDailyNotesEditing}
          currentPage={currentPage}
          onBreadcrumbClick={handleBreadcrumbClick}
          isDarkMode={isDarkMode}
          isWaitingForSecondKey={isWaitingForSecondKey}
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
          <ContentBox 
            hasFooter={true}
            dailyNotesPanelOpen={dailyNotesPanelOpen}
            dailyNotesPanelHeight={settings.dailyNotesPanelHeight}
          >
            <div 
              dangerouslySetInnerHTML={renderMarkdown(content, !isEditing && !isDailyNotesEditing && settings.enableHotkeys, 0, settings.lettersOnlyHotkeys, currentHotkeyBuffer, openTabs)} // Основной редактор начинается с индекса 0
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
              onMouseOver={(e) => {
                if (e.target.classList.contains('wiki-link')) {
                  const pageName = e.target.getAttribute('data-page');
                  if (pageName) {
                    setHoveredLink(`[[${pageName}]]`);
                  }
                } else if (e.target.classList.contains('external-link')) {
                  const url = e.target.getAttribute('data-url');
                  if (url) {
                    setHoveredLink(url);
                  }
                }
              }}
              onMouseOut={(e) => {
                if (e.target.classList.contains('wiki-link') || e.target.classList.contains('external-link')) {
                  setHoveredLink('');
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
          showHotkeys={!isEditing && !isDailyNotesEditing && settings.enableHotkeys} // Показываем метки когда оба редактора не в режиме редактирования и горячие клавиши включены
          startIndex={!isEditing && !isDailyNotesEditing ? countHotkeyTargets(content) : 0}
          onEditingChange={setIsDailyNotesEditing} // Передаем функцию для обновления состояния редактирования
          lettersOnlyHotkeys={settings.lettersOnlyHotkeys}
          currentHotkeyBuffer={currentHotkeyBuffer}
          onLinkHover={setHoveredLink}
          openTabs={openTabs}
        />

        <Footer
          isOpen={dailyNotesPanelOpen}
          onToggle={() => setDailyNotesPanelOpen(prev => !prev)}
          height={settings.dailyNotesPanelHeight}
          noteType={currentNoteType}
          isEditing={isEditing}
          isDailyNotesEditing={isDailyNotesEditing}
        />
        
                       <LinkPreview
                 link={hoveredLink}
                 isVisible={!!hoveredLink && !isEditing && !isDailyNotesEditing}
               />

               {settings.showCalendarPanel && (
                 <CalendarPanel
                   onDateSelect={handleDateSelect}
                   currentDate={selectedDate}
                 />
               )}

             </Box>
           </ThemeProvider>
         );
};



const root = createRoot(document.getElementById('root'));
root.render(<App />);

export default App;