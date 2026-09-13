const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace(
  'const latitude = locObj.latitude ?? device?.last_location?.latitude;',
  'const latitude = locObj.latitude ?? device?.last_location?.latitude ?? 24.7136;'
);

c = c.replace(
  'const longitude = locObj.longitude ?? device?.last_location?.longitude;',
  'const longitude = locObj.longitude ?? device?.last_location?.longitude ?? 46.6753;'
);

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
