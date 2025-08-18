// Создаем контекстное меню при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToBookmarks",
    title: "Добавить текущую страницу в bookmarks",
    contexts: ["page"]
  });
});

// Ретрансляция сообщений от content script к панели (и наоборот при необходимости)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'hotkeys') {
    // Отправляем всем страницам панели сообщение о горячих клавишах
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        // Пытаемся отправить в контент панели, если открыт sidebar.html
        if (tab.url && tab.url.includes('sidebar.html')) {
          try {
            chrome.tabs.sendMessage(tab.id, message);
          } catch (e) {
            // ignore
          }
        }
      }
    });
  }
});

// Обработчик команд (горячих клавиш)
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Получена команда:', command);
  
  if (command === 'toggle-hotkeys') {
    try {
      console.log('Обрабатываем команду toggle-hotkeys');
      
      // Получаем все вкладки с боковой панелью
      const tabs = await chrome.tabs.query({
        url: chrome.runtime.getURL('sidebar.html')
      });
      
      console.log('Найдено вкладок с панелью:', tabs.length);

      if (tabs.length === 0) {
        console.log('Боковая панель не найдена, открываем вкладку sidebar.html');
        try {
          const createdTab = await chrome.tabs.create({ url: chrome.runtime.getURL('sidebar.html'), active: true });
          await chrome.windows.update(createdTab.windowId, { focused: true });

          const onUpdatedListener = async (tabId, info) => {
            if (tabId === createdTab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(onUpdatedListener);
              try {
                await chrome.tabs.sendMessage(createdTab.id, {
                  type: 'hotkeys',
                  action: 'activate'
                });
                console.log('Сообщение отправлено во вкладку sidebar.html');
              } catch (error) {
                console.log('Ошибка отправки в новую вкладку:', error);
              }
            }
          };
          chrome.tabs.onUpdated.addListener(onUpdatedListener);
        } catch (error) {
          console.error('Ошибка открытия вкладки sidebar.html:', error);
        }
        return;
      }

      // Активируем первую вкладку с панелью
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
      console.log('Вкладка активирована:', tabs[0].id);

      // Отправляем сообщение для переключения горячих клавиш
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'hotkeys',
            action: 'activate'
          });
          console.log('Сообщение отправлено в вкладку:', tab.id);
        } catch (error) {
          console.log('Не удалось отправить сообщение в вкладку:', tab.id, error);
        }
      }
    } catch (error) {
      console.error('Ошибка при обработке команды toggle-hotkeys:', error);
    }
  }
});

// Обработчик клика по контекстному меню
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToBookmarks") {
    // Получаем информацию о текущей вкладке
    const url = tab.url;
    const title = tab.title;
    
    // Открываем popup для ввода названия
    const bookmarkData = await showBookmarkDialog(title, url);
    
    if (bookmarkData) {
      // Добавляем ссылку в заметку
      await addBookmarkToNote(bookmarkData.title, bookmarkData.url, bookmarkData.destination);
    }
  }
});

// Функция для обновления содержимого в правой панели
async function refreshSidePanel() {
  try {
    // Получаем все вкладки с боковой панелью
    const tabs = await chrome.tabs.query({
      url: chrome.runtime.getURL('sidebar.html')
    });
    
    // Отправляем сообщение в каждую вкладку для обновления содержимого
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'refresh_content',
          action: 'reload_bookmarks'
        });
      } catch (error) {
        console.log('Не удалось отправить сообщение в вкладку:', tab.id, error);
      }
    }
  } catch (error) {
    console.error('Ошибка обновления боковой панели:', error);
  }
}

// Функция для показа диалога ввода
function showBookmarkDialog(defaultTitle, url) {
  return new Promise((resolve) => {
    // Создаем popup окно
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 400,
      height: 350,
      focused: true
    }, (popupWindow) => {
      // Сохраняем данные в storage для передачи в popup
      chrome.storage.local.set({
        'popup_data': {
          title: defaultTitle,
          url: url
        }
      }, () => {
        // Слушаем сообщения от popup
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
          if (message.type === 'bookmark_data') {
            resolve(message.data);
            chrome.windows.remove(popupWindow.id);
          } else if (message.type === 'cancel') {
            resolve(null);
            chrome.windows.remove(popupWindow.id);
          }
        });
      });
    });
  });
}

// Функция для добавления закладки в заметку
async function addBookmarkToNote(title, url, destination = 'current') {
  try {
    // Получаем настройки
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с закладками необходимо включить API режим в настройках');
    }
    
    // Формируем новую ссылку в markdown формате
    const newBookmark = `\n[${title}](${url})`;
    
    // Определяем какой файл редактировать: активный из правой панели или index.md по умолчанию
    const current = await chrome.storage.local.get(['currentPage', 'periodicApiUrl', 'apiKey']);
    let pagePath = current?.currentPage || 'bookmarks/index.md';

    // Если выбрано "сегодня" — добавляем в ежедневную заметку
    if (destination === 'today') {
      const today = new Date();
      const year = String(today.getFullYear());
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      // Пробуем загрузить текущий контент ежедневной заметки с Periodic API
      const periodicApiBase = (current.periodicApiUrl || 'http://127.0.0.1:27123');
      const dailyUrl = `${periodicApiBase}/periodic/daily/${year}/${month}/${day}/`;

      // Подготовим контент для добавления в ежедневную заметку
      const newBookmarkLine = `\n- [${title}](${url})`;

      try {
        // Проверяем существование
        const checkResp = await fetch(dailyUrl, {
          headers: {
            'accept': 'application/vnd.olrapi.note+json',
            'Authorization': `Bearer ${current.apiKey || ''}`
          }
        });

        let bodyToSave = '';
        if (checkResp.status === 404) {
          // Создаем новую заметку
          bodyToSave = newBookmarkLine.trimStart();
          const createResp = await fetch(dailyUrl, {
            method: 'PUT',
            headers: {
              'accept': '*/*',
              'Content-Type': 'text/markdown',
              'Authorization': `Bearer ${current.apiKey || ''}`
            },
            body: bodyToSave
          });
          if (!createResp.ok) throw new Error(`HTTP ${createResp.status}`);
        } else if (checkResp.ok) {
          const data = await checkResp.json();
          const existing = data?.content || '';
          bodyToSave = existing + newBookmarkLine;
          const updateResp = await fetch(dailyUrl, {
            method: 'PUT',
            headers: {
              'accept': '*/*',
              'Content-Type': 'text/markdown',
              'Authorization': `Bearer ${current.apiKey || ''}`
            },
            body: bodyToSave
          });
          if (!updateResp.ok) throw new Error(`HTTP ${updateResp.status}`);
        } else {
          throw new Error(`HTTP ${checkResp.status}`);
        }

        // Уведомление и обновление панели, затем выходим
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Закладка добавлена',
          message: `Ссылка "${title}" добавлена в ежедневную заметку`
        });
        await refreshSidePanel();
        return;
      } catch (e) {
        throw new Error(`Ошибка сохранения в ежедневную заметку: ${e.message}`);
      }
    }

    // Загружаем текущую заметку
    const apiUrl = (result.apiUrl || 'http://127.0.0.1:27123/vault');
    const response = await fetch(`${apiUrl}/${pagePath}`, {
      headers: {
        'accept': 'application/vnd.olrapi.note+json',
        'Authorization': `Bearer ${result.apiKey || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    let currentContent = data.content || '';
    
    // Добавляем новую ссылку в конец
    currentContent += newBookmark;
    
    // Сохраняем обновленную заметку
    const saveResponse = await fetch(`${apiUrl}/${pagePath}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'text/markdown',
        'Authorization': `Bearer ${result.apiKey || ''}`
      },
      body: currentContent
    });
    
    if (!saveResponse.ok) {
      throw new Error(`HTTP error! status: ${saveResponse.status}`);
    }
    
    // Показываем уведомление об успехе
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Закладка добавлена',
      message: `Ссылка "${title}" успешно добавлена в заметку`
    });
    
    // Обновляем содержимое в правой панели
    await refreshSidePanel();
    
  } catch (error) {
    console.error('Ошибка добавления закладки:', error);
    
    // Показываем уведомление об ошибке
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Ошибка',
      message: `Не удалось добавить закладку: ${error.message}`
    });
  }
}
