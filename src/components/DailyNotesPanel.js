import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Tooltip,
  Snackbar,
  Alert,
  Typography
} from '@mui/material';
import { 
  ChevronLeft as YesterdayIcon,
  ChevronRight as TomorrowIcon,
  Today as TodayIcon,
  DragIndicator as DragIcon,
  ViewDay as DailyIcon,
  ViewWeek as WeeklyIcon,
  ViewModule as MonthlyIcon,
  CalendarMonth as YearlyIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

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
  padding: '8px 16px',
  backgroundColor: theme.palette.grey[100],
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '48px',
  '& .toolbar-left': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
    gap: '8px',
    flex: 1,
    justifyContent: 'flex-end',
  },
  '& .date-display': {
    fontSize: '14px',
    fontWeight: 'bold',
    color: theme.palette.text.primary,
  },
}));

const EditorContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: '16px',
  overflow: 'hidden',
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
  onContentChange,
  onSave,
  noteType = 'daily',
  onNoteTypeChange
}) => {
  const [localContent, setLocalContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  
  const panelRef = useRef(null);

  // Обновляем локальный контент при изменении content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

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

  // Обработка изменения типа заметки
  const handleNoteTypeChange = (type) => {
    if (onNoteTypeChange) {
      onNoteTypeChange(type);
    }
  };

  // Получение иконки для типа заметки
  const getNoteTypeIcon = (type) => {
    switch (type) {
      case 'daily':
        return <DailyIcon />;
      case 'weekly':
        return <WeeklyIcon />;
      case 'monthly':
        return <MonthlyIcon />;
      case 'yearly':
        return <YearlyIcon />;
      default:
        return <DailyIcon />;
    }
  };

  // Получение названия типа заметки
  const getNoteTypeName = (type) => {
    switch (type) {
      case 'daily':
        return 'Ежедневные';
      case 'weekly':
        return 'Еженедельные';
      case 'monthly':
        return 'Ежемесячные';
      case 'yearly':
        return 'Ежегодные';
      default:
        return 'Ежедневные';
    }
  };

  // Автосохранение при потере фокуса
  const handleBlur = async () => {
    if (localContent !== content && localContent.trim() !== '') {
      setIsSaving(true);
      try {
        await onSave(localContent);
        setSnackbar({ 
          open: true, 
          message: 'Сохранено автоматически', 
          severity: 'success' 
        });
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: `Ошибка сохранения: ${error.message}`, 
          severity: 'error' 
        });
      } finally {
        setIsSaving(false);
      }
    }
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
          <Tooltip title="Вчера">
            <IconButton 
              size="small" 
              onClick={() => handleDateChange('yesterday')}
            >
              <YesterdayIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Сегодня">
            <IconButton 
              size="small" 
              onClick={() => handleDateChange('today')}
              color="primary"
            >
              <TodayIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Завтра">
            <IconButton 
              size="small" 
              onClick={() => handleDateChange('tomorrow')}
            >
              <TomorrowIcon />
            </IconButton>
          </Tooltip>
        </div>
        
        <div className="toolbar-center">
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <Tooltip title="Ежедневные заметки">
              <IconButton 
                size="small" 
                onClick={() => handleNoteTypeChange('daily')}
                color={noteType === 'daily' ? 'primary' : 'default'}
              >
                <DailyIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Еженедельные заметки">
              <IconButton 
                size="small" 
                onClick={() => handleNoteTypeChange('weekly')}
                color={noteType === 'weekly' ? 'primary' : 'default'}
              >
                <WeeklyIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Ежемесячные заметки">
              <IconButton 
                size="small" 
                onClick={() => handleNoteTypeChange('monthly')}
                color={noteType === 'monthly' ? 'primary' : 'default'}
              >
                <MonthlyIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Ежегодные заметки">
              <IconButton 
                size="small" 
                onClick={() => handleNoteTypeChange('yearly')}
                color={noteType === 'yearly' ? 'primary' : 'default'}
              >
                <YearlyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </div>
        
        <div className="toolbar-right">
          <Typography className="date-display">
            {formatDate(currentDate)}
          </Typography>
          {isSaving && (
            <Typography variant="caption" color="text.secondary">
              Сохранение...
            </Typography>
          )}
        </div>
      </Toolbar>
      
      <EditorContainer>
        <TextField
          multiline
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleBlur}
          variant="outlined"
          placeholder="Начните писать вашу ежедневную заметку..."
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '10px',
            }
          }}
        />
      </EditorContainer>
      
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
