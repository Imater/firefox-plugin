// Система локализации для плагина

const translations = {
  en: {
    // Header
    'header.refresh': 'Refresh',
    'header.settings': 'Settings',
    'header.edit': 'Edit',
    'header.close_tabs': 'Close all tabs',
    'header.hotkeys_on': 'Hotkeys: ON',
    'header.hotkeys_off': 'Hotkeys: OFF',
    
    // Settings
    'settings.title': 'Settings',
    'settings.general': 'General Settings',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.dark_mode': 'Dark Mode',
    'settings.hotkeys': 'Enable Hotkeys',
    'settings.letters_only': 'Letters Only Hotkeys',
    'settings.tabs': 'Tab Management',
    'settings.open_current_tab': 'Open links in current tab',
    'settings.single_tab': 'Single tab mode (close others)',
    'settings.pomodoro': 'Pomodoro Timer',
    'settings.pomodoro_minutes': 'Pomodoro duration (minutes)',
    'settings.pomodoro_help': 'Standard pomodoro time (usually 25 minutes)',
    'settings.api': 'API Settings',
    'settings.api_url': 'API URL',
    'settings.api_url_help': 'Base URL for API (e.g.: http://127.0.0.1:27123/vault)',
    'settings.api_key': 'API Key',
    'settings.api_key_help': 'Bearer token for authorization',
    'settings.periodic_api_url': 'Periodic Notes API URL',
    'settings.periodic_api_help': 'URL for Periodic Notes API (e.g.: http://127.0.0.1:27124)',
    'settings.tab_refresh': 'Tab refresh time (minutes)',
    'settings.tab_refresh_help': 'Tab will be refreshed if more time has passed since last access',
    'settings.week_start': 'Week starts on',
    'settings.week_start_help': 'Choose which day the week should start on',
    'settings.save': 'Save',
    
    // Daily Notes Panel
    'daily.yesterday': 'Yesterday',
    'daily.today': 'Today',
    'daily.tomorrow': 'Tomorrow',
    'daily.notes': 'Daily Notes',
    'daily.edit': 'Edit',
    'daily.save': 'Save',
    'daily.cancel': 'Cancel',
    'daily.saving': 'Saving...',
    'daily.placeholder': 'Start writing your daily note...',
    'daily.show_calendar': 'Show calendar',
    'daily.hide_calendar': 'Hide calendar',
    
    // Calendar
    'calendar.loading': 'Loading notes...',
    'calendar.no_note': 'No note',
    'calendar.note_preview': 'Note preview:',
    
    // Footer
    'footer.toggle_daily': 'Toggle daily notes',
    
    // API Warning
    'api.warning.title': 'Obsidian needs to be running for the plugin to work properly',
    'api.warning.step1': '1. Install plugins',
    'api.warning.step2': '2. Create folder **bookmarks** and file **index.md** in your Obsidian vault',
    'api.warning.step3': '3. Make sure Obsidian is running and plugins are activated',
    'api.warning.retry': 'Retry',
    'api.warning.error': 'Error:',
    
    // Languages
    'lang.russian': 'Русский',
    'lang.english': 'English',
    'lang.chinese': '中文',
    
    // Days of week (short)
    'day.sun': 'Sun',
    'day.mon': 'Mon',
    'day.tue': 'Tue',
    'day.wed': 'Wed',
    'day.thu': 'Thu',
    'day.fri': 'Fri',
    'day.sat': 'Sat',
    
    // Days of week (full)
    'day.sunday': 'Sunday',
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    
    // Months
    'month.jan': 'January',
    'month.feb': 'February',
    'month.mar': 'March',
    'month.apr': 'April',
    'month.may': 'May',
    'month.jun': 'June',
    'month.jul': 'July',
    'month.aug': 'August',
    'month.sep': 'September',
    'month.oct': 'October',
    'month.nov': 'November',
    'month.dec': 'December',
    
    // Messages
    'msg.saved_success': 'Saved successfully!',
    'msg.save_error': 'Save error:',
    'msg.task_not_found': 'Task not found in last 30 days',
    'msg.obsidian_api_working': 'Obsidian API is working correctly',
    'msg.file_not_found': 'File bookmarks/index.md not found in Obsidian',
    'msg.invalid_api_key': 'Invalid API key',
    
    // Navigation
    'nav.home': 'Home',
  },
  
  ru: {
    // Header
    'header.refresh': 'Обновить',
    'header.settings': 'Настройки',
    'header.edit': 'Редактировать',
    'header.close_tabs': 'Закрыть все вкладки',
    'header.hotkeys_on': 'Горячие клавиши: ВКЛ',
    'header.hotkeys_off': 'Горячие клавиши: ВЫКЛ',
    
    // Settings
    'settings.title': 'Настройки',
    'settings.general': 'Общие настройки',
    'settings.appearance': 'Внешний вид',
    'settings.language': 'Язык',
    'settings.dark_mode': 'Темная тема',
    'settings.hotkeys': 'Включить горячие клавиши',
    'settings.letters_only': 'Только буквенные горячие клавиши',
    'settings.tabs': 'Управление вкладками',
    'settings.open_current_tab': 'Открывать ссылки в текущей вкладке',
    'settings.single_tab': 'Только одна вкладка (закрывать остальные)',
    'settings.pomodoro': 'Таймер Помодорро',
    'settings.pomodoro_minutes': 'Продолжительность помодорро (минуты)',
    'settings.pomodoro_help': 'Стандартное время помодорро (обычно 25 минут)',
    'settings.api': 'API настройки',
    'settings.api_url': 'API URL',
    'settings.api_url_help': 'Базовый URL для API (например: http://127.0.0.1:27123/vault)',
    'settings.api_key': 'API ключ',
    'settings.api_key_help': 'Bearer токен для авторизации',
    'settings.periodic_api_url': 'Periodic Notes API URL',
    'settings.periodic_api_help': 'URL для Periodic Notes API (например: http://127.0.0.1:27124)',
    'settings.tab_refresh': 'Время обновления вкладок (минуты)',
    'settings.tab_refresh_help': 'Вкладка будет обновлена, если прошло больше указанного времени с последнего доступа',
    'settings.week_start': 'Неделя начинается с',
    'settings.week_start_help': 'Выберите, с какого дня должна начинаться неделя',
    'settings.save': 'Сохранить',
    
    // Daily Notes Panel
    'daily.yesterday': 'Вчера',
    'daily.today': 'Сегодня',
    'daily.tomorrow': 'Завтра',
    'daily.notes': 'Ежедневные заметки',
    'daily.edit': 'Редактировать',
    'daily.save': 'Сохранить',
    'daily.cancel': 'Отмена',
    'daily.saving': 'Сохранение...',
    'daily.placeholder': 'Начните писать вашу ежедневную заметку...',
    'daily.show_calendar': 'Показать календарь',
    'daily.hide_calendar': 'Скрыть календарь',
    
    // Calendar
    'calendar.loading': 'Загрузка заметок...',
    'calendar.no_note': 'Нет заметки',
    'calendar.note_preview': 'Превью заметки:',
    
    // Footer
    'footer.toggle_daily': 'Переключить ежедневные заметки',
    
    // API Warning
    'api.warning.title': 'Для правильной работы плагина нужно запустить Obsidian',
    'api.warning.step1': '1. Установите плагины',
    'api.warning.step2': '2. Создайте папку **bookmarks** и файл **index.md** в вашем хранилище Obsidian',
    'api.warning.step3': '3. Убедитесь, что Obsidian запущен и плагины активированы',
    'api.warning.retry': 'Повторить',
    'api.warning.error': 'Ошибка:',
    
    // Languages
    'lang.russian': 'Русский',
    'lang.english': 'Английский',
    'lang.chinese': 'Китайский',
    
    // Days of week (short)
    'day.sun': 'вс',
    'day.mon': 'пн',
    'day.tue': 'вт',
    'day.wed': 'ср',
    'day.thu': 'чт',
    'day.fri': 'пт',
    'day.sat': 'сб',
    
    // Days of week (full)
    'day.sunday': 'Воскресенье',
    'day.monday': 'Понедельник',
    'day.tuesday': 'Вторник',
    'day.wednesday': 'Среда',
    'day.thursday': 'Четверг',
    'day.friday': 'Пятница',
    'day.saturday': 'Суббота',
    
    // Months
    'month.jan': 'Январь',
    'month.feb': 'Февраль',
    'month.mar': 'Март',
    'month.apr': 'Апрель',
    'month.may': 'Май',
    'month.jun': 'Июнь',
    'month.jul': 'Июль',
    'month.aug': 'Август',
    'month.sep': 'Сентябрь',
    'month.oct': 'Октябрь',
    'month.nov': 'Ноябрь',
    'month.dec': 'Декабрь',
    
    // Messages
    'msg.saved_success': 'Сохранено успешно!',
    'msg.save_error': 'Ошибка сохранения:',
    'msg.task_not_found': 'Задача не найдена в последних 30 днях',
    'msg.obsidian_api_working': 'Obsidian API работает корректно',
    'msg.file_not_found': 'Файл bookmarks/index.md не найден в Obsidian',
    'msg.invalid_api_key': 'Неверный API ключ',
    
    // Navigation
    'nav.home': 'Главная',
  },
  
  zh: {
    // Header
    'header.refresh': '刷新',
    'header.settings': '设置',
    'header.edit': '编辑',
    'header.close_tabs': '关闭所有标签页',
    'header.hotkeys_on': '快捷键：开',
    'header.hotkeys_off': '快捷键：关',
    
    // Settings
    'settings.title': '设置',
    'settings.general': '常规设置',
    'settings.appearance': '外观',
    'settings.language': '语言',
    'settings.dark_mode': '暗黑模式',
    'settings.hotkeys': '启用快捷键',
    'settings.letters_only': '仅字母快捷键',
    'settings.tabs': '标签页管理',
    'settings.open_current_tab': '在当前标签页中打开链接',
    'settings.single_tab': '单标签页模式（关闭其他）',
    'settings.pomodoro': '番茄钟',
    'settings.pomodoro_minutes': '番茄钟时长（分钟）',
    'settings.pomodoro_help': '标准番茄钟时间（通常25分钟）',
    'settings.api': 'API 设置',
    'settings.api_url': 'API URL',
    'settings.api_url_help': 'API 基础 URL（例如：http://127.0.0.1:27123/vault）',
    'settings.api_key': 'API 密钥',
    'settings.api_key_help': '用于授权的 Bearer 令牌',
    'settings.periodic_api_url': '定期笔记 API URL',
    'settings.periodic_api_help': '定期笔记 API URL（例如：http://127.0.0.1:27124）',
    'settings.tab_refresh': '标签页刷新时间（分钟）',
    'settings.tab_refresh_help': '如果超过指定时间未访问，标签页将被刷新',
    'settings.week_start': '周开始于',
    'settings.week_start_help': '选择周应该从哪一天开始',
    'settings.save': '保存',
    
    // Daily Notes Panel
    'daily.yesterday': '昨天',
    'daily.today': '今天',
    'daily.tomorrow': '明天',
    'daily.notes': '每日笔记',
    'daily.edit': '编辑',
    'daily.save': '保存',
    'daily.cancel': '取消',
    'daily.saving': '保存中...',
    'daily.placeholder': '开始写您的每日笔记...',
    'daily.show_calendar': '显示日历',
    'daily.hide_calendar': '隐藏日历',
    
    // Calendar
    'calendar.loading': '加载笔记中...',
    'calendar.no_note': '无笔记',
    'calendar.note_preview': '笔记预览：',
    
    // Footer
    'footer.toggle_daily': '切换每日笔记',
    
    // API Warning
    'api.warning.title': '插件正常工作需要运行 Obsidian',
    'api.warning.step1': '1. 安装插件',
    'api.warning.step2': '2. 在您的 Obsidian 库中创建文件夹 **bookmarks** 和文件 **index.md**',
    'api.warning.step3': '3. 确保 Obsidian 正在运行且插件已激活',
    'api.warning.retry': '重试',
    'api.warning.error': '错误：',
    
    // Languages
    'lang.russian': '俄语',
    'lang.english': '英语',
    'lang.chinese': '中文',
    
    // Days of week (short)
    'day.sun': '日',
    'day.mon': '一',
    'day.tue': '二',
    'day.wed': '三',
    'day.thu': '四',
    'day.fri': '五',
    'day.sat': '六',
    
    // Days of week (full)
    'day.sunday': '星期日',
    'day.monday': '星期一',
    'day.tuesday': '星期二',
    'day.wednesday': '星期三',
    'day.thursday': '星期四',
    'day.friday': '星期五',
    'day.saturday': '星期六',
    
    // Months
    'month.jan': '一月',
    'month.feb': '二月',
    'month.mar': '三月',
    'month.apr': '四月',
    'month.may': '五月',
    'month.jun': '六月',
    'month.jul': '七月',
    'month.aug': '八月',
    'month.sep': '九月',
    'month.oct': '十月',
    'month.nov': '十一月',
    'month.dec': '十二月',
    
    // Messages
    'msg.saved_success': '保存成功！',
    'msg.save_error': '保存错误：',
    'msg.task_not_found': '在最近30天内未找到任务',
    'msg.obsidian_api_working': 'Obsidian API 工作正常',
    'msg.file_not_found': '在 Obsidian 中未找到文件 bookmarks/index.md',
    'msg.invalid_api_key': 'API 密钥无效',
    
    // Navigation
    'nav.home': '首页',
  }
};

let currentLanguage = 'en'; // По умолчанию английский

// Функция для получения перевода
export const t = (key, defaultValue = key) => {
  const translation = translations[currentLanguage]?.[key];
  return translation || defaultValue;
};

// Функция для установки языка
export const setLanguage = async (language) => {
  if (translations[language]) {
    currentLanguage = language;
    // Сохраняем в хранилище браузера
    try {
      await chrome.storage.local.set({ language });
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
};

// Функция для получения текущего языка
export const getCurrentLanguage = () => currentLanguage;

// Функция для загрузки языка из хранилища
export const loadLanguage = async () => {
  try {
    const result = await chrome.storage.local.get(['language']);
    if (result.language && translations[result.language]) {
      currentLanguage = result.language;
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
  return currentLanguage;
};

// Получение списка доступных языков
export const getAvailableLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' }
  ];
};

// Получение дней недели с учетом начала недели
export const getWeekDays = (weekStart = 0) => {
  const days = [
    { code: 0, short: t('day.sun'), full: t('day.sunday') },
    { code: 1, short: t('day.mon'), full: t('day.monday') },
    { code: 2, short: t('day.tue'), full: t('day.tuesday') },
    { code: 3, short: t('day.wed'), full: t('day.wednesday') },
    { code: 4, short: t('day.thu'), full: t('day.thursday') },
    { code: 5, short: t('day.fri'), full: t('day.friday') },
    { code: 6, short: t('day.sat'), full: t('day.saturday') }
  ];
  
  // Переставляем дни так, чтобы неделя начиналась с выбранного дня
  const reorderedDays = [];
  for (let i = 0; i < 7; i++) {
    const dayIndex = (weekStart + i) % 7;
    reorderedDays.push(days[dayIndex]);
  }
  
  return reorderedDays;
};

// Получение короткого названия дня недели
export const getDayShort = (dayCode, weekStart = 0) => {
  const weekDays = getWeekDays(weekStart);
  const adjustedDay = (dayCode - weekStart + 7) % 7;
  return weekDays[adjustedDay]?.short || '';
};

// Хук для React компонентов
export const useTranslation = () => {
  return { t, setLanguage, getCurrentLanguage, getAvailableLanguages, getWeekDays, getDayShort };
};

export default { t, setLanguage, getCurrentLanguage, loadLanguage, getAvailableLanguages, getWeekDays, getDayShort, useTranslation };
