import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sparehub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized / Expired sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login attempt failure
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/verify-otp') && !url.includes('/auth/forgot-password') && !url.includes('/auth/reset-password')) {
        localStorage.removeItem('sparehub_token');
        localStorage.removeItem('sparehub_user');
        localStorage.removeItem('sparehub_vehicle');
        // Redirect to the appropriate login page
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else if (currentPath.startsWith('/technician')) {
          window.location.href = '/technician/login';
        } else if (currentPath.startsWith('/delivery')) {
          window.location.href = '/delivery/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80';

export const getImageUrl = (url: string | null | undefined): string => {
  if (!url || url.trim() === '') return DEFAULT_PRODUCT_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  let host = '';
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    host = baseUrl.replace(/\/api\/v1\/?$/, '');
  }
  return `${host}${url.startsWith('/') ? url : '/' + url}`;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_PRODUCT_IMAGE) {
    target.onerror = null; // prevent looping if fallback fails
    target.src = DEFAULT_PRODUCT_IMAGE;
  }
};

export default api;
