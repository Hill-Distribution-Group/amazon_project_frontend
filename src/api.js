import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

let loadingSetter = null;

export const setLoadingSetter = (setter) => {
  loadingSetter = setter;
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    if (loadingSetter) loadingSetter(true);
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (loadingSetter) loadingSetter(false);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    if (loadingSetter) loadingSetter(false);
    return response;
  },
  async (error) => {
    if (loadingSetter) loadingSetter(false);
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await api.post('/refresh', { refresh_token: refreshToken });
        const { token } = response.data;
        localStorage.setItem('access_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

api.CancelToken = axios.CancelToken;
api.isCancel = axios.isCancel;

export default api;