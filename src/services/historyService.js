import {
  normalizeUrl as normalizeUrlBase,
  isValidUrl as isValidUrlBase,
  getVisitHistory as getVisitHistoryStorage,
  removeVisit,
} from './visitHistoryStorage';

export const normalizeUrl = normalizeUrlBase;
export const isValidUrl = isValidUrlBase;

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const getVisitHistory = async () => {
  const entries = await getVisitHistoryStorage();
  return [...entries].sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0));
};

export const removeFromHistory = async (url) => removeVisit(url);
