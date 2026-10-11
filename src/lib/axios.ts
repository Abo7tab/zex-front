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

const importantRequestPattern = /\/(commands|locate|scream|stop-scream|track|stop-tracking|lock|photo|enable-net|stolen|found|power-saver|search-mode|stop-search|activity-logs|locations)/i;
const quietPollingPattern = /^\/(?:logs|devices)(?:\?|$)/i;

const shouldLogRequest = (method: string, url: string) => {
  if (method !== 'GET') return true;
  return importantRequestPattern.test(url);
};

const isQuietPollingRequest = (method: string, url: string) => method === 'GET' && quietPollingPattern.test(url);

const byteSize = (value: unknown) => {
  if (value == null) return 0;
  try {
    return new Blob([typeof value === 'string' ? value : JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
};

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('zex_token') || localStorage.getItem('zex_token') || Cookies.get('zex_auth_token') || localStorage.getItem('zex_auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    (config as any).metadata = { startTime: new Date() };
    
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const time = new Date().toLocaleTimeString('en-GB');
    
    if (typeof window !== 'undefined' && shouldLogRequest(method, url)) {
      useTerminalStore.getState().addLog(`[${time}] REQ ${method} ${url} body=${byteSize(config.data)}B`);
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
    const time = new Date().toLocaleTimeString('en-GB');
    const url = config.url || '';
    
    if (typeof window !== 'undefined' && (shouldLogRequest(method, url) || (!isQuietPollingRequest(method, url) && duration > 1000))) {
      useTerminalStore.getState().addLog(`[${time}] RES ${method} ${url} -> ${response.status} (${duration}ms)`);
    }
    
    return response;
  },
  (error) => {
    const config = error.config as any;
    const duration = config ? new Date().getTime() - (config.metadata?.startTime?.getTime() || new Date().getTime()) : 0;
    const time = new Date().toLocaleTimeString('en-GB');
    const status = error.response?.status || 'ERR';
    const msg = error.response?.data?.message || error.message;
    
    if (typeof window !== 'undefined') {
      if (config) {
          useTerminalStore.getState().addLog(`[${time}] ERR ${config.method?.toUpperCase() || 'REQ'} ${config.url} -> ${status} (${duration}ms) ${msg}`);
      } else {
          useTerminalStore.getState().addLog(`[${time}] ERR ${msg}`);
      }
    }

    if (error.response?.status === 401) {
      Cookies.remove('zex_token');
      Cookies.remove('zex_auth_token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zex_token');
        localStorage.removeItem('zex_auth_token');
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
