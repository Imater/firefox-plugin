import { marked } from 'marked';

export const renderMarkdown = (content, showHotkeys = false, startIndex = 0) => {
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

  // Настраиваем marked для правильной обработки переносов строк
  marked.setOptions({
    breaks: true, // Преобразует \n в <br>
    gfm: true,    // GitHub Flavored Markdown
    renderer: renderer
  });

  let processedContent = marked.parse(withWikiLinks);

  // Добавляем горячие клавиши если включены
  if (showHotkeys) {
    const digits = '123456789'; // 0 зарезервирован для домика
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let hotkeyIndex = startIndex;

    // Функция для генерации уникального символа без конфликтов
    const getUniqueSymbol = (index) => {
      // Сначала используем цифры
      if (index < digits.length) {
        return digits[index];
      }
      
      // Затем используем буквы, но пропускаем те, которые могут конфликтовать с двойными
      const letterIndex = index - digits.length;
      if (letterIndex < letters.length) {
        return letters[letterIndex];
      }
      
      // После исчерпания одинарных символов — генерируем двойные
      // Используем только те буквы, которые не были использованы как одинарные
      const doubleIndex = letterIndex - letters.length;
      const availableLetters = letters.slice(letters.length - 10); // Используем только последние 10 букв для двойных
      const firstIndex = Math.floor(doubleIndex / availableLetters.length);
      const secondIndex = doubleIndex % availableLetters.length;
      
      if (firstIndex < availableLetters.length) {
        return availableLetters[firstIndex] + availableLetters[secondIndex];
      }
      
      // Если и это исчерпано — используем трехсимвольные
      const tripleIndex = doubleIndex - (availableLetters.length * availableLetters.length);
      const thirdIndex = tripleIndex % availableLetters.length;
      return availableLetters[0] + availableLetters[1] + availableLetters[thirdIndex];
    };
    
    // Добавляем символы к wiki-ссылкам
    processedContent = processedContent.replace(
      /<a href="#" class="wiki-link" data-page="([^"]+)">([^<]+)<\/a>/g,
      (match, pageName, linkText) => {
        const symbol = getUniqueSymbol(hotkeyIndex);
        hotkeyIndex++;
        return `<a href="#" class="wiki-link" data-page="${pageName}" data-hotkey="${symbol}">${linkText} <span class="hotkey-symbol">${symbol}</span></a>`;
      }
    );
    
    // Добавляем символы к внешним ссылкам
    processedContent = processedContent.replace(
      /<a href="([^"]+)" class="external-link" data-url="([^"]+)">([^<]+)<\/a>/g,
      (match, href, url, linkText) => {
        const symbol = getUniqueSymbol(hotkeyIndex);
        hotkeyIndex++;
        return `<a href="${href}" class="external-link" data-url="${url}" data-hotkey="${symbol}">${linkText} <span class="hotkey-symbol">${symbol}</span></a>`;
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
  marked.setOptions({ breaks: true, gfm: true, renderer });
  const processedContent = marked.parse(withWikiLinks);
  const wikiCount = (processedContent.match(/<a [^>]*class="wiki-link"[^>]*>/g) || []).length;
  const extCount = (processedContent.match(/<a [^>]*class="external-link"[^>]*>/g) || []).length;
  return wikiCount + extCount;
};
