const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const targetStr = `onClick={() => {
                      setRtState(null);
                      setDevice(d); setShowControlCard(true);
                      setShowMobileMenu(false);
                    }}`;
const replaceStr = `onClick={() => {
                      setRtState(null);
                      setLocationHistory([]);
                      setDevice(d); setShowControlCard(true);
                      setShowMobileMenu(false);
                    }}`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
console.log('Location history reset added');
