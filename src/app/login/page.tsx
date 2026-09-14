"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Shield, Smartphone, Crosshair, Key, Gauge, ShieldCheck, Lock, Network, LogIn, UserPlus, Mail, Eye, EyeOff, User, Phone, KeyRound, AlertTriangle, Radio } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
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
          setError('Password وConfirm Password غير متطابقين');
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

        const res = await api.post('/auth/register', payload);
        const token = res.data?.token || res.data?.access_token || res.data?.data?.token;

        if (token) {
          localStorage.setItem('zex_auth_token', token);
          localStorage.setItem('zex_token', token);
          document.cookie = "zex_auth_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "zex_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          router.push('/dashboard');
        } else {
          setError('فشل التسجيل - لم يتم استلام توكن من السيرفر');
        }
      } else {
        const payload = { 
          email: identifier.trim(), 
          password: password.trim() 
        };

        const res = await api.post('/auth/login', payload);
        const token = res.data?.token || res.data?.access_token || res.data?.data?.token;

        if (token) {
          localStorage.setItem('zex_auth_token', token);
          localStorage.setItem('zex_token', token);
          document.cookie = "zex_auth_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "zex_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
          router.push('/dashboard');
        } else {
          setError('فشل الدخول - لم يتم استلام توكن من السيرفر');
        }
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
         const firstErrorKey = Object.keys(err.response.data.errors)[0];
         setError(err.response.data.errors[firstErrorKey][0]);
      } else {
         setError(err.response?.data?.message || (isRegister ? 'فشل التسجيل - تأكد من البيانات' : 'فشل الدخول - تأكد من البيانات'));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = (mode: 'login' | 'register') => {
    setIsRegister(mode === 'register');
    setError('');
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans" dir="ltr">
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <header className="w-full max-w-7xl mx-auto flex flex-row items-center justify-between py-3 px-2 mb-4 text-xs font-semibold text-slate-500 z-10">
        <div className="flex flex-row items-center gap-2">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse"></span>
          <span className="tracking-wide">UNIFIED DEFENSE NETWORK // QUANTUM ENCRYPTEDي</span>
        </div>
        <div className="hidden sm:flex flex-row items-center gap-4 font-mono text-[11px] text-slate-400">
          <span className="text-blue-600 font-bold">STATUS: OPERATIONAL</span>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch z-10">
        
        <section className="lg:col-span-6 flex flex-col justify-between gap-6 order-2 lg:order-1 bg-gradient-to-b from-white to-slate-50/80 rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
          <div className="flex flex-col gap-4">
            <div className="inline-flex flex-row items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>C4ISR Tactical Command & Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              تحكم فوري، تتبع دقيق، وحماية قصوى لهواتفك الذكية
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Unified tactical dashboard for managing and securing nodes with military-grade cyber protection and instant zero-day defense response.
            </p>
          </div>

          <div className="relative bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl overflow-hidden border border-slate-800">
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-row items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4 relative z-10">
              <div className="flex flex-row items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-base text-slate-100 flex flex-row items-center gap-2">
                    <span>ZEX-Terminal Alpha</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono" dir="ltr">NODE-09</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono" dir="ltr">#TAC-9844-X</div>
                </div>
              </div>
              <span className="inline-flex flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                قفل تكتيكي Active
              </span>
            </div>

            <div className="relative bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-5 overflow-hidden">
              <div className="flex flex-row items-center justify-between text-xs text-slate-300 font-mono mb-2">
                <span className="flex flex-row items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-blue-400" />
                  <span dir="ltr">Galileo + GPS</span>
                </span>
                <span className="text-emerald-400 font-bold">مزامنة Activeة</span>
              </div>
              <div className="h-28 w-full flex items-center justify-center relative my-1">
                <svg className="w-full h-full text-blue-500/30" fill="none" preserveAspectRatio="none" viewBox="0 0 320 80">
                  <path d="M0,40 Q40,15 80,40 T160,40 T240,10 T320,40" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke"></path>
                  <path className="text-blue-400/20" d="M0,40 Q50,70 100,40 T200,20 T320,55" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" vectorEffect="non-scaling-stroke"></path>
                  <circle className="fill-blue-400" cx="190" cy="23" r="4.5"></circle>
                  <circle className="text-blue-400 animate-ping" cx="190" cy="23" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="bg-slate-900/90 text-slate-200 border border-slate-700/80 px-3.5 py-1 rounded-full text-xs font-medium shadow backdrop-blur-sm" dir="ltr">
                    0.0000� N, 0.0000� E
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex flex-col items-center gap-0.5">
                <span className="text-[11px] text-slate-400 font-sans flex flex-row items-center justify-center gap-1 w-full">
                  <Crosshair className="w-3 h-3 text-emerald-400" />
                  Tracking Precision
                </span>
                <span className="text-lg font-bold text-white">4m</span>
                <span className="text-[10px] text-emerald-400">Dual GPS</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex flex-col items-center gap-0.5">
                <span className="text-[11px] text-slate-400 font-sans flex flex-row items-center justify-center gap-1 w-full">
                  <Key className="w-3 h-3 text-blue-400" />
                  Encryption Channel
                </span>
                <span className="text-lg font-bold text-white">AES</span>
                <span className="text-[10px] text-blue-400">Quantum</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex flex-col items-center gap-0.5">
                <span className="text-[11px] text-slate-400 font-sans flex flex-row items-center justify-center gap-1 w-full">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  Response Time
                </span>
                <span className="text-lg font-bold text-white">12ms</span>
                <span className="text-[10px] text-amber-400">Zero Latency</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex flex-row items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>ISO-27001</span>
              </div>
              <div className="flex flex-row items-center gap-1.5">
                <Lock className="w-3 h-3 text-blue-400" />
                <span>Zero-Trust V4</span>
              </div>
              <div className="flex flex-row items-center gap-1.5">
                <Network className="w-3 h-3 text-slate-300" />
                <span>Military Grid</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
            <span>C4ISR Core v4.8.2</span>
            <span>© ZEX Defense Systems</span>
          </div>
        </section>

        <section className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md flex flex-col justify-between gap-6 order-1 lg:order-2 relative">
          
          <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex flex-row items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/25">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight">ZEX MILITARY</span>
                <span className="text-xs font-semibold text-slate-500">Encrypted Operations</span>
              </div>
            </div>
            <div className="inline-flex flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ACTIVE TACTICAL SHIELD</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="flex flex-col gap-3">
            {error && (
              <div className="flex flex-row items-start justify-between gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 shadow-sm transition-all duration-300">
                <div className="flex flex-row items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm text-red-900">تنبيه النظام</span>
                    <p className="text-xs text-red-700 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
                <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 p-1 rounded-lg hover:bg-red-100/60 transition-colors" type="button">
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="p-1 bg-slate-100 rounded-2xl grid grid-cols-2 gap-1 text-sm font-bold">
            <button 
              onClick={() => toggleAuthMode('login')} 
              className={`py-2.5 rounded-xl transition-all duration-200 text-center flex flex-row items-center justify-center gap-1.5 ${!isRegister ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`} type="button">
              <LogIn className="w-4 h-4" />
              <span>Operator Login</span>
            </button>
            <button 
              onClick={() => toggleAuthMode('register')} 
              className={`py-2.5 rounded-xl transition-all duration-200 text-center flex flex-row items-center justify-center gap-1.5 ${isRegister ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`} type="button">
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleAuth}>
            {!isRegister ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex flex-row items-center justify-between">
                    <span>Operator Email</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute right-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                    <input 
                      type="email" 
                      required 
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full h-11 pr-11 pl-4 rounded-xl bg-slate-50 border border-slate-300/80 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all shadow-sm text-left" 
                      dir="ltr"
                      placeholder="operator@c4isr.gov" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-row items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute right-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pr-11 pl-11 rounded-xl bg-slate-50 border border-slate-300/80 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all shadow-sm text-left font-mono tracking-widest" 
                      dir="ltr"
                      placeholder="••••••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 text-slate-400 hover:text-slate-700 p-1 flex items-center justify-center transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Operator Name</label>
                    <div className="relative flex items-center">
                      <User className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white shadow-sm" placeholder="Operator Name" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <div className="relative flex items-center">
                      <Phone className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="tel" dir="ltr" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 pl-9 pr-3 text-left rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white shadow-sm" placeholder="+966" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Operator Email</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="email" dir="ltr" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white shadow-sm text-left" placeholder="unit@mod.gov" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Security PIN (6 Digits)</label>
                    <div className="relative flex items-center">
                      <KeyRound className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="password" required maxLength={6} pattern="[0-9]{6}" value={pinCode} onChange={(e) => setPinCode(e.target.value)} className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white shadow-sm font-mono tracking-widest text-left" dir="ltr" placeholder="6 digits" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white shadow-sm font-mono tracking-widest text-left" dir="ltr" placeholder="••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-2.5 text-slate-400 hover:text-slate-700 flex items-center">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute right-3 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type={showPassword ? "text" : "password"} required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white shadow-sm font-mono tracking-widest text-left" dir="ltr" placeholder="••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-2.5 text-slate-400 hover:text-slate-700 flex items-center">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="flex flex-row items-center justify-between text-xs text-slate-600 py-1">
                <label className="inline-flex flex-row items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                  <span>Remember Node</span>
                </label>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/25 flex flex-row items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  {isRegister ? <UserPlus className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                  <span>{isRegister ? 'Register' : 'Secure Login'}</span>
                </>
              )}
            </button>
          </form>
          </div>

        </section>
      </main>
    </div>
  );
}
