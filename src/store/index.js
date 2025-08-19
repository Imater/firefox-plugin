import { configureStore } from '@reduxjs/toolkit';
import calendarNotesReducer from './calendarNotesSlice';

export const store = configureStore({
  reducer: {
    calendarNotes: calendarNotesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем проверку сериализации для Date объектов
        ignoredActions: ['calendarNotes/fetchNoteByDate/fulfilled', 'calendarNotes/updateNote/fulfilled'],
        ignoredPaths: ['calendarNotes.notes'],
      },
    }),
});

// Types for TypeScript (commented out for now)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

