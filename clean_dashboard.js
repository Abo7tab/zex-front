const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/dashboard/DashboardClient.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Threshold 60 -> 120
content = content.replace(/const lastSeen = d\.last_heartbeat_at \|\| d\.last_seen_at \|\| d\.last_heartbeat;/g, "const lastSeen = d.last_heartbeat_at || d.last_seen_at || d.updated_at || d.last_heartbeat;");
content = content.replace(/return \(now - t\) < 60000;/g, "return (now - t) < 120000;");

// 2. Command handlers and optimistic update
const oldHandlersRegex = /const handleLocate[\s\S]*?const handleUnregisterDevice.*?finally \{ setActionLoading\(false\); \} \};/m;

const newHandlers = `const optimisticPing = () => {
    if (!device) return;
    const nowStr = new Date().toISOString();
    setDevice((p: any) => p ? { ...p, last_heartbeat_at: nowStr, updated_at: nowStr } : null);
    setRtState((p: any) => p ? { ...p, last_heartbeat_at: nowStr } : null);
    setDevices((prev: any[]) => prev.map(d => d.id === device.id ? { ...d, last_heartbeat_at: nowStr, updated_at: nowStr } : d));
    setNow(Date.now());
  };

  const handleLocate       = useCallback(async () => { if (!device) return; try { await locateDevice(device.id); optimisticPing(); } catch { alert('Failed to execute GPS Locate'); } }, [device?.id]);
  const handleStartScream  = async () => { if (!device) return; try { await screamDevice(device.id); setDevice((p:any)=>({...p,is_screaming:true})); setRtState((p:any)=>p?{...p,is_screaming:true}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to execute Scream Alert'); } };
  const handleStopScreamClick = () => { if (!device) return; setShowPasswordModal(true); };
  const handleStopScream   = async () => { if (!device) return; setActionLoading(true); try { await stopScreamDevice(device.id, passwordInput.trim()); setShowPasswordModal(false); setPasswordInput(''); setDevice((p:any)=>p?{...p,is_screaming:false}:null); setRtState((p:any)=>p?{...p,is_screaming:false}:null); optimisticPing(); fetchDevices(); } catch { alert('Invalid Password'); } finally { setActionLoading(false); } };
  const handleStartSearch  = async () => { if (!device) return; try { await startSearchMode(device.id, 30); setDevice((p:any)=>({...p,is_searching:true})); setRtState((p:any)=>p?{...p,is_searching:true}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to execute BLE Radar'); } };
  const handleStopSearch   = async () => { if (!device) return; try { await stopSearchMode(device.id); setDevice((p:any)=>({...p,is_searching:false})); setRtState((p:any)=>p?{...p,is_searching:false}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to stop BLE Radar'); } };
  const handleStartStolen  = async () => { if (!device) return; try { await markStolen(device.id); setDevice((p:any)=>({...p,is_stolen:true})); setRtState((p:any)=>p?{...p,is_stolen:true}:null); optimisticPing(); fetchDevices(); } catch { alert('Failed to execute Lock Protocol'); } };
  const handleStopStolenClick = () => { if (!device) return; setShowPinModal(true); };
  const handleMarkFound    = async () => { if (!device) return; setActionLoading(true); try { await markFound(device.id, pinInput.trim()); setShowPinModal(false); setPinInput(''); setDevice((p:any)=>p?{...p,is_stolen:false,is_screaming:false,is_searching:false}:null); setRtState((p:any)=>p?{...p,is_stolen:false,is_screaming:false,is_searching:false}:null); optimisticPing(); fetchDevices(); } catch { alert('Invalid 6-digit PIN'); } finally { setActionLoading(false); } };
  const handleDeleteClick  = () => { if (!device) return; setShowDeleteModal(true); };
  const handleDeleteDevice = async () => { if (!device) return; setActionLoading(true); try { await deleteDevice(device.id, deletePasswordInput.trim()); setShowDeleteModal(false); setDeletePasswordInput(''); const r=devices.filter((d:any)=>d.id!==device.id); setDevices(r); setDevice(r.length>0?r[0]:null); } catch { alert('Failed to Purge Device. Invalid Password.'); } finally { setActionLoading(false); } };
  const handleUnregisterDevice = async () => { if (!unregisterTarget) return; setActionLoading(true); try { await deleteDevice(unregisterTarget.id, deletePasswordInput.trim()); setShowUnregisterModal(false); setDeletePasswordInput(''); const r=devices.filter((d:any)=>d.id!==unregisterTarget.id); setDevices(r); if(device?.id===unregisterTarget.id) setDevice(r.length>0?r[0]:null); setUnregisterTarget(null); } catch { alert('Failed to Purge Device. Invalid Password.'); } finally { setActionLoading(false); } };`;

content = content.replace(oldHandlersRegex, newHandlers);

// 3. Any additional Arabic replacements missed
content = content.replace(/جاري تهيئة بيئة عمليات C4ISR\.\.\./g, 'Initializing C4ISR operational environment...');
content = content.replace(/الوحدات الActiveة/g, 'Active Units'); // Added trailing 'ة' just in case
content = content.replace(/الوحدات الActive5/g, 'Active Units'); // Just in case
content = content.replace(/الوحدات الActive/g, 'Active Units'); // Just in case
content = content.replace(/إدخال Password لإيقاف Silence Alert\./g, 'Enter Operator Password to mute the alert.');
content = content.replace(/تأكيد الحذف\?/g, 'Confirm Device Purge?');
content = content.replace(/سيؤدي Wipe الجهاز هذا إلى مسحه نهائياً من النظام\./g, 'Wiping this device will permanently delete all data and remove it from the ZEX registry.');
content = content.replace(/إلغاء/g, 'Cancel');
content = content.replace(/تأكيد/g, 'Confirm');
content = content.replace(/حذف/g, 'Purge');
content = content.replace(/إدخال PIN لإلغاء وضع السرقة من 6 أرقام\./g, 'Enter 6-digit Authorization PIN to recover device.');
content = content.replace(/هل أنت متأكد من مسح الجهاز/g, 'Are you sure you want to purge the device');
// Some strings from powershell output
content = content.replace(/تسجيل الخروج/g, 'Sign Out');
content = content.replace(/إعدادات النظام/g, 'System Settings');
content = content.replace(/عقدة :/g, 'Node:');
content = content.replace(/الحالة التكتيكية: مستقرة/g, 'TACTICAL STATUS: DEFCON-5 NOMINAL');
content = content.replace(/جميع الأنظمة الدفاعية طبيعية/g, 'All systems operating within standard parameters.');
content = content.replace(/تشفير/g, 'Encryption');
content = content.replace(/بروتوكول/g, 'Protocol');
content = content.replace(/نشط/g, 'Active');
content = content.replace(/سجل الأحداث/g, 'Live Audit Stream');
content = content.replace(/سجل النظام/g, 'System Event Log');


fs.writeFileSync(file, content, 'utf8');
console.log('DashboardClient.tsx heavily updated successfully.');
