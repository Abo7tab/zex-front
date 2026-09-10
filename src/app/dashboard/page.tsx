"use client";

import { useEffect, useState } from 'react';
import { getMe, logout } from '@/lib/auth';
import { getDevices, locateDevice, screamDevice, stopScreamDevice, startSearchMode, stopSearchMode, markStolen, markFound, deleteDevice } from '@/lib/api/devices';
import { subscribeToDeviceState } from '@/lib/firebase';
import { LogOut, User, MapPin, Search, AlertTriangle, ShieldAlert, ShieldCheck, Volume2, VolumeX, Battery, Smartphone, Wifi, WifiOff, Trash, Trash2 } from 'lucide-react';
import DeviceMap from '@/components/map/DeviceMap';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [rtState, setRtState] = useState<any>(null);
  const [locationHistory, setLocationHistory] = useState<[number, number][]>([]);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getMe().then((data) => setUser(data.data || data)).catch(() => logout());
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const fetchedDevices = await getDevices();
      if (fetchedDevices && fetchedDevices.length > 0) {
        setDevices(fetchedDevices);
        setDevice((prevDevice: any) => {
          if (prevDevice) {
            const match = fetchedDevices.find((d: any) => d.id === prevDevice.id);
            if (match) return match;
          }
          return fetchedDevices[0];
        });
      }
    } catch (err) {
      console.error("Failed to fetch devices");
    }
  };

  useEffect(() => {
    if (device?.device_uid) {
      const unsub = subscribeToDeviceState(device.device_uid, (data) => {
        setRtState(data);
      });
      return () => unsub();
    }
  }, [device?.device_uid]);

  const statusObj = rtState?.status || rtState || {};
  const locObj = rtState?.last_location || rtState?.location || device?.last_location || {};

  const isScreaming = statusObj.is_screaming ?? device?.is_screaming;
  const isStolen = statusObj.is_stolen ?? device?.is_stolen;
  const isSearching = statusObj.is_searching ?? device?.is_searching;
  const batteryLevel = statusObj.battery_level ?? device?.battery_level ?? 0;
  const lastHeartbeatStr = statusObj.last_heartbeat_at ?? device?.last_heartbeat_at;

  const latitude = locObj.latitude ?? device?.last_location?.latitude;
  const longitude = locObj.longitude ?? device?.last_location?.longitude;
  const accuracy = locObj.accuracy ?? device?.last_location?.accuracy;
  
  const lastHb = statusObj?.last_heartbeat_at || device?.last_heartbeat_at;
  let isOnline = false;
  if (lastHb) {
    const hbTime = new Date(lastHb).getTime();
    if (!isNaN(hbTime) && hbTime > 0) {
      isOnline = (Date.now() - hbTime) < 3 * 60 * 1000; // Strictly 3 minutes (180,000ms)
    }
  }

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setLocationHistory(prev => {
        const last = prev[prev.length - 1];
        if (!last || last[0] !== latitude || last[1] !== longitude) {
          return [...prev, [latitude, longitude]];
        }
        return prev;
      });
    }
  }, [latitude, longitude]);

  const handleLocate = async () => {
    if (!device) return;
    try { await locateDevice(device.id); } catch(e) { alert('Failed to locate'); }
  };

  const toggleSearch = async () => {
    if (!device) return;
    try {
      if (isSearching) { await stopSearchMode(device.id); setDevice((p: any) => ({...p, is_searching: false})); setRtState((p: any) => p ? {...p, is_searching: false} : null); }
      else { await startSearchMode(device.id, 30); setDevice((p: any) => ({...p, is_searching: true})); setRtState((p: any) => p ? {...p, is_searching: true} : null); }
      fetchDevices();
    } catch(e) { alert('Failed to toggle search'); }
  };

  const handleScreamToggle = async () => {
    if (!device) return;
    if (isScreaming) {
      setShowPasswordModal(true);
    } else {
      try { await screamDevice(device.id); setDevice((p: any) => ({...p, is_screaming: true})); setRtState((p: any) => p ? {...p, is_screaming: true} : null); fetchDevices(); } catch(e) { alert('Failed'); }
    }
  };

  const handleStopScream = async () => {
    if (!device) return;
    setActionLoading(true);
    try {
      await stopScreamDevice(device.id, passwordInput.trim());
      setShowPasswordModal(false);
      setPasswordInput('');
      setDevice((prev: any) => prev ? { ...prev, is_screaming: false } : null);
      setRtState((prev: any) => prev ? { ...prev, status: { ...prev?.status, is_screaming: false }, is_screaming: false } : null);
      fetchDevices();
    } catch(e) { alert('Invalid Password'); }
    finally { setActionLoading(false); }
  };

  const handleDeleteDevice = async () => {
    if (!device) return;
    setActionLoading(true);
    try {
      await deleteDevice(device.id);
      setShowDeleteModal(false);
      const remaining = devices.filter((d: any) => d.id !== device.id);
      setDevices(remaining);
      setDevice(remaining.length > 0 ? remaining[0] : null);
    } catch(e) { alert('Failed to delete device'); }
    finally { setActionLoading(false); }
  };

  const handleStolenToggle = async () => {
    if (!device) return;
    if (isStolen) {
      setShowPinModal(true);
    } else {
      try { await markStolen(device.id); setDevice((p: any) => ({...p, is_stolen: true})); setRtState((p: any) => p ? {...p, is_stolen: true} : null); fetchDevices(); } catch(e) { alert('Failed'); }
    }
  };

  const handleMarkFound = async () => {
    if (!device) return;
    setActionLoading(true);
    try {
      await markFound(device.id, pinInput.trim());
      setShowPinModal(false);
      setPinInput('');
      setDevice((prev: any) => prev ? { ...prev, is_stolen: false, is_screaming: false, is_searching: false } : null);
      setRtState((prev: any) => prev ? { ...prev, status: { ...prev?.status, is_stolen: false, is_screaming: false, is_searching: false }, is_stolen: false, is_screaming: false, is_searching: false } : null);
      fetchDevices();
    } catch(e) { alert('Invalid PIN Code'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 flex font-sans text-slate-900">
      
      {/* A. Background Map Layer */}
      <div className="absolute inset-0 z-0">
        {latitude != null && longitude != null ? (
           <DeviceMap 
             latitude={latitude} 
             longitude={longitude} 
             accuracy={accuracy} 
             deviceName={device?.device_name || 'Device'} 
             locationHistory={locationHistory}
           />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-400">
            <MapPin className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">No location data available yet</p>
          </div>
        )}
      </div>

      {/* B. Left Fixed Sidebar */}
      <div className="w-80 h-full bg-white z-10 border-r border-slate-200 flex flex-col justify-between p-6 shadow-lg shadow-slate-200/50">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-black text-xl text-white">Z</div>
            <span className="text-2xl font-bold tracking-tight text-black">ZEX Find</span>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">My devices ({devices.length})</h3>
            <div className="space-y-2">
              {devices.map((d: any) => (
                <div 
                  key={d.id} 
                  onClick={() => {
                    setRtState(null);
                    setDevice(d);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${device?.id === d.id ? 'bg-slate-50 border-blue-500 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className={`w-5 h-5 ${device?.id === d.id ? 'text-blue-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-bold text-sm text-slate-800">{d.device_name}</p>
                      <p className="text-xs text-slate-500">{d.device_model}</p>
                    </div>
                  </div>
                  {device?.id === d.id && (
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-200">
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-3 pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-sm font-medium text-slate-700">{user?.name || 'Loading...'}</span>
          </div>
          <button onClick={logout} className="w-full flex items-center space-x-2 text-sm text-slate-600 hover:text-black transition-colors px-3 py-2 rounded-xl hover:bg-slate-50">
            <LogOut className="h-4 w-4" />
            <span className="font-semibold">Sign out</span>
          </button>
        </div>
      </div>

      {/* C. Floating Control Card Overlay */}
      {device && (
        <div className="absolute top-6 right-6 z-10 w-[380px] bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-slate-200/80 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-slate-100 rounded-2xl">
                <Smartphone className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">{device.device_name}</h2>
                <div className="flex items-center space-x-2 text-xs font-medium mt-1">
                  {isOnline ? (
                    <span className="text-emerald-600 flex items-center"><Wifi className="w-3 h-3 mr-1"/> Online</span>
                  ) : (
                    <span className="text-slate-500 flex items-center"><WifiOff className="w-3 h-3 mr-1"/> Offline</span>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 flex items-center"><Battery className="w-3 h-3 mr-1"/> {batteryLevel}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 mb-4 px-1">
            <span>{lastHeartbeatStr ? `Updated: ${new Date(lastHeartbeatStr).toLocaleTimeString()}` : 'Just now'}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <button onClick={handleScreamToggle} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isScreaming ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-black shadow-sm group-hover:shadow-md'}`}>
                {isScreaming ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </div>
              <span className="text-[11px] font-bold text-center text-slate-700">{isScreaming ? 'Silence' : 'Ring'}</span>
            </button>
            
            <button onClick={handleStolenToggle} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isStolen ? 'bg-red-500 text-white shadow-md' : 'bg-white text-black shadow-sm group-hover:shadow-md'}`}>
                {isStolen ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <span className="text-[11px] font-bold text-center text-slate-700">{isStolen ? 'Found' : 'Lost mode'}</span>
            </button>
            
            <button onClick={toggleSearch} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isSearching ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-black shadow-sm group-hover:shadow-md'}`}>
                <Search className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-center text-slate-700">{isSearching ? 'Stop Search' : 'Search mode'}</span>
            </button>

            <button onClick={() => setShowDeleteModal(true)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors bg-white text-black shadow-sm group-hover:shadow-md">
                <Trash className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-center text-slate-700">Erase data</span>
            </button>

            <button onClick={handleLocate} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors bg-white text-black shadow-sm group-hover:shadow-md">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-center text-slate-700">Locate</span>
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Notify me when it's found</span>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isOnline ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isOnline ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </div>
      )}

      {/* D. Modals */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <VolumeX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Silence Alarm</h3>
            <p className="text-slate-500 text-sm mb-6">Enter your account password to silence the ringing.</p>
            <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-black mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Password" />
            <div className="flex space-x-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handleStopScream} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-500/20">Silence</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Device?</h3>
            <p className="text-slate-500 text-sm mb-6">This will permanently remove the device and all location history.</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handleDeleteDevice} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 shadow-md shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Device Found</h3>
            <p className="text-slate-500 text-sm mb-6">Enter the recovery PIN code to unlock the device.</p>
            <input type="text" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g,''))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-black text-center tracking-[0.5em] font-mono text-2xl mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="000000" />
            <div className="flex space-x-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handleMarkFound} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-500/20">Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}