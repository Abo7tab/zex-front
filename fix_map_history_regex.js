const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const targetStr = /setDevice\(d\);\s*setShowControlCard\(true\);\s*setShowMobileMenu\(false\);/;
const replaceStr = "setLocationHistory([]);\n                      setDevice(d); setShowControlCard(true);\n                      setShowMobileMenu(false);";

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
console.log('Location history reset added properly');
