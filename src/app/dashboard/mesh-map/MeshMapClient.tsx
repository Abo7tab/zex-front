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
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 pb-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 shrink-0 self-start sm:self-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Activity className="w-4 h-4" /> {logs.length} events</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400"><MapPin className="w-4 h-4" /> {locationCount} locs</span>
            <button onClick={fetchLogs} disabled={refreshing} title="Refresh offline events" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Fleet Offline & Mesh Map</h1>
        <p className="text-slate-400 text-sm hidden md:block">
          Historical view of offline discoveries. A marker appears only when an SMS or BLE event includes coordinates.
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

      {/* Main Content Area (Map + Side Panel) */}
      <div className="flex flex-col lg:flex-row flex-1 px-4 sm:px-6 pb-6 gap-4 overflow-hidden">
        
        {/* Map Container */}
        <div className="relative flex-1 min-h-[400px] lg:min-h-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
          <MeshLeafletMap logs={filteredLogs} />
        </div>

        {/* Side Panel: Event List */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col rounded-xl border border-slate-700 bg-slate-800 overflow-hidden shrink-0 h-[500px] lg:h-auto">
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-700 flex flex-col gap-2 shrink-0 bg-slate-800/80 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Offline Event Details</h2>
              <button onClick={() => deleteLogs(selectedIds)} disabled={selectedIds.length === 0} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-400/30 px-2 py-1 text-[10px] font-bold text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-500/20">
                <Trash2 className="w-3 h-3" /> Delete ({selectedIds.length})
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{visibleLogs.length} of {filteredLogs.length} shown</span>
              {lastUpdated && <span className="text-[10px] text-slate-500">Updated {lastUpdated.toLocaleTimeString('en-GB')}</span>}
            </div>
          </div>

          {/* Panel Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
            {visibleLogs.map((log, index) => {
              const source = String(log?.payload?.source || log?.action || 'SYSTEM').toUpperCase();
              const hasLocation = log?.payload?.lat != null && log?.payload?.lng != null;
              return (
                <div key={`${log.id || 'event'}-${index}`} className="px-4 py-3 flex gap-3 hover:bg-slate-700/30 transition-colors">
                  <input type="checkbox" aria-label={`Select event ${log.id || index}`} checked={selectedIds.includes(Number(log.id))} onChange={() => toggleSelected(Number(log.id))} className="accent-blue-500 shrink-0 mt-0.5" />
                  
                  {/* Event Card Content */}
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
                        {source.includes('BLE') ? <Bluetooth className="w-3 h-3 text-indigo-400" /> : source.includes('SMS') ? <MessageSquare className="w-3 h-3 text-emerald-400" /> : <Activity className="w-3 h-3 text-slate-400" />}
                        {source}
                      </span>
                      <span className="text-[10px] text-slate-500 inline-flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--'}
                      </span>
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wide w-12 shrink-0">Target</span>
                        <span className="truncate font-mono font-medium text-indigo-300">{log.target_device_name || log.payload?.target_uid || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300 mt-0.5">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wide w-12 shrink-0">Relay</span>
                        <span className="truncate font-mono">{log.device_name || 'Unknown'}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {log.message || 'Activity logged'}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono">
                      {hasLocation ? (
                        <a className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline bg-blue-500/10 px-2 py-0.5 rounded" href={`https://www.google.com/maps?q=${log.payload.lat},${log.payload.lng}`} target="_blank" rel="noreferrer">
                          📍 {Number(log.payload.lat).toFixed(5)}, {Number(log.payload.lng).toFixed(5)}
                        </a>
                      ) : (
                        <span className="text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded">No GPS</span>
                      )}
                      
                      {log.payload?.distance_meters != null && (
                        <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                          {Number(log.payload.distance_meters).toFixed(1)}m · {log.payload.proximity || 'NEAR'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="px-4 py-12 text-center flex flex-col items-center justify-center gap-2">
                <Activity className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                <span className="text-sm text-slate-400 font-medium">No events match this filter</span>
              </div>
            )}
            
            {/* Load More Button */}
            {visibleCount < filteredLogs.length && (
              <div className="p-4 text-center border-t border-slate-700/50">
                <button onClick={() => setVisibleCount(current => current + 20)} className="inline-flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full justify-center">
                  <ChevronDown className="w-3.5 h-3.5" /> Show more events
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
