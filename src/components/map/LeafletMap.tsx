"use client";

import React, { useEffect } from 'react';
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
          position: relative;
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: #2563eb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 14px solid #000000;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    popupAnchor: [0, -56]
  });
}

const CenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
};

export default React.memo(function LeafletMap({ 
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
  
  const isValidLocation = latitude && longitude && !(latitude === 0 && longitude === 0);
  
  if (!isValidLocation) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-slate-400 mb-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">Waiting for precise location...</p>
      </div>
    );
  }

  const displayLat = latitude;
  const displayLng = longitude;

  return (
    <MapContainer 
      center={[displayLat, displayLng]} 
      zoom={16} 
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
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
});