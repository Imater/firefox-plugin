// Функция для получения компонентов даты
const getDateComponents = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return { year, month, day };
};

// Загрузка ежедневной заметки через Periodic Notes API
export const loadDailyNote = async (date) => {
  try {
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl', 'periodicApiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с ежедневными заметками необходимо включить API режим в настройках');
    }
    
    // Используем отдельный URL для Periodic Notes API
    const periodicApiUrl = result.periodicApiUrl || 'http://127.0.0.1:27123';
    const { year, month, day } = getDateComponents(date);
    
    // Используем специальный эндпоинт для Periodic Notes
    const url = `${periodicApiUrl}/periodic/daily/${year}/${month}/${day}/`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/vnd.olrapi.note+json',
        'Authorization': `Bearer ${result.apiKey || ''}`
      }
    });
    
    if (response.status === 404) {
      // Если заметка не существует, возвращаем пустой контент
      return '';
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Извлекаем контент из JSON ответа
    if (data.content) {
      return data.content;
    } else {
      throw new Error('Неверный формат ответа API');
    }
  } catch (error) {
    if (error.message.includes('404')) {
      return '';
    }
    throw new Error(`Ошибка загрузки ежедневной заметки: ${error.message}`);
  }
};

// Сохранение ежедневной заметки через Periodic Notes API
export const saveDailyNote = async (date, content) => {
  try {
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl', 'periodicApiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с ежедневными заметками необходимо включить API режим в настройках');
    }
    
    // Используем отдельный URL для Periodic Notes API
    const periodicApiUrl = result.periodicApiUrl || 'http://127.0.0.1:27123';
    const { year, month, day } = getDateComponents(date);
    
    // Используем специальный эндпоинт для Periodic Notes
    const url = `${periodicApiUrl}/periodic/daily/${year}/${month}/${day}/`;
    
    // Всегда используем PUT, так как POST может не поддерживаться API
    const method = 'PUT';
    
    // Создаем контроллер для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'accept': '*/*',
          'Content-Type': 'text/markdown',
          'Authorization': `Bearer ${result.apiKey || ''}`
        },
        body: content,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Превышено время ожидания ${method} запроса (5 секунд)`);
      }
      throw fetchError;
    }
  } catch (error) {
    throw new Error(`Ошибка сохранения ежедневной заметки: ${error.message}`);
  }
};

// Универсальная функция сохранения для всех типов Periodic Notes
export const savePeriodicNote = async (date, content, type = 'daily') => {
  try {
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl', 'periodicApiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с заметками необходимо включить API режим в настройках');
    }
    
    // Используем отдельный URL для Periodic Notes API
    const periodicApiUrl = result.periodicApiUrl || 'http://127.0.0.1:27123';
    const { year, month, day } = getDateComponents(date);
    
    // Используем специальный эндпоинт для Periodic Notes
    const url = `${periodicApiUrl}/periodic/${type}/${year}/${month}/${day}/`;
    
    // Всегда используем PUT, так как POST может не поддерживаться API
    const method = 'PUT';
    
    // Создаем контроллер для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'accept': '*/*',
          'Content-Type': 'text/markdown',
          'Authorization': `Bearer ${result.apiKey || ''}`
        },
        body: content,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Превышено время ожидания ${method} запроса (5 секунд)`);
      }
      throw fetchError;
    }
  } catch (error) {
    throw new Error(`Ошибка сохранения ${type} заметки: ${error.message}`);
  }
};

// Получение списка существующих ежедневных заметок через Periodic Notes API
export const getDailyNotesList = async () => {
  try {
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl', 'periodicApiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с ежедневными заметками необходимо включить API режим в настройках');
    }
    
    // Используем отдельный URL для Periodic Notes API
    const periodicApiUrl = result.periodicApiUrl || 'http://127.0.0.1:27123';
    
    // Используем эндпоинт для получения списка Periodic Notes
    const url = `${periodicApiUrl}/periodic/daily/`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${result.apiKey || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Возвращаем список ежедневных заметок
    return data.notes || [];
  } catch (error) {
    throw new Error(`Ошибка получения списка ежедневных заметок: ${error.message}`);
  }
};

// Дополнительные функции для работы с другими типами Periodic Notes

// Загрузка еженедельной заметки
export const loadWeeklyNote = async (date) => {
  try {
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl', 'periodicApiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с еженедельными заметками необходимо включить API режим в настройках');
    }
    
    // Используем отдельный URL для Periodic Notes API
    const periodicApiUrl = result.periodicApiUrl || 'http://127.0.0.1:27123';
    const { year, month, day } = getDateComponents(date);
    
    const url = `${periodicApiUrl}/periodic/weekly/${year}/${month}/${day}/`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/vnd.olrapi.note+json',
        'Authorization': `Bearer ${result.apiKey || ''}`
      }
    });
    
    if (response.status === 404) {
      return '';
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content || '';
  } catch (error) {
    if (error.message.includes('404')) {
      return '';
    }
    throw new Error(`Ошибка загрузки еженедельной заметки: ${error.message}`);
  }
};

// Загрузка ежемесячной заметки
export const loadMonthlyNote = async (date) => {
  try {
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl', 'periodicApiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с ежемесячными заметками необходимо включить API режим в настройках');
    }
    
    // Используем отдельный URL для Periodic Notes API
    const periodicApiUrl = result.periodicApiUrl || 'http://127.0.0.1:27123';
    const { year, month, day } = getDateComponents(date);
    
    const url = `${periodicApiUrl}/periodic/monthly/${year}/${month}/${day}/`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/vnd.olrapi.note+json',
        'Authorization': `Bearer ${result.apiKey || ''}`
      }
    });
    
    if (response.status === 404) {
      return '';
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content || '';
  } catch (error) {
    if (error.message.includes('404')) {
      return '';
    }
    throw new Error(`Ошибка загрузки ежемесячной заметки: ${error.message}`);
  }
};

// Загрузка ежегодной заметки
export const loadYearlyNote = async (date) => {
  try {
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl', 'periodicApiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с ежегодными заметками необходимо включить API режим в настройках');
    }
    
    // Используем отдельный URL для Periodic Notes API
    const periodicApiUrl = result.periodicApiUrl || 'http://127.0.0.1:27123';
    const { year, month, day } = getDateComponents(date);
    
    const url = `${periodicApiUrl}/periodic/yearly/${year}/${month}/${day}/`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/vnd.olrapi.note+json',
        'Authorization': `Bearer ${result.apiKey || ''}`
      }
    });
    
    if (response.status === 404) {
      return '';
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content || '';
  } catch (error) {
    if (error.message.includes('404')) {
      return '';
    }
    throw new Error(`Ошибка загрузки ежегодной заметки: ${error.message}`);
  }
};

// Функция для загрузки заметки по дате
export const loadNoteByDate = async (date, settings) => {
  if (!settings.useApi) {
    console.log('API disabled, cannot load note by date');
    return null;
  }

  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Используем правильный URL для Periodic Notes API
    const periodicApiUrl = settings.periodicApiUrl || 'http://127.0.0.1:27123';
    const url = `${periodicApiUrl}/periodic/daily/${year}/${month}/${day}/`;
    console.log('Fetching daily note from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'accept': 'application/vnd.olrapi.note+json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('API response for date:', `${year}-${month}-${day}`, data);
      return data.content || '';
    } else if (response.status === 404) {
      // Заметка не существует, возвращаем пустую строку
      console.log('Note not found for date:', `${year}-${month}-${day}`);
      return '';
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error loading note by date:', error);
    return null;
  }
};

// Функция для подсчета непроставленных галочек в заметке
export const countUncheckedTasks = (content) => {
  if (!content) return { unchecked: 0, checked: 0 };
  
  const lines = content.split('\n');
  let unchecked = 0;
  let checked = 0;
  
  console.log('Counting tasks in content:', content.substring(0, 200) + '...');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    console.log('Processing line:', `"${trimmedLine}"`);
    
    // Ищем строки, которые содержат галочки (с учетом возможных пробелов)
    if (trimmedLine.match(/^- \[ \]/)) {
      unchecked++;
      console.log('Found unchecked task:', trimmedLine);
    } else if (trimmedLine.match(/^- \[[xX]\]/)) {
      checked++;
      console.log('Found checked task:', trimmedLine);
    }
  }
  
  console.log('Task count result:', { unchecked, checked });
  return { unchecked, checked };
};

// Функция для буферизации заметок по датам
export const bufferNotesByDates = async (dates, settings) => {
  const notesBuffer = new Map();
  
  // Сортируем даты: сначала сегодня, потом будущие, потом прошлые
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sortedDates = dates.sort((a, b) => {
    const aDate = new Date(a);
    const bDate = new Date(b);
    aDate.setHours(0, 0, 0, 0);
    bDate.setHours(0, 0, 0, 0);
    
    // Сегодняшняя дата имеет приоритет
    if (aDate.getTime() === today.getTime()) return -1;
    if (bDate.getTime() === today.getTime()) return 1;
    
    // Будущие даты идут после сегодняшней
    if (aDate > today && bDate <= today) return -1;
    if (bDate > today && aDate <= today) return 1;
    
    // Среди будущих дат - по возрастанию
    if (aDate > today && bDate > today) {
      return aDate - bDate;
    }
    
    // Среди прошлых дат - по убыванию (более недавние сначала)
    return bDate - aDate;
  });
  
  // Загружаем заметки
  for (const date of sortedDates) {
    try {
      const content = await loadNoteByDate(date, settings);
      const dateKey = date.toDateString();
      console.log(`Buffer: Processing date ${dateKey}, content length: ${content?.length || 0}`);
      
      if (content !== null) {
        notesBuffer.set(dateKey, content);
        console.log(`Buffer: Added note for ${dateKey}, buffer size now: ${notesBuffer.size}`);
      } else {
        console.log(`Buffer: No content for ${dateKey}`);
      }
    } catch (error) {
      console.error(`Error loading note for ${date.toDateString()}:`, error);
    }
  }
  
  console.log('Buffer: Final buffer contents:', Array.from(notesBuffer.entries()));
  return notesBuffer;
};
