import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from './cookies';
import toast from "react-hot-toast";

export const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

export function getOnboardingStatus() {
  const accessToken = typeof window !== "undefined" ? localStorage.getItem('accessToken') : null;
  if (!accessToken) return true;
  try {
    const decoded = jwtDecode(accessToken);

    return decoded.isOnboarding;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export function getLang() {
  if (typeof window !== 'undefined') {
    return getCookie('NEXT_LOCALE') || localStorage.getItem('lang') || 'ar';
  }
  return 'ar';
}

let api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(config => {
  config.requestId = crypto.randomUUID();
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const code = error.response?.data?.code || error.response?.code;
    if (
      error.response?.status === 403 &&
      code === "PERMISSION_DENIED"
    ) {
      toast.error(error.response.data.message, {
        id: `permission-${error.config?.requestId}`,
      });

      error.isGloballyHandled = true;
    }

    return Promise.reject(error);
  }
);

export function handleApiError(error, message) {
  if (error?.isGloballyHandled) return;

  toast.error(message || error?.response?.data?.message);
}

// attach access token if present
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    const lang = getLang();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-frontend-route'] = window.location.href;
    config.headers['x-lang'] = lang;
  }
  return config;
});



export default api;
