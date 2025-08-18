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
