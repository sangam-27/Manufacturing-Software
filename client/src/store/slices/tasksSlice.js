import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksAPI } from '../../services/api';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await tasksAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createTask = createAsyncThunk('tasks/create', async (payload, { rejectWithValue }) => {
  try { const { data } = await tasksAPI.create(payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateTask = createAsyncThunk('tasks/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try { const { data } = await tasksAPI.update(id, payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try { await tasksAPI.remove(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchTasks.pending,   (s) => { s.loading = true; s.error = null; })
     .addCase(fetchTasks.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; })
     .addCase(fetchTasks.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createTask.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(updateTask.fulfilled, (s, a) => { const i = s.items.findIndex(t => t._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
     .addCase(deleteTask.fulfilled, (s, a) => { s.items = s.items.filter(t => t._id !== a.payload); });
  },
});
export default tasksSlice.reducer;
