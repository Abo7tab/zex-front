"use client";

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
