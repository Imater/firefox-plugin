// Mock Chrome API for development
if (typeof chrome === 'undefined' || !chrome.storage) {
  window.chrome = {
    storage: {
      local: {
        get: async (keys) => {
          const stored = localStorage.getItem('chrome-storage-local');
          const data = stored ? JSON.parse(stored) : {};
          
          if (Array.isArray(keys)) {
            const result = {};
            keys.forEach(key => {
              result[key] = data[key];
            });
            return result;
          } else {
            return data;
          }
        },
        set: async (data) => {
          const stored = localStorage.getItem('chrome-storage-local');
          const existing = stored ? JSON.parse(stored) : {};
          const updated = { ...existing, ...data };
          localStorage.setItem('chrome-storage-local', JSON.stringify(updated));
        }
      }
    }
  };
}
