import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// ── Thunks ──────────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.getMe();
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

// ── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    null,
    token:   localStorage.getItem('token') || null,
    loading: false,
    error:   null,
    initialized: false,
  },
  reducers: {
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    clearError(state) { state.error = null; },
    setUser(state, action) { state.user = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(loginUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      // fetchMe
      .addCase(fetchMe.pending,     (s) => { s.loading = true; })
      .addCase(fetchMe.fulfilled,   (s, a) => { s.loading = false; s.user = a.payload; s.initialized = true; })
      .addCase(fetchMe.rejected,    (s) => { s.loading = false; s.initialized = true; s.token = null; localStorage.removeItem('token'); });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
