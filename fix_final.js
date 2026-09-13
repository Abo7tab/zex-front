const fs = require('fs');
let dashboard = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Replace DeviceMap dynamic import to match exact requirement
dashboard = dashboard.replace(
  /const DeviceMap = dynamic\(\(\) => import\('@\/components\/map\/DeviceMap'\), \{[\s\S]*?\}\);/m,
  `const DeviceMap = dynamic(() => import('@/components/map/DeviceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-mono text-xs rounded-2xl">
      <span>جاري تحميل الخريطة التكتيكية C4ISR...</span>
    </div>
  ),
});`
);

// Replace getMe() block
dashboard = dashboard.replace(
  /useEffect\(\(\) => \{\s*getMe\(\)[\s\S]*?fetchDevices\(\);\s*\}, \[\]\);/m,
  `useEffect(() => {
    if (typeof window === 'undefined') return;
    getMe()
      .then((data) => setUser(data?.data || data))
      .catch(() => {
        router.push('/login');
      });
    fetchDevices();
  }, []);`
);

fs.writeFileSync('src/app/dashboard/page.tsx', dashboard, 'utf8');
