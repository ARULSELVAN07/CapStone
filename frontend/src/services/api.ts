import axios from 'axios';
import { getProductImage } from './imageMap';

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

// Reliable fallback image — picsum delivers consistent CORS-safe images
export const DEFAULT_PRODUCT_IMAGE = 'https://picsum.photos/seed/bmwpart/600/600';

/**
 * Resolve any imageUrl value to a fully-renderable src string.
 *
 * Resolution priority:
 *  1. Local bundled image matched by productName (works on every machine after git pull)
 *  2. /uploads/<uuid> path → prepend the backend origin (uploaded via admin panel)
 *  3. Full http(s):// URL → returned as-is
 *  4. DEFAULT_PRODUCT_IMAGE (picsum fallback) when nothing else matches
 *
 * @param url         The imageUrl field stored in the database.
 * @param productName Optional product name used to resolve a locally-bundled image.
 */
export const getImageUrl = (
  url: string | null | undefined,
  productName?: string | null
): string => {
  // 1. Always prefer the locally-bundled image when a product name is supplied.
  //    These images are committed to Git and bundled by Vite — guaranteed present.
  if (productName) {
    const local = getProductImage(productName);
    if (local) return local;
  }

  // 2. Explicit /uploads/ path from the backend file store.
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    let origin = '';
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      origin = baseUrl.replace(/\/api\/v1\/?$/, '');
    }
    return `${origin}${url.startsWith('/') ? url : '/' + url}`;
  }

  // 3. External URL (http / https) — return as-is.
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;

  // 4. Absolute fallback.
  return DEFAULT_PRODUCT_IMAGE;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  // Only replace once to prevent infinite loops if the fallback itself fails
  if (target.src !== DEFAULT_PRODUCT_IMAGE && !target.src.includes('picsum.photos')) {
    target.onerror = null;
    target.src = DEFAULT_PRODUCT_IMAGE;
  }
};

export default api;
