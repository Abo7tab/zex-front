"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';


let customIcon: any = null;
if (typeof window !== 'undefined') {
  customIcon = L.divIcon({
    className: 'custom-smartthings-pin',
    html: `
      <div style="
        width: 48px;
        height: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 10px 15px rgba(0,0,0,0.25));
      ">
        <div style="
          width: 42px;
          height: 42px;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #000000;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #000000;
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    popupAnchor: [0, -56],
  });
}

const CenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
};

export default function LeafletMap({ 
  latitude, 
  longitude, 
  accuracy, 
  isOnline, 
  batteryLevel, 
  deviceId, 
  history = []
}: { 
  latitude: number, 
  longitude: number, 
  accuracy: number, 
  isOnline: boolean, 
  batteryLevel: number,
  deviceId?: string,
  history?: [number, number][]
}) {
  if (typeof window === 'undefined') return null;

  // Add deterministic jitter based on deviceId to avoid stacking markers exactly on top of each other
  let jitterLat = 0;
  let jitterLng = 0;
  if (deviceId) {
    const hash = deviceId.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    jitterLat = (hash % 100) * 0.000002;
    jitterLng = ((hash >> 2) % 100) * 0.000002;
  }
  
  const displayLat = latitude + jitterLat;
  const displayLng = longitude + jitterLng;

  return (
    <MapContainer 
      center={[displayLat, displayLng]} 
      zoom={16} 
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <CenterMap lat={displayLat} lng={displayLng} />
      
      {history && history.length > 0 && (
        <Polyline positions={history} pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '5, 10' }} />
      )}

      <Marker position={[displayLat, displayLng]} icon={customIcon}>
        <Popup>
          <strong>{deviceId || 'Device'}</strong><br />
          {isOnline ? 'Status: Online' : 'Status: Offline'}<br />
          {batteryLevel !== undefined && `Battery: ${batteryLevel}%`}
        </Popup>
      </Marker>
      
      {accuracy && accuracy > 0 && (
        <Circle center={[displayLat, displayLng]} radius={accuracy} pathOptions={{ fillColor: '#3b82f6', color: '#2563eb', weight: 1, fillOpacity: 0.1 }} />
      )}
    </MapContainer>
  );
}