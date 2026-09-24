'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search } from 'lucide-react';

export const Header = ({ title }: { title: string }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 px-8 flex items-center justify-between">
      <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>

      <div className="flex items-center space-x-4">
        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            className="pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500 w-64 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Notification Icon */}
        <button className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-colors">
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </button>
      </div>
    </header>
  );
};
