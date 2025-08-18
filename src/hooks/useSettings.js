import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    tabRefreshMinutes: 8 * 60,
    useApi: true,
    apiKey: 'bf299179ab0731b5fd2351fe4a3362cc43984e360f258133bb5ec406394c594f',
    apiUrl: 'http://127.0.0.1:27123/vault/bookmarks',
    periodicApiUrl: 'http://127.0.0.1:27123',
    dailyNotesPanelHeight: 300,
  });

  const loadSettings = async () => {
    const result = await chrome.storage.local.get([
      'tabRefreshMinutes',
      'useApi',
      'apiKey',
      'apiUrl',
      'periodicApiUrl',
      'dailyNotesPanelHeight'
    ]);
    setSettings({
      tabRefreshMinutes: result.tabRefreshMinutes || 15,
      useApi: result.useApi !== false, // По умолчанию true
      apiKey: result.apiKey || 'bf299179ab0731b5fd2351fe4a3362cc43984e360f258133bb5ec406394c594f',
      apiUrl: result.apiUrl || 'http://127.0.0.1:27123/vault',
      periodicApiUrl: result.periodicApiUrl || 'http://127.0.0.1:27123',
      dailyNotesPanelHeight: result.dailyNotesPanelHeight || 300,
    });
  };

  const saveSettings = async (goHome) => {
    await chrome.storage.local.set({
      tabRefreshMinutes: settings.tabRefreshMinutes || 15,
      useApi: settings.useApi,
      apiKey: settings.apiKey,
      apiUrl: settings.apiUrl,
      periodicApiUrl: settings.periodicApiUrl,
      dailyNotesPanelHeight: settings.dailyNotesPanelHeight || 300,
    });
    goHome();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, setSettings, saveSettings };
};
