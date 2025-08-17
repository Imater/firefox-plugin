import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const loadTheme = async () => {
    const result = await chrome.storage.local.get(['isDarkMode']);
    const darkMode = result.isDarkMode || false;
    setIsDarkMode(darkMode);
    
    // Скрываем горизонтальный скроллинг
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    
    // Устанавливаем фон в соответствии с темой
    document.documentElement.style.backgroundColor = darkMode ? '#121212' : '#ffffff';
    document.body.style.backgroundColor = darkMode ? '#121212' : '#ffffff';
  };

  const saveTheme = async (darkMode) => {
    await chrome.storage.local.set({ isDarkMode: darkMode });
    setIsDarkMode(darkMode);
    
    // Скрываем горизонтальный скроллинг
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    
    // Устанавливаем фон в соответствии с темой
    document.documentElement.style.backgroundColor = darkMode ? '#121212' : '#ffffff';
    document.body.style.backgroundColor = darkMode ? '#121212' : '#ffffff';
  };

  useEffect(() => {
    loadTheme();
  }, []);

  return { isDarkMode, saveTheme };
};
