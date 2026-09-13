const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
// Fix \` 
c = c.replace(/\\`/g, '`');
// Fix \$ 
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('src/app/dashboard/page.tsx', c);
