'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { ArrowLeft, MapPinned } from 'lucide-react';
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

  return (
    <div className="flex flex-col min-h-screen h-screen bg-slate-900 text-slate-100">
      <div className="p-4 sm:p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <span className="inline-flex items-center gap-2 text-xs text-slate-400"><MapPinned className="w-4 h-4" /> {logs.length} events</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Fleet Offline & Mesh Map</h1>
        <p className="text-slate-400 text-sm">
          Real-time visualization of offline intercepts. Shows when a Commander phone detects a Target offline (e.g. via SMS Relay or BLE).
        </p>
      </div>
      <div className="relative mx-4 sm:mx-6 mt-4 mb-6 h-[calc(100vh-190px)] min-h-[420px] rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
        <MeshLeafletMap logs={logs} />
      </div>
    </div>
  );
}
