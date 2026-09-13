"use client";
import { useEffect, useState } from 'react';
import { getDevices } from '@/lib/api/devices';
import { subscribeToDeviceState } from '@/lib/firebase';
import { Shield, ArrowRight, MapPin, Battery, Wifi, Navigation, Circle, Clock, Crosshair, Layers, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('@/components/map/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[420px] h-[420px] lg:h-full flex items-center justify-center bg-slate-100 text-slate-500 font-mono text-xs rounded-2xl">
      <span>Initializing Tactical Tracking System...</span>
    </div>
  ),
});

export default function TrackingClient() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [rtStates, setRtStates] = useState<Record<string, any>>({});
  const [historyMap, setHistoryMap] = useState<Record<string, [number, number][]>>({});
  const [locationHistory, setLocationHistory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  function isDeviceOnline(d: any): boolean {
    if (!d) return false;
    const lastSeen = d.last_heartbeat_at || d.last_seen_at || d.updated_at || d.last_heartbeat;
    if (!lastSeen) return false;
    const t = new Date(lastSeen).getTime();
    if (isNaN(t) || t <= 0) return false;
    return (now - t) < 120000;
  }
  
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(500);
  const [playbackIndex, setPlaybackIndex] = useState(100);
  
  const router = useRouter();

  // Load devices
  useEffect(() => {
    getDevices().then(data => {
      if (data && data.length > 0) {
        setDevices(data);
        setSelectedDevice(data[0]);
      }
    }).catch(e => console.error("Failed to load devices", e));
  }, []);

  // Firebase Subscriptions for all devices
  useEffect(() => {
    if (devices.length === 0) return;
    const unsubs = devices.map(d => {
      const uid = d.device_uid;
      if (!uid) return () => {};
      return subscribeToDeviceState(uid, (data: any) => {
        if (data) {
          setRtStates(prev => ({ ...prev, [uid]: data }));
          
          // Update history
          const lat = Number(data?.last_location?.latitude || data?.location?.latitude || d?.last_location?.latitude || 24.7136);
          const lng = Number(data?.last_location?.longitude || data?.location?.longitude || d?.last_location?.longitude || 46.6753);
          
          setHistoryMap(prev => {
            const hist = prev[uid] || [];
            const last = hist[hist.length - 1];
            if (last && last[0] === lat && last[1] === lng) return prev;
            const updated = [...hist, [lat, lng] as [number, number]];
            return { ...prev, [uid]: updated.length > 100 ? updated.slice(-100) : updated };
          });
        }
      });
    });
    
    return () => { unsubs.forEach(u => u && u()); };
  }, [devices]);

  const activeUid = selectedDevice?.device_uid;
  const rtState = activeUid ? rtStates[activeUid] : null;
  const statusObj = rtState?.status || rtState || {};
  const latitude = Number(statusObj?.latitude ?? selectedDevice?.latitude ?? 0);
  const longitude = Number(statusObj?.longitude ?? selectedDevice?.longitude ?? 0);
  const accuracy = Number(statusObj?.accuracy ?? selectedDevice?.accuracy ?? 0);
  const batteryLevel = Number(statusObj?.battery_level ?? selectedDevice?.battery_level ?? 0);
  
  const isOnline = isDeviceOnline(statusObj || selectedDevice);

  const currentHistory = activeUid ? (historyMap[activeUid] || []) : [];
  
  // Calculate displayed history based on playback slider
  const displayedHistoryCount = Math.max(1, Math.floor((playbackIndex / 100) * currentHistory.length));
  const displayedHistory = currentHistory.slice(0, displayedHistoryCount);

  function getTacticalName(d: any): string {
    if (!d) return 'Device';
    if (d.device_name && String(d.device_name).trim()) return String(d.device_name).trim();
    if (d.name && String(d.name).trim()) return String(d.name).trim();
    if (d.device_model && String(d.device_model).trim()) return String(d.device_model).trim();
    if (d.model && String(d.model).trim()) return String(d.model).trim();
    
    const uid = String(d.device_uid || d.uid || '');
    return uid ? `Device #${uid.slice(-4).toUpperCase()}` : 'Device';
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans" dir="ltr">
      <header className="h-14 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight hidden sm:block">ZEX MILITARY — التتبع الجغرافي</span>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight sm:hidden">نظام التتبع</span>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Return to Command</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Main Map Area */}
        <div className="flex-1 relative order-2 lg:order-1 min-h-[420px] h-[420px] lg:h-full">
          <TrackingMap 
            devices={devices}
            rtStates={rtStates}
            selectedDeviceId={activeUid}
            historyMap={historyMap}
            playbackIndex={playbackIndex}
            geofenceEnabled={geofenceEnabled}
            geofenceRadius={geofenceRadius}
          />
          
          {/* Map HUD overlays */}
          <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {devices.length} أجهزة
            </div>
            <div className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {Object.keys(rtStates).filter(k => {
                const t = new Date(rtStates[k]?.status?.last_heartbeat_at || 0).getTime();
                return (Date.now() - t) < 120000;
              }).length} Protocol: Active
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-[400px] xl:w-[450px] bg-slate-50 border-r border-slate-200 flex flex-col order-1 lg:order-2 h-[55vh] lg:h-full overflow-y-auto shrink-0 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] relative">
          
          <div className="p-4 sm:p-5 flex flex-col gap-5">
            {/* Device Selector */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 relative">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5"/> الوحدة الActiveة</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl pl-3 pl-10 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedDevice?.id || ''}
                  onChange={(e) => {
                    const d = devices.find(x => x.id.toString() === e.target.value);
                    if (d) {
                      setSelectedDevice(d);
                      setPlaybackIndex(100);
                    }
                  }}
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{getTacticalName(d)}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center gap-1">
                <Crosshair className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-bold mt-1">دقة الموقع</span>
                <span className="font-mono text-xs font-bold text-slate-800">±{accuracy}m</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center gap-1">
                <Battery className={`w-4 h-4 ${batteryLevel > 20 ? 'text-emerald-500' : 'text-rose-500'}`} />
                <span className="text-[10px] text-slate-500 font-bold mt-1">الطاقة</span>
                <span className="font-mono text-xs font-bold text-slate-800">{batteryLevel}%</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center gap-1">
                <Wifi className={`w-4 h-4 ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-[10px] text-slate-500 font-bold mt-1">الاتصال</span>
                <span className={`text-xs font-bold ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>{isOnline ? 'Protocol: Active' : 'Offline'}</span>
              </div>
            </div>

            {/* Timeline Slider */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500"/> مسار الحركة (Timeline)</label>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono">{playbackIndex}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={playbackIndex} 
                onChange={(e) => setPlaybackIndex(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
                disabled={currentHistory.length <= 1}
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>البداية</span>
                <span>الآن ({currentHistory.length} نقطة)</span>
              </div>
            </div>

            {/* Geofence */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Circle className="w-3.5 h-3.5 text-emerald-500"/> التسييج الجغرافي</label>
                <button 
                  onClick={() => setGeofenceEnabled(!geofenceEnabled)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${geofenceEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${geofenceEnabled ? 'left-0.5' : 'left-5'}`} />
                </button>
              </div>
              
              <div className={`transition-all overflow-hidden ${geofenceEnabled ? 'h-14 opacity-100 mt-2' : 'h-0 opacity-0'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">نطاق الأمان:</span>
                  <input 
                    type="range" min="100" max="5000" step="100"
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(parseInt(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-mono font-bold w-12 text-left">{geofenceRadius}m</span>
                </div>
              </div>
            </div>

            {/* Recent Points */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 mb-6">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500"/> آخر الإحداثيات المسجلة</label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {displayedHistory.slice(-10).reverse().map((pt, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-slate-600">{pt[0].toFixed(5)}</span>
                    </div>
                    <span className="text-slate-600">{pt[1].toFixed(5)}</span>
                  </div>
                ))}
                {displayedHistory.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-4">لا توجد مسارات مسجلة</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
