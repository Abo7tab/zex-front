const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Fix filteredDevices to handle numbers and nulls properly
const oldFilterRegex = /const filteredDevices = \(devices \|\| \[\]\)\.filter\(\(d\) => \{[\s\S]*?\}\);/m;
const newFilter = `const filteredDevices = (devices || []).filter((d) => {
    if (!searchQuery) return true;
    const q = String(searchQuery || '').toLowerCase();
    const name = String(d?.name || d?.device_uid || d?.model || '').toLowerCase();
    const model = String(d?.model || d?.device_type || '').toLowerCase();
    return name.includes(q) || model.includes(q);
  });`;

if (oldFilterRegex.test(c)) {
  c = c.replace(oldFilterRegex, newFilter);
}

// Ensure the first map uses ((filteredDevices || [])) exactly as user requested if not already
c = c.replace(/\(filteredDevices \|\| \[\]\)\.map/g, "((filteredDevices || [])).map");

// Ensure logs uses [...(logs || [])].map (wait, in my code I have reverse(), user asked for [...(logs || [])].map )
c = c.replace(/\[\.\.\.\(logs \|\| \[\]\)\]\.reverse\(\)\.map/g, "([...(logs || [])]).reverse().map");

// Ensure mounted is separated or compliant
// Wait, I will replace `if (!mounted || isLoading)` with `if (!mounted) { ... } if (isLoading) { ... }` to be super safe about hydration.
const guardRegex = /if \(\!mounted \|\| isLoading\) \{([\s\S]*?)    \}/m;
const newGuard = `if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-mono dir-rtl" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-200">جاري تهيئة غرفة العمليات التكتيكية C4ISR...</span>
        <span className="text-xs text-slate-500 mt-1">Securing connection to ZEX Node...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-mono dir-rtl" dir="rtl">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-200">جاري الاتصال بالخوادم المؤمنة...</span>
      </div>
    );
  }`;

if (guardRegex.test(c)) {
  c = c.replace(guardRegex, newGuard);
}

// Make sure d?.battery_level is safe
c = c.replace(/d\?\.battery_level \?\? 0/g, "d?.battery_level ?? 0"); // Already safe, just double check

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
