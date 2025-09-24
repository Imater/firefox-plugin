// Сервис для работы с историей посещений из ежедневных заметок
import { loadDailyNote, saveDailyNote } from './dailyNotesService';

// Функция для нормализации URL
export const normalizeUrl = (url) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    let normalized = urlObj.hostname + urlObj.pathname;
    
    // Убираем trailing slash если это не корневой путь
    if (normalized.endsWith('/') && normalized !== '/') {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return url;
  }
};

// Функция для проверки, является ли URL валидным для истории
export const isValidUrl = (url) => {
  if (!url) return false;
  
  // Исключаем системные URL
  return !url.startsWith('chrome://') && 
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('about:') &&
         !url.startsWith('moz-extension://') &&
         !url.startsWith('edge://') &&
         !url.includes('localhost') &&
         !url.includes('127.0.0.1') &&
         (url.startsWith('http://') || url.startsWith('https://'));
};

// Функция для форматирования времени
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

// Функция для создания записи истории в формате markdown
export const createHistoryEntry = (url, title) => {
  const normalizedUrl = normalizeUrl(url);
  const time = formatTime(Date.now());
  return `- [${normalizedUrl} - ${title} - ${time}](${url})`;
};

// Функция для загрузки истории из ежедневной заметки
export const loadHistoryFromNote = async (date) => {
  try {
    const noteContent = await loadDailyNote(date);
    if (!noteContent) return [];
    
    const lines = noteContent.split('\n');
    const historyEntries = [];
    
    for (const line of lines) {
      // Ищем строки, которые выглядят как записи истории в формате markdown ссылок
      const historyMatch = line.match(/^- \[(.+) - (.+) - (\d{2}:\d{2})\]\((.+)\)$/);
      if (historyMatch) {
        const [, normalizedUrl, title, time, fullUrl] = historyMatch;
        historyEntries.push({
          url: fullUrl.trim(),
          title: title.trim(),
          time: time.trim(),
          rawLine: line,
          normalizedUrl: normalizedUrl.trim()
        });
      }
    }
    
    // Сортируем по времени (самые свежие сверху)
    // Создаем объекты Date для корректной сортировки
    const sortedEntries = historyEntries.sort((a, b) => {
      // Парсим время в формате HH:MM
      const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes; // Конвертируем в минуты для сравнения
      };
      
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      
      // Сортируем по убыванию (более позднее время сначала)
      return timeB - timeA;
    });
    
    return sortedEntries;
  } catch (error) {
    console.error('Error loading history from note:', error);
    return [];
  }
};

// Функция для добавления новой записи в историю
export const addToHistory = async (date, url, title) => {
  try {
    if (!isValidUrl(url)) {
      console.log('Invalid URL for history:', url);
      return false;
    }

    const normalizedUrl = normalizeUrl(url);
    const noteContent = await loadDailyNote(date);
    const lines = noteContent ? noteContent.split('\n') : [];
    
    // Удаляем старую запись с таким же URL (если есть)
    const filteredLines = lines.filter(line => {
      const historyMatch = line.match(/^- \[(.+) - (.+) - (\d{2}:\d{2})\]\((.+)\)$/);
      if (historyMatch) {
        const [, existingNormalizedUrl, , , existingFullUrl] = historyMatch;
        return existingFullUrl.trim() !== url;
      }
      return true;
    });
    
    // Добавляем новую запись в начало
    const newEntry = createHistoryEntry(url, title);
    const newContent = [newEntry, ...filteredLines].join('\n');
    
    await saveDailyNote(date, newContent);
    return true;
  } catch (error) {
    console.error('Error adding to history:', error);
    return false;
  }
};

// Функция для удаления записи из истории
export const removeFromHistory = async (date, url) => {
  try {
    const noteContent = await loadDailyNote(date);
    if (!noteContent) return false;
    
    const lines = noteContent.split('\n');
    const filteredLines = lines.filter(line => {
      const historyMatch = line.match(/^- \[(.+) - (.+) - (\d{2}:\d{2})\]\((.+)\)$/);
      if (historyMatch) {
        const [, , , , existingFullUrl] = historyMatch;
        return existingFullUrl.trim() !== url;
      }
      return true;
    });
    
    const newContent = filteredLines.join('\n');
    await saveDailyNote(date, newContent);
    return true;
  } catch (error) {
    console.error('Error removing from history:', error);
    return false;
  }
};

// Функция для получения истории из заметки
export const getHistoryFromNote = async (date = new Date()) => {
  try {
    const history = await loadHistoryFromNote(date);
    return history;
  } catch (error) {
    console.error('Error getting history from note:', error);
    return [];
  }
};
