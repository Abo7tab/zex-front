'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { ArrowLeft, MapPinned, Bluetooth, MessageSquare, MapPin, Clock, Activity, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
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
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const logSignature = useRef('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/logs');
      setLastUpdated(new Date());
      const nextLogs = Array.isArray(res.data) ? res.data : [];
      const signature = nextLogs.map((log: any) => `${log.id}:${log.timestamp}:${log.action}`).join('|');
      if (signature !== logSignature.current) {
        logSignature.current = signature;
        setLogs(nextLogs);
      }
    } catch (err) {
      console.error('Failed to fetch offline events:', err);
    } finally { setRefreshing(false); }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 20000);
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
  const visibleLogs = filteredLogs.slice(0, visibleCount);

  const toggleSelected = (id: number) => {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const deleteLogs = async (ids: number[]) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length} activity record(s)?`)) return;
    await Promise.all(ids.map(id => api.delete(`/logs/${id}`)));
    setLogs(current => current.filter(log => !ids.includes(Number(log.id))));
    setSelectedIds(current => current.filter(id => !ids.includes(id)));
  };

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
            <button onClick={fetchLogs} disabled={refreshing} title="Refresh offline events" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Fleet Offline & Mesh Map</h1>
        <p className="text-slate-400 text-sm">
          Historical view of offline discoveries. A marker appears only when an SMS or BLE event includes coordinates; ordinary commands remain activity-only.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[['all', 'All events'], ['BLE', 'BLE discoveries'], ['SMS', 'SMS relays'], ['LOCATION', 'With coordinates']].map(([id, label]) => (
            <button key={id} onClick={() => { setFilter(id); setVisibleCount(20); setSelectedIds([]); }} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold border ${filter === id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{visibleLogs.length} of {filteredLogs.length} shown</span>
            {lastUpdated && <span className="hidden sm:inline text-[10px] text-slate-500">Updated {lastUpdated.toLocaleTimeString('en-GB')}</span>}
            <button onClick={() => deleteLogs(selectedIds)} disabled={selectedIds.length === 0} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-400/30 px-2.5 py-1.5 text-[10px] font-bold text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-500/20">
              <Trash2 className="w-3 h-3" /> Delete selected ({selectedIds.length})
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-700">
          {visibleLogs.map((log, index) => {
            const source = String(log?.payload?.source || log?.action || 'SYSTEM').toUpperCase();
            const hasLocation = log?.payload?.lat != null && log?.payload?.lng != null;
            return (
              <div key={`${log.id || 'event'}-${index}`} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <input type="checkbox" aria-label={`Select event ${log.id || index}`} checked={selectedIds.includes(Number(log.id))} onChange={() => toggleSelected(Number(log.id))} className="accent-blue-500 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    {source.includes('BLE') ? <Bluetooth className="w-3.5 h-3.5 text-indigo-400" /> : source.includes('SMS') ? <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Activity className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{source}</span>
                    <span className="text-slate-500">Target: {log.payload?.target_uid || 'Unknown device'}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 truncate">{log.message || 'Activity logged'} · Relay: {log.device_name || 'Unknown device'}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono shrink-0">
                  {hasLocation ? <a className="text-blue-400 hover:underline" href={`https://www.google.com/maps?q=${log.payload.lat},${log.payload.lng}`} target="_blank" rel="noreferrer">{log.payload.lat}, {log.payload.lng}</a> : <span className="text-amber-400">No coordinates</span>}
                  {log.payload?.distance_meters != null && <span className="text-cyan-300">{Number(log.payload.distance_meters).toFixed(1)}m · {log.payload.proximity || 'SEARCHING'}</span>}
                  <span className="text-slate-500 inline-flex items-center gap-1"><Clock className="w-3 h-3" />{log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB') : '--'}</span>
                </div>
              </div>
            );
          })}
          {filteredLogs.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-500">No events match this filter.</div>}
        </div>
        {visibleCount < filteredLogs.length && (
          <div className="border-t border-slate-700 p-3 text-center">
            <button onClick={() => setVisibleCount(current => current + 20)} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-600">
              <ChevronDown className="w-3.5 h-3.5" /> Show more events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
