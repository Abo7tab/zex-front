'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { ArrowLeft, MapPinned, Bluetooth, MessageSquare, MapPin, Clock, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MeshLeafletMap = dynamic(() => import('./MeshLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 font-mono text-xs animate-pulse">
      <p>Initializing Secure Mesh Map...</p>
    </div>
  ),
});

export default function MeshMapClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch offline events:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    const source = String(log?.payload?.source || log?.action || '').toUpperCase();
    if (filter === 'BLE') return source.includes('BLE');
    if (filter === 'SMS') return source.includes('SMS');
    if (filter === 'LOCATION') return log?.payload?.lat != null && log?.payload?.lng != null;
    return true;
  });
  const locationCount = logs.filter(log => log?.payload?.lat != null && log?.payload?.lng != null).length;

  return (
    <div className="flex flex-col min-h-screen h-screen bg-slate-900 text-slate-100">
      <div className="p-4 sm:p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2"><Activity className="w-4 h-4" /> {logs.length} events</span>
            <span className="inline-flex items-center gap-2 text-emerald-400"><MapPin className="w-4 h-4" /> {locationCount} locations</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Fleet Offline & Mesh Map</h1>
        <p className="text-slate-400 text-sm">
          Historical view of offline discoveries. A marker appears only when an SMS or BLE event includes coordinates; ordinary commands remain activity-only.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[['all', 'All events'], ['BLE', 'BLE discoveries'], ['SMS', 'SMS relays'], ['LOCATION', 'With coordinates']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold border ${filter === id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
              {id === 'BLE' ? <Bluetooth className="w-3.5 h-3.5" /> : id === 'SMS' ? <MessageSquare className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative mx-4 sm:mx-6 mt-4 mb-6 h-[calc(100vh-190px)] min-h-[420px] rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
        <MeshLeafletMap logs={filteredLogs} />
      </div>
      <div className="mx-4 sm:mx-6 mb-6 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Offline Event Details</h2>
          <span className="text-xs text-slate-400">{filteredLogs.length} shown</span>
        </div>
        <div className="divide-y divide-slate-700">
          {filteredLogs.slice(0, 20).map((log, index) => {
            const source = String(log?.payload?.source || log?.action || 'SYSTEM').toUpperCase();
            const hasLocation = log?.payload?.lat != null && log?.payload?.lng != null;
            return (
              <div key={`${log.id || 'event'}-${index}`} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    {source.includes('BLE') ? <Bluetooth className="w-3.5 h-3.5 text-indigo-400" /> : source.includes('SMS') ? <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Activity className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{source}</span>
                    <span className="text-slate-500">{log.device_name || 'Unknown device'}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 truncate">{log.message || 'Activity logged'}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono shrink-0">
                  {hasLocation ? <a className="text-blue-400 hover:underline" href={`https://www.google.com/maps?q=${log.payload.lat},${log.payload.lng}`} target="_blank" rel="noreferrer">{log.payload.lat}, {log.payload.lng}</a> : <span className="text-amber-400">No coordinates</span>}
                  <span className="text-slate-500 inline-flex items-center gap-1"><Clock className="w-3 h-3" />{log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB') : '--'}</span>
                </div>
              </div>
            );
          })}
          {filteredLogs.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-500">No events match this filter.</div>}
        </div>
      </div>
    </div>
  );
}
