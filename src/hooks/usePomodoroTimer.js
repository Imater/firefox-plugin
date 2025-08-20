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
          setIsRunning(true);
          setIsPaused(false);
          setTimeLeft(remaining);
          setStartTime(state.startTime);
          setElapsedTime(elapsed);
          setActiveTask(state.activeTask);
        } else if (state.isRunning && state.isPaused) {
          setIsRunning(true);
          setIsPaused(true);
          setTimeLeft(state.timeLeft);
          setStartTime(state.startTime);
          setElapsedTime(state.elapsedTime);
          setActiveTask(state.activeTask);
        } else if (remaining <= 0 && state.isRunning) {
          // Таймер закончился, сохраняем информацию о завершении
          localStorage.setItem('pomodoroCompleted', JSON.stringify({
            task: state.activeTask,
            completedAt: now,
            startTime: state.startTime
          }));
          // Очищаем состояние таймера
          localStorage.removeItem('pomodoroTimerState');
        }
      } catch (error) {
        console.error('Error loading pomodoro state:', error);
        localStorage.removeItem('pomodoroTimerState');
      }
    }
  }, []);

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
  }, [isRunning, isPaused]);

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
