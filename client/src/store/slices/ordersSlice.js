// ── Orders Slice ──────────────────────────────────────────────────────────────
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productionAPI } from '../../services/api';

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await productionAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createOrder = createAsyncThunk('orders/create', async (payload, { rejectWithValue }) => {
  try { const { data } = await productionAPI.create(payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateOrder = createAsyncThunk('orders/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try { const { data } = await productionAPI.update(id, payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateProgress = createAsyncThunk('orders/progress', async ({ id, ...payload }, { rejectWithValue }) => {
  try { const { data } = await productionAPI.updateProgress(id, payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteOrder = createAsyncThunk('orders/delete', async (id, { rejectWithValue }) => {
  try { await productionAPI.remove(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: {
    clearError(state) { state.error = null; },
    upsertOrder(state, action) {
      const idx = state.items.findIndex(o => o._id === action.payload._id);
      if (idx >= 0) state.items[idx] = action.payload; else state.items.unshift(action.payload);
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchOrders.pending,    (s) => { s.loading = true; s.error = null; })
     .addCase(fetchOrders.fulfilled,  (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; })
     .addCase(fetchOrders.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createOrder.fulfilled,  (s, a) => { s.items.unshift(a.payload); s.total += 1; })
     .addCase(updateOrder.fulfilled,  (s, a) => { const i = s.items.findIndex(o => o._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
     .addCase(updateProgress.fulfilled,(s, a) => { const i = s.items.findIndex(o => o._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
     .addCase(deleteOrder.fulfilled,  (s, a) => { s.items = s.items.filter(o => o._id !== a.payload); s.total -= 1; });
  },
});
export const { upsertOrder } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;
export default ordersSlice.reducer;
