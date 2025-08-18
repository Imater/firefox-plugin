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
    const baseSymbols = digits + letters; // сначала цифры, затем буквы
    let hotkeyIndex = startIndex;

    // Функция для генерации уникального символа (последовательность сверху вниз)
    const getUniqueSymbol = (index) => {
      if (index < baseSymbols.length) {
        return baseSymbols[index];
      }
      // После исчерпания — генерируем пары из букв (aa, ab, ..., zz)
      const n = index - baseSymbols.length;
      const firstIndex = Math.floor(n / 26) % 26;
      const secondIndex = n % 26;
      return letters[firstIndex] + letters[secondIndex];
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
