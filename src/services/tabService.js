// Функция для проверки, нужно ли обновить вкладку
const shouldRefreshTab = async (lastAccessed) => {
  if (!lastAccessed) {
    return false;
  }
  
  // Получаем настройку времени обновления
  let refreshMinutes = 15; // значение по умолчанию
  try {
    const result = await chrome.storage.local.get(['tabRefreshMinutes']);
    refreshMinutes = result.tabRefreshMinutes || 1 * 8 * 60;
  } catch (error) {
    console.error('Error getting tab refresh minutes setting:', error);
  }
  
  const lastAccessedDate = new Date(lastAccessed);
  const now = new Date();
  const diffInMinutes = (now - lastAccessedDate) / (1000 * 60);
  
  return diffInMinutes > refreshMinutes;
};

// Функция для получения времени последнего доступа к вкладке
const getTabLastAccessed = async (tabId) => {
  try {
    const result = await chrome.storage.local.get([`tab_${tabId}`]);
    return result[`tab_${tabId}`];
  } catch (error) {
    console.error('Error getting tab last accessed:', error);
    return null;
  }
};

// Функция для сохранения времени последнего доступа к вкладке
const setTabLastAccessed = async (tabId) => {
  try {
    await chrome.storage.local.set({
      [`tab_${tabId}`]: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting tab last accessed:', error);
  }
};

// Функция для активации существующей вкладки или создания новой
export const activateOrCreateTab = async (url, options = {}) => {
  const { openInCurrentTab = false, singleTabMode = false } = options;
  try {
    // Проверяем, что URL валидный
    if (!url || url === '#' || url === '') {
      console.warn('Invalid URL:', url);
      return null;
    }

    // Если включен режим "открывать в текущей вкладке"
    if (openInCurrentTab) {
      try {
        const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTab.length > 0) {
          const tab = currentTab[0];
          
          // Если также включен режим "только одна вкладка", закрываем все остальные КРОМЕ текущей
          if (singleTabMode) {
            try {
              const allTabs = await chrome.tabs.query({});
              const tabsToClose = allTabs.filter(t => !t.pinned && t.id !== tab.id);
              
              if (tabsToClose.length > 0) {
                await chrome.tabs.remove(tabsToClose.map(t => t.id));
                console.log('Closed', tabsToClose.length, 'tabs in single tab mode, keeping current tab');
              }
            } catch (error) {
              console.error('Error closing tabs in single tab mode:', error);
            }
          }
          
          // Обновляем URL текущей вкладки
          await chrome.tabs.update(tab.id, { url: url });
          
          // Обновляем время последнего доступа
          await setTabLastAccessed(tab.id);
          
          console.log('Updated current tab:', tab.id, 'with URL:', url);
          return tab.id;
        }
      } catch (error) {
        console.error('Error updating current tab:', error);
      }
    }
    
    // Если включен только режим "только одна вкладка" (без openInCurrentTab)
    if (singleTabMode && !openInCurrentTab) {
      try {
        const allTabs = await chrome.tabs.query({});
        const tabsToClose = allTabs.filter(tab => !tab.pinned);
        
        if (tabsToClose.length > 0) {
          await chrome.tabs.remove(tabsToClose.map(tab => tab.id));
          console.log('Closed', tabsToClose.length, 'tabs in single tab mode');
        }
      } catch (error) {
        console.error('Error closing tabs in single tab mode:', error);
      }
    }

    // Ищем существующую вкладку с таким URL
    const tabs = await chrome.tabs.query({ url: url });
    
    if (tabs.length > 0) {
      const existingTab = tabs[0];
      
      // Получаем время последнего доступа к вкладке
      const lastAccessed = await getTabLastAccessed(existingTab.id);
      
      // Проверяем, нужно ли обновить вкладку
      if (await shouldRefreshTab(lastAccessed)) {
        console.log('Refreshing tab due to age:', existingTab.id);
        await chrome.tabs.reload(existingTab.id);
      }
      
      // Активируем вкладку
      await chrome.tabs.update(existingTab.id, { active: true });
      await chrome.windows.update(existingTab.windowId, { focused: true });
      
      // Обновляем время последнего доступа
      await setTabLastAccessed(existingTab.id);
      
      console.log('Activated existing tab:', existingTab.id);
      return existingTab.id;
    } else {
      // Если вкладки нет, создаём новую
      const newTab = await chrome.tabs.create({ 
        url: url, 
        active: true
      });
      
      // Сохраняем время создания вкладки
      await setTabLastAccessed(newTab.id);
      
      console.log('Created new tab:', newTab.id);
      return newTab.id;
    }
  } catch (error) {
    console.error('Error managing tabs:', error);
    // Fallback: просто открываем в новой вкладке
    try {
      const newTab = await chrome.tabs.create({ url: url, active: true });
      console.log('Fallback: created new tab:', newTab.id);
      return newTab.id;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      return null;
    }
  }
};

// Функция для очистки записей о закрытых вкладках
export const cleanupClosedTabs = async () => {
  try {
    // Получаем все открытые вкладки
    const openTabs = await chrome.tabs.query({});
    const openTabIds = openTabs.map(tab => tab.id);
    
    // Получаем все ключи из хранилища
    const allData = await chrome.storage.local.get(null);
    const tabKeys = Object.keys(allData).filter(key => key.startsWith('tab_'));
    
    // Находим ключи для закрытых вкладок
    const closedTabKeys = tabKeys.filter(key => {
      const tabId = parseInt(key.replace('tab_', ''));
      return !openTabIds.includes(tabId);
    });
    
    // Удаляем записи о закрытых вкладках
    if (closedTabKeys.length > 0) {
      await chrome.storage.local.remove(closedTabKeys);
      console.log('Cleaned up', closedTabKeys.length, 'closed tab records');
    }
  } catch (error) {
    console.error('Error cleaning up closed tabs:', error);
  }
};

// Функция для проверки, является ли URL относительным
export const isRelativeUrl = (url) => {
  return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://');
};

// Функция для преобразования относительного URL в абсолютный
export const resolveUrl = (baseUrl, relativeUrl) => {
  if (!relativeUrl || relativeUrl === '#' || relativeUrl === '') {
    return relativeUrl;
  }

  if (isRelativeUrl(relativeUrl)) {
    // Если это относительный URL, добавляем к базовому URL
    const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const resolved = base + relativeUrl;
    console.log('Resolved URL:', relativeUrl, '->', resolved);
    return resolved;
  }
  
  console.log('Absolute URL:', relativeUrl);
  return relativeUrl;
};
