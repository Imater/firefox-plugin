export const loadCurrentPage = async (currentPage) => {
  let result;
  try {
    result = await chrome.storage.local.get([
      'useApi', 
      'apiKey', 
      'apiUrl'
    ]);
    
    // Используем только API метод
    const apiUrl = result.apiUrl || 'http://127.0.0.1:27123/vault';
    const url = `${apiUrl}/${currentPage}`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/vnd.olrapi.note+json',
        'Authorization': `Bearer ${result.apiKey || ''}`
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    // Извлекаем контент из JSON ответа
    if (data.content) {
      return data.content;
    } else {
      throw new Error('Неверный формат ответа API');
    }
  } catch (error) {
    return `Error: ${error.message}${error.message.includes('401') ? `\nПроверьте настройки API в панели настроек` : ''}`;
  }
};

export const saveCurrentPage = async (currentPage, content) => {
  let result;
  try {
    result = await chrome.storage.local.get([
      'useApi', 
      'apiKey', 
      'apiUrl'
    ]);
    
    // Используем только API метод для сохранения
    const apiUrl = result.apiUrl || 'http://127.0.0.1:27123/vault';
    const url = `${apiUrl}/${currentPage}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/markdown',
        'Authorization': `Bearer ${result.apiKey || ''}`
      },
      body: content
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`API ошибка: ${error.message}`);
  }
};
