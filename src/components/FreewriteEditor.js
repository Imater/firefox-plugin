import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { 
  Check as CheckIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material';

const FreewriteContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fafafa',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  fontFamily: '"Courier New", monospace',
  transition: 'border 0.3s ease',
  '&.inactive': {
    border: '3px solid #ff4444',
  },
  '&.active': {
    border: '3px solid transparent',
  },
}));

const TypewriterArea = styled(Box)(({ theme }) => ({
  maxWidth: '1024px',
  width: '100%',
  height: 'calc(100vh - 120px)', // Учитываем высоту кнопки сохранения
  overflow: 'auto',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: '40px',
  paddingBottom: '80px', // Отступ от кнопки сохранения
}));

const TextContainer = styled(Box)(({ theme }) => ({
  fontSize: '24px',
  lineHeight: '1.8',
  color: theme.palette.text.primary,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  fontFamily: '"Courier New", monospace',
  transform: 'translateY(0)',
}));

const CurrentLine = styled(Box)(({ theme }) => ({
  fontSize: '24px',
  lineHeight: '1.8',
  color: theme.palette.primary.main,
  fontFamily: '"Courier New", monospace',
  minHeight: '43px', // Высота одной строки
  display: 'flex',
  alignItems: 'center',
  '&::after': {
    content: '"|"',
    animation: 'blink 1s infinite',
    color: theme.palette.primary.main,
  },
}));

const Controls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  right: '20px',
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
}));

const SaveButton = styled(Box)(({ theme, isInactive }) => ({
  position: 'fixed',
  bottom: '0',
  left: '0',
  right: '50%',
  height: '60px',
  backgroundColor: isInactive ? '#ff4444' : theme.palette.primary.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  zIndex: 10000,
  '&:hover': {
    backgroundColor: isInactive ? '#cc3333' : theme.palette.primary.dark,
  },
  '&:active': {
    backgroundColor: isInactive ? '#aa2222' : theme.palette.primary.dark,
  },
}));

const CloseButton = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: '0',
  left: '50%',
  right: '0',
  height: '60px',
  backgroundColor: theme.palette.grey[600],
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  zIndex: 10000,
  '&:hover': {
    backgroundColor: theme.palette.grey[700],
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

const Timer = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  color: theme.palette.text.secondary,
  fontFamily: '"Courier New", monospace',
  minWidth: '80px',
}));

const FreewriteEditor = ({ 
  initialContent = '', 
  onSave, 
  onClose,
  blockId,
  settings = {}
}) => {
  const [content, setContent] = useState(initialContent);
  const [currentLine, setCurrentLine] = useState('');
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 минут в секундах
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [hasContent, setHasContent] = useState(!!initialContent);
  
  const textAreaRef = useRef(null);
  const inactivityTimer = useRef(null);
  const autoSaveTimer = useRef(null);
  const mainTimer = useRef(null);
  const containerRef = useRef(null);

  // Настройки
  const noEditMode = settings.noEditMode || false;

  // Таймер 20 минут
  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      mainTimer.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Время закончилось, но продолжаем писать
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (mainTimer.current) {
        clearInterval(mainTimer.current);
      }
    };
  }, [isPaused, timeLeft]);

  // Автосохранение каждые 60 секунд
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (content || currentLine) {
        handleAutoSave();
      }
    }, 60000); // 60 секунд

    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, [content, currentLine]);

  // Индикатор неактивности (красная рамка через 20 секунд)
  useEffect(() => {
    inactivityTimer.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity > 20000) { // 20 секунд
        setIsActive(false);
        if (containerRef.current) {
          containerRef.current.classList.add('inactive');
          containerRef.current.classList.remove('active');
        }
      } else {
        setIsActive(true);
        if (containerRef.current) {
          containerRef.current.classList.add('active');
          containerRef.current.classList.remove('inactive');
        }
      }
    }, 1000);

    return () => {
      if (inactivityTimer.current) {
        clearInterval(inactivityTimer.current);
      }
    };
  }, [lastActivity]);

  // Фокус на текстовое поле при открытии
  useEffect(() => {
    if (textAreaRef.current && !noEditMode) {
      textAreaRef.current.focus();
    }
  }, [noEditMode]);


  const handleAutoSave = () => {
    const fullContent = content + (currentLine ? `\n${currentLine}` : '');
    if (fullContent.trim()) {
      onSave(fullContent);
    }
  };

  const handleKeyDown = (e) => {
    setLastActivity(Date.now());
    
    if (noEditMode) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      setContent(prev => prev + currentLine + '\n');
      setCurrentLine('');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setCurrentLine(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setCurrentLine(prev => prev + e.key);
    }
  };

  const handleSave = () => {
    handleAutoSave();
  };

  const handleClose = () => {
    onClose();
  };

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <FreewriteContainer 
      ref={containerRef}
      className={isActive ? 'active' : 'inactive'}
    >
      <Controls>
        {hasContent && (
          <IconButton 
            onClick={handlePlayPause}
            sx={{ color: 'text.secondary' }}
            title={isPaused ? 'Возобновить' : 'Пауза'}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
          </IconButton>
        )}
        <Timer>
          {formatTime(timeLeft)}
        </Timer>
      </Controls>

      <TypewriterArea>
        <TextContainer>
          {content}
        </TextContainer>
        <CurrentLine>
          {currentLine}
        </CurrentLine>
        
        {/* Скрытое поле ввода */}
        <input
          ref={textAreaRef}
          type="text"
          value=""
          onChange={() => {}}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none'
          }}
          disabled={noEditMode}
          autoFocus
        />
      </TypewriterArea>

      {/* Кнопки сохранения и закрытия */}
      <SaveButton 
        onClick={handleSave}
        isInactive={!isActive}
      >
        ✓ Сохранить
      </SaveButton>
      
      <CloseButton 
        onClick={handleClose}
      >
        ✕ Закрыть
      </CloseButton>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </FreewriteContainer>
  );
};

export default FreewriteEditor;
