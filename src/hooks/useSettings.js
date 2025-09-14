import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    tabRefreshMinutes: 8 * 60,
    useApi: true,
    apiKey: 'e9b2f7b78c69992b83161f2690e7348523a7f4b96b44db542aa09d8f72c030a0',
    apiUrl: 'http://127.0.0.1:27123/vault/bookmarks',
    periodicApiUrl: 'http://127.0.0.1:27123',
    dailyNotesPanelHeight: 300,
    enableHotkeys: true,
    lettersOnlyHotkeys: false,
    openInCurrentTab: false,
    singleTabMode: false,
    language: 'en', // По умолчанию английский
    weekStart: 1, // По умолчанию понедельник (1)
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
      'openInCurrentTab',
      'singleTabMode',
      'language',
      'weekStart',
      'lastOpenedPage'
    ]);
    setSettings({
      tabRefreshMinutes: result.tabRefreshMinutes || 15,
      useApi: result.useApi !== false, // По умолчанию true
      apiKey: result.apiKey || 'e9b2f7b78c69992b83161f2690e7348523a7f4b96b44db542aa09d8f72c030a0',
      apiUrl: result.apiUrl || 'http://127.0.0.1:27123/vault',
      periodicApiUrl: result.periodicApiUrl || 'http://127.0.0.1:27123',
      dailyNotesPanelHeight: result.dailyNotesPanelHeight || 300,
      enableHotkeys: result.enableHotkeys !== false, // По умолчанию true
      lettersOnlyHotkeys: result.lettersOnlyHotkeys === true, // По умолчанию false
      openInCurrentTab: result.openInCurrentTab === true, // По умолчанию false
      singleTabMode: result.singleTabMode === true, // По умолчанию false
      language: result.language || 'en', // По умолчанию английский
      weekStart: result.weekStart || 1, // По умолчанию понедельник (1)
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
      openInCurrentTab: settings.openInCurrentTab,
      singleTabMode: settings.singleTabMode,
      language: settings.language,
      weekStart: settings.weekStart,
    });
    goHome();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, setSettings, saveSettings };
};
