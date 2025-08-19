import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    tabRefreshMinutes: 8 * 60,
    useApi: true,
    apiKey: 'bf299179ab0731b5fd2351fe4a3362cc43984e360f258133bb5ec406394c594f',
    apiUrl: 'http://127.0.0.1:27123/vault/bookmarks',
    periodicApiUrl: 'http://127.0.0.1:27123',
    dailyNotesPanelHeight: 300,
    enableHotkeys: true,
    lettersOnlyHotkeys: false,
  });

  const loadSettings = async () => {
    const result = await chrome.storage.local.get([
      'tabRefreshMinutes',
      'useApi',
      'apiKey',
      'apiUrl',
      'periodicApiUrl',
      'dailyNotesPanelHeight',
      'enableHotkeys',
      'lettersOnlyHotkeys',
      'lastOpenedPage'
    ]);
    setSettings({
      tabRefreshMinutes: result.tabRefreshMinutes || 15,
      useApi: result.useApi !== false, // По умолчанию true
      apiKey: result.apiKey || 'bf299179ab0731b5fd2351fe4a3362cc43984e360f258133bb5ec406394c594f',
      apiUrl: result.apiUrl || 'http://127.0.0.1:27123/vault',
      periodicApiUrl: result.periodicApiUrl || 'http://127.0.0.1:27123',
      dailyNotesPanelHeight: result.dailyNotesPanelHeight || 300,
      enableHotkeys: result.enableHotkeys !== false, // По умолчанию true
      lettersOnlyHotkeys: result.lettersOnlyHotkeys === true, // По умолчанию false
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
      enableHotkeys: settings.enableHotkeys,
      lettersOnlyHotkeys: settings.lettersOnlyHotkeys,
    });
    goHome();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, setSettings, saveSettings };
};
