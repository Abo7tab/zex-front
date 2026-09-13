"use client";

import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '4px solid #2563eb',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 16,
        }}
      />
      <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
        جاري تهيئة غرفة العمليات التكتيكية C4ISR...
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function Page() {
  return (
    <ErrorBoundary>
      <DashboardClient />
    </ErrorBoundary>
  );
}
