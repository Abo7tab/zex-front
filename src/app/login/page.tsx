"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
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
      await login(email.trim(), password.trim());
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F16] p-4 font-mono">
      <div className="w-full max-w-md bg-[#111827] border border-[#00F0FF]/20 rounded-2xl p-8 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
        <div className="mb-8 text-center border-b border-[#00F0FF]/20 pb-4">
          <h1 className="text-xl font-bold text-[#00F0FF] mb-2 tracking-widest">منظومة ZEX العسكرية // بروتوكول الدخول</h1>
          <p className="text-[#00FA9A] text-xs uppercase tracking-widest">TACTICAL OPS ACCESS PROTOCOL // V2.4</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF3366]/10 border border-[#FF3366]/50 rounded-lg text-[#FF3366] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">OPERATOR CALL SIGN</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#00F0FF]/50" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition"
                placeholder="CALL SIGN / EMAIL"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#00F0FF] mb-2 uppercase tracking-wider">TACTICAL ACCESS KEY</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#00F0FF]/50" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-[#00F0FF]/30 rounded-lg bg-black/50 text-[#00FA9A] placeholder-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition"
                placeholder="????????"
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
            className="w-full flex justify-center items-center py-3 px-4 border border-[#00F0FF]/50 rounded-lg shadow-[0_0_10px_rgba(0,240,255,0.2)] text-sm font-bold text-black bg-[#00F0FF] hover:bg-[#00FA9A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F16] focus:ring-[#00F0FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-widest uppercase"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'AUTHENTICATE TERMINAL // دخول'}
          </button>
          
          <button
            type="button"
            className="w-full mt-4 flex justify-center py-2 px-4 border border-[#FF3366]/50 rounded-md shadow-sm text-xs font-bold text-[#FF3366] bg-transparent hover:bg-[#FF3366]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F16] focus:ring-[#FF3366] transition-colors tracking-widest uppercase"
            onClick={() => alert('SOS PROTOCOL INITIATED')}
          >
            EMERGENCY SOS / OFFLINE OVERRIDE
          </button>
        </form>
      </div>
    </div>
  );
}
