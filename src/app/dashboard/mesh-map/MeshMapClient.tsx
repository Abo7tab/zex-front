'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';

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

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Fleet Offline & Mesh Map</h1>
        <p className="text-slate-400 text-sm">
          Real-time visualization of offline intercepts. Shows when a Commander phone detects a Target offline (e.g. via SMS Relay or BLE).
        </p>
      </div>
      <div className="flex-1 relative m-6 mt-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
        <MeshLeafletMap logs={logs} />
      </div>
    </div>
  );
}
