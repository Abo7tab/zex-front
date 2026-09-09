"use client";

import { useEffect, useState } from 'react';
import { getMe, logout } from '@/lib/auth';
import { getDevices, locateDevice, screamDevice, stopScreamDevice, startSearchMode, stopSearchMode, markStolen, markFound } from '@/lib/api/devices';
import { subscribeToDeviceState } from '@/lib/firebase';
import { LogOut, User, MapPin, Search, AlertTriangle, ShieldAlert, ShieldCheck, Volume2, VolumeX, Battery, Smartphone, Wifi, WifiOff } from 'lucide-react';
import DeviceMap from '@/components/map/DeviceMap';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [rtState, setRtState] = useState<any>(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getMe().then((data) => setUser(data.data || data)).catch(() => logout());
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const devices = await getDevices();
      if (devices && devices.length > 0) {
        setDevices(devices);
        setDevice(devices[0]);
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
  
  const lastHeartbeatAt = lastHeartbeatStr ? new Date(lastHeartbeatStr).getTime() : 0;
  const isOnline = (Date.now() - lastHeartbeatAt) < 5 * 60 * 1000;

  const handleLocate = async () => {
    if (!device) return;
    try { await locateDevice(device.id); } catch(e) { alert('Failed to locate'); }
  };

  const toggleSearch = async () => {
    if (!device) return;
    try {
      if (isSearching) await stopSearchMode(device.id);
      else await startSearchMode(device.id, 30);
      fetchDevices();
    } catch(e) { alert('Failed to toggle search'); }
  };

  const handleScreamToggle = async () => {
    if (!device) return;
    if (isScreaming) {
      setShowPasswordModal(true);
    } else {
      try { await screamDevice(device.id); fetchDevices(); } catch(e) { alert('Failed'); }
    }
  };

  const handleStopScream = async () => {
    if (!device) return;
    setActionLoading(true);
    try {
      await stopScreamDevice(device.id, passwordInput.trim());
      setShowPasswordModal(false);
      setPasswordInput('');
      fetchDevices();
    } catch(e) { alert('Invalid Password'); }
    finally { setActionLoading(false); }
  };

  const handleStolenToggle = async () => {
    if (!device) return;
    if (isStolen) {
      setShowPinModal(true);
    } else {
      try { await markStolen(device.id); fetchDevices(); } catch(e) { alert('Failed'); }
    }
  };

  const handleMarkFound = async () => {
    if (!device) return;
    setActionLoading(true);
    try {
      await markFound(device.id, pinInput.trim());
      setShowPinModal(false);
      setPinInput('');
      fetchDevices();
    } catch(e) { alert('Invalid PIN Code'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">Z</div>
          <span className="text-2xl font-bold tracking-tight text-white">ZEX<span className="text-blue-500">Tracker</span></span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800 rounded-full text-sm text-slate-300">
            <User className="h-4 w-4 text-blue-400" />
            <span className="font-medium">{user?.name || 'Loading...'}</span>
          </div>
          <button onClick={logout} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-red-400 transition-colors bg-slate-900 px-4 py-2 rounded-full border border-slate-700 hover:border-red-500/30 hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {!device ? (
              <div className="flex items-center space-x-3 text-slate-500">
                <div className="w-8 h-8 rounded-full border-2 border-slate-700 animate-spin border-t-blue-500"></div>
                <span>Loading device profile...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    {devices.length > 1 ? (
                      <select 
                        className="bg-slate-800 text-white font-bold text-xl rounded-lg px-3 py-1 border border-slate-700 focus:outline-none focus:border-blue-500"
                        value={device?.id}
                        onChange={(e) => setDevice(devices.find(d => d.id === parseInt(e.target.value)))}
                      >
                        {devices.map(d => (
                          <option key={d.id} value={d.id}>{d.device_name}</option>
                        ))}
                      </select>
                    ) : (
                      <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                        <span>{device.device_name}</span>
                      </h2>
                    )}
                    <p className="text-slate-400 text-sm mt-1">{device.device_model} • Android {device.android_version}</p>
                  </div>
                  {isOnline ? (
                    <div className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md text-xs font-bold border border-emerald-500/20">
                      <Wifi className="w-3 h-3" /> <span>ONLINE</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 bg-slate-800 text-slate-400 px-2 py-1 rounded-md text-xs font-bold border border-slate-700">
                      <WifiOff className="w-3 h-3" /> <span>OFFLINE</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 mb-6 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <Battery className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Battery Level</span>
                      <span className="text-white font-bold">{batteryLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${batteryLevel <= 20 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${batteryLevel}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isStolen && (
                    <div className="flex items-center space-x-1.5 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-500/30 animate-pulse">
                      <ShieldAlert className="w-4 h-4" /> <span>STOLEN</span>
                    </div>
                  )}
                  {isScreaming && (
                    <div className="flex items-center space-x-1.5 bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-orange-500/30 animate-pulse">
                      <Volume2 className="w-4 h-4" /> <span>SCREAMING</span>
                    </div>
                  )}
                  {isSearching && (
                    <div className="flex items-center space-x-1.5 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-500/30">
                      <Search className="w-4 h-4" /> <span>SEARCHING</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Command Center</h3>
            <div className="grid grid-cols-2 gap-3">
              
              <button onClick={handleLocate} className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all group">
                <MapPin className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-slate-200">Locate</span>
              </button>
              
              <button onClick={toggleSearch} className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all group ${isSearching ? 'bg-blue-600/20 border-blue-500/50' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                <Search className={`w-6 h-6 mb-2 group-hover:scale-110 transition-transform ${isSearching ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
                <span className={`text-sm font-semibold ${isSearching ? 'text-blue-400' : 'text-slate-200'}`}>Search Mode</span>
              </button>

              <button onClick={handleScreamToggle} className={`col-span-2 flex items-center justify-center space-x-2 p-4 border rounded-xl transition-all ${isScreaming ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20 border-orange-400' : 'bg-slate-800 border-slate-700 hover:border-orange-500/50 text-slate-200 hover:text-orange-400 font-semibold'}`}>
                {isScreaming ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                <span>{isScreaming ? 'Silence Device' : 'Trigger Scream Alarm'}</span>
              </button>

              <button onClick={handleStolenToggle} className={`col-span-2 flex items-center justify-center space-x-2 p-4 border rounded-xl transition-all ${isStolen ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 border-emerald-500' : 'bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 border-red-500 hover:bg-red-500'}`}>
                {isStolen ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                <span>{isStolen ? 'I Found My Device' : 'Report as Stolen!'}</span>
              </button>

            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
          <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-3 flex items-center space-x-2 z-20">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-sm text-slate-200">Live GPS Tracking</span>
            {lastHeartbeatStr && <span className="text-xs text-slate-500 ml-auto">Last updated: {new Date(lastHeartbeatStr).toLocaleTimeString()}</span>}
          </div>
          
          <div className="flex-1 relative z-10">
            {latitude != null && longitude != null ? (
               <DeviceMap 
                 latitude={latitude} 
                 longitude={longitude} 
                 accuracy={accuracy} 
                 deviceName={device?.device_name || 'Device'} 
               />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <MapPin className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">No location data available yet</p>
                <p className="text-sm mt-1 opacity-60">Trigger 'Locate' to wake the device.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Silence Alarm</h3>
            <p className="text-slate-400 text-sm mb-4">Enter your account password to confirm.</p>
            <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Password" />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={handleStopScream} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-500 transition disabled:opacity-50">Silence</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Device Found</h3>
            <p className="text-slate-400 text-sm mb-4">Enter the recovery PIN code to unlock the device.</p>
            <input type="text" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g,''))} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white text-center tracking-[0.5em] font-mono text-2xl mb-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="000000" />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowPinModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={handleMarkFound} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition disabled:opacity-50">Unlock</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}