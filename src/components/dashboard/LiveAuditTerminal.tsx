"use client";

import { useTerminalStore } from '@/store/useTerminalStore';

export default function LiveAuditTerminal() {
  const logs = useTerminalStore((state) => state.logs);

  return (
    <section className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-30 overflow-hidden rounded-xl border border-cyan-400/20 bg-[#0A0F16]/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-cyan-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">
        <span>Live Audit Terminal</span>
        <span className="text-emerald-300">{logs.length ? 'ONLINE' : 'READY'}</span>
      </div>
      <div className="max-h-28 overflow-y-auto px-3 py-2 font-mono text-[10px] leading-5 text-slate-300">
        {logs.length ? logs.map((log, index) => <div key={`${log}-${index}`}>{log}</div>) : <div className="text-slate-500">Waiting for API activity...</div>}
      </div>
    </section>
  );
}
