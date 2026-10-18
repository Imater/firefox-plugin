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

import { useAppDispatch } from '../store/hooks';
import { updateNote } from '../store/calendarNotesSlice';
import { 
  ChevronLeft as YesterdayIcon,
  ChevronRight as TomorrowIcon,
  Today as TodayIcon,
  DragIndicator as DragIcon,
  ViewDay as DailyIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CalendarMonth as CalendarIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { renderMarkdown } from '../utils/markdownRenderer';
import CalendarPanel from './CalendarPanel';
import HistoryPanel from './HistoryPanel';
import { useTranslation } from '../utils/i18n';

const PanelContainer = styled(Box)(({ theme, height, isOpen, isResizing, showCalendar }) => ({
  position: 'relative', // Добавляем для работы ResizeHandle
  height: isOpen ? (height || '300px') : '0px',
  backgroundColor: theme.palette.background.default,
  borderTop: `2px solid ${theme.palette.primary.main}`,
  transition: isResizing ? 'none' : 'height 0.3s ease', // Отключаем transition при изменении размера
  zIndex: 999,
  display: 'flex',
  flexDirection: 'row', // Изменяем на row для размещения календаря справа
  overflow: 'hidden',
  boxShadow: isOpen ? '0 -4px 12px rgba(0,0,0,0.15)' : 'none',
}));

const MainContent = styled(Box)(({ theme, showCalendar }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  marginRight: showCalendar ? '60px' : '0px', // Отступ для календарной панели (уменьшен)
  transition: 'margin-right 0.3s ease',
}));

const CalendarWrapper = styled(Box)(({ theme, showCalendar }) => ({
  position: 'absolute',
  right: 0,
  top: 0, // Начинается сверху
  width: '60px', // Уменьшенная ширина
  height: '100%', // Полная высота
  backgroundColor: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
  transform: showCalendar ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 0.3s ease',
  zIndex: 500, // Меньше чем у тулбара, чтобы тулбар был поверх
}));

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '2px 16px',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '15px',
  position: 'relative',
  zIndex: 1000, // Поверх календаря
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
      fontSize: '11px',
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
    '& .collapsible-block': {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '4px',
      margin: '8px 0',
      overflow: 'hidden',
    },
    '& .collapsible-block-header': {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
      cursor: 'pointer',
      userSelect: 'none',
      borderBottom: `1px solid ${theme.palette.divider}`,
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200],
      },
    },
    '& .block-toggle': {
      marginRight: '8px',
      fontSize: '12px',
      color: theme.palette.text.secondary,
      transition: 'transform 0.2s ease',
      '&.collapsed': {
        transform: 'rotate(-90deg)',
      },
    },
    '& .block-type': {
      fontWeight: 'bold',
      color: theme.palette.text.primary,
    },
    '& .collapsible-block-content': {
      padding: '12px',
      '&.collapsed': {
        display: 'none',
      },
    },
    '& .collapsible-block-content:not(.collapsed)': {
      display: 'block',
    },
  },
  '& .hotkey-symbol': {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: '0.9em',
    marginLeft: '4px',
    backgroundColor: theme.palette.mode === 'dark' ? '#d0d0d0' : '#e0e0e0',
    padding: '1px 5px',
    borderRadius: '999px',
    border: '1px solid #bdbdbd',
    opacity: 0.9,
    position: 'relative',
    top: '-1px', // Поднимаем на 1px выше
  },
  '& .hotkey-highlighted': {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    border: `2px solid ${theme.palette.warning.dark}`,
    opacity: 1,
    animation: 'pulse 1s infinite',
  },
  '& .hotkey-open-tab': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    border: `2px solid ${theme.palette.success.dark}`,
    opacity: 1,
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.7)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(255, 193, 7, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(255, 193, 7, 0)',
    },
  },
}));

const ResizeHandle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '-2px', // Размещаем на границе с основной панелью
  left: 0,
  right: 0,
  height: '4px',
  backgroundColor: theme.palette.primary.main,
  cursor: 'ns-resize',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1001, // Поверх всех элементов
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    height: '6px', // Увеличиваем при наведении для лучшего UX
    boxShadow: `0 2px 8px ${theme.palette.primary.main}40`,
  },
  '&:active': {
    backgroundColor: theme.palette.primary.dark,
    height: '6px',
  },
  '& .drag-icon': {
    color: theme.palette.primary.contrastText,
    fontSize: '16px',
    opacity: 0.8,
    transition: 'opacity 0.2s ease',
  },
  '&:hover .drag-icon': {
    opacity: 1,
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
  onEditingChange,
  lettersOnlyHotkeys = false,
  currentHotkeyBuffer = '',
  onLinkHover = null,
  openTabs = [],
  onTodayClick = null,
  onScrollToDate = null,
  notePreview = '',
  pomodoroTimer = null,
  settings = null,
  onDateSelect = null,
  selectedDate = null,
  onCalendarNotePreview = null
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [previewContent, setPreviewContent] = useState('');
  const [activePomodoroTask, setActivePomodoroTask] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' или 'history'
  
  // Загружаем состояние календаря из хранилища при инициализации
  useEffect(() => {
    const loadCalendarState = async () => {
      try {
        const result = await chrome.storage.local.get(['dailyNotesCalendarOpen']);
        if (result.dailyNotesCalendarOpen !== undefined) {
          setShowCalendar(result.dailyNotesCalendarOpen);
        }
      } catch (error) {
        console.error('Error loading calendar state:', error);
      }
    };
    
    loadCalendarState();
  }, []);
  
  // Сохраняем состояние календаря в хранилище
  const saveCalendarState = async (isOpen) => {
    try {
      await chrome.storage.local.set({ dailyNotesCalendarOpen: isOpen });
    } catch (error) {
      console.error('Error saving calendar state:', error);
    }
  };
  
  // Скрываем календарь, когда панель закрыта
  useEffect(() => {
    if (!isOpen) {
      setShowCalendar(false);
    }
  }, [isOpen]);
  const [scrollToTodayFunction, setScrollToTodayFunction] = useState(null);
  const [scrollToDateFunction, setScrollToDateFunction] = useState(null);
  
  const panelRef = useRef(null);
  const dispatch = useAppDispatch();

  // Делаем функцию handleDateChange доступной через ref
  const handleDateChangeRef = useRef(null);

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

  // Обрабатываем превью из календаря
  useEffect(() => {
    if (notePreview && !isEditing) {
      setPreviewContent(notePreview);
    } else {
      setPreviewContent('');
    }
  }, [notePreview, isEditing]);

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
    
    console.log('DailyNotesPanel: Date changed to:', newDate.toDateString(), 'direction:', direction);
    
    // Вызываем функцию скролла календаря к выбранной дате
    if (onScrollToDate) {
      console.log('DailyNotesPanel: Calling onScrollToDate with:', newDate);
      onScrollToDate(newDate);
    } else {
      console.log('DailyNotesPanel: onScrollToDate is not available');
    }
    
    onDateChange(newDate);
  };

  // Экспортируем функцию handleDateChange через ref
  useEffect(() => {
    handleDateChangeRef.current = handleDateChange;
    // Делаем доступной через window для App.jsx
    window.dailyNotesPanelRef = {
      handleDateChange: handleDateChange
    };
  }, [currentDate, onDateChange, onScrollToDate]);

  // Обработка завершения таймера
  useEffect(() => {
    if (pomodoroTimer && !pomodoroTimer.isRunning && pomodoroTimer.activeTask && pomodoroTimer.timeLeft === 0) {
      // Таймер закончился, добавляем заполненную помидорку
      const currentContent = previewContent || content;
      const now = new Date();
      const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const checkboxPattern = new RegExp(`^- \\[ \\] (${pomodoroTimer.activeTask.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`, 'gm');
      const newContent = currentContent.replace(checkboxPattern, (match) => {
        return `${match} 🔴 ${timeString}`;
      });
      
      onSave(newContent);
      dispatch(updateNote({ date: currentDate, content: newContent }));
    }
  }, [pomodoroTimer, previewContent, content, onSave, dispatch, currentDate]);



  // Получение названия типа заметки
  const getNoteTypeName = (type) => {
    return t('daily.notes');
  };

  // Обработка сохранения
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editContent);
      
      // Обновляем заметку в Redux store
      dispatch(updateNote({ date: currentDate, content: editContent }));
      
      setSnackbar({ 
        open: true, 
        message: t('msg.saved_success'), 
        severity: 'success' 
      });
      setIsEditing(false);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `${t('msg.save_error')} ${error.message}`, 
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
    e.stopPropagation();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
    
    // Добавляем класс для предотвращения выделения текста
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  };

  // Восстанавливаем состояние сворачиваемых блоков при загрузке
  useEffect(() => {
    const restoreBlockStates = () => {
      const blocks = document.querySelectorAll('.collapsible-block');
      blocks.forEach(block => {
        const blockType = block.getAttribute('data-block-type');
        const blockId = block.getAttribute('data-block-id');
        const content = block.querySelector('.collapsible-block-content');
        const toggle = block.querySelector('.block-toggle');
        
        if (blockType && blockId && content && toggle) {
          const savedState = localStorage.getItem(`collapsible-block-${blockType}-${blockId}`);
          const isCollapsed = savedState === 'true';
          
          if (isCollapsed) {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
          } else if (savedState === 'false') {
            // Если явно сохранено как развернутое, убираем collapsed
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
          }
          // Если нет сохраненного состояния, оставляем как есть (по умолчанию свернуто)
        }
      });
    };

    // Восстанавливаем состояние после рендеринга
    const timer = setTimeout(restoreBlockStates, 100);
    return () => clearTimeout(timer);
  }, [content, currentDate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      e.preventDefault();
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
      onHeightChange(newHeight);
    };

    const handleMouseUp = (e) => {
      if (!isResizing) return;
      
      e.preventDefault();
      setIsResizing(false);
      
      // Восстанавливаем стили
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Восстанавливаем стили при размонтировании
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
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
    <PanelContainer ref={panelRef} height={height} isOpen={isOpen} isResizing={isResizing} showCalendar={showCalendar}>
      <ResizeHandle onMouseDown={handleMouseDown}>
        <DragIcon className="drag-icon" />
      </ResizeHandle>
      
      <MainContent showCalendar={showCalendar}>
        <Toolbar>
          <div className="toolbar-left">
            {activeTab === 'notes' && !isEditing && (
              <>
                <Tooltip title={t('daily.yesterday')}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDateChange('yesterday')}
                    sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                  >
                    <YesterdayIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('daily.today')}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDateChange('today')}
                    color="primary"
                    sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                  >
                    <TodayIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('daily.tomorrow')}>
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
                  color={activeTab === 'notes' ? "primary" : "default"}
                  onClick={() => setActiveTab('notes')}
                  sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                >
                  <DailyIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="История посещений">
                <IconButton 
                  size="small" 
                  color={activeTab === 'history' ? "primary" : "default"}
                  onClick={() => setActiveTab('history')}
                  sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                >
                  <HistoryIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={showCalendar ? t('daily.hide_calendar') : t('daily.show_calendar')}>
                <IconButton 
                  size="small" 
                  color={showCalendar ? "primary" : "default"}
                  onClick={() => {
                    const newState = !showCalendar;
                    setShowCalendar(newState);
                    saveCalendarState(newState);
                  }}
                  sx={{ padding: '2px', minWidth: '24px', height: '24px' }}
                >
                  <CalendarIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </div>
          
          <div className="toolbar-right">
            {activeTab === 'notes' && !isEditing && (
              <Typography className="date-display">
                {formatDate(currentDate)}
              </Typography>
            )}
            
            {activeTab === 'notes' && isEditing && (
              <div className="editor-actions">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={isSaving}
                  size="small"
                  sx={{ fontSize: '11px', padding: '2px 8px', minHeight: '24px' }}
                >
                  {isSaving ? t('daily.saving') : t('daily.save')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={isSaving}
                  size="small"
                  sx={{ fontSize: '11px', padding: '2px 8px', minHeight: '24px' }}
                >
                  {t('daily.cancel')}
                </Button>
              </div>
            )}
            
            {activeTab === 'notes' && !isEditing && (
              <Tooltip title={t('daily.edit')}>
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
          {activeTab === 'notes' ? (
            isEditing ? (
              <TextField
                multiline
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                variant="outlined"
                placeholder={t('daily.placeholder')}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '10px',
                  }
                }}
              />
            ) : (
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={renderMarkdown(
                  previewContent || content, 
                  !isEditing && showHotkeys, 
                  0, 
                  lettersOnlyHotkeys, 
                  currentHotkeyBuffer, 
                  openTabs,
                  true
                )} // DailyNotes - isDailyNotes = true
              onClick={(e) => {
                // Обработка сворачиваемых блоков
                if (e.target.closest('.collapsible-block-header')) {
                  e.preventDefault();
                  e.stopPropagation();
                  const header = e.target.closest('.collapsible-block-header');
                  const blockType = header.getAttribute('data-block-type');
                  const blockId = header.getAttribute('data-block-id');
                  const block = header.closest('.collapsible-block');
                  const content = block.querySelector('.collapsible-block-content');
                  const toggle = header.querySelector('.block-toggle');
                  
                  if (block && content && toggle) {
                    const isCollapsed = content.classList.contains('collapsed');
                    if (isCollapsed) {
                      content.classList.remove('collapsed');
                      toggle.classList.remove('collapsed');
                      localStorage.setItem(`collapsible-block-${blockType}-${blockId}`, 'false');
                    } else {
                      content.classList.add('collapsed');
                      toggle.classList.add('collapsed');
                      localStorage.setItem(`collapsible-block-${blockType}-${blockId}`, 'true');
                    }
                  }
                  return;
                }
                
                if (e.target.classList.contains('wiki-link')) {
                  e.preventDefault();
                  e.stopPropagation();
                  const pageName = e.target.getAttribute('data-page');
                  if (pageName) {
                    console.log('DailyNotes: Wiki link clicked:', pageName);
                    // Нужно передать обработчик из App.jsx
                    if (window.handleWikiLinkClick) {
                      window.handleWikiLinkClick(pageName);
                    }
                  }
                } else if (e.target.classList.contains('external-link')) {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = e.target.getAttribute('data-url');
                  if (url) {
                    console.log('DailyNotes: External link clicked:', url);
                    // Нужно передать обработчик из App.jsx
                    if (window.handleExternalLinkClick) {
                      window.handleExternalLinkClick(url);
                    }
                  }
                } else if (e.target.classList.contains('task-checkbox') || e.target.closest('.task-checkbox')) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const checkboxElement = e.target.classList.contains('task-checkbox') ? e.target : e.target.closest('.task-checkbox');
                  const isCurrentlyChecked = checkboxElement.getAttribute('data-checked') === 'true';
                  const taskText = checkboxElement.getAttribute('data-text');
                  
                  // Переключаем состояние галочки
                  const newChecked = !isCurrentlyChecked;
                  const newSymbol = newChecked ? '☑' : '☐';
                  
                  // Обновляем отображение
                  checkboxElement.setAttribute('data-checked', newChecked.toString());
                  checkboxElement.className = `task-checkbox ${newChecked ? 'checked' : 'unchecked'}`;
                  
                  // Сохраняем горячую клавишу если она есть
                  const hotkey = checkboxElement.getAttribute('data-hotkey');
                  const hotkeySymbol = hotkey ? ` <span class="hotkey-symbol">${hotkey.toUpperCase()}</span>` : '';
                  checkboxElement.innerHTML = `${newSymbol} ${taskText}${hotkeySymbol}`;
                  
                  // Обновляем контент и сохраняем
                  const currentContent = previewContent || content;
                  const checkboxPattern = new RegExp(`^- \\[${isCurrentlyChecked ? '[xX]' : ' '}\\] (.+)$`, 'gm');
                  const replacement = `- [${newChecked ? 'x' : ' '}] $1`;
                  const newContent = currentContent.replace(checkboxPattern, (match, text) => {
                    if (text === taskText) {
                      return replacement.replace('$1', text);
                    }
                    return match;
                  });
                  
                  // Сохраняем изменения
                  onSave(newContent);
                  
                  // Обновляем заметку в Redux store
                  dispatch(updateNote({ date: currentDate, content: newContent }));
                } else if (e.target.classList.contains('pomodoro-play')) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const taskText = e.target.getAttribute('data-task-text');
                  setActivePomodoroTask(taskText);
                  
                  // Запускаем таймер
                  if (pomodoroTimer) {
                    pomodoroTimer.start(taskText);
                  }
                  
                  // Скрываем кнопку play
                  e.target.style.display = 'none';
                 
                } else if (e.target.classList.contains('pomodoro-pause')) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (pomodoroTimer && pomodoroTimer.isPaused) {
                    pomodoroTimer.resume();
                  } else if (pomodoroTimer) {
                    pomodoroTimer.pause();
                  }
                  
                } else if (e.target.classList.contains('pomodoro-stop')) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const taskText = e.target.getAttribute('data-task-text');
                  if (pomodoroTimer) {
                    pomodoroTimer.stop();
                  }
                  
                  // Показываем кнопку play
                  const playBtn = e.target.parentElement.querySelector('.pomodoro-play');
                  if (playBtn) {
                    playBtn.style.display = 'inline';
                  }
                  
                  // Добавляем помидорку в markdown только при остановке
                  const currentContent = previewContent || content;
                  const now = new Date();
                  const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                  const checkboxPattern = new RegExp(`^- \\[ \\] (${taskText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`, 'gm');
                  const newContent = currentContent.replace(checkboxPattern, (match) => {
                    return `${match} 🔴 ${timeString}`;
                  });
                  
                  onSave(newContent);
                  dispatch(updateNote({ date: currentDate, content: newContent }));
                }
              }}
              onMouseOver={(e) => {
                if (e.target.classList.contains('wiki-link')) {
                  const pageName = e.target.getAttribute('data-page');
                  if (pageName) {
                    // Уведомляем родительский компонент о наведении на ссылку
                    if (onLinkHover) {
                      onLinkHover(`[[${pageName}]]`);
                    }
                  }
                } else if (e.target.classList.contains('external-link')) {
                  const url = e.target.getAttribute('data-url');
                  if (url) {
                    if (onLinkHover) {
                      onLinkHover(url);
                    }
                  }
                }
              }}
              onMouseOut={(e) => {
                if (e.target.classList.contains('wiki-link') || e.target.classList.contains('external-link')) {
                  if (onLinkHover) {
                    onLinkHover('');
                  }
                }
              }}
            />
            )
          ) : (
            <HistoryPanel isVisible={activeTab === 'history'} />
          )}
        </ContentContainer>
      </MainContent>
      
      {/* Календарная панель */}
      <CalendarWrapper showCalendar={showCalendar}>
        {showCalendar && settings && (
          <CalendarPanel
            onDateSelect={onDateSelect}
            currentDate={currentDate} // Используем currentDate из DailyNotesPanel
            onTodayClick={setScrollToTodayFunction}
            onScrollToDate={setScrollToDateFunction}
            settings={settings}
            onNotePreview={onCalendarNotePreview}
            isEmbedded={true}
            containerHeight={height || 300} // Передаем высоту панели
          />
        )}
      </CalendarWrapper>
      
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
