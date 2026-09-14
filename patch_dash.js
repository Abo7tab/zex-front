const fs = require('fs'); 
let code = fs.readFileSync('src/app/dashboard/DashboardClient.tsx', 'utf8'); 

code = code.replace('markFound, deleteDevice } from', 'markFound, deleteDevice, togglePowerSaver } from'); 

code = code.replace('const isSearching  = statusObj.is_searching  ?? device?.is_searching;', 'const isSearching  = statusObj.is_searching  ?? device?.is_searching;\n    const isPowerSaver = statusObj.is_power_saver ?? device?.is_power_saver;'); 

code = code.replace('const handleLocate', 'const handleTogglePowerSaver = async () => { if (!device) return; try { await togglePowerSaver(device.id, !isPowerSaver); setDevice((p:any)=>({...p,is_power_saver:!isPowerSaver})); setRtState((p:any)=>p?{...p,is_power_saver:!isPowerSaver}:null); optimisticPing(); fetchDevices(); } catch { alert("Failed to toggle power saver"); } };\n    const handleLocate'); 

code = code.replace('{ label: \'Wipe Device\',     sub: \'Permanent Purge\',  icon: <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />,         color: \'slate\',   onClick: handleDeleteClick,    disabled: !device },', '{ label: isPowerSaver ? \'Normal Power\' : \'Extreme Saver\', sub: \'Battery Profile\', icon: <Battery className="w-5 h-5 sm:w-6 sm:h-6" />, color: isPowerSaver ? \'slate\' : \'amber\', onClick: handleTogglePowerSaver, disabled: !device },\n      { label: \'Wipe Device\',     sub: \'Permanent Purge\',  icon: <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />,         color: \'slate\',   onClick: handleDeleteClick,    disabled: !device },'); 

code = code.replace('emerald: \'bg-emerald-50 text-emerald-600\',', 'amber: \'bg-amber-50 text-amber-600\',\n      emerald: \'bg-emerald-50 text-emerald-600\','); 

// And the badge indicator:
code = code.replace('</div>\n                  <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5 opacity-80">', '</div>\n                  {isPowerSaver && <div className="mt-1 flex items-center gap-1 text-xs text-amber-500 font-bold"><Battery className="w-3 h-3" /> EXTREME POWER SAVER ACTIVE</div>}\n                  <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5 opacity-80">');

fs.writeFileSync('src/app/dashboard/DashboardClient.tsx', code);
