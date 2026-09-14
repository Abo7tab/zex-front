'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leafet marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapBoundsFitter({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

export default function MeshLeafletMap({ logs }: { logs: any[] }) {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  
  const validPoints = logs.filter(log => log.payload && log.payload.lat != null && log.payload.lng != null).map(log => {
    return {
      lat: parseFloat(log.payload.lat),
      lng: parseFloat(log.payload.lng),
      targetUid: log.payload.target_uid || 'Unknown Target',
      finderName: log.device_name || 'Unknown Finder',
      message: log.message,
      timestamp: log.timestamp
    }
  }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  useEffect(() => {
    if (validPoints.length > 0) {
      const b = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
      setBounds(b);
    }
  }, [logs]);

  return (
    <MapContainer center={[30.0, 31.0]} zoom={4} className="w-full h-full" style={{ background: '#1e293b' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <MapBoundsFitter bounds={bounds} />
      
      {validPoints.map((point, idx) => (
        <Marker key={idx} position={[point.lat, point.lng]}>
          <Popup>
            <div className="font-sans text-slate-800">
              <h3 className="font-bold border-b pb-1 mb-2">Offline Intercept</h3>
              <p className="text-xs mb-1"><strong>Target UID:</strong> {point.targetUid}</p>
              <p className="text-xs mb-1"><strong>Found By:</strong> {point.finderName}</p>
              <p className="text-xs mb-1 text-blue-600 font-semibold">{point.message}</p>
              <p className="text-[10px] text-gray-500 mt-2">{new Date(point.timestamp).toLocaleString()}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      {validPoints.length === 0 && (
        <div className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center">
          <div className="rounded-xl bg-slate-900/85 border border-slate-600 px-5 py-4 text-center shadow-xl">
            <p className="text-sm font-bold text-white">No location points yet</p>
            <p className="mt-1 text-xs text-slate-300">SMS/BLE events will appear here after coordinates are relayed.</p>
          </div>
        </div>
      )}
    </MapContainer>
  );
}
