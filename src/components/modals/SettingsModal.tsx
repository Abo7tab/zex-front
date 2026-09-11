import { useState } from "react";
import { X } from "lucide-react";
import api from "@/lib/axios";

export default function SettingsModal({ isOpen, onClose, user, onUserUpdate }: { isOpen: boolean, onClose: () => void, user: any, onUserUpdate: (u: any) => void }) {
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pinCode, setPinCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await api.put("/auth/profile", { name, email });
      setMessage("تم تحديث الملف الشخصي بنجاح");
      if (onUserUpdate) onUserUpdate(res.data.owner);
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      return setError("كلمة المرور غير متطابقة");
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const payload: any = { current_password: currentPassword };
      if (newPassword) {
        payload.password = newPassword;
        payload.password_confirmation = confirmPassword;
      }
      if (pinCode) {
        payload.pin_code = pinCode;
      }
      await api.put("/auth/security", payload);
      setMessage("تم تحديث الأمان بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPinCode("");
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl" dir="rtl">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-800">إعدادات المالك</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="flex border-b border-slate-100">
          <button onClick={() => setTab("profile")} className={`flex-1 p-3 text-sm font-semibold transition-colors ${tab === "profile" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"}`}>الملف الشخصي</button>
          <button onClick={() => setTab("password")} className={`flex-1 p-3 text-sm font-semibold transition-colors ${tab === "password" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"}`}>كلمة المرور</button>
          <button onClick={() => setTab("pin")} className={`flex-1 p-3 text-sm font-semibold transition-colors ${tab === "pin" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"}`}>رمز PIN</button>
        </div>

        <div className="p-4">
          {message && <div className="p-3 mb-4 text-sm text-green-700 bg-green-50 rounded-xl">{message}</div>}
          {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>}

          {tab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">الاسم</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </form>
          )}

          {tab === "password" && (
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">كلمة المرور الحالية (مطلوبة)</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full p-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">كلمة المرور الجديدة</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full p-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
              </button>
            </form>
          )}

          {tab === "pin" && (
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">كلمة المرور الحالية (مطلوبة للتحقق)</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full p-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">رمز PIN الجديد (6 أرقام)</label>
                <input type="text" maxLength={6} value={pinCode} onChange={e => setPinCode(e.target.value)} required className="w-full p-2 border border-slate-200 rounded-xl text-sm text-center tracking-widest" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {loading ? "جاري التحديث..." : "تحديث رمز PIN"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
