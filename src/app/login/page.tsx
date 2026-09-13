"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Eye, EyeOff, User, Phone, KeyRound } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Register specific fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== passwordConfirm) {
          setError('المفتاح التكتيكي غير متطابق');
          setLoading(false);
          return;
        }

        const payload = {
          name: name.trim(),
          email: identifier.trim(),
          phone: phone.trim(),
          password: password,
          password_confirmation: passwordConfirm,
          pin_code: pinCode.trim(),
        };

        const res = await axios.post('https://zex.alwaysdata.net/api/auth/register', payload);
        const token = res.data?.token || res.data?.access_token || res.data?.data?.token;

        if (token) {
          localStorage.setItem('zex_auth_token', token);
          localStorage.setItem('zex_token', token);
          document.cookie = "zex_auth_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "zex_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          router.push('/');
        } else {
          setError('فشل التسجيل - لم يتم استلام رمز تحقق من السيرفر');
        }
      } else {
        const payload = { 
          email: identifier.trim(), 
          password: password.trim() 
        };

        const res = await axios.post('https://zex.alwaysdata.net/api/auth/login', payload);
        const token = res.data?.token || res.data?.access_token || res.data?.data?.token;

        if (token) {
          localStorage.setItem('zex_auth_token', token);
          localStorage.setItem('zex_token', token);
          document.cookie = "zex_auth_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "zex_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          router.push('/');
        } else {
          setError('فشل الدخول - لم يتم استلام رمز تحقق من السيرفر');
        }
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
         const firstErrorKey = Object.keys(err.response.data.errors)[0];
         setError(err.response.data.errors[firstErrorKey][0]);
      } else {
         setError(err.response?.data?.message || (isRegister ? 'فشل التسجيل - تحقق من البيانات' : 'فشل الدخول - تحقق من البيانات'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F16] p-4 font-sans" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px #0A0F16 inset !important;
            -webkit-text-fill-color: #00FA9A !important;
        }
      `}} />
      <div className="w-full max-w-md bg-[#111827] border border-[#00F0FF]/20 rounded-2xl p-8 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
        <div className="mb-8 text-center border-b border-[#00F0FF]/20 pb-4">
          <h1 className="text-xl font-bold text-[#00F0FF] mb-2 tracking-widest">منظومة ZEX العسكرية</h1>
          <p className="text-[#00FA9A] text-xs uppercase tracking-widest font-mono">
            {isRegister ? 'بروتوكول تسجيل العناصر // TACTICAL OPS ENLIST' : 'بروتوكول الدخول التكتيكي // TACTICAL OPS ACCESS'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF3366]/10 border border-[#FF3366]/50 rounded-lg text-[#FF3366] text-sm font-mono flex items-center gap-2" dir="rtl">
            <span className="font-bold shrink-0" dir="ltr">[SYS_ERR]:</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} method="POST" className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">
                اسم العنصر
              </label>
              <div className="relative" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#00F0FF]/50" />
                </div>
                <input
                  type="text"
                  required={isRegister}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono text-sm"
                  placeholder="OPERATOR NAME"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">
              {isRegister ? 'البريد الإلكتروني للعنصر' : 'الرمز المميز للعنصر'}
            </label>
            <div className="relative" dir="ltr">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#00F0FF]/50" />
              </div>
              <input
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono text-sm"
                placeholder="OPERATOR EMAIL"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">
                رقم اتصال الأزمات
              </label>
              <div className="relative" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-[#00F0FF]/50" />
                </div>
                <input
                  type="text"
                  required={isRegister}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono text-sm"
                  placeholder="SECURE PHONE NUMBER"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">
              المفتاح التكتيكي
            </label>
            <div className="relative" dir="ltr">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#00F0FF]/50" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono text-sm"
                placeholder="TACTICAL ACCESS KEY"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#00F0FF]/60 hover:text-[#00F0FF]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">
                  تأكيد المفتاح
                </label>
                <div className="relative" dir="ltr">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#00F0FF]/50" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required={isRegister}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono text-sm"
                    placeholder="CONFIRM ACCESS KEY"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">
                  رمز الطوارئ (6 أرقام)
                </label>
                <div className="relative" dir="ltr">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-[#00F0FF]/50" />
                  </div>
                  <input
                    type="text"
                    required={isRegister}
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono text-sm tracking-widest"
                    placeholder="6-DIGIT PIN"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-[#00F0FF]/50 rounded-lg shadow-[0_0_10px_rgba(0,240,255,0.2)] text-sm font-bold text-black bg-[#00F0FF] hover:bg-[#00FA9A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F16] focus:ring-[#00F0FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-widest font-mono"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  <span>{isRegister ? 'جارٍ التسجيل...' : 'جارٍ التحقق // AUTHENTICATING...'}</span>
                </div>
              ) : (
                isRegister ? 'تسجيل // ENLIST NOW' : 'دخول // AUTHENTICATE'
              )}
            </button>
            
            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-[#FF3366]/50 rounded-md shadow-sm text-xs font-bold text-[#FF3366] bg-transparent hover:bg-[#FF3366]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F16] focus:ring-[#FF3366] transition-colors tracking-widest font-mono"
              onClick={() => alert('SOS PROTOCOL INITIATED')}
            >
              طوارئ // EMERGENCY OVERRIDE
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="w-full mt-2 text-center text-[#00FA9A]/70 hover:text-[#00FA9A] text-xs font-mono transition-colors tracking-widest"
            >
              {isRegister ? 'العودة للدخول // BACK TO LOGIN' : 'إنشاء حساب جديد // REGISTER OPERATOR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
