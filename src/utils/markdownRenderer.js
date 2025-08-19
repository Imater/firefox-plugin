import { marked } from 'marked';

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

export const renderMarkdown = (content, showHotkeys = false, startIndex = 0, lettersOnly = false, currentBuffer = '', openTabs = []) => {
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
      return `<span class="${className}" data-checked="${isChecked}" data-text="${text}">${checkboxSymbol} ${text}</span>`;
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

    // Резервируем последние 4 буквы для двойных меток
    const reservedLetters = letters.slice(-4); // w, x, y, z
    const availableSingleLetters = letters.slice(0, -4); // a-v

    // Функция для генерации уникального символа без конфликтов
    const getUniqueSymbol = (index) => {
      if (lettersOnly) {
        // Только буквы: сначала используем доступные одинарные буквы
        if (index < availableSingleLetters.length) {
          return availableSingleLetters[index];
        }
        
        // Затем генерируем двойные метки, используя зарезервированные буквы
        const doubleIndex = index - availableSingleLetters.length;
        const firstIndex = Math.floor(doubleIndex / reservedLetters.length);
        const secondIndex = doubleIndex % reservedLetters.length;
        
        if (firstIndex < reservedLetters.length) {
          return reservedLetters[firstIndex] + reservedLetters[secondIndex];
        }
        
        // Если и это исчерпано — используем трехсимвольные
        const tripleIndex = doubleIndex - (reservedLetters.length * reservedLetters.length);
        const thirdIndex = tripleIndex % reservedLetters.length;
        return reservedLetters[0] + reservedLetters[1] + reservedLetters[thirdIndex];
      } else {
        // Смешанный режим: сначала цифры, затем буквы
        if (index < digits.length) {
          return digits[index];
        }
        
        // Затем используем доступные одинарные буквы
        const letterIndex = index - digits.length;
        if (letterIndex < availableSingleLetters.length) {
          return availableSingleLetters[letterIndex];
        }
        
        // После исчерпания одинарных символов — генерируем двойные
        const doubleIndex = letterIndex - availableSingleLetters.length;
        const firstIndex = Math.floor(doubleIndex / reservedLetters.length);
        const secondIndex = doubleIndex % reservedLetters.length;
        
        if (firstIndex < reservedLetters.length) {
          return reservedLetters[firstIndex] + reservedLetters[secondIndex];
        }
        
        // Если и это исчерпано — используем трехсимвольные
        const tripleIndex = doubleIndex - (reservedLetters.length * reservedLetters.length);
        const thirdIndex = tripleIndex % reservedLetters.length;
        return reservedLetters[0] + reservedLetters[1] + reservedLetters[thirdIndex];
      }
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
        // Одинарная метка
        const isHighlighted = currentBuffer === symbol;
        const isOpenTab = isOpenInTab;
        const displaySymbol = formatSymbolForDisplay(symbol);
        
        let className = 'hotkey-symbol';
        if (isHighlighted) className += ' hotkey-highlighted';
        if (isOpenTab) className += ' hotkey-open-tab';
        
        return `<span class="${className}">${displaySymbol}</span>`;
      } else {
        // Двойная метка
        const firstChar = symbol[0];
        const secondChar = symbol[1];
        const isFirstHighlighted = currentBuffer === firstChar;
        const isBothHighlighted = currentBuffer === symbol;
        const isOpenTab = isOpenInTab;
        
        const displayFirstChar = formatSymbolForDisplay(firstChar);
        const displaySecondChar = formatSymbolForDisplay(secondChar);
        const displaySymbol = displayFirstChar + displaySecondChar;
        
        let className = 'hotkey-symbol';
        if (isBothHighlighted) className += ' hotkey-highlighted';
        if (isOpenTab) className += ' hotkey-open-tab';
        
        if (isBothHighlighted) {
          return `<span class="${className}">${displaySymbol}</span>`;
        } else if (isFirstHighlighted) {
          return `<span class="hotkey-symbol${isOpenTab ? ' hotkey-open-tab' : ''}"><span class="hotkey-highlighted">${displayFirstChar}</span>${displaySecondChar}</span>`;
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
    
    // Добавляем символы к галочкам
    processedContent = processedContent.replace(
      /<span class="task-checkbox ([^"]+)" data-checked="([^"]+)" data-text="([^"]+)">([^<]+)<\/span>/g,
      (match, className, checked, text, content) => {
        const symbol = getUniqueSymbol(hotkeyIndex);
        hotkeyIndex++;
        return `<span class="task-checkbox ${className}" data-checked="${checked}" data-text="${text}" data-hotkey="${symbol}">${content} ${createHotkeySymbol(symbol)}</span>`;
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
      return `<span class="${className}" data-checked="${isChecked}" data-text="${text}">${checkboxSymbol} ${text}</span>`;
    }
  );
  
  marked.setOptions({ breaks: true, gfm: true, renderer });
  const processedContent = marked.parse(withCheckboxes);
  const wikiCount = (processedContent.match(/<a [^>]*class="wiki-link"[^>]*>/g) || []).length;
  const extCount = (processedContent.match(/<a [^>]*class="external-link"[^>]*>/g) || []).length;
  const checkboxCount = (processedContent.match(/<span [^>]*class="task-checkbox[^>]*>/g) || []).length;
  return wikiCount + extCount + checkboxCount;
};
