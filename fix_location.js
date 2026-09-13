const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Remove commented out old effects
c = c.replace(/\/\/ Disabled temporarily to debug freeze[\s\S]*?\/\/ \}, \[latitude, longitude\]\);/, '');

// Add the new location history effect right before the mounted check
const safeEffects = `  useEffect(() => {
    if (latitude == null || longitude == null) return;
    
    setLocationHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last[0] === latitude && last[1] === longitude) {
        return prev; // Return SAME array reference if unchanged
      }
      const updated = [...prev, [latitude, longitude]];
      return updated.length > 50 ? updated.slice(-50) : updated;
    });
  }, [latitude, longitude]);
`;

c = c.replace('if (!mounted || isLoading) {', safeEffects + '\n  if (!mounted || isLoading) {');

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
