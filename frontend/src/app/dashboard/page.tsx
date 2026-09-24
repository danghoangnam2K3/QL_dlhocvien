'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import {
  BookOpen,
  Users,
  AlertTriangle,
  Award,
  Calendar,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dashboard Tổng Quan" />

        <main className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Khóa học mở</p>
                  <h3 className="text-3xl font-extrabold text-white mt-2">
                    {loading ? '-' : stats?.summary?.total_active_courses || 0}
                  </h3>
                </div>
                <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <span>Đang hoạt động</span>
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng học viên</p>
                  <h3 className="text-3xl font-extrabold text-white mt-2">
                    {loading ? '-' : stats?.summary?.total_active_students || 0}
                  </h3>
                </div>
                <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                <span>Hồ sơ đang theo dõi</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cảnh báo lỗi DAT</p>
                  <h3 className="text-3xl font-extrabold text-amber-400 mt-2">
                    {loading ? '-' : stats?.summary?.total_dat_errors || 0}
                  </h3>
                </div>
                <div className="p-3 bg-amber-600/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-xs text-amber-400/80 font-medium">
                <span>Cần kiểm tra đối soát</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Đạt Đăng Ký Thi</p>
                  <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">
                    {loading ? '-' : stats?.summary?.total_eligible_students || 0}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Award className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-xs text-emerald-400/80 font-medium">
                <span>Đã đủ điều kiện DAT</span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/courses"
              className="p-6 bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div>
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">Quản Lý Khóa Học</h4>
                <p className="text-xs text-slate-400 mt-1">Tạo mới, thiết lập định mức DAT</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link
              href="/dat"
              className="p-6 bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div>
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">Nhập & Theo Dõi DAT</h4>
                <p className="text-xs text-slate-400 mt-1">Import file XML/Excel đối soát</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link
              href="/graduation"
              className="p-6 bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div>
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">Đợt Tốt Nghiệp</h4>
                <p className="text-xs text-slate-400 mt-1">Tự động xét duyệt & xuất báo cáo</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>
          </div>

          {/* Section: Category breakdown & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category breakdown */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-4">Phân Bổ Học Viên Theo Hạng</h3>
              <div className="space-y-4">
                {stats?.category_breakdown && Object.keys(stats.category_breakdown).length > 0 ? (
                  Object.entries(stats.category_breakdown).map(([cat, count]: any) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg text-xs border border-blue-500/20">
                        Hạng {cat}
                      </span>
                      <span className="font-extrabold text-white">{count} học viên</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">Chưa có dữ liệu phân bổ</p>
                )}
              </div>
            </div>

            {/* Recent Audit Activities */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Lịch Sử Thao Tác Gần Đây</h3>
                <button onClick={fetchStats} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {stats?.recent_activities?.length > 0 ? (
                  stats.recent_activities.map((act: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/40 text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-blue-600/10 text-blue-400 font-mono font-semibold rounded border border-blue-500/20">
                          {act.action}
                        </span>
                        <span className="text-slate-300 font-medium">{act.entity}</span>
                      </div>
                      <div className="text-right text-slate-400">
                        <span>{act.user?.full_name || act.user?.username || 'Hệ thống'}</span>
                        <span className="block text-[10px] text-slate-500">{new Date(act.created_at).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">Chưa có lịch sử thao tác</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
