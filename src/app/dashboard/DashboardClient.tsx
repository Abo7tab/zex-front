"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getMe, logout } from '@/lib/auth';
import { getDevices, locateDevice, screamDevice, stopScreamDevice, startSearchMode, stopSearchMode, markStolen, markFound, deleteDevice, togglePowerSaver } from '@/lib/api/devices';
import { subscribeToDeviceState } from '@/lib/firebase';
import { useTerminalStore } from '@/store/useTerminalStore';
import {
  Shield, User, Smartphone, Search, AlertTriangle, ShieldCheck,
  Volume2, VolumeX, Battery, Wifi, Trash2, Menu, X, Settings,
  Eye, EyeOff, LogOut, Radar, MapPin, Crosshair,
  Bluetooth, BluetoothSearching, CheckCircle,
  Terminal, ShieldAlert
} from 'lucide-react';
import dynamic from 'next/dynamic';
import SettingsModal from '@/components/modals/SettingsModal';
import { useRouter } from 'next/navigation';

const DeviceMap = dynamic(() => import('@/components/map/DeviceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[420px] h-[420px] flex items-center justify-center bg-slate-100 text-slate-500 font-mono text-xs rounded-2xl">
      <span>جاري تحميل الخريطة...</span>
    </div>
  ),
});

export default function DashboardClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
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
    return (now - t) < 300000;
  }
  const [device, setDevice] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [rtState, setRtState] = useState<any>(null);
  const [locationHistory, setLocationHistory] = useState<[number, number][]>([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [unregisterTarget, setUnregisterTarget] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allLogs = useTerminalStore((state) => state.logs);
  const logs = allLogs.slice(-50);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('zex_token') || localStorage.getItem('zex_auth_token');
    const hasCookie = document.cookie.includes('zex_token=');
    if (!token && !hasCookie) { router.replace('/login'); return; }

    getMe()
      .then((data) => { setUser(data?.data || data); fetchDevicesInner(); })
      .catch(() => { localStorage.removeItem('zex_token'); localStorage.removeItem('zex_auth_token'); router.replace('/login'); })
      .finally(() => setIsLoading(false));

    const t = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const uid = device?.device_uid;
    if (!uid) return;
    setLocationHistory([]); // Reset history when switching device
    let unsub: (() => void) | null = null;
    try { unsub = subscribeToDeviceState(uid, (data: any) => { if (data) setRtState(data); }); }
    catch (e) { console.warn('Firebase sub error', e); }
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [device?.device_uid]);

  useEffect(() => {
    setLocationHistory([]);
  }, [device?.id]);

  const statusObj = rtState?.status || rtState || {};
  const locObj = rtState?.last_location || rtState?.location || device?.last_location || {};
  const rawLat = locObj.latitude ?? device?.last_location?.latitude;
  const rawLng = locObj.longitude ?? device?.last_location?.longitude;
  const rawAcc = locObj.accuracy ?? device?.last_location?.accuracy;
  const latitude: number  = rawLat ? Number(rawLat) : 24.7136;
  const longitude: number = rawLng ? Number(rawLng) : 46.6753;
  const accuracy: number  = rawAcc ? Number(rawAcc) : 0;
  const relaySource = statusObj.relay_source ?? locObj.relay_source ?? device?.relay_source ?? device?.last_location?.relay_source;

  useEffect(() => {
    setLocationHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last[0] === latitude && last[1] === longitude) return prev;
      const updated: [number, number][] = [...prev, [latitude, longitude] as [number, number]];
      return updated.length > 50 ? updated.slice(-50) : updated;
    });
  }, [latitude, longitude]);

  const isScreaming  = statusObj.is_screaming  ?? device?.is_screaming;
  const isStolen     = statusObj.is_stolen     ?? device?.is_stolen;
  const isSearching  = statusObj.is_searching  ?? device?.is_searching;
    const isPowerSaver = statusObj.is_power_saver ?? device?.is_power_saver;
  const batteryLevel = Number(statusObj.battery_level ?? device?.battery_level ?? 0);

  const isOnline = isDeviceOnline(statusObj || device);

  const filteredDevices = (devices || []).filter((d) => {
    if (!searchQuery) return true;
    const q = String(searchQuery).toLowerCase();
    return String(d?.name || d?.device_uid || d?.model || '').toLowerCase().includes(q) ||
           String(d?.model || d?.device_type || '').toLowerCase().includes(q);
  });

  async function fetchDevicesInner() {
    try {
      const fetched = await getDevices();
      if (fetched && fetched.length > 0) {
        setDevices(fetched);
        setDevice((prev: any) => { if (prev) { const m = fetched.find((d: any) => d.id === prev.id); if (m) return m; } return fetched[0]; });
      } else { setDevices([]); setDevice(null); }
    } catch { setDevices([]); setDevice(null); }
  }
  const fetchDevices = () => fetchDevicesInner();

  const optimisticPing = () => {
    if (!device) return;
    const nowStr = new Date().toISOString();
    setDevice((p: any) => p ? { ...p, last_heartbeat_at: nowStr, updated_at: nowStr } : null);
    setRtState((p: any) => p ? { ...p, last_heartbeat_at: nowStr } : null);
    setDevices((prev: any[]) => prev.map(d => d.id === device.id ? { ...d, last_heartbeat_at: nowStr, updated_at: nowStr } : d));
    setNow(Date.now());
  };

  const handleTogglePowerSaver = async () => { if (!device) return; try { await togglePowerSaver(device.id, !isPowerSaver); setDevice((p:any)=>({...p,is_power_saver:!isPowerSaver})); setRtState((p:any)=>p?{...p,is_power_saver:!isPowerSaver}:null); optimisticPing(); fetchDevices(); } catch { alert("Failed to toggle power saver"); } };
    const handleLocate       = useCallback(async () => { if (!device) return; try { await locateDevice(device.id); optimisticPing(); } catch { alert('Failed to execute GPS Locate'); } }, [device?.id]);
  const handleStartScream  = async () => { if (!device) return; try { await screamDevice(device.id); setDevice((p:any)=>({...p,is_screaming:true})); setRtState((p:any)=>p?{...p,is_screaming:true}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to execute Scream Alert'); } };
  const handleStopScreamClick = () => { if (!device) return; setShowPasswordModal(true); };
  const handleStopScream   = async () => { if (!device) return; setActionLoading(true); try { await stopScreamDevice(device.id, passwordInput.trim()); setShowPasswordModal(false); setPasswordInput(''); setDevice((p:any)=>p?{...p,is_screaming:false}:null); setRtState((p:any)=>p?{...p,is_screaming:false}:null); optimisticPing(); fetchDevices(); } catch { alert('Invalid Password'); } finally { setActionLoading(false); } };
  const handleStartSearch  = async () => { if (!device) return; try { await startSearchMode(device.id, 30); setDevice((p:any)=>({...p,is_searching:true})); setRtState((p:any)=>p?{...p,is_searching:true}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to execute BLE Radar'); } };
  const handleStopSearch   = async () => { if (!device) return; try { await stopSearchMode(device.id); setDevice((p:any)=>({...p,is_searching:false})); setRtState((p:any)=>p?{...p,is_searching:false}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to stop BLE Radar'); } };
  const handleStartStolen  = async () => { if (!device) return; try { await markStolen(device.id); setDevice((p:any)=>({...p,is_stolen:true})); setRtState((p:any)=>p?{...p,is_stolen:true}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to execute Lock Protocol'); } };
  const handleStopStolenClick = () => { if (!device) return; setShowPinModal(true); };
  const handleMarkFound    = async () => { if (!device) return; setActionLoading(true); try { await markFound(device.id, pinInput.trim()); setShowPinModal(false); setPinInput(''); setDevice((p:any)=>p?{...p,is_stolen:false,is_screaming:false,is_searching:false}:null); setRtState((p:any)=>p?{...p,is_stolen:false,is_screaming:false,is_searching:false}:null); optimisticPing(); fetchDevices(); } catch { alert('Invalid 6-digit PIN'); } finally { setActionLoading(false); } };
  const handleDeleteClick  = () => { if (!device) return; setShowDeleteModal(true); };
  const handleDeleteDevice = async () => { if (!device) return; setActionLoading(true); try { await deleteDevice(device.id, deletePasswordInput.trim()); setShowDeleteModal(false); setDeletePasswordInput(''); const r=devices.filter((d:any)=>d.id!==device.id); setDevices(r); setDevice(r.length>0?r[0]:null); } catch { alert('Failed to Purge Device. Invalid Password.'); } finally { setActionLoading(false); } };
  const handleUnregisterDevice = async () => { if (!unregisterTarget) return; setActionLoading(true); try { await deleteDevice(unregisterTarget.id, deletePasswordInput.trim()); setShowUnregisterModal(false); setDeletePasswordInput(''); const r=devices.filter((d:any)=>d.id!==unregisterTarget.id); setDevices(r); if(device?.id===unregisterTarget.id) setDevice(r.length>0?r[0]:null); setUnregisterTarget(null); } catch { alert('Failed to Purge Device. Invalid Password.'); } finally { setActionLoading(false); } };

  const commands = [
    { label: 'Scream Alert',    sub: 'Force Siren',      icon: <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />,          color: 'blue',    onClick: handleStartScream,    disabled: !!isScreaming || !device },
    { label: 'Silence Alert',   sub: 'Mute Alarm',       icon: <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />,          color: 'slate',   onClick: handleStopScreamClick, disabled: !isScreaming || !device },
    { label: 'GPS Locate',      sub: 'Fetch Live GPS',   icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />,           color: 'emerald', onClick: handleLocate,         disabled: !device },
    { label: 'BLE Radar',       sub: 'Start Beacon',     icon: <BluetoothSearching className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'indigo',  onClick: handleStartSearch,    disabled: !!isSearching || !device },
    { label: 'Stop Radar',      sub: 'Disable Beacon',   icon: <Bluetooth className="w-5 h-5 sm:w-6 sm:h-6" />,        color: 'slate',   onClick: handleStopSearch,     disabled: !isSearching || !device },
    { label: 'Mark Stolen',     sub: 'Lock Protocol',    icon: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />,      color: 'rose',    onClick: handleStartStolen,    disabled: !!isStolen || !device },
    { label: 'Unmark Stolen',   sub: 'Recovered Status', icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />,      color: 'emerald', onClick: handleStopStolenClick, disabled: !isStolen || !device },
    { label: 'Wipe Device',     sub: 'Permanent Purge',  icon: <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />,           color: 'slate',   onClick: handleDeleteClick,    disabled: !device },
  ];
  const btnColors: Record<string,string> = {
    blue:    'bg-blue-50 text-blue-600',
    slate:   'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
      emerald: 'bg-emerald-50 text-emerald-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    rose:    'bg-rose-50 text-rose-600',
  };

  function getTacticalName(d: any): string {
    if (!d) return 'Device';
    if (d.device_name && String(d.device_name).trim()) return String(d.device_name).trim();
    if (d.name && String(d.name).trim()) return String(d.name).trim();
    if (d.device_model && String(d.device_model).trim()) return String(d.device_model).trim();
    if (d.model && String(d.model).trim()) return String(d.model).trim();
    
    const uid = String(d.device_uid || d.uid || '');
    return uid ? `Device #${uid.slice(-4).toUpperCase()}` : 'Device';
  }

  const memoizedDeviceMap = useMemo(() => (
    <DeviceMap latitude={latitude} longitude={longitude} accuracy={accuracy} isOnline={isOnline} batteryLevel={batteryLevel} deviceId={device?.device_uid} history={locationHistory} />
  ), [latitude, longitude, accuracy, isOnline, batteryLevel, device?.device_uid, locationHistory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-mono" dir="ltr">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold text-slate-200">جاري تهيئة غرفة العمليات C4ISR...</span>
        <span className="text-xs text-slate-500 mt-1">Securing ZEX Node...</span>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex flex-row items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0"><Shield className="w-4 h-4" /></div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">ZEX MILITARY</span>
            <span className="text-[10px] font-semibold text-slate-500">Encrypted Operations</span>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 flex flex-row items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0"><User className="w-3.5 h-3.5" /></div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-xs text-slate-800 truncate">{user?.name || 'Operator'}</span>
            <span className="text-[10px] text-slate-500 font-mono truncate">{user?.email || 'admin@c4isr.gov'}</span>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex flex-row items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-blue-600" />Active Units</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">{devices?.length || 0}</span>
        </div>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
          <input type="text" placeholder="Search units..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-8 pr-8 pr-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex flex-col gap-1.5">
          {(filteredDevices.length > 0) ? filteredDevices.map(d => (
            <div key={d.id} onClick={() => { setDevice(d); setShowMobileMenu(false); }}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${device?.id === d.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className={`w-3.5 h-3.5 ${device?.id === d.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`font-bold text-xs truncate max-w-[120px] ${device?.id === d.id ? 'text-blue-900' : 'text-slate-700'}`}>
                      {getTacticalName(d)}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono truncate pr-5">{d?.device_uid || ''}</span>
                </div>
                {d.is_stolen && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 truncate">{`Android ${d?.android_version || '10'} • ${d?.device_model || d?.model || d?.brand || ''}`}</span>
                <span className={`px-1 py-0.5 rounded flex items-center gap-0.5 ${(d?.battery_level ?? 0) > 20 ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
                  <Battery className="w-2.5 h-2.5" />{d?.battery_level ?? 0}%
                </span>
              </div>
            </div>
          )) : <div className="text-xs text-slate-400 text-center py-4">No devices found</div>}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-100 flex flex-col gap-1 bg-slate-50/50">
        <button onClick={() => { router.push('/settings'); setShowMobileMenu(false); }} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
          <Settings className="w-3.5 h-3.5" />System Settings
        </button>
        <button onClick={() => { logout(); router.push('/login'); }} className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
          <LogOut className="w-3.5 h-3.5" />Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex font-sans" dir="ltr">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* ── Desktop Sidebar ── */}
      <aside className="w-72 xl:w-80 bg-white border-l border-slate-200/80 shadow-sm hidden lg:flex flex-col z-20 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden" dir="ltr">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <aside className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200/80 shadow-sm flex items-center justify-between px-3 sm:px-5 z-10 shrink-0 sticky top-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger */}
            <button onClick={() => setShowMobileMenu(true)} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center active:scale-95 transition-transform">
              <Menu className="w-4 h-4" />
            </button>
            {/* Brand icon (mobile only) */}
            <div className="lg:hidden w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            {/* Device UID chip */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-[180px] sm:max-w-none">
              <Radar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-500 hidden sm:inline">عقدة:</span>
              <span className="font-bold text-slate-900 truncate" title={device?.device_uid}>{getTacticalName(device)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => alert('SOS BROADCAST SENT')} className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-2.5 py-1.5 text-xs font-bold active:scale-95 transition-transform hover:bg-rose-100">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span className="hidden xs:inline">SOS</span>
            </button>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2.5 py-1.5 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">ONLINE</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">

          {devices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[400px]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No devices found مسجلة</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">يرجى تسجيل جهاز من تطبيق الموبايل أو Operator Login بحساب يحتوي على أجهزة.</p>
            </div>
          ) : (
            <>
              {/* ── Status Banner ── */}
              <div className={`rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border shadow-sm ${isStolen ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50/60 border-blue-200/60 text-blue-900'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isStolen ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isStolen ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm">{isStolen ? '⚠ سرقة: Protocol الطوارئ Active' : 'TACTICAL STATUS: DEFCON-5 NOMINAL'}</span>
                    <span className={`text-[11px] ${isStolen ? 'text-red-700' : 'text-slate-500'}`}>{isStolen ? 'التتبع السري Active — AES-256 E2EE' : 'All systems operating within standard parameters. — DEFCON-5'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] sm:text-xs self-end sm:self-center">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400">Encryption</span>
                    <span className="font-bold">AES-256</span>
                  </div>
                  <div className="w-px h-7 bg-slate-200" />
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400">Protocol</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>
                  </div>
                </div>
              </div>

              {/* ── Map ── */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-sm relative">
                {/* Map container */}
                <div className="w-full min-h-[420px] h-[420px] rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
                  <div className="absolute inset-0 z-0">
                    {memoizedDeviceMap}
                  </div>

                  {/* HUD overlays */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex justify-between items-start pointer-events-none">
                    <div className="bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-lg p-2 flex flex-col gap-0.5 font-mono text-[9px] sm:text-[10px] pointer-events-auto">
                      <div className="flex flex-row items-center gap-3 mb-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <MapPin className="w-2.5 h-2.5 text-blue-600" />
                            <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-1">
                            <Crosshair className="w-2.5 h-2.5" />±{accuracy}m
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${latitude || 24.7136},${longitude || 46.6753}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all"
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-lg p-2 flex flex-col gap-0.5 font-mono text-[9px] sm:text-[10px] items-end">
                      <div className="flex items-center gap-1 text-slate-700 font-bold">
                        <span>{batteryLevel}%</span>
                        <Battery className={`w-2.5 h-2.5 ${batteryLevel > 20 ? 'text-emerald-500' : 'text-rose-500'}`} />
                      </div>
                      <div className={`flex items-center gap-1 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <Wifi className="w-2.5 h-2.5" />{isOnline ? 'Protocol: Active' : 'Offline'}
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg font-bold text-[9px] sm:text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />Safe Geofence
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Command Matrix — 2 cols mobile / 4 cols md+ ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {commands.map(({ label, sub, icon, color, onClick, disabled }) => (
                  <button key={label} onClick={onClick} disabled={disabled}
                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-sm hover:shadow-md active:scale-[.98] transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 disabled:cursor-not-allowed group">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${btnColors[color]}`}>
                      {icon}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[11px] sm:text-xs text-slate-800 leading-tight">{label}</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 leading-tight">{sub}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* ── Terminal Log ── */}
              <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 shadow-xl border border-slate-800 text-slate-300 font-mono text-xs h-48 sm:h-56 flex flex-col relative overflow-hidden mb-2">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 via-emerald-400 to-transparent opacity-60" />
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5 mb-2.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-[10px] text-slate-100 uppercase tracking-widest">Live Audit Stream</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 flex flex-col-reverse font-mono text-left" dir="ltr">
                  {(logs.length > 0) ? [...logs].reverse().map((log, i) => (
                    <div key={i} className="flex items-start gap-2 border-l-2 border-slate-700/50 pr-2">
                      <span className="text-slate-500 shrink-0 text-[9px] sm:text-[10px]">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                      <span className={`break-all text-[10px] sm:text-xs ${log.includes('ERROR') ? 'text-rose-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-300'}`}>
                        <span className="text-blue-400">$ </span>{log}
                      </span>
                    </div>
                  )) : (
                    <div className="flex items-start gap-2 border-l-2 border-slate-700/50 pr-2">
                      <span className="text-slate-500">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                      <span className="text-slate-400"><span className="text-blue-400">$ </span>Monitoring secure channels...</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"><VolumeX className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Silence Alert</h3>
            <p className="text-slate-500 text-xs mb-5">أدخل Password لSilence Alert.</p>
            <div className="relative mb-5">
              <input type={showPassword ? 'text' : 'password'} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none pl-10 font-mono text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleStopScream} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Confirm الPurge</h3>
            <p className="text-slate-500 text-xs mb-5">سيتم Wipe جميع بيانات الجهاز نهائياً.</p>
            <div className="relative mb-5">
              <input type={showPassword ? 'text' : 'password'} value={deletePasswordInput} onChange={e => setDeletePasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none pl-10 font-mono text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleDeleteDevice} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white disabled:opacity-50 text-sm">Purge</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"><ShieldCheck className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Cancel Mark Stolen</h3>
            <p className="text-slate-500 text-xs mb-5">أدخل رمز PIN المكون من 6 digits.</p>
            <input type="text" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-center tracking-[0.5em] font-mono text-2xl mb-5 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="000000" />
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleMarkFound} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showUnregisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Cancel تسجيل الجهاز</h3>
            <p className="text-slate-500 text-xs mb-5">لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="relative mb-5">
              <input type={showPassword ? 'text' : 'password'} value={deletePasswordInput} onChange={e => setDeletePasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none pl-10 font-mono text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowUnregisterModal(false); setUnregisterTarget(null); setDeletePasswordInput(''); }} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleUnregisterDevice} disabled={actionLoading || !deletePasswordInput} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white disabled:opacity-50 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} onUserUpdate={(u: any) => setUser({ ...user, ...u })} />
    </div>
  );
}
