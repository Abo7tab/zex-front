"use client";
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

function getMarkerColor(rtState: any, device: any): string {
  const isStolen = rtState?.status?.is_stolen ?? device?.is_stolen;
  const isScreaming = rtState?.status?.is_screaming ?? device?.is_screaming;
  const isSearching = rtState?.status?.is_searching ?? device?.is_searching;
  const lastHb = rtState?.status?.last_heartbeat_at || device?.last_heartbeat_at;
  
  let isOnline = false;
  if (lastHb) {
    const t = new Date(lastHb).getTime();
    if (!isNaN(t) && t > 0) isOnline = (Date.now() - t) < 2 * 60 * 1000;
  }

  if (isStolen) return '#ef4444'; // red
  if (isScreaming || isSearching) return '#eab308'; // yellow
  if (isOnline) return '#22c55e'; // green
  return '#94a3b8'; // gray (offline)
}

function createColoredIcon(color: string) {
  if (typeof window === 'undefined') return null;
  return L.divIcon({
    className: 'custom-colored-pin',
    html: `
      <div style="width: 24px; height: 24px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);"></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

const BoundsUpdater = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom() < 14 ? 14 : map.getZoom(), { duration: 1 });
  }, [lat, lng, map]);
  return null;
};

export default function TrackingMap({
  devices,
  rtStates,
  selectedDeviceId,
  historyMap,
  playbackIndex,
  geofenceEnabled,
  geofenceRadius
}: {
  devices: any[];
  rtStates: Record<string, any>;
  selectedDeviceId?: string;
  historyMap: Record<string, [number, number][]>;
  playbackIndex: number;
  geofenceEnabled: boolean;
  geofenceRadius: number;
}) {
  if (typeof window === 'undefined') return null;

  // Find selected device coords to center map
  let centerLat = 24.7136;
  let centerLng = 46.6753;

  if (selectedDeviceId) {
    const rt = rtStates[selectedDeviceId];
    const dev = devices.find(d => d.device_uid === selectedDeviceId);
    const loc = rt?.last_location || rt?.location || dev?.last_location;
    if (loc) {
      centerLat = Number(loc.latitude || centerLat);
      centerLng = Number(loc.longitude || centerLng);
    }
  }

  return (
    <MapContainer 
      center={[centerLat, centerLng]} 
      zoom={14} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution=""
      />
      
      {selectedDeviceId && <BoundsUpdater lat={centerLat} lng={centerLng} />}

      {/* Draw Geofence for selected device */}
      {selectedDeviceId && geofenceEnabled && (
        <Circle 
          center={[centerLat, centerLng]} 
          radius={geofenceRadius} 
          pathOptions={{ fillColor: '#22c55e', color: '#16a34a', weight: 2, fillOpacity: 0.15, dashArray: '5, 5' }} 
        />
      )}

      {/* Draw History Polyline for selected device */}
      {selectedDeviceId && historyMap[selectedDeviceId] && historyMap[selectedDeviceId].length > 1 && (
        <Polyline 
          positions={historyMap[selectedDeviceId].slice(0, Math.max(1, Math.floor((playbackIndex / 100) * historyMap[selectedDeviceId].length)))} 
          pathOptions={{ color: '#3b82f6', weight: 4 }} 
        />
      )}

      {/* Draw Markers for all devices */}
      {devices.map(d => {
        const uid = d.device_uid;
        if (!uid) return null;
        const rt = rtStates[uid];
        const loc = rt?.last_location || rt?.location || d?.last_location;
        if (!loc || !loc.latitude || !loc.longitude) return null;

        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        const color = getMarkerColor(rt, d);
        const icon = createColoredIcon(color);
        const isSelected = uid === selectedDeviceId;

        // Jitter to prevent overlap
        const hash = uid.split('').reduce((a:number,b:string)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
        const jLat = lat + ((hash % 100) * 0.000005);
        const jLng = lng + (((hash >> 2) % 100) * 0.000005);

        return (
          <Marker key={uid} position={[jLat, jLng]} icon={icon || undefined} zIndexOffset={isSelected ? 1000 : 0}>
            <Popup>
              <div dir="rtl" className="font-sans text-xs">
                <strong>{d.name || d.device_uid}</strong><br />
                Lat: {lat.toFixed(5)}<br />
                Lng: {lng.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
