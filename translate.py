import os

files = [
    "src/app/dashboard/DashboardClient.tsx",
    "src/app/tracking/TrackingClient.tsx",
    "src/app/logs/LogsClient.tsx",
    "src/app/login/page.tsx"
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change RTL to LTR
    content = content.replace('dir="rtl"', 'dir="ltr"')
    content = content.replace("dir='rtl'", "dir='ltr'")
    
    # Common paddings left/right flip
    content = content.replace('pr-9 pl-3', 'pl-9 pr-3')
    content = content.replace('pr-9 pl-9', 'pl-9 pr-9')
    content = content.replace('pl-5', 'pr-5')
    content = content.replace('pl-2', 'pr-2')
    content = content.replace('pr-10', 'pl-10')
    content = content.replace('border-r-4', 'border-l-4')
    content = content.replace('border-r-red', 'border-l-red')
    content = content.replace('border-r-yellow', 'border-l-yellow')
    content = content.replace('border-r-transparent', 'border-l-transparent')
    
    # English replacements for Dashboard
    content = content.replace('C4ISR Security Systems', 'Encrypted Operations')
    content = content.replace('الشبكة الدفاعية الموحدة C4ISR // مشفرة بنظام كوانتوم', 'UNIFIED DEFENSE NETWORK // QUANTUM ENCRYPTED')
    content = content.replace('نظام الحماية الفوري نشط', 'ACTIVE TACTICAL SHIELD')
    content = content.replace('تسجيل خروج', 'Sign Out')
    content = content.replace('إعدادات النظام', 'System Settings')
    content = content.replace('بحث عن جهاز (UID أو الاسم)...', 'Search unit by name or UID...')
    content = content.replace('الأجهزة النشطة', 'Active Units')
    content = content.replace('متصل', 'Protocol: Active')
    content = content.replace('غير متصل', 'Protocol: Offline')
    content = content.replace('بطارية:', 'Battery:')
    
    content = content.replace('الحالة الدفاعية: مستقرة (DEFCON 5)', 'TACTICAL STATUS: DEFCON-5 NOMINAL')
    content = content.replace('جميع الأنظمة تعمل بكفاءة. لا توجد اختراقات نشطة.', 'All defense subsystems operating within standard parameters. No threats detected.')
    content = content.replace('نظام متصل', 'ONLINE SYSTEM')
    
    content = content.replace('تفعيل الإنذار', 'Scream Alert')
    content = content.replace('إطلاق صافرة رعب قصوى', 'Force Loud Siren')
    
    content = content.replace('إيقاف الإنذار', 'Silence Alert')
    content = content.replace('كتم الصوت فوراً', 'Mute Alarm')
    
    content = content.replace('تحديد الموقع', 'GPS Locate')
    content = content.replace('تحديث الإحداثيات', 'Fetch Coordinates')
    
    content = content.replace('رادار البحث', 'Start BLE Radar')
    content = content.replace('بحث محلي (بلوتوث)', 'Local Beacon Mode')
    
    content = content.replace('إيقاف الرادار', 'Stop BLE Radar')
    content = content.replace('إلغاء البحث المحلي', 'Disable Beacon')
    
    content = content.replace('الإبلاغ عن سرقة', 'Mark Stolen')
    content = content.replace('تفعيل وضع الخطر', 'Lock Protocol')
    
    content = content.replace('إلغاء السرقة', 'Unmark Stolen')
    content = content.replace('إلغاء وضع الخطر', 'Recovered Status')
    
    content = content.replace('تدمير الجهاز', 'Wipe Device')
    content = content.replace('مسح شامل وعميق', 'Permanent Purge')
    
    content = content.replace('نطاق أمان', 'Safe Geofence')
    content = content.replace('خرائط جوجل', 'Open in Google Maps')
    
    content = content.replace('Live Audit Terminal', 'Live Audit Stream')
    content = content.replace('سجل الأحداث المباشر', 'Live Audit Stream')
    content = content.replace('سجل النظام', 'System Event Log')
    content = content.replace('Waiting for activity...', 'Monitoring secure channels...')
    
    content = content.replace('إلغاء التسجيل', 'Unregister Node')
    
    # Password / Pin Modals
    content = content.replace('تأكيد كلمة المرور', 'Confirm Password')
    content = content.replace('يرجى إدخال كلمة المرور لتأكيد العملية.', 'Please enter operator password to verify authorization.')
    content = content.replace('إلغاء', 'Cancel')
    content = content.replace('تأكيد', 'Confirm')
    content = content.replace('إلغاء الارتباط', 'Unregister')
    content = content.replace('مسح', 'Wipe')
    
    # Tracking Page Specific
    content = content.replace('ZEX MILITARY — تتبع الوحدات', 'ZEX MILITARY — TACTICAL TRACKING')
    content = content.replace('العودة للغرفة', 'Return to Command')
    content = content.replace('الوحدات المتصلة:', 'Online Nodes:')
    content = content.replace('إجمالي الوحدات:', 'Total Nodes:')
    content = content.replace('دقة GPS:', 'GPS Accuracy:')
    content = content.replace('حالة العقدة:', 'Node Status:')
    content = content.replace('منقطع', 'Offline')
    content = content.replace('السجل الزمني للمسار', 'Route Playback Timeline')
    content = content.replace('نطاق الحماية (Geofence)', 'Tactical Geofence')
    content = content.replace('تفعيل النطاق الجغرافي الآمن', 'Enable Safe Zone')
    content = content.replace('قطر الدائرة (متر):', 'Radius (meters):')
    content = content.replace('السجل الجغرافي الأخير', 'Recent Coordinate Log')
    content = content.replace('لا يوجد سجل حالياً', 'No coordinate history available')
    content = content.replace('جاري تهيئة نظام التتبع...', 'Initializing Tactical Tracking System...')
    content = content.replace('بدء البحث...', 'Initiating radar sweep...')
    content = content.replace('إلغاء وضع الخطر للعودة للوضع الطبيعي.', 'Cancel alert state and return to nominal operation.')
    content = content.replace('سيتم مسح بيانات الجهاز نهائياً. هذه العملية لا يمكن التراجع عنها.', 'Irreversible data destruction will commence.')
    content = content.replace('إدخال كود PIN السري لإيقاف الإنذار', 'Enter authorization PIN to disarm siren')
    
    # Logs Page Specific
    content = content.replace('ZEX SECURITY — سجل التدقيق الجنائي', 'ZEX SECURITY — FORENSIC AUDIT LOG')
    content = content.replace('سجل التدقيق', 'Audit Log')
    content = content.replace('إجمالي الأحداث', 'Total Events')
    content = content.replace('الأحداث الحرجة', 'Critical Events')
    content = content.replace('آخر نشاط مسجل', 'Latest Activity')
    content = content.replace('بحث: معرف الجهاز، المشغل، نوع العملية...', 'Search: Node UID, Operator, Operation Type...')
    content = content.replace('الكل', 'All')
    content = content.replace('حرج', 'Critical')
    content = content.replace('تحذير', 'Warning')
    content = content.replace('معلومات', 'Info')
    content = content.replace('الوقت والتاريخ', 'Timestamp')
    content = content.replace('العقدة / الجهاز', 'Node / Device')
    content = content.replace('الخطورة', 'Severity')
    content = content.replace('نوع العملية', 'Operation Type')
    content = content.replace('المشغل', 'Operator')
    content = content.replace('التفاصيل', 'Details')
    content = content.replace('لا توجد سجلات مطابقة للبحث', 'No forensic records match current query')
    content = content.replace('التفاصيل الجنائية للحدث (Payload)', 'Forensic Event Payload (JSON)')
    content = content.replace('نسخ النص', 'Copy Payload')
    content = content.replace('تم النسخ!', 'Copied!')
    content = content.replace('جاري تحميل سجل الأمن الجنائي...', 'Loading Forensic Audit Log...')
    
    # Login Page Specific
    content = content.replace('تسجيل الدخول', 'Operator Login')
    content = content.replace('إنشاء حساب', 'Register')
    content = content.replace('البريد الإلكتروني', 'Operator Email')
    content = content.replace('كلمة المرور', 'Password')
    content = content.replace('الاسم', 'Operator Name')
    content = content.replace('رقم الهاتف', 'Phone Number')
    content = content.replace('تأكيد كلمة المرور', 'Confirm Password')
    content = content.replace('دخول آمن', 'Secure Login')
    content = content.replace('تذكر الجهاز', 'Remember Node')
    content = content.replace('رمز الدخول (PIN)', 'Authorization PIN')
    content = content.replace('6 أرقام', '6 digits')
    content = content.replace('منظومة الدفاع والتحكم الميداني C4ISR', 'C4ISR Tactical Command & Control')
    content = content.replace('تحكم فوري، تتبع دقيق، وحماية قصوى للهواتف الذكية', 'Real-time Command, Precision Tracking, Maximum Protection')
    content = content.replace('لوحة التحكم التكتيكية الموحدة لإدارة وتأمين الأجهزة والاتصالات المشفرة بأعلى معايير الحماية السيبرانية العسكرية وتتبع الحركة الفورية مع استجابة دفاعية صفرية.', 'Unified tactical dashboard for managing and securing nodes with military-grade cyber protection and instant zero-day defense response.')
    content = content.replace('قناة التشفير', 'Encryption Channel')
    content = content.replace('دقة التحديد', 'Tracking Precision')
    content = content.replace('الاستجابة', 'Response Time')
    content = content.replace('استجابة صفرية', 'Zero Latency')
    content = content.replace('مزامنة نقطة', 'Node Sync')
    content = content.replace('جاري التحقق...', 'Authenticating...')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for file in files:
    if os.path.exists(file):
        process_file(file)
        print(f"Processed {file}")
