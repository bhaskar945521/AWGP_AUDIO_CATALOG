import axios from 'axios';

let resolvedBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (!resolvedBaseUrl) {
  const hostname = window.location.hostname;
  if (hostname && hostname !== 'localhost') {
    resolvedBaseUrl = `http://${hostname}:5000`;
  }
}
const BASE_URL = resolvedBaseUrl || '';

const api = axios.create({
  baseURL: BASE_URL ? `${BASE_URL}/api` : '/api',
  timeout: 300000,
});

api.interceptors.request.use(
  config => {
    console.log('API request:', config.baseURL + config.url);
    return config;
  },
  error => Promise.reject(error)
);

function resolveUrl(url) {
  if (!url) return '';
  
  // Already absolute URLs
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  
  // Handle relative path - prefix with BASE_URL if needed
  // If url starts with /, use BASE_URL + url
  // Otherwise, assume it's relative to current domain/BASE_URL
  const resolved = BASE_URL 
    ? `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
    : url;
  
  return resolved;
}

export { BASE_URL, resolveUrl };
export default api;
