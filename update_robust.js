const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const targetStr = '{/* C. Floating Control Card Overlay */}';
const targetIndex = content.indexOf(targetStr);

if (targetIndex > -1) {
    const endStr = '{/* Drag Handle & Mobile Header */}';
    const endIndex = content.indexOf(endStr, targetIndex);
    
    if (endIndex > -1) {
        const replacement = `{/* C. Floating Control Card Overlay */}
      {device && !showControlCard && (
        <button onClick={() => setShowControlCard(true)} className="hidden md:flex absolute top-6 right-[22rem] z-10 bg-white/95 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-200/80 items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors" title="إظهار لوحة التحكم">
           <Sliders className="w-6 h-6" />
        </button>
      )}
      {device && showControlCard && (
        <div className={\`fixed bottom-0 md:absolute md:bottom-auto md:top-6 left-0 right-0 md:left-auto md:right-[22rem] z-10 w-full md:w-[380px] bg-white/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl p-4 md:p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-2xl border-t md:border border-slate-200/80 flex flex-col transition-all duration-300 ease-in-out transform \${isBottomSheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-80px)] md:translate-y-0'}\`}>
          <button onClick={() => setShowControlCard(false)} className="hidden md:flex absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20" title="إخفاء لوحة التحكم">
            <X className="w-5 h-5" />
          </button>
          `;
        
        content = content.substring(0, targetIndex) + replacement + content.substring(endIndex);
        fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
        console.log('Replaced UI successfully!');
    } else {
        console.log('Could not find end index');
    }
} else {
    console.log('Could not find start index');
}
