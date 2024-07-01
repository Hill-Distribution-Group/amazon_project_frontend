import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('Request Interceptor - Token:', token);  // Debugging
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log('Response Error:', error.response);  // Debugging
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await api.post('/refresh', { refresh_token: refreshToken });
        const { token } = response.data;
        console.log('Token refreshed - New Token:', token);  // Debugging
        localStorage.setItem('access_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh Token Error:', refreshError);  // Debugging
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
