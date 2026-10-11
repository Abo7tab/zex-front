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
const quietPollingPattern = /^\/(?:logs|devices|auth\/me)(?:\?|$)/i;

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

const describeRequest = (method: string, url: string, size: number) => {
  const locateMatch = url.match(/\/devices\/([^/]+)\/locate/i);
  if (locateMatch && method === 'POST') return `تم إرسال طلب تحديد موقع للجهاز رقم ${locateMatch[1]} (${size}B)`;
  const screamMatch = url.match(/\/devices\/([^/]+)\/scream/i);
  if (screamMatch && method === 'POST') return `تم إرسال طلب تشغيل الرنين للجهاز رقم ${screamMatch[1]} (${size}B)`;
  const stopScreamMatch = url.match(/\/devices\/([^/]+)\/stop-scream/i);
  if (stopScreamMatch && method === 'POST') return `تم إرسال طلب إيقاف الرنين للجهاز رقم ${stopScreamMatch[1]} (${size}B)`;
  const powerSaverMatch = url.match(/\/devices\/([^/]+)\/power-saver/i);
  if (powerSaverMatch && method === 'POST') return `تم إرسال طلب تعديل توفير الطاقة للجهاز رقم ${powerSaverMatch[1]} (${size}B)`;
  const searchModeMatch = url.match(/\/devices\/([^/]+)\/search-mode/i);
  if (searchModeMatch && method === 'POST') return `تم إرسال طلب تشغيل البحث للجهاز رقم ${searchModeMatch[1]} (${size}B)`;
  const stopSearchMatch = url.match(/\/devices\/([^/]+)\/stop-search/i);
  if (stopSearchMatch && method === 'POST') return `تم إرسال طلب إيقاف البحث للجهاز رقم ${stopSearchMatch[1]} (${size}B)`;
  if (/\/locations$/i.test(url) && method === 'POST') return `الموبايل بعت إحداثيات GPS جديدة (${size}B)`;
  if (/\/locations\/ble-relay$/i.test(url) && method === 'POST') return `تم استلام موقع عن طريق البلوتوث (${size}B)`;
  if (/\/locations\/sms-relay$/i.test(url) && method === 'POST') return `تم استلام موقع عن طريق SMS (${size}B)`;
  if (/\/commands\/[^/]+\/response$/i.test(url) && method === 'POST') return `الموبايل رد على أمر من السيرفر (${size}B)`;
  return `${method} ${url} body=${size}B`;
};

const describeResponse = (method: string, url: string, status: number, duration: number) => {
  const locateMatch = url.match(/\/devices\/([^/]+)\/locate/i);
  if (locateMatch && method === 'POST') return `السيرفر قبل طلب تحديد موقع الجهاز رقم ${locateMatch[1]} (${duration}ms)`;
  const screamMatch = url.match(/\/devices\/([^/]+)\/scream/i);
  if (screamMatch && method === 'POST') return `السيرفر قبل طلب تشغيل الرنين للجهاز رقم ${screamMatch[1]} (${duration}ms)`;
  const stopScreamMatch = url.match(/\/devices\/([^/]+)\/stop-scream/i);
  if (stopScreamMatch && method === 'POST') return `السيرفر قبل طلب إيقاف الرنين للجهاز رقم ${stopScreamMatch[1]} (${duration}ms)`;
  const powerSaverMatch = url.match(/\/devices\/([^/]+)\/power-saver/i);
  if (powerSaverMatch && method === 'POST') return `السيرفر قبل طلب توفير الطاقة للجهاز رقم ${powerSaverMatch[1]} (${duration}ms)`;
  const searchModeMatch = url.match(/\/devices\/([^/]+)\/search-mode/i);
  if (searchModeMatch && method === 'POST') return `السيرفر قبل طلب تشغيل البحث للجهاز رقم ${searchModeMatch[1]} (${duration}ms)`;
  const stopSearchMatch = url.match(/\/devices\/([^/]+)\/stop-search/i);
  if (stopSearchMatch && method === 'POST') return `السيرفر قبل طلب إيقاف البحث للجهاز رقم ${stopSearchMatch[1]} (${duration}ms)`;
  if (/\/locations$/i.test(url) && method === 'POST') return `السيرفر حفظ/حدّث موقع GPS (${duration}ms)`;
  if (/\/locations\/ble-relay$/i.test(url) && method === 'POST') return `السيرفر حفظ موقع البلوتوث (${duration}ms)`;
  if (/\/locations\/sms-relay$/i.test(url) && method === 'POST') return `السيرفر حفظ موقع SMS (${duration}ms)`;
  if (/\/commands\/[^/]+\/response$/i.test(url) && method === 'POST') return `السيرفر استلم رد الموبايل على الأمر (${duration}ms)`;
  return `${method} ${url} -> ${status} (${duration}ms)`;
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
      useTerminalStore.getState().addLog(`[${time}] ${describeRequest(method, url, byteSize(config.data))}`);
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
      useTerminalStore.getState().addLog(`[${time}] ${describeResponse(method, url, response.status, duration)}`);
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
