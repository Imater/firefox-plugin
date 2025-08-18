import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Tooltip,
  Snackbar,
  Alert,
  Typography,
  Button
} from '@mui/material';
import { 
  ChevronLeft as YesterdayIcon,
  ChevronRight as TomorrowIcon,
  Today as TodayIcon,
  DragIndicator as DragIcon,
  ViewDay as DailyIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { renderMarkdown } from '../utils/markdownRenderer';

const PanelContainer = styled(Box)(({ theme, height, isOpen }) => ({
  position: 'fixed',
  bottom: isOpen ? '24px' : '-100%',
  left: 0,
  right: 0,
  height: height || '300px',
  backgroundColor: theme.palette.background.default,
  borderTop: `2px solid ${theme.palette.primary.main}`,
  transition: 'bottom 0.3s ease',
  zIndex: 999,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: isOpen ? '0 -4px 12px rgba(0,0,0,0.15)' : 'none',
}));

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '2px 16px',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '15px',
  '& .toolbar-left': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  '& .toolbar-center': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  '& .toolbar-right': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    justifyContent: 'flex-end',
  },
  '& .date-display': {
    fontSize: '12px',
    fontWeight: 'bold',
    color: theme.palette.text.primary,
  },
  '& .editor-actions': {
    display: 'flex',
    gap: '4px',
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: '16px',
  overflow: 'auto',
  color: theme.palette.text.primary,
  '& .MuiTextField-root': {
    width: '100%',
    height: '100%',
    '& .MuiInputBase-root': {
      height: '100%',
      fontSize: '10px',
      fontFamily: 'monospace',
    },
    '& .MuiInputBase-input': {
      height: '100% !important',
      overflow: 'auto',
    },
  },
  '& .markdown-content': {
    fontSize: '12px',
    lineHeight: '1.5',
    color: theme.palette.text.primary,
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: '8px',
      marginBottom: '4px',
      color: theme.palette.text.primary,
    },
    '& p': {
      margin: '4px 0',
      color: theme.palette.text.primary,
    },
    '& ul, & ol': {
      margin: '4px 0',
      paddingLeft: '20px',
      color: theme.palette.text.primary,
    },
    '& li': {
      color: theme.palette.text.primary,
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& code': {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
      color: theme.palette.text.primary,
      padding: '2px 4px',
      borderRadius: '3px',
      fontSize: '11px',
    },
    '& pre': {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
      color: theme.palette.text.primary,
      padding: '8px',
      borderRadius: '4px',
      overflow: 'auto',
      fontSize: '11px',
    },
    '& blockquote': {
      borderLeft: `3px solid ${theme.palette.primary.main}`,
      margin: '8px 0',
      padding: '4px 12px',
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
      color: theme.palette.text.secondary,
    },
  },
  '& .hotkey-symbol': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    fontWeight: 'bold',
    fontSize: '0.9em',
    marginLeft: '4px',
    backgroundColor: theme.palette.mode === 'dark' ? '#ff6b35' : '#ff9800',
    padding: '2px 6px',
    borderRadius: '4px',
    border: `2px solid ${theme.palette.mode === 'dark' ? '#ff6b35' : '#ff9800'}`,
    textShadow: theme.palette.mode === 'dark' ? '0 0 2px rgba(255, 255, 255, 0.8)' : '0 0 2px rgba(0, 0, 0, 0.3)',
  },
}));

const ResizeHandle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '4px',
  backgroundColor: theme.palette.primary.main,
  cursor: 'ns-resize',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  '& .drag-icon': {
    color: theme.palette.primary.contrastText,
    fontSize: '16px',
  },
}));

const DailyNotesPanel = ({ 
  isOpen, 
  height, 
  onHeightChange,
  onDateChange,
  currentDate,
  content,
  onSave,
  noteType = 'daily',
  showHotkeys = false,
  onEditingChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  
  const panelRef = useRef(null);

  // Обновляем editContent при изменении content
  useEffect(() => {
    setEditContent(content);
  }, [content]);

  // Уведомляем родительский компонент об изменении состояния редактирования
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(isEditing);
    }
  }, [isEditing, onEditingChange]);

  // Обработка изменения даты
  const handleDateChange = (direction) => {
    const today = new Date(currentDate);
    let newDate;
    
    switch (direction) {
      case 'yesterday':
        newDate = new Date(today);
        newDate.setDate(today.getDate() - 1);
        break;
      case 'today':
        newDate = new Date();
        break;
      case 'tomorrow':
        newDate = new Date(today);
        newDate.setDate(today.getDate() + 1);
        break;
      default:
        return;
    }
    
    onDateChange(newDate);
  };

  // Получение названия типа заметки
  const getNoteTypeName = (type) => {
    return 'Ежедневные';
  };

  // Обработка сохранения
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editContent);
      setSnackbar({ 
        open: true, 
        message: 'Сохранено успешно!', 
        severity: 'success' 
      });
      setIsEditing(false);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Ошибка сохранения: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Обработка отмены
  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  // Обработка изменения размера панели
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startY, startHeight, onHeightChange]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <PanelContainer ref={panelRef} height={height} isOpen={isOpen}>
      <ResizeHandle onMouseDown={handleMouseDown}>
        <DragIcon className="drag-icon" />
      </ResizeHandle>
      
      <Toolbar>
        <div className="toolbar-left">
          {!isEditing && (
            <>
              <Tooltip title="Вчера">
                <IconButton 
                  size="small" 
                  onClick={() => handleDateChange('yesterday')}
                  sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                >
                  <YesterdayIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Сегодня">
                <IconButton 
                  size="small" 
                  onClick={() => handleDateChange('today')}
                  color="primary"
                  sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                >
                  <TodayIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Завтра">
                <IconButton 
                  size="small" 
                  onClick={() => handleDateChange('tomorrow')}
                  sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                >
                  <TomorrowIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
        
        <div className="toolbar-center">
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <Tooltip title="Ежедневные заметки">
              <IconButton 
                size="small" 
                color="primary"
                sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
              >
                <DailyIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </div>
        
        <div className="toolbar-right">
          {!isEditing && (
            <Typography className="date-display">
              {formatDate(currentDate)}
            </Typography>
          )}
          
          {isEditing ? (
            <div className="editor-actions">
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={isSaving}
                size="small"
                sx={{ fontSize: '10px', padding: '2px 8px', minHeight: '24px' }}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={isSaving}
                size="small"
                sx={{ fontSize: '10px', padding: '2px 8px', minHeight: '24px' }}
              >
                Отмена
              </Button>
            </div>
          ) : (
            <Tooltip title="Редактировать">
              <IconButton 
                size="small" 
                onClick={() => setIsEditing(true)}
                sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
              >
                <EditIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </Toolbar>
      
      <ContentContainer>
        {isEditing ? (
          <TextField
            multiline
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            placeholder="Начните писать вашу ежедневную заметку..."
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '10px',
              }
            }}
          />
        ) : (
          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={renderMarkdown(content, !isEditing && showHotkeys, 20)} // DailyNotes начинается с индекса 20 для уникальности
          />
        )}
      </ContentContainer>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PanelContainer>
  );
};

export default DailyNotesPanel;
