import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, IconButton } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { styled } from '@mui/material/styles';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

const CalendarContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  right: 0,
  top: 0,
  width: '60px',
  height: '100vh',
  backgroundColor: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
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
  width: '60px',
  height: '30px',
  borderRadius: 0,
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));



const DaySquare = styled(Box)(({ theme, isToday, isWeekend, isSelected }) => ({
  width: '60px',
  height: '60px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
  borderBottom: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
  backgroundColor: isToday 
    ? theme.palette.warning.main 
    : isSelected 
    ? theme.palette.primary.light 
    : isWeekend 
    ? theme.palette.action.disabledBackground
    : theme.palette.success.light,
  color: isToday 
    ? theme.palette.warning.contrastText 
    : isWeekend 
    ? theme.palette.text.disabled
    : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .day-number': {
    fontSize: '16px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  '& .day-name': {
    fontSize: '9px',
    textTransform: 'uppercase',
    lineHeight: 1,
    marginTop: '3px',
  },
}));

const MonthHeader = styled(Box)(({ theme }) => ({
  width: '60px',
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

const CalendarPanel = ({ onDateSelect, currentDate, onTodayClick }) => {
  const [items, setItems] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const listRef = useRef(null);
  const infiniteLoaderRef = useRef(null);

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
    if (!item) return 60; // Высота по умолчанию
    return item.type === 'month' ? 50 : 60;
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

  // Функция для скролла к сегодняшнему дню
  const scrollToToday = useCallback(() => {
    if (listRef.current) {
      const todayDate = new Date();
      const todayIndex = items.findIndex(item => 
        item.type === 'day' && item.date.toDateString() === todayDate.toDateString()
      );
      if (todayIndex !== -1) {
        listRef.current.scrollToItem(todayIndex, 'center');
        setCurrentVisibleIndex(todayIndex);
      }
    }
  }, [items]);

  // Экспортируем функцию скролла к сегодняшнему дню
  useEffect(() => {
    if (onTodayClick) {
      onTodayClick(scrollToToday);
    }
  }, [onTodayClick, scrollToToday]);

  // Компонент для рендера элемента списка
  const ItemRenderer = useCallback(({ index, style }) => {
    const item = items[index];
    if (!item) return <div style={style}>Loading...</div>;

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
      return (
        <div style={style}>
          <DaySquare
            isToday={isToday(item.date)}
            isWeekend={isWeekend(item.date)}
            isSelected={isSelected(item.date)}
            onClick={() => handleDayClick(item.date)}
            title={formatDate(item.date)}
          >
            <div className="day-number">
              {item.date.getDate()}
            </div>
            <div className="day-name">
              {getDayName(item.date)}
            </div>
          </DaySquare>
        </div>
      );
    }
  }, [items, isToday, isWeekend, isSelected, handleDayClick, formatDate, getDayName, getMonthName]);

  // Инициализация
  useEffect(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 60); // Начинаем с 60 дней назад

    const initialItems = generateItems(startDate, 120); // Генерируем 120 дней (4 месяца)
    setItems(initialItems);
    
    // Скроллим к сегодняшнему дню через небольшую задержку
    setTimeout(() => {
      if (listRef.current) {
        const todayDate = new Date();
        const todayIndex = initialItems.findIndex(item => 
          item.type === 'day' && item.date.toDateString() === todayDate.toDateString()
        );
        if (todayIndex !== -1) {
          listRef.current.scrollToItem(todayIndex, 'center');
          setCurrentVisibleIndex(todayIndex);
        }
      }
    }, 100);
  }, [generateItems]);

    return (
    <CalendarContainer
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ScrollButton onClick={handleScrollUp} size="small">
        <KeyboardArrowUpIcon />
      </ScrollButton>
      
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
  );
};

export default CalendarPanel;
