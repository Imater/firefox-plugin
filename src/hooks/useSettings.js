import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    webdavUrl: 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks',
    username: '',
    password: '',
    tabRefreshMinutes: 8 * 60,
    useApi: true,
    apiKey: 'bf299179ab0731b5fd2351fe4a3362cc43984e360f258133bb5ec406394c594f',
    apiUrl: 'http://127.0.0.1:27123/vault/bookmarks',
  });

  const loadSettings = async () => {
    const result = await chrome.storage.local.get([
      'webdavUrl', 
      'username', 
      'password', 
      'tabRefreshMinutes',
      'useApi',
      'apiKey',
      'apiUrl'
    ]);
    setSettings({
      webdavUrl: result.webdavUrl || 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks',
      username: result.username || '',
      password: result.password || '',
      tabRefreshMinutes: result.tabRefreshMinutes || 15,
      useApi: result.useApi || false,
      apiKey: result.apiKey || 'bf299179ab0731b5fd2351fe4a3362cc43984e360f258133bb5ec406394c594f',
      apiUrl: result.apiUrl || 'http://127.0.0.1:27123/vault',
    });
  };

  const saveSettings = async (goHome) => {
    const normalizedUrl = settings.webdavUrl.endsWith('/') ? settings.webdavUrl : settings.webdavUrl + '/';
    await chrome.storage.local.set({
      webdavUrl: normalizedUrl,
      username: settings.username,
      password: settings.password,
      tabRefreshMinutes: settings.tabRefreshMinutes || 15,
      useApi: settings.useApi,
      apiKey: settings.apiKey,
      apiUrl: settings.apiUrl,
    });
    goHome();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, setSettings, saveSettings };
};
