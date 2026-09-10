"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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