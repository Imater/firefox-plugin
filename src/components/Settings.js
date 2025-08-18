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
