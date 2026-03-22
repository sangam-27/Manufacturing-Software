import { configureStore } from '@reduxjs/toolkit';
import authReducer     from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer   from './slices/ordersSlice';
import tasksReducer    from './slices/tasksSlice';
import billingReducer  from './slices/billingSlice';
import usersReducer    from './slices/usersSlice';

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    products: productsReducer,
    orders:   ordersReducer,
    tasks:    tasksReducer,
    billing:  billingReducer,
    users:    usersReducer,
  },
});

export default store;
