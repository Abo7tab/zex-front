const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const oldFirebase = /useEffect\(\(\) => \{\s*if \(device\?\.device_uid && typeof window !== 'undefined'\) \{[\s\S]*?\}\s*\}, \[device\?\.device_uid\]\);/m;
const newFirebase = `useEffect(() => {
  const uid = device?.device_uid;
  if (!uid || typeof window === 'undefined') return;

  let unsub = null;
  try {
    unsub = subscribeToDeviceState(uid, (data) => {
      if (data) {
        setRtState(data);
      }
    });
  } catch (e) {
    console.warn("Firebase sub error", e);
  }

  return () => {
    if (typeof unsub === 'function') unsub();
  };
}, [device?.device_uid]);`;

c = c.replace(oldFirebase, newFirebase);

const oldLocation = /useEffect\(\(\) => \{\s*if \(latitude != null && longitude != null\) \{[\s\S]*?\}\s*\}, \[latitude, longitude\]\);/m;
const newLocation = `useEffect(() => {
  if (latitude == null || longitude == null) return;
  
  setLocationHistory(prev => {
    const last = prev[prev.length - 1];
    if (last && last[0] === latitude && last[1] === longitude) {
      return prev; // Return SAME array reference if unchanged
    }
    const updated = [...prev, [latitude, longitude]];
    return updated.length > 50 ? updated.slice(-50) : updated;
  });
}, [latitude, longitude]);`;

c = c.replace(oldLocation, newLocation);

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
