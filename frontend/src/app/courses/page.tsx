'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Search, Filter, Edit, Trash2, BookOpen, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'B2',
    start_date: '',
    end_date: '',
    dat_km_target: 810,
    dat_hours_target: 20,
    notes: ''
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses', { params: { search, category } });
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, category]);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      category: 'B2',
      start_date: '',
      end_date: '',
      dat_km_target: 810,
      dat_hours_target: 20,
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      category: course.category,
      start_date: course.start_date ? course.start_date.split('T')[0] : '',
      end_date: course.end_date ? course.end_date.split('T')[0] : '',
      dat_km_target: course.dat_km_target,
      dat_hours_target: course.dat_hours_target,
      notes: course.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        const res = await api.put(`/courses/${editingCourse.id}`, formData);
        if (res.data.success) {
          toast.success('Cập nhật khóa học thành công!');
          setShowModal(false);
          fetchCourses();
        }
      } else {
        const res = await api.post('/courses', formData);
        if (res.data.success) {
          toast.success('Tạo khóa học mới thành công!');
          setShowModal(false);
          fetchCourses();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa/hủy khóa học ${code}?`)) return;
    try {
      const res = await api.delete(`/courses/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCourses();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa khóa học');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Quản Lý Khóa Đào Tạo" />

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 border border-slate-800 rounded-2xl">
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mã khóa, tên khóa học..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả hạng</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Khóa Học Mới</span>
            </button>
          </div>

          {/* Courses Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Mã Khóa</th>
                    <th className="px-6 py-4">Tên Khóa Học</th>
                    <th className="px-6 py-4">Hạng</th>
                    <th className="px-6 py-4">Thời Gian</th>
                    <th className="px-6 py-4">Định Mức DAT</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td>
                    </tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">Không tìm thấy khóa học nào</td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-blue-400">{course.code}</td>
                        <td className="px-6 py-4 font-semibold text-white">{course.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md text-xs font-bold">
                            {course.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {course.start_date?.split('T')[0]} → {course.end_date?.split('T')[0]}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold text-slate-200">{course.dat_km_target} KM</span> / <span className="font-semibold text-slate-200">{course.dat_hours_target} Giờ</span>
                        </td>
                        <td className="px-6 py-4">
                          {course.status === 'active' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              <span>Đang Đào Tạo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              <XCircle className="w-3 h-3" />
                              <span>Đã Kết Thúc / Hủy</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(course)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(course.id, course.code)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Create/Edit Course */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingCourse ? 'Chỉnh Sửa Khóa Đào Tạo' : 'Tạo Khóa Đào Tạo Mới'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mã Khóa Học *</label>
                  <input
                    type="text"
                    disabled={!!editingCourse}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="VD: K250_B2"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 uppercase font-mono disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Hạng Đào Tạo *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="A1">A1</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tên Khóa Học *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Khóa B2 K250 - Tháng 09/2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ngày Bắt Đầu *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ngày Kết Thúc *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Định Mức KM DAT</label>
                  <input
                    type="number"
                    value={formData.dat_km_target}
                    onChange={(e) => setFormData({ ...formData, dat_km_target: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Định Mức Giờ DAT</label>
                  <input
                    type="number"
                    value={formData.dat_hours_target}
                    onChange={(e) => setFormData({ ...formData, dat_hours_target: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                  {editingCourse ? 'Lưu Thay Đổi' : 'Tạo Khóa Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
