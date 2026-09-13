const fs = require('fs');

// 1. Fix LeafletMap.tsx
let leafletMap = fs.readFileSync('src/components/map/LeafletMap.tsx', 'utf8');
leafletMap = leafletMap.replace(
  /const customIcon = L\.divIcon\(\{[\s\S]*?\}\);/m, 
  `let customIcon: any = null;
if (typeof window !== 'undefined') {
  customIcon = L.divIcon({
    className: 'custom-smartthings-pin',
    html: \`
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
    \`,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    popupAnchor: [0, -56],
  });
}`
);

if (!leafletMap.includes('if (typeof window === \'undefined\') return null;')) {
  leafletMap = leafletMap.replace(
    'export default function LeafletMap({ latitude, longitude, accuracy, deviceName, lastSeen, locationHistory }: MapProps) {',
    `export default function LeafletMap({ latitude, longitude, accuracy, deviceName, lastSeen, locationHistory }: MapProps) {\n  if (typeof window === 'undefined') return null;`
  );
}

fs.writeFileSync('src/components/map/LeafletMap.tsx', leafletMap, 'utf8');

// 2. Fix dashboard/page.tsx
let dashboard = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

if (!dashboard.includes('const [mounted, setMounted] = useState(false);')) {
  dashboard = dashboard.replace(
    'export default function DashboardPage() {',
    `export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-mono dir-rtl" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-200">جاري تهيئة غرفة العمليات التكتيكية C4ISR...</span>
        <span className="text-xs text-slate-500 mt-1">Securing connection to ZEX Node...</span>
      </div>
    );
  }
`
  );
}

// Ensure array wraps
dashboard = dashboard.replace(/filteredDevices\.map/g, '(filteredDevices || []).map');
dashboard = dashboard.replace(/\[\.\.\.logs\]\.reverse\(\)\.map/g, '[...(logs || [])].reverse().map');

fs.writeFileSync('src/app/dashboard/page.tsx', dashboard, 'utf8');
