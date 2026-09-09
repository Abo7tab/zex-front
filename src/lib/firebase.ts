import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const firebaseConfig = {
  projectId: 'zex-12',
  databaseURL: 'https://zex-12-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export const subscribeToDeviceState = (deviceUid: string, callback: (data: any) => void) => {
  const deviceRef = ref(db, `devices/${deviceUid}`);
  const unsubscribe = onValue(deviceRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  return unsubscribe;
};