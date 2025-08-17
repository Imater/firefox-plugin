export const getBreadcrumbs = (currentPage) => {
  if (currentPage === 'index.md') {
    return [{ name: 'Главная', path: 'index.md' }];
  }

  // Убираем .md и декодируем имя файла
  const pageName = decodeURIComponent(currentPage.replace('.md', ''));
  
  // Разбиваем путь по разделителям (/, \, -)
  const pathParts = pageName.split(/[\/\\-]/).filter(part => part.trim() !== '');
  
  const breadcrumbs = [{ name: 'Главная', path: 'index.md' }];
  
  let currentPath = '';
  pathParts.forEach((part, index) => {
    currentPath += (currentPath ? '/' : '') + part;
    breadcrumbs.push({
      name: part,
      path: encodeURIComponent(currentPath) + '.md'
    });
  });
  
  return breadcrumbs;
};
