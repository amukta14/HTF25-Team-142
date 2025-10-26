import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Capsules APIs
export const capsulesAPI = {
  create: (formData) => api.post('/capsules', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (status) => api.get('/capsules', { params: { status } }),
  getById: (id) => api.get(`/capsules/${id}`),
  delete: (id) => api.delete(`/capsules/${id}`),
  getStats: () => api.get('/capsules/stats/dashboard'),
  getEmotionTimeline: () => api.get('/capsules/analytics/emotion-timeline')
};

// Shared Capsules APIs
export const sharedAPI = {
  share: (data) => api.post('/shared', data),
  getSent: () => api.get('/shared/sent'),
  getReceived: () => api.get('/shared/received'),
  getByAccessCode: (accessCode) => api.get(`/shared/${accessCode}`),
  verifyPassword: (accessCode, password) => api.post(`/shared/${accessCode}/verify-password`, { password }),
  completeMilestone: (accessCode) => api.post(`/shared/${accessCode}/complete-milestone`)
};

export default api;