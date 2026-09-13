const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace(
  /const q = searchQuery\.toLowerCase\(\);[\s\S]*?const name = \(d\?\.name \|\| d\?\.device_uid \|\| d\?\.model \|\| ''\)\.toLowerCase\(\);[\s\S]*?const model = \(d\?\.model \|\| d\?\.device_type \|\| ''\)\.toLowerCase\(\);/,
  `const q = String(searchQuery || '').toLowerCase();
    const name = String(d?.name || d?.device_uid || d?.model || '').toLowerCase();
    const model = String(d?.model || d?.device_type || '').toLowerCase();`
);

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
