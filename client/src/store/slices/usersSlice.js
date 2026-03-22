import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api';
import { authAPI } from '../../services/api';

export const fetchUsers = createAsyncThunk('users/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await usersAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createUser = createAsyncThunk('users/create', async (payload, { rejectWithValue }) => {
  try { const { data } = await authAPI.register(payload); return data.user; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateUser = createAsyncThunk('users/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try { const { data } = await usersAPI.update(id, payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try { await usersAPI.remove(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const usersSlice = createSlice({
  name: 'users',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchUsers.pending,   (s) => { s.loading = true; s.error = null; })
     .addCase(fetchUsers.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; })
     .addCase(fetchUsers.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createUser.fulfilled, (s, a) => { s.items.push(a.payload); s.total += 1; })
     .addCase(updateUser.fulfilled, (s, a) => { const i = s.items.findIndex(u => u._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
     .addCase(deleteUser.fulfilled, (s, a) => { s.items = s.items.filter(u => u._id !== a.payload); s.total -= 1; });
  },
});
export default usersSlice.reducer;
