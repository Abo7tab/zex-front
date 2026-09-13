"use client";
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

const LogsClient = dynamic(() => import('./LogsClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div>جاري تحميل سجل الأمن الجنائي...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  ),
});

export default function Page() {
  return <ErrorBoundary><LogsClient /></ErrorBoundary>;
}
