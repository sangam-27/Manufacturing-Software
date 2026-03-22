import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  login:          (d) => api.post('/auth/login', d),
  register:       (d) => api.post('/auth/register', d),
  getMe:          ()  => api.get('/auth/me'),
  changePassword: (d) => api.put('/auth/change-password', d),
};
export const dashboardAPI = { get: () => api.get('/dashboard') };
export const usersAPI = {
  getAll: (p) => api.get('/users', { params: p }),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id,d) => api.put(`/users/${id}`, d),
  remove: (id) => api.delete(`/users/${id}`),
};
export const productsAPI = {
  getAll:      (p) => api.get('/products', { params: p }),
  getOne:      (id) => api.get(`/products/${id}`),
  create:      (d) => api.post('/products', d),
  update:      (id,d) => api.put(`/products/${id}`, d),
  remove:      (id) => api.delete(`/products/${id}`),
  adjustStock: (id,d) => api.post(`/products/${id}/stock`, d),
  getLogs:     (id) => api.get(`/products/${id}/logs`),
};
export const productionAPI = {
  getAll:         (p) => api.get('/production', { params: p }),
  getOne:         (id) => api.get(`/production/${id}`),
  create:         (d) => api.post('/production', d),
  update:         (id,d) => api.put(`/production/${id}`, d),
  updateProgress: (id,d) => api.patch(`/production/${id}/progress`, d),
  remove:         (id) => api.delete(`/production/${id}`),
};
export const tasksAPI = {
  getAll: (p) => api.get('/tasks', { params: p }),
  create: (d) => api.post('/tasks', d),
  update: (id,d) => api.patch(`/tasks/${id}`, d),
  remove: (id) => api.delete(`/tasks/${id}`),
};
export const billingAPI = {
  getAll:       (p) => api.get('/billing', { params: p }),
  getOne:       (id) => api.get(`/billing/${id}`),
  create:       (d) => api.post('/billing', d),
  updateStatus: (id,d) => api.patch(`/billing/${id}/status`, d),
  remove:       (id) => api.delete(`/billing/${id}`),
};
// ── New modules ───────────────────────────────────────────────────────────────
export const suppliersAPI = {
  getAll:  (p) => api.get('/suppliers', { params: p }),
  getOne:  (id) => api.get(`/suppliers/${id}`),
  create:  (d) => api.post('/suppliers', d),
  update:  (id,d) => api.put(`/suppliers/${id}`, d),
  remove:  (id) => api.delete(`/suppliers/${id}`),
};
export const purchaseOrdersAPI = {
  getAll:        (p) => api.get('/purchase-orders', { params: p }),
  getOne:        (id) => api.get(`/purchase-orders/${id}`),
  create:        (d) => api.post('/purchase-orders', d),
  updateStatus:  (id,d) => api.patch(`/purchase-orders/${id}/status`, d),
  receiveItems:  (id,d) => api.patch(`/purchase-orders/${id}/receive`, d),
  remove:        (id) => api.delete(`/purchase-orders/${id}`),
};
export const bomAPI = {
  getAll:             (p) => api.get('/bom', { params: p }),
  getOne:             (id) => api.get(`/bom/${id}`),
  getByProduct:       (pid) => api.get(`/bom/product/${pid}`),
  create:             (d) => api.post('/bom', d),
  update:             (id,d) => api.put(`/bom/${id}`, d),
  remove:             (id) => api.delete(`/bom/${id}`),
  checkAvailability:  (id,d) => api.post(`/bom/${id}/check-availability`, d),
};
export const machinesAPI = {
  getAll:          (p) => api.get('/machines', { params: p }),
  getOne:          (id) => api.get(`/machines/${id}`),
  getDueMaintenance: () => api.get('/machines/due-maintenance'),
  create:          (d) => api.post('/machines', d),
  update:          (id,d) => api.put(`/machines/${id}`, d),
  addMaintenance:  (id,d) => api.post(`/machines/${id}/maintenance`, d),
  remove:          (id) => api.delete(`/machines/${id}`),
};
export const shiftsAPI = {
  getAll:             (p) => api.get('/shifts', { params: p }),
  getOne:             (id) => api.get(`/shifts/${id}`),
  getAttendanceReport:(p) => api.get('/shifts/attendance-report', { params: p }),
  create:             (d) => api.post('/shifts', d),
  update:             (id,d) => api.put(`/shifts/${id}`, d),
  markAttendance:     (id,d) => api.post(`/shifts/${id}/attendance`, d),
  remove:             (id) => api.delete(`/shifts/${id}`),
};
export const notificationsAPI = {
  getAll:      (p) => api.get('/notifications', { params: p }),
  markRead:    (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  create:      (d) => api.post('/notifications', d),
};
export const reportsAPI = {
  getGST:       (p) => api.get('/reports/gst', { params: p }),
  getFinancial: (p) => api.get('/reports/financial', { params: p }),
};
