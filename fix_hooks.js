const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Identify and extract the early return block
const earlyReturnRegex = /if \(!mounted(?: \|\| isLoading)?\) \{[\s\S]*?return \([\s\S]*?\}\);?\s*\}/m;
const earlyReturnMatch = content.match(earlyReturnRegex);

if (earlyReturnMatch) {
  content = content.replace(earlyReturnMatch[0], ''); // remove it from current position
  
  // Find where to insert it safely below ALL hooks.
  // A safe place is just before "// Command Matrix Action Handlers"
  content = content.replace('// Command Matrix Action Handlers', `${earlyReturnMatch[0]}\n\n  // Command Matrix Action Handlers`);
}

// Ensure the mounted hook exists but is safely at the top
content = content.replace(/useEffect\(\(\) => \{\s*setMounted\(true\);\s*\}, \[\]\);/m, `useEffect(() => { setMounted(true); }, []);`);

// Now replace the auth useEffect with the user's requested logic.
// The old effect starts with useEffect(() => { if (typeof window === 'undefined') return; setIsLoading(true); getMe() ...
const oldUseEffect = /useEffect\(\(\) => \{\s*if \(typeof window === 'undefined'\) return;\s*setIsLoading\(true\);\s*getMe\(\)[\s\S]*?fetchDevices\(\);\s*\}, \[\]\);/m;

const newUseEffect = `useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set mounted explicitly if needed here or rely on the other hook
    const token = localStorage.getItem('zex_token') || localStorage.getItem('zex_auth_token');
    
    // Also check cookies as a fallback if localStorage isn't synced but cookie is.
    const hasCookie = document.cookie.includes('zex_token=');
    
    if (!token && !hasCookie) {
      router.replace('/login');
      return;
    }

    getMe()
      .then((data) => {
        setUser(data?.data || data);
        fetchDevices();
      })
      .catch(() => {
        localStorage.removeItem('zex_token');
        localStorage.removeItem('zex_auth_token');
        router.replace('/login');
      })
      .finally(() => {
        setIsLoading(false);
      });

    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(safetyTimer);
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);

// Wait, let's make sure the replacement succeeded. If it didn't match the old use effect, we might need a broader regex.
if (!content.includes('safetyTimer')) {
  // Try another regex if the old effect was different.
  const alternativeRegex = /useEffect\(\(\) => \{\s*if \(typeof window === 'undefined'\) return;\s*getMe\(\)[\s\S]*?fetchDevices\(\);\s*\}, \[\]\);/m;
  content = content.replace(alternativeRegex, newUseEffect);
}

fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
