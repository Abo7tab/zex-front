import { initializeApp, getApps, getApp } from 'firebase/app';
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
  if (typeof window === 'undefined' || !deviceUid) return () => {};
  try {
    const db = getFirebaseDb();
    if (!db) return () => {};
    const deviceRef = ref(db, `devices/${deviceUid}`);
    let lastData: any = null;
    
    const unsubscribe = onValue(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        // Only callback if data actually changed
        if (JSON.stringify(newData) !== JSON.stringify(lastData)) {
          lastData = newData;
          callback(newData);
        }
      }
    }, (error) => {
      console.warn('Firebase read warning:', error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firebase subscription bypass:', err);
    return () => {};
  }
};
