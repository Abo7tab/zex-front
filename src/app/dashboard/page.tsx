"use client";

import { useEffect, useState } from 'react';
import { getMe, logout } from '@/lib/auth';
import { getDevices, locateDevice, screamDevice, stopScreamDevice, startSearchMode, stopSearchMode, markStolen, markFound, deleteDevice } from '@/lib/api/devices';
import { subscribeToDeviceState } from '@/lib/firebase';
import { useTerminalStore } from '@/store/useTerminalStore';
import { 
  Shield, User, Smartphone, Search, AlertTriangle, ShieldCheck, 
  Volume2, VolumeX, Battery, Wifi, Trash2, Menu, X, Settings, 
  Eye, EyeOff, LogOut, Radar, MapPin, Crosshair, Key, Gauge,
  Network, Lock, Bluetooth, BluetoothSearching, CheckCircle,
  Terminal, ShieldAlert
} from 'lucide-react';
import dynamic from 'next/dynamic';
const DeviceMap = dynamic(() => import('@/components/map/DeviceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-mono text-xs rounded-2xl">
      <span>جاري تحميل الخريطة التكتيكية C4ISR...</span>
    </div>
  ),
});
import SettingsModal from '@/components/modals/SettingsModal';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-mono dir-rtl" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-200">جاري تهيئة غرفة العمليات التكتيكية C4ISR...</span>
        <span className="text-xs text-slate-500 mt-1">Securing connection to ZEX Node...</span>
      </div>
    );
  }

  const [user, setUser] = useState<any>(null);
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
  
  const logs = useTerminalStore((state) => state.logs);
  const router = useRouter();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    getMe()
      .then((data) => setUser(data?.data || data))
      .catch(() => {
        router.push('/login');
      });
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
      const unsub = subscribeToDeviceState(device.device_uid, (data: any) => {
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
  const isBleMesh = locObj.provider === 'ble_mesh';
  
  const lastHb = statusObj?.last_heartbeat_at || device?.last_heartbeat_at;
  let isOnline = false;
  if (lastHb) {
    const hbTime = new Date(lastHb).getTime();
    if (!isNaN(hbTime) && hbTime > 0) {
      isOnline = (Date.now() - hbTime) < 2 * 60 * 1000;
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (device?.id && (rtState?.live_tracking || rtState?.stolen_mode)) {
      interval = setInterval(() => {
        locateDevice(device.id).catch(() => {});
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [device?.id, rtState?.live_tracking, rtState?.stolen_mode]);

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

  // Command Matrix Action Handlers
  const handleStartScream = async () => {
    if (!device) return;
    try { await screamDevice(device.id); setDevice((p: any) => ({...p, is_screaming: true})); setRtState((p: any) => p ? {...p, is_screaming: true} : null); fetchDevices(); } catch(e) { alert('فشل التشغيل'); }
  };

  const handleStopScreamClick = () => {
    if (!device) return;
    setShowPasswordModal(true);
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
    } catch(e) { alert('كلمة المرور غير صحيحة'); }
    finally { setActionLoading(false); }
  };

  const handleLocate = async () => {
    if (!device) return;
    try { await locateDevice(device.id); } catch(e) { alert('فشل تحديد الموقع'); }
  };

  const handleStartSearch = async () => {
    if (!device) return;
    try { await startSearchMode(device.id, 30); setDevice((p: any) => ({...p, is_searching: true})); setRtState((p: any) => p ? {...p, is_searching: true} : null); fetchDevices(); } catch(e) { alert('فشل بدء البحث'); }
  };

  const handleStopSearch = async () => {
    if (!device) return;
    try { await stopSearchMode(device.id); setDevice((p: any) => ({...p, is_searching: false})); setRtState((p: any) => p ? {...p, is_searching: false} : null); fetchDevices(); } catch(e) { alert('فشل إيقاف البحث'); }
  };

  const handleStartStolen = async () => {
    if (!device) return;
    try { await markStolen(device.id); setDevice((p: any) => ({...p, is_stolen: true})); setRtState((p: any) => p ? {...p, is_stolen: true} : null); fetchDevices(); } catch(e) { alert('فشل تفعيل وضع السرقة'); }
  };

  const handleStopStolenClick = () => {
    if (!device) return;
    setShowPinModal(true);
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
    } catch(e) { alert('رمز PIN غير صحيح'); }
    finally { setActionLoading(false); }
  };

  const handleDeleteClick = () => {
    if (!device) return;
    setShowDeleteModal(true);
  };

  const handleDeleteDevice = async () => {
    if (!device) return;
    setActionLoading(true);
    try {
      await deleteDevice(device.id, deletePasswordInput.trim());
      setShowDeleteModal(false);
      setDeletePasswordInput('');
      const remaining = devices.filter((d: any) => d.id !== device.id);
      setDevices(remaining);
      setDevice(remaining.length > 0 ? remaining[0] : null);
    } catch(e) { alert('فشل المسح أو كلمة المرور غير صحيحة'); }
    finally { setActionLoading(false); }
  };

  const handleUnregisterDevice = async () => {
    if (!unregisterTarget) return;
    setActionLoading(true);
    try {
      await deleteDevice(unregisterTarget.id, deletePasswordInput.trim());
      setShowUnregisterModal(false);
      setDeletePasswordInput('');
      const remaining = devices.filter((d: any) => d.id !== unregisterTarget.id);
      setDevices(remaining);
      if (device?.id === unregisterTarget.id) {
        setDevice(remaining.length > 0 ? remaining[0] : null);
      }
      setUnregisterTarget(null);
    } catch(e) { alert('كلمة المرور غير صحيحة أو فشل الحذف'); }
    setActionLoading(false);
  };

  const filteredDevices = devices.filter(d => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex selection:bg-blue-600 selection:text-white font-sans overflow-hidden" dir="rtl">
      
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Sidebar: Devices & Operator Intel */}
      <aside className="w-80 bg-white border-l border-slate-200/80 shadow-md hidden lg:flex flex-col z-20 h-screen relative shrink-0">
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">ZEX MILITARY</span>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider">SECURE OPERATIONS</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex flex-row items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-xs text-slate-800 truncate">{user?.name || 'Operator'}</span>
              <span className="text-[10px] text-slate-500 font-mono truncate">{user?.email || 'admin@c4isr.gov'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="flex flex-row items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex flex-row items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              الوحدات النشطة
            </span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">{devices?.length || 0} مقترن</span>
          </div>

          <div className="relative shrink-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="البحث عن عقدة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pr-9 pl-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner" 
            />
          </div>

          <div className="flex flex-col gap-2">
            {filteredDevices?.length > 0 ? (filteredDevices || []).map((d) => (
              <div 
                key={d.id} 
                onClick={() => setDevice(d)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${device?.id === d.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                <div className="flex flex-row items-center justify-between mb-2">
                  <div className="flex flex-row items-center gap-2">
                    <Smartphone className={`w-4 h-4 ${device?.id === d.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`font-bold text-xs ${device?.id === d.id ? 'text-blue-900' : 'text-slate-700'}`}>{d?.name || 'Unknown Device'}</span>
                  </div>
                  {d.is_stolen && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
                </div>
                <div className="flex flex-row items-center justify-between text-[10px] font-mono">
                  <span className={`${device?.id === d.id ? 'text-blue-600' : 'text-slate-500'} truncate mr-2`}>{d?.model || 'Generic Model'}</span>
                  <span className={`px-1.5 py-0.5 rounded flex flex-row items-center gap-1 shrink-0 ${d.battery_level > 20 ? (device?.id === d.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600') : 'bg-rose-100 text-rose-700'}`}>
                    <Battery className="w-3 h-3" />
                    {d?.battery_level ?? 0}%
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-xs text-slate-400 text-center py-4">لا توجد أجهزة مقترنة</div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-2 shrink-0 bg-slate-50/50">
          <button onClick={() => setIsSettingsOpen(true)} className="flex flex-row items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-2 px-3 hover:bg-white rounded-lg hover:shadow-sm">
            <Settings className="w-4 h-4" />
            إعدادات النظام
          </button>
          <button onClick={() => { logout(); router.push('/login'); }} className="flex flex-row items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors py-2 px-3 hover:bg-white rounded-lg hover:shadow-sm">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Operational Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Command Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 shadow-sm flex flex-row items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex flex-row items-center gap-4">
            <div className="lg:hidden flex flex-row items-center gap-3">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
                 {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex flex-row items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono">
              <Radar className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600 hidden sm:inline-block">NODE:</span>
              <span className="font-bold text-slate-900">{device?.device_uid || 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-row items-center gap-3">
            <div className="hidden sm:flex flex-row items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-rose-100 transition-colors" onClick={() => alert('SOS BROADCAST SENT')}>
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span>EMERGENCY SOS</span>
            </div>
            <div className="flex flex-row items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-1.5 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline-block">SYSTEM</span> ONLINE
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Operational DEFCON Banner */}
          <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border shadow-sm ${isStolen ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50/50 border-blue-200/60 text-blue-900'}`}>
            <div className="flex flex-row items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isStolen ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {isStolen ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm sm:text-base">
                  {isStolen ? 'حالة طوارئ: تم الإبلاغ عن سرقة الجهاز' : 'الحالة التكتيكية: مستقرة (DEFCON-5)'}
                </span>
                <span className={`text-xs ${isStolen ? 'text-red-700' : 'text-slate-500'}`}>
                  {isStolen ? 'بروتوكولات التتبع السري وتأمين البيانات نشطة بالكامل.' : 'جميع الأنظمة الدفاعية تعمل ضمن المعايير الطبيعية. لا توجد تهديدات.'}
                </span>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 sm:gap-4 font-mono text-[10px] sm:text-xs">
              <div className="flex flex-col items-end">
                <span className={`${isStolen ? 'text-red-600' : 'text-slate-400'}`}>تشفير القناة</span>
                <span className="font-bold">AES-256 E2EE</span>
              </div>
              <div className="w-px h-8 bg-slate-200/80"></div>
              <div className="flex flex-col items-end">
                <span className={`${isStolen ? 'text-red-600' : 'text-slate-400'}`}>بروتوكول الربط</span>
                <span className="font-bold text-emerald-600 flex flex-row items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  نشط
                </span>
              </div>
            </div>
          </div>

          {/* C4ISR Map Visualizer */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col gap-4 relative z-10 min-h-[450px] lg:h-[450px]">
            <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-300/80 relative shadow-inner bg-slate-100">
              
              {/* Actual Map */}
              <div className="absolute inset-0 z-0">
                <DeviceMap 
                  latitude={latitude} 
                  longitude={longitude} 
                  accuracy={accuracy}
                  isOnline={isOnline}
                  batteryLevel={batteryLevel}
                  deviceId={device?.device_uid}
                  history={locationHistory}
                />
              </div>

              {/* Map Vignette Overlay */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.03)] z-10"></div>
              
              {/* Reticle / Crosshair Overlay (Visual Only) */}
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center opacity-30 mix-blend-overlay">
                <div className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] border border-blue-500 rounded-full flex items-center justify-center relative">
                  <div className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] border border-emerald-500/50 rounded-full border-dashed animate-[spin_30s_linear_infinite]"></div>
                  <div className="w-full h-px bg-blue-500/50 absolute top-1/2 -translate-y-1/2"></div>
                  <div className="h-full w-px bg-blue-500/50 absolute left-1/2 -translate-x-1/2"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 absolute"></div>
                </div>
              </div>

              {/* Floating Top HUD Metrics */}
              <div className="absolute top-4 left-4 right-4 z-20 flex flex-row justify-between items-start pointer-events-none">
                <div className="bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-xl p-2.5 flex flex-col gap-1 font-mono text-[10px]">
                  <div className="flex flex-row items-center gap-2 text-slate-700 font-bold">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span>{latitude ? latitude.toFixed(6) : 'N/A'}, {longitude ? longitude.toFixed(6) : 'N/A'}</span>
                  </div>
                  <div className="text-slate-500 flex flex-row items-center gap-1 text-[9px]">
                    <Crosshair className="w-3 h-3" />
                    دقة التحديد: ±{accuracy || 0}m
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-xl p-2.5 flex flex-col gap-1.5 font-mono text-[10px] items-end">
                  <div className="flex flex-row items-center gap-1.5 text-slate-700 font-bold">
                    <span>{batteryLevel}%</span>
                    <Battery className={`w-3 h-3 ${batteryLevel > 20 ? 'text-emerald-500' : 'text-rose-500'}`} />
                  </div>
                  <div className={`flex flex-row items-center gap-1 text-[9px] ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <Wifi className="w-3 h-3" />
                    {isOnline ? 'متصل بالشبكة' : 'غير متصل'}
                  </div>
                </div>
              </div>

              {/* Geofence / Status Badge */}
              <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg shadow-sm font-bold text-[10px] flex flex-row items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  نطاق جغرافي آمن
                </div>
              </div>
            </div>
          </div>

          {/* Strict Command Matrix (8 Buttons EXACTLY as requested) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 z-10 shrink-0">
            {/* 1. Scream */}
            <button onClick={handleStartScream} disabled={isScreaming || !device} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Volume2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800">إطلاق إنذار صاخب</span>
                <span className="text-[10px] text-slate-500">Force Siren 🔊</span>
              </div>
            </button>

            {/* 2. Stop Scream */}
            <button onClick={handleStopScreamClick} disabled={!isScreaming || !device} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-400 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <VolumeX className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800">إيقاف الإنذار</span>
                <span className="text-[10px] text-slate-500">Mute Siren 🔇</span>
              </div>
            </button>

            {/* 3. Locate GPS */}
            <button onClick={handleLocate} disabled={!device} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800">تحديد الموقع (GPS)</span>
                <span className="text-[10px] text-slate-500">Track Location 📍</span>
              </div>
            </button>

            {/* 4. Start Search Mode */}
            <button onClick={handleStartSearch} disabled={isSearching || !device} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BluetoothSearching className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800">بدء البحث (BLE)</span>
                <span className="text-[10px] text-slate-500">Start Radar 📶</span>
              </div>
            </button>

            {/* 5. Stop Search Mode */}
            <button onClick={handleStopSearch} disabled={!isSearching || !device} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-400 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bluetooth className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800">إيقاف البحث</span>
                <span className="text-[10px] text-slate-500">Stop Radar 🛑</span>
              </div>
            </button>

            {/* 6. Mark Stolen */}
            <button onClick={handleStartStolen} disabled={isStolen || !device} className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm hover:shadow-md hover:border-rose-400 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-rose-700">وضع السرقة</span>
                <span className="text-[10px] text-rose-500/80">Mark Stolen 🚨</span>
              </div>
            </button>

            {/* 7. Mark Found */}
            <button onClick={handleStopStolenClick} disabled={!isStolen || !device} className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-emerald-700">إلغاء وضع السرقة</span>
                <span className="text-[10px] text-emerald-500/80">Mark Found ✅</span>
              </div>
            </button>

            {/* 8. Delete Device */}
            <button onClick={handleDeleteClick} disabled={!device} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-400 transition-all flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-700">مسح الجهاز</span>
                <span className="text-[10px] text-slate-500/80">Wipe & Delete 🗑️</span>
              </div>
            </button>
          </div>

          {/* Live Audit Stream Terminal Component */}
          <div className="bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-800 text-slate-300 font-mono text-xs h-64 flex flex-col relative z-10 overflow-hidden mb-6 shrink-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-400 to-transparent opacity-50"></div>
            
            <div className="flex flex-row items-center justify-between border-b border-slate-700/80 pb-3 mb-3 shrink-0">
              <div className="flex flex-row items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold tracking-widest text-[10px] text-slate-100 uppercase">Live Audit Stream</span>
              </div>
              <div className="flex flex-row items-center gap-2 text-[10px]">
                <span className="text-slate-500">SECURE SHELL</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col-reverse">
              {logs.length > 0 ? [...(logs || [])].reverse().map((log, index) => (
                <div key={index} className="flex flex-row items-start gap-2 border-l-2 border-slate-700/50 pl-2">
                  <span className="text-slate-500 shrink-0 text-[10px]">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
                  <span className={`break-words ${log.includes('ERROR') ? 'text-rose-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-300'}`}>
                    <span className="text-blue-400 mr-1">$</span>
                    {log}
                  </span>
                </div>
              )) : (
                <div className="flex flex-row items-start gap-2 border-l-2 border-slate-700/50 pl-2">
                  <span className="text-slate-500 shrink-0">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
                  <span className="text-slate-400">
                    <span className="text-blue-400 mr-1">$</span>
                    Waiting for API activity...
                  </span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>

      {/* Modals from old UI adapted to Light Theme */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center" dir="rtl">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <VolumeX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">إيقاف الإنذار</h3>
            <p className="text-slate-500 text-xs mb-6">يرجى إدخال كلمة المرور لتأكيد إيقاف الإنذار.</p>
            <div className="relative mb-6">
              <input type={showPassword ? "text" : "password"} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10 font-mono tracking-widest text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-sm">إلغاء</button>
              <button onClick={handleStopScream} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-md text-sm">تأكيد الإيقاف</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center" dir="rtl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-500 text-xs mb-6">هل أنت متأكد من حذف الجهاز؟ سيتم مسح جميع البيانات.</p>
            <div className="relative mb-6">
              <input type={showPassword ? "text" : "password"} value={deletePasswordInput} onChange={e => setDeletePasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none pr-10 font-mono tracking-widest text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-sm">إلغاء</button>
              <button onClick={handleDeleteDevice} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 shadow-md text-sm">حذف نهائي</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center" dir="rtl">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">إلغاء وضع السرقة</h3>
            <p className="text-slate-500 text-xs mb-6">أدخل رمز PIN المكون من 6 أرقام لتأكيد استعادة الجهاز.</p>
            <input type="text" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g,''))} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-center tracking-[0.5em] font-mono text-2xl mb-6 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="000000" />
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-sm">إلغاء</button>
              <button onClick={handleMarkFound} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-md text-sm">تأكيد الاستعادة</button>
            </div>
          </div>
        </div>
      )}

      {showUnregisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 text-center" dir="rtl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">إلغاء تسجيل الجهاز</h3>
            <p className="text-slate-500 text-xs mb-6">سيتم إزالة الجهاز من لوحة التحكم، لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="relative mb-6">
              <input type={showPassword ? "text" : "password"} value={deletePasswordInput} onChange={e => setDeletePasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none pr-10 font-mono tracking-widest text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => {setShowUnregisterModal(false); setUnregisterTarget(null); setDeletePasswordInput('');}} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-sm">إلغاء</button>
              <button onClick={handleUnregisterDevice} disabled={actionLoading || !deletePasswordInput} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 shadow-md text-sm">تأكيد المسح</button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user} 
        onUserUpdate={(u: any) => setUser({ ...user, ...u })} 
      />

    </div>
  );
}
