export const VISIT_HISTORY_KEY = 'visitHistory';
export const VISIT_HISTORY_MAX = 200;

export const normalizeUrl = (url) => {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    let normalized = urlObj.hostname + urlObj.pathname;

    if (normalized.endsWith('/') && normalized !== '/') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return url;
  }
};

export const isValidUrl = (url) => {
  if (!url) return false;

  return (
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('about:') &&
    !url.startsWith('moz-extension://') &&
    !url.startsWith('edge://') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1') &&
    (url.startsWith('http://') || url.startsWith('https://'))
  );
};

export const getVisitHistory = async () => {
  const result = await chrome.storage.local.get(VISIT_HISTORY_KEY);
  const list = result[VISIT_HISTORY_KEY];
  return Array.isArray(list) ? list : [];
};

export const appendVisit = async (url, title) => {
  if (!isValidUrl(url)) {
    return false;
  }

  const existing = await getVisitHistory();
  const filtered = existing.filter((entry) => entry.url !== url);
  const next = [
    { url, title: title || '', visitedAt: Date.now() },
    ...filtered,
  ].slice(0, VISIT_HISTORY_MAX);

  await chrome.storage.local.set({ [VISIT_HISTORY_KEY]: next });
  return true;
};

export const removeVisit = async (url) => {
  const existing = await getVisitHistory();
  const next = existing.filter((entry) => entry.url !== url);
  await chrome.storage.local.set({ [VISIT_HISTORY_KEY]: next });
  return true;
};
