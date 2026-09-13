const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Fix filteredDevices
const oldFilter = /const filteredDevices = devices\.filter\(d => \s*d\.name\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\s*d\.model\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\s*\);/m;
const newFilter = `const filteredDevices = (devices || []).filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (d?.name || d?.device_uid || d?.model || '').toLowerCase();
    const model = (d?.model || d?.device_type || '').toLowerCase();
    return name.includes(q) || model.includes(q);
  });`;

if (oldFilter.test(c)) {
  c = c.replace(oldFilter, newFilter);
} else {
  // If slightly different formatted
  c = c.replace(
    /const filteredDevices = [\s\S]*?toLowerCase\(\)\)\n\s*\);/m,
    newFilter
  );
}

// 1b. Fix device card title
c = c.replace(/\{d\?\.name \|\| 'Unknown Device'\}/g, "{d?.name || d?.device_uid || 'جهاز تكتيكي'}");

// 2. Localization
c = c.replace(/'Unknown Device'/g, "'جهاز تكتيكي'");
c = c.replace(/>EMERGENCY SOS</g, ">طوارئ SOS<");
c = c.replace(/>SYSTEM<\/span> ONLINE</g, ">النظام</span> نشط<");
c = c.replace(/>NODE:</g, ">عقدة الجهاز:<");
c = c.replace(/>SECURE OPERATIONS</g, ">العمليات المشفرة<");

// Command Matrix Sub-text
c = c.replace(/>Force Siren 🔊</g, ">تفعيل الصفارة الإجبارية 🔊<");
c = c.replace(/>Mute Siren 🔇</g, ">كتم صوت الإنذار 🔇<");
c = c.replace(/>Track Location 📍</g, ">تتبع الإحداثيات الحية 📍<");
c = c.replace(/>Start Radar 📶</g, ">تفعيل الرادار المحلي 📶<");
c = c.replace(/>Stop Radar 🛑</g, ">تعطيل الرادار المحلي 🛑<");
c = c.replace(/>Mark Stolen 🚨</g, ">تفعيل بروتوكول السرقة 🚨<");
c = c.replace(/>Mark Found ✅</g, ">إلغاء بلاغ السرقة ✅<");
c = c.replace(/>Wipe & Delete 🗑️</g, ">حذف وتجميد الجهاز 🗑️<");

// Terminal Log Window
c = c.replace(/>Live Audit Stream</g, ">سجل التدقيق والأحداث المباشر<");
c = c.replace(/>SECURE SHELL</g, ">قناة مشفرة<");
c = c.replace(/>Waiting for API activity\.\.\.</g, ">في انتظار إشارات الجهاز والـ API...<");

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
