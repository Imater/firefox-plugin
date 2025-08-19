import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { styled } from '@mui/material/styles';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { store } from '../store';
import { 
  fetchMultipleNotes, 
  selectTaskCountsByDate, 
  selectNoteContentByDate,
  selectIsLoading,
  updateNote
} from '../store/calendarNotesSlice';

const CalendarContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  right: 0,
  top: 0,
  width: '100px',
  height: '100vh',
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  // Улучшаем touch-взаимодействие
  touchAction: 'pan-y',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
}));

const ScrollButton = styled(IconButton)(({ theme }) => ({
  width: '100px',
  height: '30px',
  borderRadius: 0,
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));



const DaySquare = styled(Box)(({ theme, isToday, isWeekend, isSelected, isFuture, isPast }) => ({
  width: '100px',
  height: '100px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 'bold',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#666666' : '#999999'}`,
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#cccccc' : '#e0e0e0'}`,
  borderLeft: isSelected ? 'none' : `1px solid ${theme.palette.mode === 'dark' ? '#666666' : '#999999'}`,
  flexShrink: 0,
  backgroundColor: isToday 
    ? theme.palette.background.paper
    : isSelected 
    ? theme.palette.background.default
    : theme.palette.mode === 'dark' ? '#000000' : '#f5f5f5',
  color: isToday 
    ? theme.palette.warning.main
    : isFuture 
    ? theme.palette.mode === 'dark' ? '#ffffff' : '#666666'
    : isPast
    ? theme.palette.text.disabled
    : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .day-number': {
    fontSize: '19px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  '& .day-name': {
    fontSize: '11px',
    textTransform: 'uppercase',
    lineHeight: 1,
    marginTop: '2px',
    color: isWeekend ? (isPast ? theme.palette.error.dark : theme.palette.error.main) : 'inherit',
  },
  '& .days-difference': {
    fontSize: '11px',
    lineHeight: 1,
    marginTop: '1px',
    opacity: 0.9,
    fontWeight: 'bold',
  },
  '& .tasks-indicator': {
    position: 'absolute',
    bottom: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px',
    fontWeight: 'normal',
    textAlign: 'center',
    lineHeight: 1,
    color: isToday ? theme.palette.warning.main : theme.palette.text.secondary,
  },
  '& .tasks-text': {
    fontSize: '11px',
    lineHeight: 1,
  },
  '& .checked-count': {
    textDecoration: 'line-through',
    opacity: 0.7,
  },
  '& .unchecked-tasks': {
    color: 'inherit',
    fontWeight: 'normal',
  },
  '& .checked-tasks': {
    color: 'inherit',
    fontWeight: 'bold',
    opacity: 0.8,
  },
  '& .separator': {
    margin: '0 1px',
  },
}));

const MonthHeader = styled(Box)(({ theme }) => ({
  width: '100px',
  height: '50px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '10px',
  fontWeight: 'bold',
  textAlign: 'center',
  flexShrink: 0,
  '& .month-name': {
    fontSize: '11px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  '& .year': {
    fontSize: '9px',
    lineHeight: 1,
    marginTop: '2px',
    opacity: 0.9,
  },
}));

const CalendarPanel = ({ onDateSelect, currentDate, onTodayClick, onScrollToDate, settings, onNotePreview }) => {
  const [items, setItems] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const listRef = useRef(null);
  const infiniteLoaderRef = useRef(null);
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);

  // Проверяем, является ли день выбранным
  const isSelected = (date) => {
    if (!currentDate) return false;
    return date.toDateString() === currentDate.toDateString();
  };

  // Генерируем дни для отображения с заголовками месяцев
  const generateItems = useCallback((startDate, count) => {
    const newItems = [];
    let currentMonth = null;
    
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Проверяем, начался ли новый месяц
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (currentMonth !== monthKey) {
        currentMonth = monthKey;
        newItems.push({
          type: 'month',
          date: new Date(date),
          key: `month-${monthKey}`,
          id: `month-${date.getTime()}`
        });
      }
      
      newItems.push({
        type: 'day',
        date: new Date(date),
        key: `day-${date.getTime()}`,
        id: `day-${date.getTime()}`
      });
    }
    return newItems;
  }, []);

  // Получаем день недели на русском
  const getDayName = (date) => {
    const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return days[date.getDay()];
  };

  // Получаем название месяца на русском
  const getMonthName = (date) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[date.getMonth()];
  };

  // Проверяем, является ли день выходным
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // воскресенье или суббота
  };

  // Проверяем, является ли день сегодняшним
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Проверяем, является ли день будущим
  const isFuture = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  // Проверяем, является ли день прошлым
  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Вычисляем разность дней от сегодня
  const getDaysDifference = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const diffTime = checkDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Форматируем дату для tooltip
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dayName = getDayName(date);
    return `${day}.${month}.${year} ${dayName}`;
  };

  // Обработчик клика по дню
  const handleDayClick = (date) => {
    onDateSelect(date);
  };

  // Обработчик drag & drop для календаря
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Если перетаскиваем в тот же день, ничего не делаем
    if (source.droppableId === destination.droppableId) return;

    // Получаем текст задачи из перетаскиваемого элемента
    const taskText = result.draggableId;
    
    // Получаем даты
    const sourceDate = new Date(source.droppableId);
    const targetDate = new Date(destination.droppableId);
    
    console.log(`Перемещаем задачу "${taskText}" с ${sourceDate.toDateString()} на ${targetDate.toDateString()}`);
    
    // Получаем текущее содержимое заметок из Redux store
    const state = store.getState();
    const sourceNoteContent = selectNoteContentByDate(state, sourceDate.toDateString()) || '';
    const targetNoteContent = selectNoteContentByDate(state, targetDate.toDateString()) || '';
    
    // Удаляем задачу из исходного дня
    const sourceNewContent = sourceNoteContent.replace(
      new RegExp(`^- \\[[ xX]\\] ${taskText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gm'),
      ''
    ).replace(/\n\s*\n/g, '\n').trim();
    
    // Добавляем задачу в целевой день
    const targetNewContent = targetNoteContent + (targetNoteContent ? '\n' : '') + `- [ ] ${taskText}`;
    
    // Сохраняем изменения через Redux
    dispatch(updateNote({ date: sourceDate, content: sourceNewContent }));
    dispatch(updateNote({ date: targetDate, content: targetNewContent }));
    
    console.log(`Задача "${taskText}" успешно перемещена`);
  };

  // Функция для буферизации заметок больше не нужна - все заметки загружаются при инициализации

  // Загружаем больше элементов
  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (isNextPageLoading) return Promise.resolve();
    
    setIsNextPageLoading(true);
    
    try {
      // Загружаем в конец списка
      const lastItem = items[items.length - 1];
      if (lastItem) {
        const startDate = new Date(lastItem.date);
        startDate.setDate(startDate.getDate() + 1);
        const newItems = generateItems(startDate, 30); // Загружаем 30 дней за раз
        setItems(prev => [...prev, ...newItems]);
      }
    } finally {
      setIsNextPageLoading(false);
    }
    
    return Promise.resolve();
  }, [items, isNextPageLoading, generateItems]);

  // Проверяем, загружен ли элемент
  const isItemLoaded = useCallback((index) => {
    return !!items[index];
  }, [items]);

  // Получаем высоту элемента
  const getItemSize = useCallback((index) => {
    const item = items[index];
    if (!item) return 100; // Высота по умолчанию
    return item.type === 'month' ? 50 : 100;
  }, [items]);

  // Текущий видимый индекс
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
  
  // Состояние для touch-событий
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Обработчик кнопок вверх/вниз
  const handleScrollUp = () => {
    if (listRef.current) {
      const newIndex = Math.max(0, currentVisibleIndex - 1);
      listRef.current.scrollToItem(newIndex, 'center');
      setCurrentVisibleIndex(newIndex);
    }
  };

  const handleScrollDown = () => {
    if (listRef.current) {
      const newIndex = Math.min(items.length - 1, currentVisibleIndex + 1);
      listRef.current.scrollToItem(newIndex, 'center');
      setCurrentVisibleIndex(newIndex);
    }
  };

  // Обработчик изменения видимых элементов
  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }) => {
    setCurrentVisibleIndex(Math.floor((visibleStartIndex + visibleStopIndex) / 2));
    
    // Теперь все заметки загружаются при инициализации, поэтому дополнительная буферизация не нужна
    console.log('Calendar: Visible items changed:', {
      visibleStartIndex,
      visibleStopIndex
    });
  }, []);

  // Touch-обработчики для планшетов
  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;
    
    if (isUpSwipe && listRef.current) {
      // Свайп вверх - скролл вниз
      const newIndex = Math.min(items.length - 1, currentVisibleIndex + 3);
      listRef.current.scrollToItem(newIndex, 'center');
      setCurrentVisibleIndex(newIndex);
    }
    
    if (isDownSwipe && listRef.current) {
      // Свайп вниз - скролл вверх
      const newIndex = Math.max(0, currentVisibleIndex - 3);
      listRef.current.scrollToItem(newIndex, 'center');
      setCurrentVisibleIndex(newIndex);
    }
  }, [touchStart, touchEnd, currentVisibleIndex, items.length]);

  // Функция для скролла к любой дате
  const scrollToDate = useCallback((targetDate) => {
    if (!targetDate || !listRef.current || !items || items.length === 0) {
      console.log('Calendar scrollToDate: Invalid parameters', { 
        targetDate: !!targetDate, 
        listRef: !!listRef.current, 
        itemsLength: items?.length 
      });
      return;
    }

    const targetIndex = items.findIndex(item => 
      item && item.type === 'day' && item.date && item.date.toDateString() === targetDate.toDateString()
    );
    
    if (targetIndex !== -1) {
      listRef.current.scrollToItem(targetIndex, 'center');
      setCurrentVisibleIndex(targetIndex);
      console.log('Calendar scrolled to:', targetDate.toDateString(), 'index:', targetIndex);
    } else {
      console.log('Date not found in calendar items:', targetDate.toDateString(), 'available items:', items.length);
    }
  }, [items]);

  // Функция для скролла к сегодняшнему дню
  const scrollToToday = useCallback(() => {
    const todayDate = new Date();
    scrollToDate(todayDate);
  }, [scrollToDate]);

  // Экспортируем функции скролла
  useEffect(() => {
    if (onTodayClick) {
      onTodayClick(scrollToToday);
    }
  }, [onTodayClick, scrollToToday]);

  useEffect(() => {
    if (onScrollToDate) {
      onScrollToDate(scrollToDate);
    }
  }, [onScrollToDate, scrollToDate]);

  // Компонент для рендера элемента списка
  const ItemRenderer = useCallback(({ index, style }) => {
    const item = items[index];
    if (!item || !item.date) return <div style={style}>Loading...</div>;

    if (item.type === 'month') {
      return (
        <div style={style}>
          <MonthHeader>
            <div className="month-name">
              {getMonthName(item.date)}
            </div>
            <div className="year">
              {item.date.getFullYear()}
            </div>
          </MonthHeader>
        </div>
      );
    } else {
      // Получаем данные из Redux store
      const taskCounts = useAppSelector(state => selectTaskCountsByDate(state, item.date));
      const noteContent = useAppSelector(state => selectNoteContentByDate(state, item.date));
      const { unchecked, checked } = taskCounts;
      const hasTasks = unchecked > 0 || checked > 0;
      
      // Отладочная информация для сегодняшней даты
      const today = new Date();
      if (item.date.toDateString() === today.toDateString()) {
        console.log('Today calendar item (Redux):', {
          date: item.date.toDateString(),
          noteContent: noteContent.substring(0, 100) + '...',
          taskCounts: { unchecked, checked },
          hasTasks
        });
      }
      
      return (
        <div style={style}>
          <Droppable droppableId={item.date.toDateString()}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: snapshot.isDraggingOver ? 'rgba(0, 0, 255, 0.1)' : 'transparent'
                }}
              >
                <Tooltip
                  title={noteContent ? `${formatDate(item.date)}\n\nПревью заметки:\n${noteContent.substring(0, 200)}${noteContent.length > 200 ? '...' : ''}` : `${formatDate(item.date)}\n\nНет заметки`}
                  placement="left"
                  arrow
                >
                  <DaySquare
                    isToday={isToday(item.date)}
                    isWeekend={isWeekend(item.date)}
                    isSelected={isSelected(item.date)}
                    isFuture={isFuture(item.date)}
                    isPast={isPast(item.date)}
                    onClick={() => handleDayClick(item.date)}
                  >
              <div className="day-number">
                {item.date.getDate()}
              </div>
              <div className="day-name">
                {getDayName(item.date)}
              </div>
              <div className="days-difference">
                {(() => {
                  const diff = getDaysDifference(item.date);
                  if (diff === 0) return '';
                  return diff > 0 ? `+${diff}дн` : `${diff}дн`;
                })()}
              </div>
              {hasTasks && (
                <div className="tasks-indicator">
                  <div className="tasks-text">
                    {unchecked > 0 && (
                      <span className="unchecked-tasks">
                        ☐ {unchecked}
                      </span>
                    )}
                    {unchecked > 0 && checked > 0 && (
                      <span className="separator"> </span>
                    )}
                    {checked > 0 && (
                      <span className="checked-tasks">
                        ☑ {checked}
                      </span>
                    )}
                  </div>
                </div>
              )}

            </DaySquare>
          </Tooltip>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      );
    }
  }, [items, isToday, isWeekend, isSelected, handleDayClick, formatDate, getDayName, getMonthName, onNotePreview]);

  // Инициализация
  useEffect(() => {
    const initializeCalendar = async () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 60); // Начинаем с 60 дней назад

      const initialItems = generateItems(startDate, 120); // Генерируем 120 дней (4 месяца)
      setItems(initialItems);
      
      // Загружаем все заметки через Redux
      if (settings && settings.useApi) {
        const dayItems = initialItems.filter(item => item.type === 'day');
        const dates = dayItems.map(item => item.date);
        
        console.log('Calendar: Loading all notes for dates:', dates.map(d => d.toDateString()));
        
        try {
          await dispatch(fetchMultipleNotes({ dates, settings }));
          console.log('Calendar: All notes loaded via Redux');
        } catch (error) {
          console.error('Calendar: Error loading initial notes:', error);
        }
      }
      
      // Скроллим к сегодняшнему дню через небольшую задержку
      setTimeout(() => {
        if (listRef.current && initialItems && initialItems.length > 0) {
          const todayDate = new Date();
          const todayIndex = initialItems.findIndex(item => 
            item && item.type === 'day' && item.date && item.date.toDateString() === todayDate.toDateString()
          );
          if (todayIndex !== -1) {
            listRef.current.scrollToItem(todayIndex, 'center');
            setCurrentVisibleIndex(todayIndex);
          }
        }
      }, 100);
    };
    
    initializeCalendar();
  }, [generateItems, settings, dispatch]);

    return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <CalendarContainer
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      <ScrollButton onClick={handleScrollUp} size="small">
        <KeyboardArrowUpIcon />
      </ScrollButton>
      
      {isLoading && (
        <Box sx={{
          position: 'absolute',
          top: '30px',
          left: '0',
          right: '0',
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '2px',
          fontSize: '8px',
          zIndex: 1001
        }}>
          Загрузка заметок...
        </Box>
      )}
      
      <Box sx={{ 
        flex: 1,
        '& > div': {
          // Скрываем скроллбар для всех браузеров
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          '&::-webkit-scrollbar': {
            display: 'none' // Chrome/Safari/Opera
          }
        }
      }}>
        <InfiniteLoader
          ref={infiniteLoaderRef}
          isItemLoaded={isItemLoaded}
          itemCount={hasNextPage ? items.length + 1 : items.length}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(el) => {
                listRef.current = el;
                ref(el);
              }}
              height={window.innerHeight - 60} // Высота минус кнопки
              itemCount={items.length}
              itemSize={getItemSize}
              onItemsRendered={({ visibleStartIndex, visibleStopIndex, overscanStartIndex, overscanStopIndex }) => {
                handleItemsRendered({ visibleStartIndex, visibleStopIndex });
                onItemsRendered({ visibleStartIndex, visibleStopIndex, overscanStartIndex, overscanStopIndex });
              }}
              overscanCount={5}
              style={{
                // Дополнительное скрытие скроллбара
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
            >
              {ItemRenderer}
            </List>
          )}
        </InfiniteLoader>
      </Box>

      <ScrollButton onClick={handleScrollDown} size="small">
        <KeyboardArrowDownIcon />
      </ScrollButton>
    </CalendarContainer>
    </DragDropContext>
  );
};

export default CalendarPanel;
