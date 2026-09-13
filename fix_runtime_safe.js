const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const oldFilter = `  const filteredDevices = (devices || []).filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (d?.name || d?.device_uid || d?.model || '').toLowerCase();
    const model = (d?.model || d?.device_type || '').toLowerCase();
    return name.includes(q) || model.includes(q);
  });`;

const newFilter = `  const filteredDevices = (devices || []).filter((d) => {
    if (!searchQuery) return true;
    const q = String(searchQuery || '').toLowerCase();
    const name = String(d?.name || d?.device_uid || d?.model || '').toLowerCase();
    const model = String(d?.model || d?.device_type || '').toLowerCase();
    return name.includes(q) || model.includes(q);
  });`;

c = c.replace(oldFilter, newFilter);

// Replace filteredDevices mapping to be exactly what user said
c = c.replace(
  `{(filteredDevices?.length || 0) > 0 ? (filteredDevices || []).map((d) => (`,
  `{(filteredDevices?.length || 0) > 0 ? ((filteredDevices || [])).map((d) => (`
);

// Replace logs mapping to be exactly what user said
c = c.replace(
  `{(logs || []).length > 0 ? [...(logs || [])].reverse().map((log, index) => (`,
  `{(logs || []).length > 0 ? ([...(logs || [])]).reverse().map((log, index) => (`
);

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
