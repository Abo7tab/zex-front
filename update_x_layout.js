const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const xButtonStr = `          <button onClick={() => setShowControlCard(false)} className="hidden md:flex absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20" title="إخفاء لوحة التحكم">\n            <X className="w-5 h-5" />\n          </button>\n`;
content = content.replace(xButtonStr, '');

const externalLinkStr = `                {latitude != null && longitude != null && (\n                  <a \n                    href={\`https://maps.google.com/?q=\${latitude},\${longitude}\`} \n                    target="_blank" \n                    rel="noopener noreferrer"\n                    className="p-2 text-blue-600 bg-blue-50/80 hover:bg-blue-100 transition-colors flex items-center justify-center rounded-xl"\n                    title="فتح في خرائط جوجل"\n                  >\n                    <ExternalLink className="w-4 h-4" />\n                  </a>\n                )}`;

const newExternalLinkStr = `                <div className="flex items-center space-x-2 space-x-reverse">\n                  {latitude != null && longitude != null && (\n                    <a \n                      href={\`https://maps.google.com/?q=\${latitude},\${longitude}\`} \n                      target="_blank" \n                      rel="noopener noreferrer"\n                      className="p-2 text-blue-600 bg-blue-50/80 hover:bg-blue-100 transition-colors flex items-center justify-center rounded-xl"\n                      title="فتح في خرائط جوجل"\n                    >\n                      <ExternalLink className="w-4 h-4" />\n                    </a>\n                  )}\n                  <button onClick={() => setShowControlCard(false)} className="hidden md:flex p-2 text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" title="إخفاء لوحة التحكم">\n                    <X className="w-5 h-5" />\n                  </button>\n                </div>`;

content = content.replace(externalLinkStr, newExternalLinkStr);

fs.writeFileSync('src/app/dashboard/page.tsx', content, 'utf8');
console.log('Replaced X layout successfully!');
