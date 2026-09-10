"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = L.divIcon({
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

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface MapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  deviceName: string;
  lastSeen?: string;
  locationHistory?: [number, number][];
}

export default function LeafletMap({ latitude, longitude, accuracy, deviceName, lastSeen, locationHistory }: MapProps) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 10 }}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapUpdater lat={latitude} lng={longitude} />
      
      {locationHistory && locationHistory.length > 0 && (
        <Polyline positions={locationHistory} pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '5, 10' }} />
      )}

      <Marker position={[latitude, longitude]} icon={customIcon}>
        <Popup>
          <strong>{deviceName}</strong><br />
          {lastSeen ? `Last seen: ${lastSeen}` : 'Live location'}
        </Popup>
      </Marker>
      
      {accuracy && accuracy > 0 && (
        <Circle center={[latitude, longitude]} radius={accuracy} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} />
      )}
    </MapContainer>
  );
}