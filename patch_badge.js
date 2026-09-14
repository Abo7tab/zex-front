const fs = require('fs');
let code = fs.readFileSync('front/src/app/dashboard/DashboardClient.tsx', 'utf8');

if (!code.includes("className=\"w-2.5 h-2.5\" />Power Saver")) {
    code = code.replace(
        /<Wifi className="w-2\.5 h-2\.5" \/>\{isOnline \? 'Protocol: Active' : 'Offline'\}/,
        `<Wifi className="w-2.5 h-2.5" />{isOnline ? 'Protocol: Active' : 'Offline'}
                      </div>
                      {isPowerSaver && (
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ml-2">
                          <Zap className="w-2.5 h-2.5" />Power Saver
                        </div>
                      )}
                      <div>`
    );
    // Let's just fix the HTML gracefully. The original HTML is:
    /*
    <div className={`flex items-center gap-1 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
        <Wifi className="w-2.5 h-2.5" />{isOnline ? 'Protocol: Active' : 'Offline'}
    </div>
    */
    code = code.replace(
        /\{isOnline \? 'Protocol: Active' : 'Offline'\}\s*<\/div>/,
        `{isOnline ? 'Protocol: Active' : 'Offline'}
                      </div>
                      {isPowerSaver && (
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Zap className="w-2.5 h-2.5" />Power Saver
                        </div>
                      )}`
    );
    fs.writeFileSync('front/src/app/dashboard/DashboardClient.tsx', code);
}
