const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const startStr = '<div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-200">';

const beforeSplit = c.substring(0, c.indexOf(startStr) + startStr.length);
let rest = c.substring(c.indexOf(startStr) + startStr.length);

const emptyStateJSX = `
          {devices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-sm h-full min-h-[400px]">
              <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">لا توجد أجهزة مسجلة حالياً</h2>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                يرجى تسجيل جهاز من تطبيق الموبايل أو تسجيل الدخول بحساب يحتوي على أجهزة للوصول إلى غرفة العمليات.
              </p>
            </div>
          ) : (
            <>
`;

// Insert empty state opening
rest = emptyStateJSX + rest;

// Find the end of the scrollable div. It's before </main>
const endStr = `        </div>\n      </main>`;
rest = rest.replace(endStr, `            </>\n          )}\n${endStr}`);

c = beforeSplit + rest;

fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
