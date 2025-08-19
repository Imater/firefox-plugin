import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadNoteByDate, countUncheckedTasks } from '../services/dailyNotesService';

// Асинхронная загрузка заметки по дате
export const fetchNoteByDate = createAsyncThunk(
  'calendarNotes/fetchNoteByDate',
  async ({ date, settings }, { rejectWithValue }) => {
    try {
      const content = await loadNoteByDate(date, settings);
      // content может быть null (ошибка) или строкой (пустой или с контентом)
      const finalContent = content !== null ? content : '';
      const taskCounts = countUncheckedTasks(finalContent);
      return {
        dateKey: date.toDateString(),
        content: finalContent,
        taskCounts,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      // Игнорируем ошибки и возвращаем пустую заметку
      console.log(`Ignoring error for date ${date.toDateString()}:`, error);
      return {
        dateKey: date.toDateString(),
        content: '',
        taskCounts: { unchecked: 0, checked: 0 },
        lastUpdated: new Date().toISOString()
      };
    }
  }
);

// Асинхронная загрузка множественных заметок
export const fetchMultipleNotes = createAsyncThunk(
  'calendarNotes/fetchMultipleNotes',
  async ({ dates, settings }, { dispatch, rejectWithValue }) => {
    try {
      const promises = dates.map(date => 
        dispatch(fetchNoteByDate({ date, settings })).catch(error => {
          // Игнорируем ошибки отдельных запросов (например, 404)
          console.log(`Ignoring error for date ${date.toDateString()}:`, error);
          return null;
        })
      );
      
      await Promise.allSettled(promises);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Обновление заметки (при сохранении)
export const updateNote = createAsyncThunk(
  'calendarNotes/updateNote',
  async ({ date, content }, { rejectWithValue }) => {
    try {
      const taskCounts = countUncheckedTasks(content);
      return {
        dateKey: date.toDateString(),
        content,
        taskCounts,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notes: {}, // { dateKey: { content, taskCounts, lastUpdated } }
  loading: false,
  error: null,
  lastFetch: null
};

const calendarNotesSlice = createSlice({
  name: 'calendarNotes',
  initialState,
  reducers: {
    clearNotes: (state) => {
      state.notes = {};
      state.lastFetch = null;
    },
    removeNote: (state, action) => {
      const { dateKey } = action.payload;
      delete state.notes[dateKey];
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchNoteByDate
      .addCase(fetchNoteByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNoteByDate.fulfilled, (state, action) => {
        const { dateKey, content, taskCounts, lastUpdated } = action.payload;
        state.notes[dateKey] = {
          content,
          taskCounts,
          lastUpdated
        };
        state.loading = false;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchNoteByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch note';
      })
      
      // fetchMultipleNotes
      .addCase(fetchMultipleNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMultipleNotes.fulfilled, (state) => {
        state.loading = false;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchMultipleNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch multiple notes';
      })
      
      // updateNote
      .addCase(updateNote.fulfilled, (state, action) => {
        const { dateKey, content, taskCounts, lastUpdated } = action.payload;
        state.notes[dateKey] = {
          content,
          taskCounts,
          lastUpdated
        };
      });
  }
});

export const { clearNotes, removeNote } = calendarNotesSlice.actions;

// Селекторы
export const selectNoteByDate = (state, date) => {
  const dateKey = date.toDateString();
  return state.calendarNotes.notes[dateKey] || null;
};

export const selectTaskCountsByDate = (state, date) => {
  const note = selectNoteByDate(state, date);
  return note ? note.taskCounts : { unchecked: 0, checked: 0 };
};

export const selectNoteContentByDate = (state, date) => {
  const note = selectNoteByDate(state, date);
  return note ? note.content : '';
};

export const selectIsLoading = (state) => state.calendarNotes.loading;
export const selectError = (state) => state.calendarNotes.error;
export const selectLastFetch = (state) => state.calendarNotes.lastFetch;

export default calendarNotesSlice.reducer;

