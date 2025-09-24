import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  Divider
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  History as HistoryIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useTranslation } from '../utils/i18n';
import { 
  getHistoryFromNote, 
  removeFromHistory,
  formatTime 
} from '../services/historyService';

const PanelContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '40px',
}));

const Content = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: '8px',
}));

const HistoryList = styled(List)(({ theme }) => ({
  padding: 0,
  '& .MuiListItem-root': {
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '2px',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const HistoryItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '& .MuiListItemText-primary': {
    fontSize: '12px',
    fontWeight: 'bold',
    color: theme.palette.text.primary,
  },
  '& .MuiListItemText-secondary': {
    fontSize: '11px',
    color: theme.palette.text.secondary,
  },
}));

const TimeText = styled(Typography)(({ theme }) => ({
  fontSize: '11px',
  color: theme.palette.text.secondary,
  fontFamily: 'monospace',
  marginLeft: '8px',
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));

const HistoryPanel = ({ 
  currentDate, 
  onDateChange,
  isVisible = false 
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Загружаем историю при изменении даты или видимости
  useEffect(() => {
    if (isVisible) {
      loadHistory();
    }
  }, [currentDate, isVisible]);

  // Слушаем сообщения от background.js для обновления истории
  useEffect(() => {
    const handleMessage = (message, sender, sendResponse) => {
      if (message?.type === 'history_updated' && isVisible) {
        // Обновляем историю при получении уведомления
        loadHistory();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [isVisible]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const historyData = await getHistoryFromNote(currentDate);
      setHistory(historyData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Ошибка загрузки истории посещений');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadHistory();
  };

  const handleItemClick = async (item) => {
    try {
      // Открываем полный URL в новой вкладке
      await chrome.tabs.create({ url: item.url, active: true });
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      const success = await removeFromHistory(currentDate, item.url);
      if (success) {
        // Обновляем локальное состояние
        const updatedHistory = history.filter(h => h.url !== item.url);
        setHistory(updatedHistory);
      } else {
        setError('Ошибка удаления записи');
      }
    } catch (error) {
      console.error('Error deleting history item:', error);
      setError('Ошибка удаления записи');
    }
  };

  const formatDisplayTime = (timeString) => {
    return timeString;
  };

  if (!isVisible) return null;

  return (
    <PanelContainer>
      <Header>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HistoryIcon sx={{ fontSize: '20px' }} />
          <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
            История посещений
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {lastUpdate && (
            <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>
              {lastUpdate.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Typography>
          )}
          
          <Tooltip title="Обновить историю">
            <IconButton 
              size="small" 
              onClick={handleRefresh}
              disabled={loading}
              sx={{ padding: '4px' }}
            >
              <RefreshIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Header>

      <Content>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ margin: '8px', fontSize: '12px' }}>
            {error}
          </Alert>
        )}

        {!loading && !error && history.length === 0 && (
          <EmptyState>
            <HistoryIcon sx={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <Typography variant="body2" sx={{ fontSize: '12px' }}>
              История посещений пуста
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '10px', marginTop: '4px' }}>
              Откройте несколько страниц, чтобы увидеть историю
            </Typography>
          </EmptyState>
        )}

        {!loading && !error && history.length > 0 && (
          <>
            <Box sx={{ padding: '8px 0' }}>
              <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                Найдено записей: {history.length} (отсортировано по времени)
              </Typography>
            </Box>
            
            <Divider sx={{ margin: '8px 0' }} />
            
            <HistoryList>
              {history
                .sort((a, b) => {
                  // Дополнительная сортировка по времени (самые свежие сверху)
                  const parseTime = (timeStr) => {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    return hours * 60 + minutes;
                  };
                  
                  const timeA = parseTime(a.time);
                  const timeB = parseTime(b.time);
                  
                  return timeB - timeA; // Сортируем по убыванию
                })
                .map((item, index) => (
                <HistoryItem 
                  key={index}
                  onClick={() => handleItemClick(item)}
                >
                  <ListItemText
                    primary={item.normalizedUrl}
                    secondary={item.title}
                  />
                  
                  <TimeText>
                    {formatDisplayTime(item.time)}
                  </TimeText>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tooltip title="Открыть в новой вкладке">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        sx={{ padding: '2px' }}
                      >
                        <OpenInNewIcon sx={{ fontSize: '14px' }} />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Удалить из истории">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                        sx={{ padding: '2px' }}
                      >
                        <DeleteIcon sx={{ fontSize: '14px' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </HistoryItem>
              ))}
            </HistoryList>
          </>
        )}
      </Content>
    </PanelContainer>
  );
};

export default HistoryPanel;
