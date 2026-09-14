"use client";

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, KeyRound, Server, ShieldCheck, LogOut, Activity, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function SettingsClient() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [authToken, setAuthToken] = useState('');
  const [zexToken, setZexToken] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchProfile();
    setAuthToken(localStorage.getItem('zex_auth_token') || '');
    setZexToken(localStorage.getItem('zex_token') || '');
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data || res.data;
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // If there's an actual endpoint in backend for updating profile, e.g. PUT /auth/profile
      await api.put('/auth/profile', { name, email, phone });
      alert('Operator profile updated successfully.');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update profile. Ensure backend is deployed.');
    } finally {
      setLoading(false);
    }
  };

  
  const [showPinPassword, setShowPinPassword] = useState(false);
  
  const [pinCurrentPassword, setPinCurrentPassword] = useState('');
  const [showPinCurrentPassword, setShowPinCurrentPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/security', { 
        current_password: currentPassword, 
        password: newPassword,
        password_confirmation: newPassword
      });
      alert('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/security', { 
        current_password: pinCurrentPassword, 
        pin_code: pinCode 
      });
      alert('PIN updated successfully.');
      setPinCurrentPassword('');
      setPinCode('');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update PIN.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRevokeSessions = () => {
    if (confirm('Are you sure you want to revoke all active sessions? You will be logged out immediately.')) {
      localStorage.removeItem('zex_auth_token');
      localStorage.removeItem('zex_token');
      document.cookie = 'zex_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'zex_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 sm:p-8" dir="ltr">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Operator Settings</h1>
              <p className="text-xs font-semibold text-slate-500">Manage profile, security PIN, and active sessions</p>
            </div>
          </div>
          <button onClick={handleRevokeSessions} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold rounded-xl transition-colors border border-rose-200 flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Profile Settings */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Operator Profile</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Operator Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" placeholder="Full Name" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" placeholder="operator@c4isr.gov" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" placeholder="+1..." />
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="w-full mt-2 h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-75">
                Save Profile Updates
              </button>
            </form>
          </section>
          
          
          {/* Security (Password) */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input type={showCurrentPassword ? "text" : "password"} required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white font-mono tracking-wider transition-colors" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input type={showNewPassword ? "text" : "password"} required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white font-mono tracking-wider transition-colors" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="w-full mt-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] disabled:opacity-75">
                Update Password
              </button>
            </form>
          </section>

          {/* Authorization PIN */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Authorization PIN</h2>
            </div>
            
            <form onSubmit={handleUpdatePin} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Current Password (to verify)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input type={showPinCurrentPassword ? "text" : "password"} required value={pinCurrentPassword} onChange={e => setPinCurrentPassword(e.target.value)} className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white font-mono tracking-wider transition-colors" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPinCurrentPassword(!showPinCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1">
                    {showPinCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">New Authorization PIN (6 digits)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input type={showPinPassword ? "text" : "password"} required maxLength={6} pattern="[0-9]{6}" value={pinCode} onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))} className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white font-mono tracking-widest transition-colors" placeholder="000000" />
                  <button type="button" onClick={() => setShowPinPassword(!showPinPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1">
                    {showPinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="w-full mt-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-[0.99] disabled:opacity-75">
                Update PIN
              </button>
            </form>
          </section>

          {/* Session & Tokens */}

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Active Session & Tokens</h2>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-24 shrink-0">AUTH TOKEN</span>
                    <span className="text-[10px] font-mono text-slate-600 truncate bg-slate-100 px-2 py-1 rounded w-full border border-slate-200">{authToken || 'Not Found'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-24 shrink-0">ZEX TOKEN</span>
                    <span className="text-[10px] font-mono text-slate-600 truncate bg-slate-100 px-2 py-1 rounded w-full border border-slate-200">{zexToken || 'Not Found'}</span>
                  </div>
                </div>
                <button onClick={handleRevokeSessions} className="w-full h-11 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm rounded-xl border border-rose-200 transition-colors">
                  Revoke All Sessions
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Server Configuration</h2>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="block text-xs font-bold text-indigo-400 mb-1">PRODUCTION ENDPOINT</span>
                    <span className="block text-sm font-mono font-semibold text-indigo-900 bg-white px-3 py-2 rounded-lg border border-indigo-100 shadow-sm">
                      https://zex.alwaysdata.net/api
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-indigo-400">STATUS</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ONLINE
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-indigo-400">PROTOCOL</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-1">
                        TLS 1.3
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

