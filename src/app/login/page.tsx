"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('https://ab7tb.alwaysdata.net/api/v1/auth/login', {
        email: identifier.trim(),
        call_sign: identifier.trim(),
        password: password.trim()
      });
      
      const token = res.data?.token || res.data?.access_token || res.data?.data?.token;
      
      if (token) {
        localStorage.setItem('zex_auth_token', token);
        document.cookie = "zex_auth_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
        
        // Also set zex_token to maintain compatibility with previous proxy middleware and axios
        localStorage.setItem('zex_token', token);
        document.cookie = "zex_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
        
        router.push('/');
      } else {
        setError('فشل الدخول - لم يتم استلام رمز تحقق من السيرفر');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل الدخول - تحقق من البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F16] p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-[#111827] border border-[#00F0FF]/20 rounded-2xl p-8 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
        <div className="mb-8 text-center border-b border-[#00F0FF]/20 pb-4">
          <h1 className="text-xl font-bold text-[#00F0FF] mb-2 tracking-widest">منظومة ZEX العسكرية</h1>
          <p className="text-[#00FA9A] text-xs uppercase tracking-widest font-mono">بروتوكول الدخول التكتيكي // TACTICAL OPS ACCESS</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF3366]/10 border border-[#FF3366]/50 rounded-lg text-[#FF3366] text-sm font-mono text-left" dir="ltr">
            [SYS_ERR]: {error}
          </div>
        )}

        <form onSubmit={handleLogin} method="POST" className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">
              الرمز المميز للعنصر
            </label>
            <div className="relative" dir="ltr">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#00F0FF]/50" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono"
                placeholder="OPERATOR CALL SIGN"
              />
            </div>
          </div>

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
                className="block w-full pl-10 pr-10 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition font-mono"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-[#00F0FF]/50 rounded-lg shadow-[0_0_10px_rgba(0,240,255,0.2)] text-sm font-bold text-black bg-[#00F0FF] hover:bg-[#00FA9A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F16] focus:ring-[#00F0FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-widest font-mono"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                جارٍ التحقق // AUTHENTICATING...
              </>
            ) : (
              'دخول // AUTHENTICATE'
            )}
          </button>
          
          <button
            type="button"
            className="w-full mt-4 flex justify-center py-2 px-4 border border-[#FF3366]/50 rounded-md shadow-sm text-xs font-bold text-[#FF3366] bg-transparent hover:bg-[#FF3366]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F16] focus:ring-[#FF3366] transition-colors tracking-widest font-mono"
            onClick={() => alert('SOS PROTOCOL INITIATED')}
          >
            طوارئ // EMERGENCY OVERRIDE
          </button>
        </form>
      </div>
    </div>
  );
}
