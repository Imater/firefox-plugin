import React from 'react';
import { Typography, Switch, FormControlLabel, TextField, Button, Divider } from '@mui/material';
import SettingsPanel from './styled/SettingsPanel';

const Settings = ({ isDarkMode, saveTheme, settings, setSettings, onSave }) => {
  return (
    <SettingsPanel elevation={3}>
      <Typography variant="h6" gutterBottom>
        Настройки
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={isDarkMode}
            onChange={(e) => saveTheme(e.target.checked)}
            color="primary"
          />
        }
        label="Темная тема"
        sx={{ marginBottom: '16px' }}
      />

      <Divider sx={{ marginY: '16px' }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Горячие клавиши
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.enableHotkeys}
            onChange={async (e) => {
              const newSettings = {...settings, enableHotkeys: e.target.checked};
              setSettings(newSettings);
              // Автоматически сохраняем настройку
              await chrome.storage.local.set({ enableHotkeys: e.target.checked });
            }}
            color="primary"
          />
        }
        label="Включить метки быстрого перехода"
        sx={{ marginBottom: '8px' }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.lettersOnlyHotkeys}
            onChange={async (e) => {
              const newSettings = {...settings, lettersOnlyHotkeys: e.target.checked};
              setSettings(newSettings);
              // Автоматически сохраняем настройку
              await chrome.storage.local.set({ lettersOnlyHotkeys: e.target.checked });
            }}
            color="primary"
            disabled={!settings.enableHotkeys}
          />
        }
        label="Быстрый переход только буквами (без цифр)"
        sx={{ marginBottom: '16px' }}
      />

      <Divider sx={{ marginY: '16px' }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Управление вкладками
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.openInCurrentTab}
            onChange={async (e) => {
              const newSettings = {...settings, openInCurrentTab: e.target.checked};
              setSettings(newSettings);
              // Автоматически сохраняем настройку
              await chrome.storage.local.set({ openInCurrentTab: e.target.checked });
            }}
            color="primary"
          />
        }
        label="Открывать ссылки в текущей вкладке"
        sx={{ marginBottom: '8px' }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.singleTabMode}
            onChange={async (e) => {
              const newSettings = {...settings, singleTabMode: e.target.checked};
              setSettings(newSettings);
              // Автоматически сохраняем настройку
              await chrome.storage.local.set({ singleTabMode: e.target.checked });
            }}
            color="primary"
          />
        }
        label="Только одна вкладка (закрывать остальные)"
        sx={{ marginBottom: '16px' }}
      />

      <Divider sx={{ marginY: '16px' }} />
      
      <Typography variant="subtitle1" gutterBottom>
        API настройки
      </Typography>
      
      <TextField
        label="API URL"
        value={settings.apiUrl}
        onChange={(e) => setSettings({...settings, apiUrl: e.target.value})}
        fullWidth
        margin="dense"
        helperText="Базовый URL для API (например: http://127.0.0.1:27123/vault)"
      />
      <TextField
        label="API Key"
        type="password"
        value={settings.apiKey}
        onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
        fullWidth
        margin="dense"
        helperText="Bearer токен для авторизации"
      />
      <TextField
        label="Periodic Notes API URL"
        value={settings.periodicApiUrl}
        onChange={(e) => setSettings({...settings, periodicApiUrl: e.target.value})}
        fullWidth
        margin="dense"
        helperText="URL для Periodic Notes API (например: http://127.0.0.1:27124)"
      />

      <TextField
        label="Время обновления вкладок (минуты)"
        type="number"
        value={settings.tabRefreshMinutes || 15}
        onChange={(e) => setSettings({...settings, tabRefreshMinutes: parseInt(e.target.value) || 15})}
        fullWidth
        margin="dense"
        inputProps={{ min: 1, max: 1440 }}
        helperText="Вкладка будет обновлена, если прошло больше указанного времени с последнего доступа"
      />
      <Button 
        onClick={onSave} 
        variant="contained" 
        color="primary"
        sx={{ marginTop: '8px' }}
      >
        Save
      </Button>
    </SettingsPanel>
  );
};

export default Settings;
