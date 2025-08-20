import { marked } from 'marked';

// Глобальное хранилище использованных горячих клавиш
let usedHotkeys = new Set();

// Функция для сброса использованных клавиш
export const resetUsedHotkeys = () => {
  usedHotkeys.clear();
};

// Функция для получения открытых вкладок
const getOpenTabs = async () => {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs.map(tab => tab.url).filter(url => url && url !== 'chrome://newtab/');
  } catch (error) {
    console.error('Error getting open tabs:', error);
    return [];
  }
};

// Функция для проверки, открыта ли ссылка в вкладке
const isUrlOpenInTab = (url, openTabs) => {
  if (!url || !openTabs || openTabs.length === 0) return false;
  
  // Нормализуем URL для сравнения
  const normalizedUrl = url.replace(/\/$/, ''); // Убираем trailing slash
  
  return openTabs.some(tabUrl => {
    const normalizedTabUrl = tabUrl.replace(/\/$/, '');
    return normalizedTabUrl === normalizedUrl;
  });
};

export const renderMarkdown = (content, showHotkeys = false, startIndex = 0, lettersOnly = false, currentBuffer = '', openTabs = [], isDailyNotes = false) => {
  // Сбрасываем использованные клавиши в начале каждой генерации
  resetUsedHotkeys();
  
  // Настраиваем marked для добавления специального класса к ссылкам
  const renderer = new marked.Renderer();
  renderer.link = (href, title, text) => {
    return `<a href="${href}" class="external-link" data-url="${href}">${text}</a>`;
  };

  // Process wiki links first
  const withWikiLinks = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (match, p1) => `<a href="#" class="wiki-link" data-page="${p1}">${p1}</a>`
  );

  // Process checkboxes
  const withCheckboxes = withWikiLinks.replace(
    /^- \[([ xX])\] (.+)$/gm,
    (match, checked, text) => {
      const isChecked = checked.toLowerCase() === 'x';
      const className = `task-checkbox ${isChecked ? 'checked' : 'unchecked'}`;
      const checkboxSymbol = isChecked ? '☑' : '☐';
      // Экранируем кавычки в data-text атрибуте
      const escapedText = text.replace(/"/g, '&quot;');
      return `<span class="${className}" data-checked="${isChecked}" data-text="${escapedText}">${checkboxSymbol} ${text}</span>`;
    }
  );

  // Настраиваем marked для правильной обработки переносов строк
  marked.setOptions({
    breaks: true, // Преобразует \n в <br>
    gfm: true,    // GitHub Flavored Markdown
    renderer: renderer
  });

  let processedContent = marked.parse(withCheckboxes);

  // Добавляем горячие клавиши если включены
  if (showHotkeys) {
    const digits = '123456789'; // 0 зарезервирован для домика
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let hotkeyIndex = startIndex;

    // Функция для генерации уникального символа
    const getUniqueSymbol = (index) => {
      let symbol;
      let attempts = 0;
      const maxAttempts = 100; // Защита от бесконечного цикла
      
      do {
        if (isDailyNotes) {
          // Для ежедневных заметок: все метки начинаются с "d" и являются двойными или тройными
          if (index < 26) {
            // Первые 26 элементов: d + буква (da, db, dc, ..., dz)
            symbol = 'd' + letters[index];
          } else if (index < 676) {
            // Следующие 650 элементов: d + две буквы (daa, dab, ..., dzz)
            const secondIndex = Math.floor((index - 26) / 26);
            const thirdIndex = (index - 26) % 26;
            symbol = 'd' + letters[secondIndex] + letters[thirdIndex];
          } else {
            // Остальные: d + три буквы (daaa, daab, ..., dzzz)
            const remainingIndex = index - 676;
            const secondIndex = Math.floor(remainingIndex / 676);
            const thirdIndex = Math.floor((remainingIndex % 676) / 26);
            const fourthIndex = remainingIndex % 26;
            symbol = 'd' + letters[secondIndex] + letters[thirdIndex] + letters[fourthIndex];
          }
        } else {
          // Для основного контента: обычная логика без буквы "d"
          const availableLetters = letters.replace('d', ''); // Исключаем "d"
          
          if (lettersOnly) {
            // Только буквы (без "d")
            if (index < availableLetters.length) {
              symbol = availableLetters[index];
            } else {
              // Двойные метки
              const doubleIndex = index - availableLetters.length;
              const firstIndex = Math.floor(doubleIndex / availableLetters.length);
              const secondIndex = doubleIndex % availableLetters.length;
              symbol = availableLetters[firstIndex] + availableLetters[secondIndex];
            }
          } else {
            // Смешанный режим: сначала цифры, затем буквы (без "d")
            if (index < digits.length) {
              symbol = digits[index];
            } else {
              const letterIndex = index - digits.length;
              if (letterIndex < availableLetters.length) {
                symbol = availableLetters[letterIndex];
              } else {
                // Двойные метки
                const doubleIndex = letterIndex - availableLetters.length;
                const firstIndex = Math.floor(doubleIndex / availableLetters.length);
                const secondIndex = doubleIndex % availableLetters.length;
                symbol = availableLetters[firstIndex] + availableLetters[secondIndex];
              }
            }
          }
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          console.warn('Превышено максимальное количество попыток генерации символа');
          symbol = isDailyNotes ? 'dx' : 'x'; // Fallback символ
          break;
        }
      } while (usedHotkeys.has(symbol));
      
      // Резервируем символ
      usedHotkeys.add(symbol);
      return symbol;
    };
    
    // Функция для создания HTML символа горячей клавиши с подсветкой
    const createHotkeySymbol = (symbol, url = null) => {
      // Функция для преобразования символа в отображаемый вид (буквы в верхний регистр)
      const formatSymbolForDisplay = (char) => {
        return /[a-z]/.test(char) ? char.toUpperCase() : char;
      };
      
      // Проверяем, открыта ли ссылка в вкладке
      const isOpenInTab = url ? isUrlOpenInTab(url, openTabs) : false;
      
      if (symbol.length === 1) {
        // Одинарная метка (только для основного контента)
        const isHighlighted = currentBuffer === symbol;
        const isOpenTab = isOpenInTab;
        const displaySymbol = formatSymbolForDisplay(symbol);
        
        let className = 'hotkey-symbol';
        if (isHighlighted) className += ' hotkey-highlighted';
        if (isOpenTab) className += ' hotkey-open-tab';
        
        return `<span class="${className}">${displaySymbol}</span>`;
      } else {
        // Двойная или тройная метка
        const isHighlighted = currentBuffer === symbol;
        const isFirstHighlighted = currentBuffer === symbol[0];
        const isOpenTab = isOpenInTab;
        
        const displaySymbol = symbol.split('').map(formatSymbolForDisplay).join('');
        
        let className = 'hotkey-symbol';
        if (isHighlighted) className += ' hotkey-highlighted';
        if (isOpenTab) className += ' hotkey-open-tab';
        
        if (isHighlighted) {
          return `<span class="${className}">${displaySymbol}</span>`;
        } else if (isFirstHighlighted) {
          const firstChar = formatSymbolForDisplay(symbol[0]);
          const restChars = symbol.slice(1).split('').map(formatSymbolForDisplay).join('');
          return `<span class="hotkey-symbol${isOpenTab ? ' hotkey-open-tab' : ''}"><span class="hotkey-highlighted">${firstChar}</span>${restChars}</span>`;
        } else {
          return `<span class="${className}">${displaySymbol}</span>`;
        }
      }
    };
    
    // Добавляем символы к wiki-ссылкам
    processedContent = processedContent.replace(
      /<a href="#" class="wiki-link" data-page="([^"]+)">([^<]+)<\/a>/g,
      (match, pageName, linkText) => {
        const symbol = getUniqueSymbol(hotkeyIndex);
        hotkeyIndex++;
        return `<a href="#" class="wiki-link" data-page="${pageName}" data-hotkey="${symbol}">${linkText} ${createHotkeySymbol(symbol)}</a>`;
      }
    );
    
    // Добавляем символы к внешним ссылкам
    processedContent = processedContent.replace(
      /<a href="([^"]+)" class="external-link" data-url="([^"]+)">([^<]+)<\/a>/g,
      (match, href, url, linkText) => {
        const symbol = getUniqueSymbol(hotkeyIndex);
        hotkeyIndex++;
        return `<a href="${href}" class="external-link" data-url="${url}" data-hotkey="${symbol}">${linkText} ${createHotkeySymbol(symbol, url)}</a>`;
      }
    );
    
    // Добавляем символы к галочкам и кнопки помодорро
    processedContent = processedContent.replace(
      /<span class="task-checkbox ([^"]+)" data-checked="([^"]+)" data-text="([^"]+)">([^<]+)<\/span>/g,
      (match, className, checked, text, content) => {
        const symbol = getUniqueSymbol(hotkeyIndex);
        hotkeyIndex++;
        const isChecked = checked === 'true';
        
                 // Добавляем только кнопку play для невыполненных задач
         let pomodoroButtons = '';
         if (!isChecked) {
           pomodoroButtons = `
             <button class="pomodoro-play" data-task-text="${text}" style="background: none; border: none; cursor: pointer; font-size: 12px; color: inherit; margin-left: 8px;">▶</button>
           `;
         }
         
         return `<span class="task-checkbox ${className}" data-checked="${checked}" data-text="${text}" data-hotkey="${symbol}">${content} ${createHotkeySymbol(symbol)}</span>${pomodoroButtons}`;
      }
    );
  }

  return { __html: processedContent };
};

// Подсчитываем количество целей для горячих клавиш (сверху вниз)
export const countHotkeyTargets = (content) => {
  const renderer = new marked.Renderer();
  renderer.link = (href, title, text) => {
    return `<a href="${href}" class="external-link" data-url="${href}">${text}</a>`;
  };
  const withWikiLinks = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (match, p1) => `<a href="#" class="wiki-link" data-page="${p1}">${p1}</a>`
  );
  
  // Process checkboxes for counting
  const withCheckboxes = withWikiLinks.replace(
    /^- \[([ xX])\] (.+)$/gm,
    (match, checked, text) => {
      const isChecked = checked.toLowerCase() === 'x';
      const className = `task-checkbox ${isChecked ? 'checked' : 'unchecked'}`;
      const checkboxSymbol = isChecked ? '☑' : '☐';
      // Экранируем кавычки в data-text атрибуте
      const escapedText = text.replace(/"/g, '&quot;');
      return `<span class="${className}" data-checked="${isChecked}" data-text="${escapedText}">${checkboxSymbol} ${text}</span>`;
    }
  );
  
  marked.setOptions({ breaks: true, gfm: true, renderer });
  const processedContent = marked.parse(withCheckboxes);
  const wikiCount = (processedContent.match(/<a [^>]*class="wiki-link"[^>]*>/g) || []).length;
  const extCount = (processedContent.match(/<a [^>]*class="external-link"[^>]*>/g) || []).length;
  const checkboxCount = (processedContent.match(/<span [^>]*class="task-checkbox[^>]*>/g) || []).length;
  return wikiCount + extCount + checkboxCount;
};
