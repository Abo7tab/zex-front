"use client";

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 animate-pulse">
      <p>Initializing Secure Map...</p>
    </div>
  ),
});

export default function DeviceMap(props: any) {
  return <DynamicMap {...props} />;
}