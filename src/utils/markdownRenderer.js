import { marked } from 'marked';

export const renderMarkdown = (content) => {
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

  // Then render markdown with custom renderer
  return { __html: marked.parse(withWikiLinks, { renderer }) };
};
