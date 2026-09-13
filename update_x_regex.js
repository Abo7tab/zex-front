const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Remove absolute X button
const absoluteXMatch = /<button onClick=\{\(\) => setShowControlCard\(false\)\} className="hidden md:flex absolute top-4 left-4[^>]+>\s*<X className="w-5 h-5" \/>\s*<\/button>/;
content = content.replace(absoluteXMatch, '');

// 2. Replace ExternalLink block
const externalLinkRegex = /\{latitude != null && longitude != null && \(\s*<a\s+href=\{`https:\/\/maps\.google\.com\/\?q=\$\{latitude\},\$\{longitude\}`\}\s+target="_blank"\s+rel="noopener noreferrer"\s+className="p-2 text-blue-600 bg-blue-50\/80 hover:bg-blue-100 transition-colors flex items-center justify-center rounded-xl"\s+title="[^"]+"\s*>\s*<ExternalLink className="w-4 h-4" \/>\s*<\/a>\s*\)\}/;

const newExternalLinkStr = `<div className="flex items-center space-x-2 space-x-reverse">
                  {latitude != null && longitude != null && (
                    <a 
                      href={\`https://maps.google.com/?q=\${latitude},\${longitude}\`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 bg-blue-50/80 hover:bg-blue-100 transition-colors flex items-center justify-center rounded-xl"
                      title="فتح في خرائط جوجل"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => setShowControlCard(false)} className="hidden md:flex p-2 text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" title="إخفاء لوحة التحكم">
                    <X className="w-5 h-5" />
                  </button>
                </div>`;

content = content.replace(externalLinkRegex, newExternalLinkStr);

fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
console.log('Replaced via regex!');
