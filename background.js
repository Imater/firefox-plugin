// Создаем контекстное меню при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToBookmarks",
    title: "Добавить текущую страницу в bookmarks",
    contexts: ["page"]
  });
  
  chrome.contextMenus.create({
    id: "addToDailyNotes",
    title: "Добавить текущую страницу в ежедневные заметки",
    contexts: ["page"]
  });
  
  chrome.contextMenus.create({
    id: "addLinkToBookmarks",
    title: "Добавить ссылку в bookmarks",
    contexts: ["link"]
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
  if (info.menuItemId === "addToBookmarks" || info.menuItemId === "addToDailyNotes") {
    // Получаем информацию о текущей вкладке
    const url = tab.url;
    const title = tab.title;
    const defaultDestination = info.menuItemId === "addToDailyNotes" ? "today" : "current";
    
    // Формируем название ссылки с доменом
    const formattedTitle = formatBookmarkTitle(url, title);
    
    // Открываем popup для ввода названия
    const bookmarkData = await showBookmarkDialog(formattedTitle, url, defaultDestination);
    
    if (bookmarkData) {
      // Добавляем ссылку в заметку
      await addBookmarkToNote(bookmarkData.title, bookmarkData.url, bookmarkData.comment, bookmarkData.destination);
    }
  } else if (info.menuItemId === "addLinkToBookmarks") {
    // Получаем информацию о ссылке
    const url = info.linkUrl;
    const linkText = info.selectionText || info.linkText || 'Ссылка';
    const title = tab.title;
    
    // Формируем название ссылки с доменом
    const formattedTitle = formatBookmarkTitle(url, linkText);
    
    // Открываем popup для ввода названия
    const bookmarkData = await showBookmarkDialog(formattedTitle, url, 'current');
    
    if (bookmarkData) {
      // Добавляем ссылку в заметку
      await addBookmarkToNote(bookmarkData.title, bookmarkData.url, bookmarkData.comment, bookmarkData.destination);
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

// Функция для извлечения домена из URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Error extracting domain from URL:', error);
    return '';
  }
}

// Функция для формирования названия ссылки
function formatBookmarkTitle(url, pageTitle) {
  const domain = extractDomain(url);
  if (!domain) {
    return pageTitle || 'Без названия';
  }
  
  // Очищаем заголовок страницы от лишних символов
  let cleanTitle = pageTitle || '';
  
  // Убираем лишние пробелы и переносы строк
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  
  // Если заголовок слишком длинный, обрезаем его
  const maxTitleLength = 100;
  if (cleanTitle.length > maxTitleLength) {
    cleanTitle = cleanTitle.substring(0, maxTitleLength) + '...';
  }
  
  return `${domain} - ${cleanTitle}`;
}

// Функция для показа диалога ввода
function showBookmarkDialog(defaultTitle, url, defaultDestination = 'current') {
  return new Promise((resolve) => {
    // Создаем popup окно
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 500,
      height: 550,
      focused: true
    }, (popupWindow) => {
      // Сохраняем данные в storage для передачи в popup
      chrome.storage.local.set({
        'popup_data': {
          title: defaultTitle,
          url: url,
          destination: defaultDestination
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
async function addBookmarkToNote(title, url, comment = '', destination = 'current') {
  try {
    // Получаем настройки
    const result = await chrome.storage.local.get(['useApi', 'apiKey', 'apiUrl']);
    
    if (!result.useApi) {
      throw new Error('Для работы с закладками необходимо включить API режим в настройках');
    }
    
    // Формируем новую ссылку в markdown формате
    const commentText = comment ? ` (${comment})` : '';
    const newBookmark = `\n- [${title}](${url})${commentText}`;
    
    // Определяем какой файл редактировать: активный из правой панели или index.md по умолчанию
    const current = await chrome.storage.local.get(['currentPage', 'periodicApiUrl', 'apiKey']);
    let pagePath = current?.currentPage || 'bookmarks/index.md';

    // Если выбрано "сегодня" — добавляем в ежедневную заметку
    if (destination === 'today') {
      const today = new Date();
      const year = String(today.getFullYear());
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      // Используем Vault API для ежедневных заметок (работает для всех дат)
      const periodicApiBase = (current.periodicApiUrl || 'http://127.0.0.1:27123');
      
      // Получаем день недели на русском языке
      const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
      const dayOfWeek = dayNames[today.getDay()];
      
      // Используем правильную структуру папок: YYYY/YYYY-MM/YYYY-MM-DD (dd).md
      const fileName = `${year}-${month}-${day} (${dayOfWeek}).md`;
      const dailyUrl = `${periodicApiBase}/vault/DailyNotes/${year}/${year}-${month}/${fileName}`;

      // Получаем текущее время
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      // Подготовим контент для добавления в ежедневную заметку
      const newBookmarkLine = `\n- ${timeString} [${title}](${url})${commentText}`;

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
          if (!createResp.ok && createResp.status !== 204) throw new Error(`HTTP ${createResp.status}`);
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
          if (!updateResp.ok && updateResp.status !== 204) throw new Error(`HTTP ${updateResp.status}`);
        } else {
          throw new Error(`HTTP ${checkResp.status}`);
        }

        // Уведомление и обновление панели, затем выходим
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'favorites-icon.png',
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
      iconUrl: 'favorites-icon.png',
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
      iconUrl: 'favorites-icon.png',
      title: 'Ошибка',
      message: `Не удалось добавить закладку: ${error.message}`
    });
  }
}
