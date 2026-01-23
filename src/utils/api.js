import axios from 'axios';

export const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// attach access token if present
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
