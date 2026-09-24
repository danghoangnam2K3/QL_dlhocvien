'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  Calendar, Plus, Search, Filter, Clock, Car, UserCheck,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    schedule_type: 'DAT',
    instructor: '',
    vehicle_code: '',
    scheduled_at: '',
    notes: ''
  });

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students?status=active');
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules', {
        params: { type: typeFilter, status: statusFilter }
      });
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      toast.error('Lỗi khi tải lịch học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [typeFilter, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/schedules', formData);
      if (res.data.success) {
        toast.success('Xếp lịch học thành công!');
        setShowModal(false);
        setFormData({
          student_id: '',
          schedule_type: 'DAT',
          instructor: '',
          vehicle_code: '',
          scheduled_at: '',
          notes: ''
        });
        fetchSchedules();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo lịch học');
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch học này?')) return;
    try {
      const res = await api.delete(`/schedules/${id}`);
      if (res.data.success) {
        toast.success('Hủy lịch học thành công!');
        fetchSchedules();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy lịch');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Quản Lý Lịch Học DAT & Cabin" />

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 border border-slate-800 rounded-2xl">
            <div className="flex items-center space-x-3 flex-1">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả loại lịch</option>
                <option value="DAT">Lịch Thực Hành DAT</option>
                <option value="Cabin">Lịch Mô Phỏng Cabin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ Thực Hiện</option>
                <option value="completed">Đã Hoàn Thành</option>
                <option value="cancelled">Đã Hủy</option>
              </select>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Xếp Lịch Học Mới</span>
            </button>
          </div>

          {/* Schedule List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Học Viên</th>
                    <th className="px-6 py-4">Loại Lịch</th>
                    <th className="px-6 py-4">Thời Gian Tập</th>
                    <th className="px-6 py-4">Giáo Viên / Xe</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">Đang tải lịch học...</td>
                    </tr>
                  ) : schedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">Chưa có lịch học nào được tạo</td>
                    </tr>
                  ) : (
                    schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">{sch.student?.full_name}</span>
                          <span className="text-xs text-slate-400 font-mono">CCCD: {sch.student?.cccd}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            sch.schedule_type === 'DAT'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {sch.schedule_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-200">
                          {new Date(sch.scheduled_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300">
                          <span className="block font-semibold">{sch.instructor || 'Chưa phân công GV'}</span>
                          <span className="text-slate-400">Mã xe: {sch.vehicle_code || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          {sch.status === 'pending' ? (
                            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium">
                              Chờ Thực Hiện
                            </span>
                          ) : sch.status === 'completed' ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
                              Đã Hoàn Thành
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium">
                              Đã Hủy
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {sch.status === 'pending' && (
                            <button
                              onClick={() => handleCancelSchedule(sch.id)}
                              className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                            >
                              Hủy Lịch
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Xếp Lịch Tập Mới (DAT / Cabin)</h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Học Viên *</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Chọn Học Viên --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.cccd})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Loại Lịch *</label>
                  <select
                    value={formData.schedule_type}
                    onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="DAT">Thực Hành DAT</option>
                    <option value="Cabin">Mô Phỏng Cabin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Thời Gian Dự Kiến *</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Giáo Viên Hướng Dẫn</label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="Tên GV..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mã Xe Tập</label>
                  <input
                    type="text"
                    value={formData.vehicle_code}
                    onChange={(e) => setFormData({ ...formData, vehicle_code: e.target.value })}
                    placeholder="BKS / Mã xe..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ghi Chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Lưu Lịch Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
