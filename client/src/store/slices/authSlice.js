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
const storedToken = localStorage.getItem('token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    token:       storedToken || null,
    loading:     false,
    error:       null,
    // ✅ Fix: agar token hi nahi hai localStorage mein toh
    //    immediately initialized=true — koi wait nahi karna
    initialized: !storedToken,
  },
  reducers: {
    logout(state) {
      state.user        = null;
      state.token       = null;
      state.initialized = true;   // ✅ logout ke baad bhi initialized raho
      localStorage.removeItem('token');
    },
    clearError(state) { state.error = null; },
    setUser(state, action) { state.user = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      // ── login ──────────────────────────────────────────────────────────────
      .addCase(loginUser.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading     = false;
        s.user        = a.payload.user;
        s.token       = a.payload.token;
        s.initialized = true;   // ✅ THE FIX: login ke turant baad initialized=true
      })
      .addCase(loginUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      // ── fetchMe (token restore on page reload) ─────────────────────────────
      .addCase(fetchMe.pending,     (s) => { s.loading = true; })
      .addCase(fetchMe.fulfilled,   (s, a) => {
        s.loading     = false;
        s.user        = a.payload;
        s.initialized = true;
      })
      .addCase(fetchMe.rejected,    (s) => {
        s.loading     = false;
        s.initialized = true;
        s.token       = null;
        localStorage.removeItem('token');
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;