const fs = require('fs');

// 1. Fix LeafletMap.tsx
let leafletMap = fs.readFileSync('src/components/map/LeafletMap.tsx', 'utf8');
leafletMap = leafletMap.replace("import 'leaflet/dist/leaflet.css';", "");
fs.writeFileSync('src/components/map/LeafletMap.tsx', leafletMap, 'utf8');

// 1b. Add to globals.css
let globalsCss = fs.readFileSync('src/app/globals.css', 'utf8');
if (!globalsCss.includes("leaflet/dist/leaflet.css")) {
  globalsCss = `@import 'leaflet/dist/leaflet.css';\n` + globalsCss;
  fs.writeFileSync('src/app/globals.css', globalsCss, 'utf8');
}

// 2. Fix firebase.ts
let firebase = `import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const firebaseConfig = {
  projectId: 'zex-12',
  databaseURL: 'https://zex-12-default-rtdb.europe-west1.firebasedatabase.app',
};

const getFirebaseApp = () => {
  if (typeof window === 'undefined') return null;
  return !getApps().length ? initializeApp(firebaseConfig) : getApp();
};

export const getFirebaseDb = () => {
  const app = getFirebaseApp();
  return app ? getDatabase(app) : null;
};

export const subscribeToDeviceState = (deviceUid: string, callback: (data: any) => void) => {
  const db = getFirebaseDb();
  if (!db) return () => {};
  
  const deviceRef = ref(db, \`devices/\${deviceUid}\`);
  const unsubscribe = onValue(deviceRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  return unsubscribe;
};
`;
fs.writeFileSync('src/lib/firebase.ts', firebase, 'utf8');

// 3. Fix axios.ts
let axiosCode = `import axios from 'axios';
import Cookies from 'js-cookie';
import { useTerminalStore } from '../store/useTerminalStore';

const api = axios.create({
  baseURL: 'https://zex.alwaysdata.net/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get('zex_token') || localStorage.getItem('zex_token');
    if (token && config.headers) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
  }
  
  (config as any).metadata = { startTime: new Date() };
  
  const method = config.method?.toUpperCase() || 'GET';
  const url = config.url || '';
  const time = new Date().toISOString().substring(11, 19) + 'Z';
  
  if (typeof window !== 'undefined') {
    useTerminalStore.getState().addLog(\`[\${time}] SYS//REQ > [\${method}] \${url}\`);
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    const duration = new Date().getTime() - (config.metadata?.startTime?.getTime() || new Date().getTime());
    const method = config.method?.toUpperCase() || 'GET';
    const time = new Date().toISOString().substring(11, 19) + 'Z';
    
    if (typeof window !== 'undefined') {
      useTerminalStore.getState().addLog(\`[\${time}] SYS//RES > [200 OK] (\${duration}ms) \${config.url}\`);
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
          useTerminalStore.getState().addLog(\`[\${time}] SYS//ERR > [\${status}] (\${duration}ms) \${config.url} -> \${msg}\`);
      } else {
          useTerminalStore.getState().addLog(\`[\${time}] SYS//ERR > \${msg}\`);
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
`;
fs.writeFileSync('src/lib/axios.ts', axiosCode, 'utf8');
