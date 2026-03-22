import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await productsAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch products'); }
});

export const createProduct = createAsyncThunk('products/create', async (payload, { rejectWithValue }) => {
  try { const { data } = await productsAPI.create(payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create product'); }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try { const { data } = await productsAPI.update(id, payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update product'); }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try { await productsAPI.remove(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete product'); }
});

export const adjustStock = createAsyncThunk('products/adjustStock', async ({ id, ...payload }, { rejectWithValue }) => {
  try { const { data } = await productsAPI.adjustStock(id, payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to adjust stock'); }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: {
    clearError(state) { state.error = null; },
    upsertProduct(state, action) {
      const idx = state.items.findIndex(p => p._id === action.payload._id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.unshift(action.payload);
    },
    removeProduct(state, action) {
      state.items = state.items.filter(p => p._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; })
      .addCase(fetchProducts.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createProduct.fulfilled, (s, a) => { s.items.unshift(a.payload); s.total += 1; })
      .addCase(updateProduct.fulfilled, (s, a) => { const i = s.items.findIndex(p => p._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
      .addCase(deleteProduct.fulfilled, (s, a) => { s.items = s.items.filter(p => p._id !== a.payload); s.total -= 1; })
      .addCase(adjustStock.fulfilled,   (s, a) => { const i = s.items.findIndex(p => p._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; });
  },
});

export const { clearError, upsertProduct, removeProduct } = productsSlice.actions;
export default productsSlice.reducer;
