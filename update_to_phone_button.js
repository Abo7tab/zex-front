const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Remove the X button from the flex div
const xButtonRegex = /\s*<button onClick=\{\(\) => setShowControlCard\(false\)\} className="hidden md:flex p-2 text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" title="[^"]+">\s*<X className="w-5 h-5" \/>\s*<\/button>/;
content = content.replace(xButtonRegex, '');

// 2. Change the Smartphone div into a button
const phoneDivRegex = /<div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hidden md:block">\s*<Smartphone className="w-6 h-6 text-slate-700" \/>\s*<\/div>/;
const phoneButtonStr = `<button 
                    onClick={() => setShowControlCard(false)}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hidden md:flex items-center justify-center hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer group"
                    title="إخفاء لوحة التحكم"
                  >
                    <Smartphone className="w-6 h-6 text-slate-700 group-hover:text-red-500 transition-colors" />
                  </button>`;
content = content.replace(phoneDivRegex, phoneButtonStr);

fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
console.log('Replaced successfully!');
