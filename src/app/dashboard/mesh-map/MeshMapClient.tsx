'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import {
  ArrowRight, Bluetooth, MessageSquare, MapPin, Clock,
  Activity, Trash2, ChevronDown, RefreshCw, Shield, Map,
  ExternalLink, Wifi, WifiOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const MeshLeafletMap = dynamic(() => import('./MeshLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-mono text-xs animate-pulse">
      <p>Loading Map...</p>
    </div>
  ),
});

export default function MeshMapClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(30);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const logSignature = useRef('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
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
    <div className="bg-slate-50 min-h-screen flex font-sans" dir="ltr">
      {/* ── Subtle grid overlay ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* ── Sidebar ── */}
      <aside className="w-72 xl:w-80 bg-white border-r border-slate-200/80 shadow-sm hidden lg:flex flex-col z-20 h-screen shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">ZEX MILITARY</span>
              <span className="text-[10px] font-semibold text-slate-500">Offline Mesh Map</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-blue-600" /> Filter Events
          </span>

          <div className="flex flex-col gap-1">
            {[
              { id: 'all', label: 'All Events', count: logs.length },
              { id: 'BLE', label: 'BLE Discoveries', icon: <Bluetooth className="w-3 h-3 text-indigo-500" /> },
              { id: 'SMS', label: 'SMS Relays', icon: <MessageSquare className="w-3 h-3 text-emerald-500" /> },
              { id: 'LOCATION', label: 'With GPS', count: locationCount, icon: <MapPin className="w-3 h-3 text-blue-500" /> },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setVisibleCount(30); setSelectedIds([]); }}
                className={`flex items-center justify-between gap-2 text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors ${filter === f.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 border border-transparent'}`}
              >
                <span className="flex items-center gap-2">{f.icon}<span>{f.label}</span></span>
                {f.count !== undefined && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{f.count}</span>}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total events</span>
              <span className="font-bold text-slate-800">{logs.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">With GPS</span>
              <span className="font-bold text-blue-700">{locationCount}</span>
            </div>
            {lastUpdated && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Updated</span>
                <span className="font-mono text-slate-600 text-[10px]">{lastUpdated.toLocaleTimeString('en-GB')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="p-3 border-t border-slate-100 flex flex-col gap-1 bg-slate-50/50">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
            <ArrowRight className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <button onClick={() => router.push('/logs')} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
            <Activity className="w-3.5 h-3.5" /> Fleet Activities Log
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="lg:hidden inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <ArrowRight className="w-3.5 h-3.5" /> Dashboard
            </button>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">Fleet Offline & Mesh Map</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">{logs.length} events · {locationCount} GPS</span>
            <button onClick={fetchLogs} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-blue-50/50 border-b border-blue-100 px-4 sm:px-6 py-2 hidden md:block">
          <p className="text-xs text-blue-700/80">Historical view of offline discoveries. Markers appear only when SMS or BLE events include GPS coordinates.</p>
        </div>

        {/* Mobile Filter Tabs */}
        <div className="lg:hidden px-4 py-2 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto shrink-0">
          {[['all','All'], ['BLE','BLE'], ['SMS','SMS'], ['LOCATION','GPS']].map(([id, label]) => (
            <button key={id} onClick={() => { setFilter(id); setVisibleCount(30); }} className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${filter === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Content: Map + List */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">

          {/* Map */}
          <div className="relative flex-1 min-h-[360px] xl:min-h-0 border-b xl:border-b-0 xl:border-r border-slate-200">
            <MeshLeafletMap logs={filteredLogs} />
          </div>

          {/* Event List Panel */}
          <div className="w-full xl:w-[420px] flex flex-col bg-white shrink-0 h-[420px] xl:h-auto overflow-hidden">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Offline Events</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">{visibleLogs.length} of {filteredLogs.length} shown</p>
              </div>
              <button
                onClick={() => deleteLogs(selectedIds)}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-[10px] font-bold text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete ({selectedIds.length})
              </button>
            </div>

            {/* Scrollable Events */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {visibleLogs.map((log, index) => {
                const source = String(log?.payload?.source || log?.action || 'SYSTEM').toUpperCase();
                const hasLocation = log?.payload?.lat != null && log?.payload?.lng != null;
                const isBLE = source.includes('BLE');
                const isSMS = source.includes('SMS');
                const isExpanded = expandedId === Number(log.id);

                return (
                  <div key={`${log.id || 'event'}-${index}`} className="hover:bg-slate-50 transition-colors">
                    {/* Main Row */}
                    <div className="px-3 py-2.5 flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select event ${log.id || index}`}
                        checked={selectedIds.includes(Number(log.id))}
                        onChange={() => toggleSelected(Number(log.id))}
                        className="accent-blue-600 shrink-0 mt-1"
                      />

                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isBLE ? 'bg-indigo-50' : isSMS ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                        {isBLE ? <Bluetooth className="w-3.5 h-3.5 text-indigo-600" /> :
                          isSMS ? <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> :
                          <Activity className="w-3.5 h-3.5 text-slate-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Source + Time */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{source}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-GB') : '--'}
                          </span>
                        </div>

                        {/* Target + Relay */}
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400 font-semibold w-9 shrink-0">Target</span>
                            <span className="font-bold text-slate-800 truncate">{log.target_device_name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400 font-semibold w-9 shrink-0">Relay</span>
                            <span className="text-slate-600 truncate">{log.device_name || 'Unknown'}</span>
                          </div>
                        </div>

                        {/* Expand/Collapse Button */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : Number(log.id))}
                          className="mt-1.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {isExpanded ? '▲ Less' : '▼ Details'}
                          {hasLocation && !isExpanded && <MapPin className="w-2.5 h-2.5 text-blue-400 ml-1" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 ml-[52px] flex flex-col gap-2">
                        {/* Message */}
                        <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100">
                          {log.message || 'Activity logged'}
                        </p>

                        {/* Location */}
                        {hasLocation ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="text-[11px] font-bold text-blue-800">GPS Location Captured</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-xs text-blue-700 bg-white rounded-md px-2 py-1.5 border border-blue-100">
                              📍 {Number(log.payload.lat).toFixed(6)}, {Number(log.payload.lng).toFixed(6)}
                            </div>
                            <a
                              href={`https://www.google.com/maps?q=${log.payload.lat},${log.payload.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg py-2 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View on Google Maps
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
                            <WifiOff className="w-3.5 h-3.5 shrink-0" /> No GPS coordinates in this event
                          </div>
                        )}

                        {/* Distance */}
                        {log.payload?.distance_meters != null && (
                          <div className="flex items-center gap-2 text-[11px] bg-cyan-50 border border-cyan-100 rounded-lg px-2.5 py-2">
                            <Wifi className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <span className="text-cyan-700 font-bold">{Number(log.payload.distance_meters).toFixed(1)}m</span>
                            <span className="text-cyan-600">· {log.payload.proximity || 'SEARCHING'}</span>
                          </div>
                        )}

                        {/* Date */}
                        <p className="text-[10px] text-slate-400 font-mono text-right">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB') : '--'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="px-4 py-16 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="text-sm text-slate-400 font-semibold">No events match this filter</span>
                  <span className="text-xs text-slate-300">SMS/BLE offline events will appear here</span>
                </div>
              )}

              {visibleCount < filteredLogs.length && (
                <div className="p-4">
                  <button
                    onClick={() => setVisibleCount(c => c + 30)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2.5 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" /> Show more events
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
