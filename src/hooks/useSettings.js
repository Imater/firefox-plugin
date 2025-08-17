import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    webdavUrl: 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks',
    username: '',
    password: '',
  });

  const loadSettings = async () => {
    const result = await chrome.storage.local.get(['webdavUrl', 'username', 'password']);
    setSettings({
      webdavUrl: result.webdavUrl || 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks',
      username: result.username || '',
      password: result.password || '',
    });
  };

  const saveSettings = async (goHome) => {
    const normalizedUrl = settings.webdavUrl.endsWith('/') ? settings.webdavUrl : settings.webdavUrl + '/';
    await chrome.storage.local.set({
      webdavUrl: normalizedUrl,
      username: settings.username,
      password: settings.password,
    });
    goHome();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, setSettings, saveSettings };
};
