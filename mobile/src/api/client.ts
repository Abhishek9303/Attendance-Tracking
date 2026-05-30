import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// For local testing in React Native Android/iOS Emulators, we map standard localhost,
// but let's provide a fallback URL that points to localhost (10.0.2.2 is Android VM gateway to host loopback).
const BASE_URL = 'http://localhost:5001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Access Token to headers automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept expired tokens and attempt refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const res = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = res.data;
        useAuthStore.getState().updateToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
