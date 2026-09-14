const fs = require('fs');
let code = fs.readFileSync('front/src/app/dashboard/DashboardClient.tsx', 'utf8');

if (!code.includes("label: 'Power Saver'")) {
    code = code.replace(/\{\s*label:\s*'Scream Alert'/, "    { label: 'Power Saver',   sub: isPowerSaver ? 'Disable Saver' : 'Extreme Saver', icon: <Zap className=\"w-5 h-5 sm:w-6 sm:h-6\" />, color: isPowerSaver ? 'amber' : 'emerald', onClick: handleTogglePowerSaver, disabled: !device },\n    { label: 'Scream Alert'");
    code = code.replace(/import\s*\{\s*Shield,/, "import { Shield, Zap,");
    fs.writeFileSync('front/src/app/dashboard/DashboardClient.tsx', code);
}
