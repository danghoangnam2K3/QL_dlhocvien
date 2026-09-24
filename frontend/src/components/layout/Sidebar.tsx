'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  Activity,
  Calendar,
  Award,
  UserCheck,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Khóa Đào Tạo', href: '/courses', icon: BookOpen },
    { name: 'Học Viên', href: '/students', icon: Users },
    { name: 'Quản Lý DAT', href: '/dat', icon: Activity },
    { name: 'Lịch Học DAT/Cabin', href: '/schedules', icon: Calendar },
    { name: 'Đợt Tốt Nghiệp', href: '/graduation', icon: Award },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Quản Lý Tài Khoản', href: '/users', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 text-slate-200 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-wide leading-tight">Số Hóa Lái Xe</h1>
            <p className="text-xs text-slate-400">Quản Lý & Tốt Nghiệp</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-blue-400">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.username}</p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-blue-950 text-blue-300 border border-blue-800/50 uppercase">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
