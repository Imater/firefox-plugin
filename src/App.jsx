import './chrome-mock';
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Alert, Paper, Typography, Button, Link } from '@mui/material';

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


// Hooks
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { styled } from '@mui/system';

const PomodoroToolbar = styled(Box)(({ theme, isVisible, dailyNotesPanelOpen, dailyNotesPanelHeight }) => ({
  position: 'fixed',
  bottom: dailyNotesPanelOpen ? '25px' : '24px', // Над футером панели ежедневных заметок (25px когда открыта, 24px когда свернута)
  left: 0,
  right: '0px', // Убираем отступ для календарной панели, так как она теперь внутри DailyNotesPanel
  height: isVisible ? '40px' : '0px',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  zIndex: 1000,
  '& .pomodoro-info': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: theme.palette.text.primary,
  },
  '& .pomodoro-task-link': {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& .pomodoro-controls': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  '& .pomodoro-button': {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

// Utils
import { renderMarkdown, countHotkeyTargets, resetUsedHotkeys } from './utils/markdownRenderer';

// Services
import { loadCurrentPage, saveCurrentPage } from './services/pageService';
import { activateOrCreateTab, resolveUrl, cleanupClosedTabs, closeAllTabsExceptCurrent } from './services/tabService';
import { 
  loadDailyNote, 
  saveDailyNote, 
  savePeriodicNote
} from './services/dailyNotesService';
import { loadLanguage, setLanguage, useTranslation } from './utils/i18n';



function App() {
  const { t } = useTranslation();
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
  const [scrollToTodayFunction, setScrollToTodayFunction] = useState(null);
  const [scrollToDateFunction, setScrollToDateFunction] = useState(null);
  const [calendarNotePreview, setCalendarNotePreview] = useState('');
  const [apiStatus, setApiStatus] = useState({ isConnected: true, isChecking: true, error: null });

  
  const { isDarkMode, saveTheme } = useTheme();
  const { settings, setSettings, saveSettings } = useSettings();
  const pomodoroTimer = usePomodoroTimer(settings.pomodoroMinutes || 25);

  // Функция для проверки работоспособности API Obsidian
  const checkObsidianAPI = async () => {
    if (!settings.useApi) {
      setApiStatus({ isConnected: true, isChecking: false, error: null });
      return;
    }

    setApiStatus({ isConnected: false, isChecking: true, error: null });
    
    try {
      // Проверяем доступность конкретного файла index.md в папке bookmarks
      const testUrl = 'http://127.0.0.1:27123/vault/bookmarks/index.md';
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        setApiStatus({ isConnected: true, isChecking: false, error: null });
        console.log('Obsidian API is working correctly - index.md file is accessible');
      } else if (response.status === 404) {
        throw new Error('Файл bookmarks/index.md не найден в Obsidian');
      } else if (response.status === 401) {
        throw new Error('Неверный API ключ');
      } else {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Obsidian API check failed:', error);
      setApiStatus({ 
        isConnected: false, 
        isChecking: false, 
        error: error.message 
      });
    }
  };

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

  // Инициализация языка при запуске
  useEffect(() => {
    const initializeLanguage = async () => {
      const savedLanguage = await loadLanguage();
      if (savedLanguage !== settings.language) {
        setSettings(prev => ({ ...prev, language: savedLanguage }));
      }
    };
    initializeLanguage();
  }, []);

  // Обновление языка при изменении настроек
  useEffect(() => {
    if (settings.language) {
      setLanguage(settings.language);
    }
  }, [settings.language]);

  // Проверка API при изменении настроек
  useEffect(() => {
    if (settings.useApi && settings.apiUrl && settings.apiKey) {
      checkObsidianAPI();
    }
  }, [settings.useApi, settings.apiUrl, settings.apiKey]);

  // Инициализация - загружаем последнюю открытую страницу и состояние ежедневных заметок
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const result = await chrome.storage.local.get(['lastOpenedPage', 'dailyNotesPanelOpen']);
        const lastPage = result.lastOpenedPage || 'index.md';
        const dailyNotesOpen = result.dailyNotesPanelOpen || false;
        
        // Устанавливаем календарную панель по умолчанию, если настройка не найдена
        
        
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

  // Обработка завершенного таймера помодорро
  useEffect(() => {
    const completedPomodoro = localStorage.getItem('pomodoroCompleted');
    if (completedPomodoro) {
      try {
        const data = JSON.parse(completedPomodoro);
        console.log('Pomodoro completed:', data);
        // Здесь можно добавить уведомление или другую логику
        localStorage.removeItem('pomodoroCompleted');
      } catch (error) {
        console.error('Error parsing completed pomodoro:', error);
        localStorage.removeItem('pomodoroCompleted');
      }
    }
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
              } else if (element.classList.contains('task-checkbox')) {
                // Обработка галочек
                element.click();
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
           
                       // Обработка стрелок вверх и вниз для навигации по ежедневным заметкам
            if ((key === 'arrowup' || key === 'up') && !isEditing && !isDailyNotesEditing) {
              e.preventDefault();
              // Эмулируем нажатие кнопки "вчера" в DailyNotesPanel
              if (window.dailyNotesPanelRef && window.dailyNotesPanelRef.handleDateChange) {
                window.dailyNotesPanelRef.handleDateChange('yesterday');
              }
              resetBuffer();
              return;
            }
            
            if ((key === 'arrowdown' || key === 'down') && !isEditing && !isDailyNotesEditing) {
              e.preventDefault();
              // Эмулируем нажатие кнопки "завтра" в DailyNotesPanel
              if (window.dailyNotesPanelRef && window.dailyNotesPanelRef.handleDateChange) {
                window.dailyNotesPanelRef.handleDateChange('tomorrow');
              }
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
            } else if (el.classList.contains('task-checkbox')) {
              // Обработка галочек
              el.click();
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
      setSelectedDate(newDate); // Обновляем выбранную дату в календаре
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
               marginRight: '0px' // Убираем отступ для календарной панели, так как она теперь внутри DailyNotesPanel
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

        {/* Предупреждение о недоступности API Obsidian */}
        {settings.useApi && !apiStatus.isConnected && !apiStatus.isChecking && (
          <Alert 
            severity="warning" 
            sx={{ 
              margin: '8px 16px', 
              borderRadius: '8px',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={checkObsidianAPI}
                sx={{ minWidth: 'auto' }}
              >
                Повторить
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {t('api.warning.title')}
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: '8px' }}>
              {t('api.warning.step1')}{' '}
              <Link 
                href="https://github.com/coddingtonbear/obsidian-local-rest-api" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ fontWeight: 'bold' }}
              >
                Local REST API for Obsidian
              </Link>
              {' '}и{' '}
              <Link 
                href="https://github.com/liamcain/obsidian-periodic-notes" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ fontWeight: 'bold' }}
              >
                Periodic Notes
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: '8px' }}>
              {t('api.warning.step2')}
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: '8px' }}>
              {t('api.warning.step3')}
            </Typography>
            {apiStatus.error && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {t('api.warning.error')} {apiStatus.error}
              </Typography>
            )}
          </Alert>
        )}

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
                             key={`content-${content.length}-${content.substring(0, 50)}`} // Простой ключ без Date.now()
                             dangerouslySetInnerHTML={renderMarkdown(content, !isEditing && !isDailyNotesEditing && settings.enableHotkeys, 0, settings.lettersOnlyHotkeys, currentHotkeyBuffer, openTabs, false)} // Основной редактор - не daily notes
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
                 key={`daily-notes-${dailyNoteContent.length}-${dailyNoteContent.substring(0, 50)}-${currentDailyDate.toDateString()}`} // Простой ключ без Date.now()
                 isOpen={dailyNotesPanelOpen}
                 height={settings.dailyNotesPanelHeight}
                 onHeightChange={handleDailyNotesPanelHeightChange}
                 onDateChange={handleDailyDateChange}
                 currentDate={currentDailyDate}
                 content={dailyNoteContent}
                 onSave={handleSaveDailyNote}
                 noteType={currentNoteType}
                 showHotkeys={!isEditing && !isDailyNotesEditing && settings.enableHotkeys} // Показываем метки когда оба редактора не в режиме редактирования и горячие клавиши включены
                                   startIndex={!isEditing && !isDailyNotesEditing ? 0 : 0} // Используем общую систему резервирования
                 onEditingChange={setIsDailyNotesEditing} // Передаем функцию для обновления состояния редактирования
                 lettersOnlyHotkeys={settings.lettersOnlyHotkeys}
                 currentHotkeyBuffer={currentHotkeyBuffer}
                 onLinkHover={setHoveredLink}
                 openTabs={openTabs}
                 onTodayClick={scrollToTodayFunction ? () => scrollToTodayFunction() : null}
                 onScrollToDate={scrollToDateFunction ? (date) => scrollToDateFunction(date) : null}
                 notePreview={calendarNotePreview}
                 pomodoroTimer={pomodoroTimer}
                 settings={settings}
                 onDateSelect={handleDateSelect}
                 selectedDate={selectedDate}
                 onCalendarNotePreview={setCalendarNotePreview}
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



             </Box>
             
                           <PomodoroToolbar 
                isVisible={pomodoroTimer && pomodoroTimer.activeTask && pomodoroTimer.isRunning}
                dailyNotesPanelOpen={dailyNotesPanelOpen}
                dailyNotesPanelHeight={settings.dailyNotesPanelHeight}
              >
               {pomodoroTimer && pomodoroTimer.activeTask && pomodoroTimer.isRunning && (
                 <>
                   <div className="pomodoro-info">
                     <span>🔴</span>
                     <span className="pomodoro-timer-display">
                       {pomodoroTimer.formatTime(pomodoroTimer.timeLeft)}
                     </span>
                     <span 
                       className="pomodoro-task-link"
                       onClick={() => {
                         // Ищем задачу во всех загруженных заметках и переключаемся на нужную дату
                         const findTaskInNotes = async () => {
                           try {
                             // Проверяем текущую заметку
                             if (dailyNoteContent.includes(pomodoroTimer.activeTask)) {
                               // Задача в текущей заметке, просто прокручиваем к ней
                               const taskElement = document.querySelector(`[data-task-text="${pomodoroTimer.activeTask}"]`);
                               if (taskElement) {
                                 taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                               }
                               return;
                             }
                             
                             // Если задача не в текущей заметке, ищем в других заметках
                             // Проверяем последние 30 дней
                             const today = new Date();
                             for (let i = 0; i < 30; i++) {
                               const checkDate = new Date(today);
                               checkDate.setDate(today.getDate() - i);
                               
                               try {
                                 const noteContent = await loadDailyNote(checkDate);
                                 if (noteContent.includes(pomodoroTimer.activeTask)) {
                                   // Нашли задачу, переключаемся на эту дату
                                   setCurrentDailyDate(checkDate);
                                   setSelectedDate(checkDate);
                                   await handleLoadDailyNote(checkDate);
                                   
                                   // Ждем загрузки и прокручиваем к задаче
                                   setTimeout(() => {
                                     const taskElement = document.querySelector(`[data-task-text="${pomodoroTimer.activeTask}"]`);
                                     if (taskElement) {
                                       taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                     }
                                   }, 500);
                                   return;
                                 }
                               } catch (error) {
                                 // Игнорируем ошибки загрузки заметок
                                 continue;
                               }
                             }
                             
                             // Если не нашли, показываем уведомление
                             console.log('Задача не найдена в последних 30 днях');
                           } catch (error) {
                             console.error('Ошибка поиска задачи:', error);
                           }
                         };
                         
                         findTaskInNotes();
                       }}
                     >
                       {pomodoroTimer.activeTask}
                     </span>
                   </div>
                   <div className="pomodoro-controls">
                     <button 
                       className="pomodoro-button"
                       onClick={() => {
                         pomodoroTimer.stop();
                         
                         // Ищем задачу и добавляем помидорку в правильную заметку
                         const addPomodoroToCorrectNote = async () => {
                           try {
                             // Проверяем текущую заметку
                             if (dailyNoteContent.includes(pomodoroTimer.activeTask)) {
                               // Задача в текущей заметке
                               const currentContent = dailyNoteContent;
                               const now = new Date();
                               const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                               const checkboxPattern = new RegExp(`^- \\[ \\] (${pomodoroTimer.activeTask.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`, 'gm');
                               const newContent = currentContent.replace(checkboxPattern, (match) => {
                                 return `${match} 🔴 ${timeString}`;
                               });
                               
                               handleSaveDailyNote(newContent);
                               return;
                             }
                             
                             // Если задача не в текущей заметке, ищем в других заметках
                             const today = new Date();
                             for (let i = 0; i < 30; i++) {
                               const checkDate = new Date(today);
                               checkDate.setDate(today.getDate() - i);
                               
                               try {
                                 const noteContent = await loadDailyNote(checkDate);
                                 if (noteContent.includes(pomodoroTimer.activeTask)) {
                                   // Нашли задачу, добавляем помидорку в эту заметку
                                   const now = new Date();
                                   const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                                   const checkboxPattern = new RegExp(`^- \\[ \\] (${pomodoroTimer.activeTask.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`, 'gm');
                                   const newContent = noteContent.replace(checkboxPattern, (match) => {
                                     return `${match} 🔴 ${timeString}`;
                                   });
                                   
                                   // Сохраняем заметку
                                   await saveDailyNote(checkDate, newContent);
                                   return;
                                 }
                               } catch (error) {
                                 // Игнорируем ошибки загрузки заметок
                                 continue;
                               }
                             }
                             
                             console.log('Задача не найдена для добавления помидорки');
                           } catch (error) {
                             console.error('Ошибка добавления помидорки:', error);
                           }
                         };
                         
                         addPomodoroToCorrectNote();
                       }}
                       title="Остановить"
                     >
                       ⏹️
                     </button>
                     <button 
                       className="pomodoro-button"
                       onClick={() => {
                         if (pomodoroTimer.isPaused) {
                           pomodoroTimer.resume();
                         } else {
                           pomodoroTimer.pause();
                         }
                       }}
                       title={pomodoroTimer.isPaused ? "Возобновить" : "Пауза"}
                     >
                       {pomodoroTimer.isPaused ? '▶️' : '⏸️'}
                     </button>
                   </div>
                 </>
               )}
             </PomodoroToolbar>
           </ThemeProvider>
         );
};



// Provider moved to index.js

export default App;