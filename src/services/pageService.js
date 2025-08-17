export const loadCurrentPage = async (currentPage) => {
  try {
    const result = await chrome.storage.local.get(['webdavUrl', 'username', 'password']);
    const baseUrl = result.webdavUrl || 'file://C:\\Users\\eugen\\coding\\obsidian\\imater-2024-2\\bookmarks';
    const url = baseUrl + '/' + currentPage;
    
    const response = await fetch(url, {
      headers: url.startsWith('file://') ? {} : {
        'Authorization': 'Basic ' + btoa(
          (result.username || '') + ':' + (result.password || '')
        )
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const text = await response.text();
    return text;
  } catch (error) {
    return `Error: ${error.message}${error.message.includes('401') ? '\nPlease check your credentials in settings' : ''}`;
  }
};
