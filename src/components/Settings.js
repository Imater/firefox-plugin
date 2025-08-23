import React from 'react';
import { Typography, Switch, FormControlLabel, TextField, Button, Divider, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import SettingsPanel from './styled/SettingsPanel';
import { useTranslation } from '../utils/i18n';

const Settings = ({ isDarkMode, saveTheme, settings, setSettings, onSave }) => {
  const { t, setLanguage, getAvailableLanguages, getWeekDays } = useTranslation();
  
  const handleLanguageChange = async (newLanguage) => {
    await setLanguage(newLanguage);
    setSettings({...settings, language: newLanguage});
    await chrome.storage.local.set({ language: newLanguage });
  };
  
  return (
    <SettingsPanel elevation={3}>
      <Typography variant="h6" gutterBottom>
        {t('settings.title')}
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom>
        {t('settings.general')}
      </Typography>
      
      <FormControl fullWidth margin="dense" sx={{ marginBottom: '16px' }}>
        <InputLabel>{t('settings.language')}</InputLabel>
        <Select
          value={settings.language || 'en'}
          label={t('settings.language')}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          {getAvailableLanguages().map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth margin="dense" sx={{ marginBottom: '16px' }}>
        <InputLabel>{t('settings.week_start')}</InputLabel>
        <Select
          value={settings.weekStart || 1}
          label={t('settings.week_start')}
          onChange={(e) => setSettings({...settings, weekStart: parseInt(e.target.value)})}
        >
          {getWeekDays().map((day) => (
            <MenuItem key={day.code} value={day.code}>
              {day.full}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControlLabel
        control={
          <Switch
            checked={isDarkMode}
            onChange={(e) => saveTheme(e.target.checked)}
            color="primary"
          />
        }
        label={t('settings.dark_mode')}
        sx={{ marginBottom: '16px' }}
      />

      <Divider sx={{ marginY: '16px' }} />
      
      <Typography variant="subtitle1" gutterBottom>
        {t('settings.hotkeys')}
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.enableHotkeys}
            onChange={async (e) => {
              const newSettings = {...settings, enableHotkeys: e.target.checked};
              setSettings(newSettings);
              await chrome.storage.local.set({ enableHotkeys: e.target.checked });
            }}
            color="primary"
          />
        }
        label={t('settings.hotkeys')}
        sx={{ marginBottom: '8px' }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.lettersOnlyHotkeys}
            onChange={async (e) => {
              const newSettings = {...settings, lettersOnlyHotkeys: e.target.checked};
              setSettings(newSettings);
              await chrome.storage.local.set({ lettersOnlyHotkeys: e.target.checked });
            }}
            color="primary"
            disabled={!settings.enableHotkeys}
          />
        }
        label={t('settings.letters_only')}
        sx={{ marginBottom: '16px' }}
      />

      <Divider sx={{ marginY: '16px' }} />
      
      <Typography variant="subtitle1" gutterBottom>
        {t('settings.tabs')}
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.openInCurrentTab}
            onChange={async (e) => {
              const newSettings = {...settings, openInCurrentTab: e.target.checked};
              setSettings(newSettings);
              await chrome.storage.local.set({ openInCurrentTab: e.target.checked });
            }}
            color="primary"
          />
        }
        label={t('settings.open_current_tab')}
        sx={{ marginBottom: '8px' }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.singleTabMode}
            onChange={async (e) => {
              const newSettings = {...settings, singleTabMode: e.target.checked};
              setSettings(newSettings);
              await chrome.storage.local.set({ singleTabMode: e.target.checked });
            }}
            color="primary"
          />
        }
        label={t('settings.single_tab')}
        sx={{ marginBottom: '8px' }}
      />

      <Divider sx={{ marginY: '16px' }} />
      
      <Typography variant="subtitle1" gutterBottom>
        {t('settings.pomodoro')}
      </Typography>
      
      <TextField
        label={t('settings.pomodoro_minutes')}
        type="number"
        value={settings.pomodoroMinutes || 25}
        onChange={(e) => setSettings({...settings, pomodoroMinutes: parseInt(e.target.value) || 25})}
        fullWidth
        margin="dense"
        inputProps={{ min: 1, max: 120 }}
        helperText={t('settings.pomodoro_help')}
      />

      <Divider sx={{ marginY: '16px' }} />
      
      <Typography variant="subtitle1" gutterBottom>
        {t('settings.api')}
      </Typography>
      
      <TextField
        label={t('settings.api_url')}
        value={settings.apiUrl}
        onChange={(e) => setSettings({...settings, apiUrl: e.target.value})}
        fullWidth
        margin="dense"
        helperText={t('settings.api_url_help')}
      />
      <TextField
        label={t('settings.api_key')}
        type="password"
        value={settings.apiKey}
        onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
        fullWidth
        margin="dense"
        helperText={t('settings.api_key_help')}
      />
      <TextField
        label={t('settings.periodic_api_url')}
        value={settings.periodicApiUrl}
        onChange={(e) => setSettings({...settings, periodicApiUrl: e.target.value})}
        fullWidth
        margin="dense"
        helperText={t('settings.periodic_api_help')}
      />

      <TextField
        label={t('settings.tab_refresh')}
        type="number"
        value={settings.tabRefreshMinutes || 15}
        onChange={(e) => setSettings({...settings, tabRefreshMinutes: parseInt(e.target.value) || 15})}
        fullWidth
        margin="dense"
        inputProps={{ min: 1, max: 1440 }}
        helperText={t('settings.tab_refresh_help')}
      />
      <Button 
        onClick={onSave} 
        variant="contained" 
        color="primary"
        sx={{ marginTop: '8px' }}
      >
        {t('settings.save')}
      </Button>
    </SettingsPanel>
  );
};

export default Settings;
