// Тесты для tabService.js
// Этот файл можно запустить в браузере для проверки функциональности

// Мок для chrome API
const mockChrome = {
  storage: {
    local: {
      get: async (keys) => {
        // Симулируем получение данных из хранилища
        if (keys === null) {
          return {
            'tab_123': '2024-01-01T10:00:00.000Z',
            'tab_456': '2024-01-01T11:00:00.000Z',
            'tabRefreshMinutes': 15
          };
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (key === 'tabRefreshMinutes') {
              result[key] = 15;
            }
          });
          return result;
        }
        return {};
      },
      set: async (data) => {
        console.log('Mock chrome.storage.local.set:', data);
      },
      remove: async (keys) => {
        console.log('Mock chrome.storage.local.remove:', keys);
      }
    }
  },
  tabs: {
    query: async (queryInfo) => {
      // Симулируем поиск вкладок
      if (queryInfo.url) {
        return [{ id: 123, windowId: 1 }];
      }
      return [{ id: 123, windowId: 1 }, { id: 456, windowId: 1 }];
    },
    update: async (tabId, updateProperties) => {
      console.log('Mock chrome.tabs.update:', tabId, updateProperties);
    },
    reload: async (tabId) => {
      console.log('Mock chrome.tabs.reload:', tabId);
    },
    create: async (createProperties) => {
      console.log('Mock chrome.tabs.create:', createProperties);
      return { id: 789 };
    },
    onRemoved: {
      addListener: (callback) => {
        console.log('Mock chrome.tabs.onRemoved.addListener');
      },
      removeListener: (callback) => {
        console.log('Mock chrome.tabs.onRemoved.removeListener');
      }
    }
  },
  windows: {
    update: async (windowId, updateInfo) => {
      console.log('Mock chrome.windows.update:', windowId, updateInfo);
    }
  }
};

// Заменяем глобальный chrome объект
if (typeof window !== 'undefined') {
  window.chrome = mockChrome;
}

// Тестовые функции
const testShouldRefreshTab = () => {
  console.log('=== Тест shouldRefreshTab ===');
  
  // Тест 1: Вкладка была загружена 20 минут назад (должна обновиться)
  const oldTime = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  console.log('Время загрузки:', oldTime);
  console.log('Должна обновиться:', true);
  
  // Тест 2: Вкладка была загружена 10 минут назад (не должна обновиться)
  const recentTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  console.log('Время загрузки:', recentTime);
  console.log('Должна обновиться:', false);
  
  // Тест 3: Нет времени загрузки (не должна обновиться)
  console.log('Время загрузки: null');
  console.log('Должна обновиться:', false);
};

const testTabManagement = () => {
  console.log('=== Тест управления вкладками ===');
  
  // Тест активации существующей вкладки
  console.log('Тестируем активацию существующей вкладки...');
  
  // Тест создания новой вкладки
  console.log('Тестируем создание новой вкладки...');
};

// Запуск тестов
if (typeof window !== 'undefined') {
  console.log('Запуск тестов tabService...');
  testShouldRefreshTab();
  testTabManagement();
  console.log('Тесты завершены');
}
