const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/dashboard/DashboardClient.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Sidebar
content = content.replace(/الوحدات الActive[ة5]/g, 'Active Units');
content = content.replace(/الوحدات النشطة/g, 'Active Units');
content = content.replace(/تسجيل الخروج/g, 'Sign Out');
content = content.replace(/إعدادات النظام/g, 'System Settings');
content = content.replace(/بحث\.\.\./g, 'Search units...');
content = content.replace(/لا توجد أجهزة/g, 'No devices found');

// 2. Top Bar & Status
content = content.replace(/عقدة :/g, 'Node:');
content = content.replace(/الحالة التكتيكية: مستقرة/g, 'TACTICAL STATUS: DEFCON-5 NOMINAL');
content = content.replace(/جميع الأنظمة الدفاعية طبيعية/g, 'All systems operating within standard parameters.');
content = content.replace(/تشفير/g, 'Encryption');
content = content.replace(/بروتوكول/g, 'Protocol');
content = content.replace(/نشط/g, 'Active');

// Other random texts in the header/loading
content = content.replace(/جاري تهيئة بيئة عمليات C4ISR\.\.\./g, 'Initializing C4ISR operational environment...');

// 3. Commands Array
const commandsRegex = /const commands = \[([\s\S]*?)\];/;
const newCommandsBlock = `const commands = [
    { label: 'Scream Alert',    sub: 'Force Siren',      icon: <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />,          color: 'blue',    onClick: handleStartScream,    disabled: !!isScreaming || !device },
    { label: 'Silence Alert',   sub: 'Mute Alarm',       icon: <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />,          color: 'slate',   onClick: handleStopScreamClick, disabled: !isScreaming || !device },
    { label: 'GPS Locate',      sub: 'Fetch Live GPS',   icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />,           color: 'emerald', onClick: handleLocate,         disabled: !device },
    { label: 'BLE Radar',       sub: 'Start Beacon',     icon: <BluetoothSearching className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'indigo',  onClick: handleStartSearch,    disabled: !!isSearching || !device },
    { label: 'Stop Radar',      sub: 'Disable Beacon',   icon: <Bluetooth className="w-5 h-5 sm:w-6 sm:h-6" />,        color: 'slate',   onClick: handleStopSearch,     disabled: !isSearching || !device },
    { label: 'Mark Stolen',     sub: 'Lock Protocol',    icon: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />,      color: 'rose',    onClick: handleStartStolen,    disabled: !!isStolen || !device },
    { label: 'Unmark Stolen',   sub: 'Recovered Status', icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />,      color: 'emerald', onClick: handleStopStolenClick, disabled: !isStolen || !device },
    { label: 'Wipe Device',     sub: 'Permanent Purge',  icon: <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />,           color: 'slate',   onClick: handleDeleteClick,    disabled: !device },
  ];`;

content = content.replace(commandsRegex, newCommandsBlock);

// 4. Terminal Footer
content = content.replace(/سجل الأحداث/g, 'Live Audit Stream');
content = content.replace(/سجل النظام/g, 'System Log');

// Any Modals Arabic text
content = content.replace(/إدخال Password لإيقاف Silence Alert\./g, 'Enter Operator Password to mute the alert.');
content = content.replace(/تأكيد الحذف\?/g, 'Confirm Device Purge?');
content = content.replace(/سيؤدي Wipe الجهاز هذا إلى مسحه نهائياً من النظام\./g, 'Wiping this device will permanently delete all data and remove it from the ZEX registry.');
content = content.replace(/إلغاء/g, 'Cancel');
content = content.replace(/تأكيد/g, 'Confirm');
content = content.replace(/حذف/g, 'Purge');
content = content.replace(/إدخال PIN لإلغاء وضع السرقة من 6 أرقام\./g, 'Enter 6-digit Authorization PIN to recover device.');
content = content.replace(/هل أنت متأكد من مسح الجهاز/g, 'Are you sure you want to purge the device');

// Router push for settings
content = content.replace(/onClick=\{.*?setIsSettingsOpen\(true\).*?\}/g, "onClick={() => { router.push('/settings'); setShowMobileMenu(false); }}");

fs.writeFileSync(file, content, 'utf8');
console.log('DashboardClient.tsx cleaned successfully.');
