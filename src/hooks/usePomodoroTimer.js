import { useState, useEffect, useRef } from 'react';

export const usePomodoroTimer = (durationMinutes = 25) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60); // в секундах
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTask, setActiveTask] = useState(null);
  const intervalRef = useRef(null);

  // Загружаем состояние таймера при инициализации
  useEffect(() => {
    const savedState = localStorage.getItem('pomodoroTimerState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const now = Date.now();
        const elapsed = Math.floor((now - state.startTime) / 1000);
        const remaining = Math.max(0, state.durationMinutes * 60 - elapsed);
        
        if (remaining > 0 && state.isRunning && !state.isPaused) {
          // Таймер еще идет, восстанавливаем состояние с учетом прошедшего времени
          setIsRunning(true);
          setIsPaused(false);
          setTimeLeft(remaining);
          setStartTime(new Date(state.startTime));
          setElapsedTime(elapsed);
          setActiveTask(state.activeTask);
          
          // Немедленно сохраняем обновленное состояние
          const updatedState = {
            isRunning: true,
            isPaused: false,
            timeLeft: remaining,
            startTime: state.startTime,
            elapsedTime: elapsed,
            activeTask: state.activeTask,
            durationMinutes: state.durationMinutes
          };
          localStorage.setItem('pomodoroTimerState', JSON.stringify(updatedState));
        } else if (state.isRunning && state.isPaused) {
          // Таймер на паузе, восстанавливаем состояние
          setIsRunning(true);
          setIsPaused(true);
          setTimeLeft(state.timeLeft);
          setStartTime(new Date(state.startTime));
          setElapsedTime(state.elapsedTime);
          setActiveTask(state.activeTask);
        } else if (remaining <= 0 && state.isRunning) {
          // Таймер закончился пока приложение было закрыто
          // Сохраняем информацию о завершении для добавления помидорки
          localStorage.setItem('pomodoroCompleted', JSON.stringify({
            task: state.activeTask,
            completedAt: now,
            startTime: state.startTime,
            durationMinutes: state.durationMinutes
          }));
          // Очищаем состояние таймера
          localStorage.removeItem('pomodoroTimerState');
          
          // Сбрасываем состояние таймера
          setIsRunning(false);
          setIsPaused(false);
          setTimeLeft(durationMinutes * 60);
          setStartTime(null);
          setElapsedTime(0);
          setActiveTask(null);
        }
      } catch (error) {
        console.error('Error loading pomodoro state:', error);
        localStorage.removeItem('pomodoroTimerState');
      }
    }
  }, [durationMinutes]);

  // Обновляем время при изменении длительности
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes, isRunning]);

  // Обработка таймера
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Таймер закончился
            setIsRunning(false);
            setIsPaused(false);
            
            // Сохраняем информацию о завершении для добавления помидорки
            const now = Date.now();
            localStorage.setItem('pomodoroCompleted', JSON.stringify({
              task: activeTask,
              completedAt: now,
              startTime: startTime ? startTime.getTime() : null,
              durationMinutes: durationMinutes
            }));
            
            localStorage.removeItem('pomodoroTimerState');
            return 0;
          }
          return prev - 1;
        });
        
        setElapsedTime(prev => prev + 1);
        saveState();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, activeTask, startTime, durationMinutes]);

  const saveState = () => {
    const state = {
      isRunning,
      isPaused,
      timeLeft,
      startTime: startTime ? startTime.getTime() : null,
      elapsedTime,
      activeTask,
      durationMinutes
    };
    localStorage.setItem('pomodoroTimerState', JSON.stringify(state));
  };

  const start = (task = null) => {
    setIsRunning(true);
    setIsPaused(false);
    const now = new Date();
    setStartTime(now);
    setElapsedTime(0);
    setActiveTask(task);
    saveState();
  };

  const pause = () => {
    setIsPaused(true);
    saveState();
  };

  const resume = () => {
    setIsPaused(false);
    saveState();
  };

  const stop = () => {
    // Если таймер был запущен и прошло больше минуты, сохраняем информацию о завершении
    if (isRunning && elapsedTime > 60) {
      const now = Date.now();
      localStorage.setItem('pomodoroCompleted', JSON.stringify({
        task: activeTask,
        completedAt: now,
        startTime: startTime ? startTime.getTime() : null,
        durationMinutes: durationMinutes
      }));
    }
    
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(durationMinutes * 60);
    setStartTime(null);
    setElapsedTime(0);
    setActiveTask(null);
    localStorage.removeItem('pomodoroTimerState');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalSeconds = durationMinutes * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  return {
    isRunning,
    isPaused,
    timeLeft,
    startTime,
    elapsedTime,
    activeTask,
    start,
    pause,
    resume,
    stop,
    formatTime,
    getProgress,
    durationMinutes
  };
};
