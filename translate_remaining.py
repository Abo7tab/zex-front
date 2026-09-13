import os

files = [
    "src/app/dashboard/DashboardClient.tsx",
    "src/app/tracking/TrackingClient.tsx",
    "src/app/logs/LogsClient.tsx",
    "src/app/login/page.tsx",
    "src/components/map/LeafletMap.tsx",
    "src/components/map/TrackingMap.tsx"
]

replacements = {
    "عقدة :": "Node:",
    "الحالة التكتيكية: مستقرة": "TACTICAL STATUS: DEFCON-5 NOMINAL",
    "جميع الأنظمة الدفاعية طبيعية": "All systems operating within standard parameters.",
    "تشفير": "Encryption",
    "بروتوكول": "Protocol",
    "نشط": "Active",
    "العمليات المشفرة": "Encrypted Operations",
    "الوحدات النشطة": "Active Units",
    "إنذار صاخب": "Scream Alert",
    "تفعيل الصفارة": "Siren On",
    "إيقاف الإنذار": "Silence Alert",
    "كتم الصوت": "Mute Siren",
    "تحديد الموقع": "GPS Locate",
    "مباشر GPS": "Live GPS",
    "بحث BLE": "BLE Radar",
    "رادار محلي": "Local Search",
    "إيقاف البحث": "Stop Radar",
    "تعطيل الرادار": "Disable BLE",
    "وضع السرقة": "Mark Stolen",
    "بروتوكول الطوارئ": "Lock Protocol",
    "إلغاء السرقة": "Unmark Stolen",
    "استعادة الجهاز": "Recovered",
    "مسح الجهاز": "Wipe Device",
    "حذف نهائي": "Permanent Purge",
    "نطاق آمن": "Safe Geofence"
}

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for ar, en in replacements.items():
            content = content.replace(ar, en)
            
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Processed {file}")
