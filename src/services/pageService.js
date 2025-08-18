export const loadCurrentPage = async (currentPage) => {
  let result;
  try {
    result = await chrome.storage.local.get([
      'webdavUrl', 
      'username', 
      'password', 
      'useApi', 
      'apiKey', 
      'apiUrl'
    ]);
    
    // Проверяем, какой метод использовать
    if (result.useApi) {
      // API метод
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
    } else {
      // WebDAV метод (существующий код)
      const baseUrl = result.webdavUrl || 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks';
      const url = baseUrl + '/' + currentPage;
      
      const response = await fetch(url, {
        headers: url.startsWith('file://') ? {} : {
          'Authorization': 'Basic ' + btoa(
            (result.username || '') + ':' + (result.password || '')
          )
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      return text;
    }
  } catch (error) {
    const method = result?.useApi ? 'API' : 'WebDAV';
    return `Error: ${error.message}${error.message.includes('401') ? `\nПроверьте настройки ${method} в панели настроек` : ''}`;
  }
};
