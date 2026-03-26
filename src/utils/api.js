import axios from 'axios';

export const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

let api = axios.create({
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

api.interceptors.response.use(
  (response) => response, // إذا كان الطلب ناجحاً، مرره كما هو
  (error) => {
    const { response } = error;

    if (response && response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        const isAuthPage = window.location.pathname.includes('/login') ||
          window.location.pathname.includes('/auth');

        if (!isAuthPage) {
          window.location.href = '/auth?mode=signin';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
