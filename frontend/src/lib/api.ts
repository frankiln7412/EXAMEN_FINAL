import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, clearUser } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const { data } = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          setTokens(data.access_token, data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          clearTokens();
          clearUser();
          window.location.href = '/';
          return Promise.reject(error);
        }
      } else {
        clearTokens();
        clearUser();
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
