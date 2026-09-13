const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
c = c.replace(
  'const updated = [...prev, [latitude, longitude]];',
  'const updated: [number, number][] = [...prev, [latitude, longitude] as [number, number]];'
);
fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
