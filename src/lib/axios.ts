import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'https://zex.alwaysdata.net/api/',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('zex_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('zex_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else {
      if (typeof window !== 'undefined') {
        const msg = error.response?.data?.message || error.message;
        console.error("ZEX_API_ERROR:", msg);
        alert(`API Error: ${msg}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
