const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace(
  `const latitude = locObj.latitude ?? device?.last_location?.latitude ?? 24.7136;\n    const longitude = locObj.longitude ?? device?.last_location?.longitude ?? 46.6753;\n    const accuracy = locObj.accuracy ?? device?.last_location?.accuracy;`,
  `const rawLat = locObj.latitude ?? device?.last_location?.latitude;\n    const rawLng = locObj.longitude ?? device?.last_location?.longitude;\n    const rawAcc = locObj.accuracy ?? device?.last_location?.accuracy;\n    const latitude = rawLat ? Number(rawLat) : 24.7136;\n    const longitude = rawLng ? Number(rawLng) : 46.6753;\n    const accuracy = rawAcc ? Number(rawAcc) : 0;`
);

c = c.replace(
  /\{latitude \? latitude\.toFixed\(6\) : 'N\/A'\}, \{longitude \? longitude\.toFixed\(6\) : 'N\/A'\}/,
  "{latitude ? Number(latitude).toFixed(6) : 'N/A'}, {longitude ? Number(longitude).toFixed(6) : 'N/A'}"
);

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
