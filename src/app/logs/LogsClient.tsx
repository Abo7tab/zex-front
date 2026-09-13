"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Shield, Search, X, Copy, Check, ChevronLeft, ChevronRight, ArrowRight, Eye, Code } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SeverityBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  const labels: Record<string, string> = { critical: 'حرج', warning: 'تحذير', info: 'معلومات' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[s] || map.info}`}>{labels[s] || s}</span>;
}

const MOCK_LOGS = [
  { id: 1, timestamp: new Date(Date.now() - 300000).toISOString(), device_uid: 'zex-uid-350f22', type: 'SCREAM_ACTIVATED', severity: 'critical', operator: 'admin@c4isr.gov', payload: { action: 'scream', device_id: 1, duration_ms: 5000 } },
  { id: 2, timestamp: new Date(Date.now() - 600000).toISOString(), device_uid: 'zex-uid-a1b2c3', type: 'DEVICE_LOCATED', severity: 'info', operator: 'admin@c4isr.gov', payload: { lat: 24.71, lng: 46.67, accuracy: 12 } },
  { id: 3, timestamp: new Date(Date.now() - 900000).toISOString(), device_uid: 'zex-uid-350f22', type: 'STOLEN_REPORTED', severity: 'critical', operator: 'admin@c4isr.gov', payload: { reported_at: new Date().toISOString(), auto_scream: true } },
  { id: 4, timestamp: new Date(Date.now() - 1200000).toISOString(), device_uid: 'zex-uid-a1b2c3', type: 'SEARCH_MODE_START', severity: 'warning', operator: 'system', payload: { interval_seconds: 30 } },
  { id: 5, timestamp: new Date(Date.now() - 1800000).toISOString(), device_uid: 'zex-uid-350f22', type: 'DEVICE_LOGIN', severity: 'info', operator: 'system', payload: { ip: '192.168.1.1', user_agent: 'ZEX-Android/2.1' } },
  { id: 6, timestamp: new Date(Date.now() - 86400000).toISOString(), device_uid: 'zex-uid-99f5e1', type: 'GEOFENCE_BREACH', severity: 'critical', operator: 'system', payload: { lat: 24.75, lng: 46.69, distance_m: 540, radius_m: 500 } },
  { id: 7, timestamp: new Date(Date.now() - 90000000).toISOString(), device_uid: 'zex-uid-99f5e1', type: 'DATA_WIPE_INITIATED', severity: 'critical', operator: 'admin@c4isr.gov', payload: { target_device: 'zex-uid-99f5e1', auth_method: 'PASSWORD', auth_status: 'SUCCESS' } },
];

export default function LogsClient() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try to fetch real logs, fallback to mock
    api.get('/logs')
      .then(res => {
        if (res.data && res.data.length > 0) setLogs(res.data);
        else setLogs(MOCK_LOGS);
      })
      .catch(() => {
        setLogs(MOCK_LOGS);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (selectedLog?.payload) {
      navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        String(log.device_uid).toLowerCase().includes(q) ||
        String(log.type).toLowerCase().includes(q) ||
        String(log.operator).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  const criticalCount = logs.filter(l => l.severity === 'critical').length;
  const lastTime = logs.length > 0 ? new Date(logs[0].timestamp).toLocaleTimeString('ar-SA') : '-';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight hidden sm:block">ZEX SECURITY — سجل التدقيق الجنائي</span>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight sm:hidden">سجل التدقيق</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">العودة للغرفة</span>
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-5">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-xs text-slate-500 font-bold mb-1">إجمالي الأحداث</span>
            <span className="text-2xl font-black text-slate-800">{logs.length}</span>
          </div>
          <div className="bg-red-50 border border-red-200 shadow-sm rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-xs text-red-600 font-bold mb-1">الأحداث الحرجة</span>
            <span className="text-2xl font-black text-red-700">{criticalCount}</span>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-xs text-slate-500 font-bold mb-1">آخر نشاط مسجل</span>
            <span className="text-lg font-black text-slate-800 font-mono mt-1">{lastTime}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث: معرف الجهاز، المشغل، نوع العملية..." 
              value={search}
              onChange={e => {setSearch(e.target.value); setPage(1);}}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto shrink-0">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'critical', label: 'حرج' },
              { id: 'warning', label: 'تحذير' },
              { id: 'info', label: 'معلومات' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => {setFilterSeverity(tab.id); setPage(1);}}
                className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${filterSeverity === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[400px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <tr>
                  <th className="px-4 py-3">الوقت والتاريخ</th>
                  <th className="px-4 py-3">العقدة / الجهاز</th>
                  <th className="px-4 py-3">الخطورة</th>
                  <th className="px-4 py-3">نوع العملية</th>
                  <th className="px-4 py-3">المشغل</th>
                  <th className="px-4 py-3 w-16">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${log.severity === 'critical' ? 'border-r-4 border-r-red-500 bg-red-50/20' : log.severity === 'warning' ? 'border-r-4 border-r-yellow-400 bg-yellow-50/20' : 'border-r-4 border-r-transparent'}`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500" dir="ltr">
                        {new Date(log.timestamp).toLocaleString('en-GB')}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 text-xs font-mono">
                        {log.device_uid}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge s={log.severity} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
                        {log.type}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {log.operator}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Shield className="w-8 h-8 opacity-20" />
                        <span className="text-sm font-bold">لا توجد سجلات مطابقة للبحث</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">صفحة {page} من {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden" dir="rtl">
            
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800">
                <Code className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold">التفاصيل الجنائية للحدث (Payload)</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto bg-[#0f172a] text-slate-300 font-mono text-[11px] sm:text-xs leading-relaxed" dir="ltr">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(selectedLog.payload, null, 2).replace(/"(.*?)":/g, '<span class="text-blue-300">"$1"</span>:').replace(/: (true|false|null|[0-9.]+)/g, ': <span class="text-emerald-400">$1</span>').replace(/: "(.*?)"/g, ': <span class="text-amber-300">"$1"</span>')}
              </pre>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <div className="text-xs text-slate-500 font-bold flex gap-3">
                <span>{selectedLog.device_uid}</span>
                <span className="w-px h-4 bg-slate-200" />
                <span>{selectedLog.type}</span>
              </div>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'تم النسخ!' : 'نسخ النص'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
