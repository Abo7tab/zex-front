import axios from 'axios';
import Cookies from 'js-cookie';
import { useTerminalStore } from '../store/useTerminalStore';

const api = axios.create({
  baseURL: 'https://zex.alwaysdata.net/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('zex_token') || localStorage.getItem('zex_token') || Cookies.get('zex_auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    (config as any).metadata = { startTime: new Date() };
    
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const time = new Date().toISOString().substring(11, 19) + 'Z';
    
    if (typeof window !== 'undefined') {
      useTerminalStore.getState().addLog(`[${time}] SYS//REQ > [${method}] ${url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    const duration = new Date().getTime() - (config.metadata?.startTime?.getTime() || new Date().getTime());
    const method = config.method?.toUpperCase() || 'GET';
    const time = new Date().toISOString().substring(11, 19) + 'Z';
    
    if (typeof window !== 'undefined') {
      useTerminalStore.getState().addLog(`[${time}] SYS//RES > [200 OK] (${duration}ms) ${config.url}`);
    }
    
    return response;
  },
  (error) => {
    const config = error.config as any;
    const duration = config ? new Date().getTime() - (config.metadata?.startTime?.getTime() || new Date().getTime()) : 0;
    const time = new Date().toISOString().substring(11, 19) + 'Z';
    const status = error.response?.status || 'ERR';
    const msg = error.response?.data?.message || error.message;
    
    if (typeof window !== 'undefined') {
      if (config) {
          useTerminalStore.getState().addLog(`[${time}] SYS//ERR > [${status}] (${duration}ms) ${config.url} -> ${msg}`);
      } else {
          useTerminalStore.getState().addLog(`[${time}] SYS//ERR > ${msg}`);
      }
    }

    if (error.response?.status === 401) {
      Cookies.remove('zex_token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zex_token');
        window.location.href = '/login';
      }
    } else {
      if (typeof window !== 'undefined') {
        console.error("ZEX_API_ERROR:", msg);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
