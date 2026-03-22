import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { billingAPI } from '../../services/api';

export const fetchInvoices = createAsyncThunk('billing/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await billingAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createInvoice = createAsyncThunk('billing/create', async (payload, { rejectWithValue }) => {
  try { const { data } = await billingAPI.create(payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateInvoiceStatus = createAsyncThunk('billing/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try { const { data } = await billingAPI.updateStatus(id, { status }); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteInvoice = createAsyncThunk('billing/delete', async (id, { rejectWithValue }) => {
  try { await billingAPI.remove(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const billingSlice = createSlice({
  name: 'billing',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchInvoices.pending,        (s) => { s.loading = true; s.error = null; })
     .addCase(fetchInvoices.fulfilled,      (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; })
     .addCase(fetchInvoices.rejected,       (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createInvoice.fulfilled,      (s, a) => { s.items.unshift(a.payload); s.total += 1; })
     .addCase(updateInvoiceStatus.fulfilled,(s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
     .addCase(deleteInvoice.fulfilled,      (s, a) => { s.items = s.items.filter(x => x._id !== a.payload); s.total -= 1; });
  },
});
export default billingSlice.reducer;
