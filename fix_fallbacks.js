const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Replacements
content = content.replace(/user\?\.name \|\| 'Operator Alpha'/g, "user?.name || 'Operator'");
content = content.replace(/device\?\.device_uid \|\| 'WAITING\.\.\.'/g, "device?.device_uid || 'N/A'");
content = content.replace(/\{d\.name\}/g, "{d?.name || 'Unknown Device'}");
content = content.replace(/\{d\.model\}/g, "{d?.model || 'Generic Model'}");
content = content.replace(/d\.battery_level \?\? 0/g, "d?.battery_level ?? 0");
content = content.replace(/filteredDevices\.length/g, "filteredDevices?.length");
content = content.replace(/\{devices\.length\}/g, "{devices?.length || 0}");

fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
