"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Cpu, Battery, Activity, ShieldAlert, VolumeX, MapPin, 
  Radio, Lock, Unlock, Trash2, Smartphone, Signal, Wifi, Copy, CheckCircle2 
} from 'lucide-react';
import { getDevice, screamDevice, stopScreamDevice, locateDevice, startSearchMode, stopSearchMode, markStolen, markFound, deleteDevice } from '@/lib/api/devices';

export default function DeviceDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  function isDeviceOnline(d: any): boolean {
    if (!d) return false;
    const lastSeen = d.last_heartbeat_at || d.last_seen_at || d.last_heartbeat;
    if (!lastSeen) return false;
    const t = new Date(lastSeen).getTime();
    if (isNaN(t) || t <= 0) return false;
    return (now - t) < 60000;
  }

  useEffect(() => {
    fetchDevice();
  }, [id]);

  const fetchDevice = async () => {
    try {
      const data = await getDevice(id);
      setDevice(data);
    } catch (err) {
      console.error('Failed to fetch device details:', err);
    } finally {
      setLoading(false);
    }
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

  const handleCommand = async (commandName: string) => {
    if (!device) return;

    setActionLoading(true);
    try {
      if (commandName === 'scream') await screamDevice(device.id);
      else if (commandName === 'stop_scream') {
        const pwd = prompt('Enter your operator password to mute the alarm:');
        if (!pwd) return;
        await stopScreamDevice(device.id, pwd);
      }
      else if (commandName === 'get_location') await locateDevice(device.id);
      else if (commandName === 'start_search') await startSearchMode(device.id);
      else if (commandName === 'stop_search') await stopSearchMode(device.id);
      else if (commandName === 'mark_stolen') await markStolen(device.id);
      else if (commandName === 'unmark_stolen') {
        const pin = prompt('Enter the 6-digit Authorization PIN to recover device:');
        if (!pin) return;
        await markFound(device.id, pin);
      }
      else if (commandName === 'wipe') {
        const pwd = prompt('DANGER: Enter your password to permanently WIPE this device:');
        if (!pwd) return;
        await deleteDevice(device.id, pwd);
        alert('Device wiped and removed from registry.');
        router.push('/dashboard');
        return;
      }
      
      alert(`Command [${commandName.toUpperCase()}] executed successfully.`);
      fetchDevice(); // refresh state
    } catch (err) {
      console.error(err);
      alert('Command failed to execute. Verify your permissions or device connection.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyTelemetry = () => {
    if (!device) return;
    navigator.clipboard.writeText(JSON.stringify(device, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const syntaxHighlight = (json: string) => {
    if (!json) return '';
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'text-blue-500'; 
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-indigo-400 font-semibold'; 
        } else {
          cls = 'text-emerald-500'; 
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-rose-500 font-bold'; 
      } else if (/null/.test(match)) {
        cls = 'text-slate-400 italic'; 
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
          <span className="text-sm font-bold text-slate-500">Loading Diagnostics...</span>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans gap-4">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
          <Cpu className="w-8 h-8" />
        </div>
        <span className="text-slate-500 font-bold">Device not found in active registry.</span>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md">
          Return to Command
        </button>
      </div>
    );
  }

  const isOnline = isDeviceOnline(device);
  const battery = device.battery_level ?? 0;
  
  const commands = [
    { id: 'scream', label: 'Force Loud Siren', icon: ShieldAlert, color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-300' },
    { id: 'stop_scream', label: 'Mute Alarm', icon: VolumeX, color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300' },
    { id: 'get_location', label: 'Fetch Coordinates', icon: MapPin, color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300' },
    { id: 'start_search', label: 'Local Beacon Mode', icon: Radio, color: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300' },
    { id: 'stop_search', label: 'Disable Beacon', icon: Signal, color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300' },
    { id: 'mark_stolen', label: 'Lock Protocol', icon: Lock, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300' },
    { id: 'unmark_stolen', label: 'Recovered Status', icon: Unlock, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' },
    { id: 'wipe', label: 'Permanent Purge', icon: Trash2, color: 'bg-red-600 text-white border-red-700 hover:bg-red-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 sm:p-8" dir="ltr">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <button onClick={() => router.push('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 shrink-0">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {getTacticalName(device)}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {device.device_uid || device.uid || 'UNKNOWN-UID'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${battery > 20 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  <Battery className="w-3 h-3" />
                  {battery}%
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Diagnostic Metrics Grid */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                <Activity className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Diagnostic Metrics</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">OPERATING SYSTEM</span>
                  <span className="text-sm font-semibold text-slate-700">Android {device.android_version || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">LAST HEARTBEAT</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {device.last_heartbeat ? new Date(device.last_heartbeat).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' }) : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">TRACKING PROTOCOL</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                    <Wifi className="w-3 h-3" /> Enabled
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">LOCAL BEACON (BLE)</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg border ${device.search_mode ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                    <Radio className="w-3 h-3" /> {device.search_mode ? 'Active Broadcasting' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">STOLEN STATUS</span>
                  {device.is_stolen ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                      <Lock className="w-3 h-3" /> Lock Protocol Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      <Unlock className="w-3 h-3" /> Nominal
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Quick Action Command Bar */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                <Cpu className="w-4 h-4 text-slate-800" />
                <h2 className="text-sm font-bold text-slate-800">Quick Action Command Bar</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {commands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button 
                      key={cmd.id}
                      onClick={() => handleCommand(cmd.id)}
                      disabled={actionLoading}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-[0.98] ${cmd.color} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold text-center leading-tight">{cmd.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Telemetry JSON Inspector */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800">Telemetry Payload (JSON)</h2>
                </div>
                <button 
                  onClick={copyTelemetry}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <div className="flex-1 bg-[#1e1e2e] rounded-2xl p-4 overflow-auto relative">
                <pre 
                  className="text-xs font-mono leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(device, null, 2)) }}
                />
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
