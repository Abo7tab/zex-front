import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# lib/axios.ts
axios_ts = """import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'https://zex.alwaysdata.net/api/',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('zex_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('zex_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
"""
write_file('src/lib/axios.ts', axios_ts)

# lib/auth.ts
auth_ts = """import api from './axios';
import Cookies from 'js-cookie';

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  const token = res.data?.token || res.data?.data?.token;
  if (token) {
    Cookies.set('zex_token', token, { expires: 7 }); // 7 days
  }
  return res.data;
};

export const logout = async () => {
  Cookies.remove('zex_token');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
"""
write_file('src/lib/auth.ts', auth_ts)

# middleware.ts
middleware_ts = """import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('zex_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/') {
    if (token) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
"""
write_file('src/middleware.ts', middleware_ts)

# login UI
login_page_tsx = """"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">ZEX Tracker</h1>
          <p className="text-slate-400">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="owner@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
"""
write_file('src/app/login/page.tsx', login_page_tsx)

# dashboard UI
dashboard_page_tsx = """"use client";

import { useEffect, useState } from 'react';
import { getMe, logout } from '@/lib/auth';
import { LogOut, User } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getMe().then((data) => setUser(data.data || data)).catch(() => logout());
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">Z</div>
          <span className="text-xl font-semibold text-white">ZEX Dashboard</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <User className="h-4 w-4" />
            <span>{user?.name || 'Loading...'}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Welcome to ZEX Dashboard</h2>
          <p className="text-slate-400">Your anti-theft tracking center is currently being built. Device management and map views will appear here.</p>
        </div>
      </main>
    </div>
  );
}
"""
write_file('src/app/dashboard/page.tsx', dashboard_page_tsx)

# globals.css
globals_css = """@import "tailwindcss";

@plugin "tailwindcss-animate";

:root {
  --background: #020617; /* slate-950 */
  --foreground: #f8fafc; /* slate-50 */
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
"""
write_file('src/app/globals.css', globals_css)

if os.path.exists('src/app/page.tsx'):
    os.remove('src/app/page.tsx')
