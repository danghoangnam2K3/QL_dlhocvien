'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  Plus, Search, Upload, User, Phone, IdCard, Calendar,
  FileCheck, XCircle, Edit, Ban, FileSpreadsheet,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCabinModal, setShowCabinModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    course_id: '',
    full_name: '',
    dob: '',
    cccd: '',
    phone: '',
    category: 'B2'
  });

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCourseId, setImportCourseId] = useState('');

  const [cabinData, setCabinData] = useState({
    cabin_status: 'submitted',
    cabin_submit_date: new Date().toISOString().split('T')[0]
  });

  const [cancelReason, setCancelReason] = useState('');

  // 1. Tải cache tức thì khi mở trang (0ms delay)
  useEffect(() => {
    try {
      const cachedCourses = sessionStorage.getItem('cache_courses');
      if (cachedCourses) setCourses(JSON.parse(cachedCourses));

      const cachedStudents = sessionStorage.getItem('cache_students');
      if (cachedStudents) {
        const parsed = JSON.parse(cachedStudents);
        setStudents(parsed.data || []);
        if (parsed.pagination) {
          setTotal(parsed.pagination.total || 0);
          setTotalPages(parsed.pagination.totalPages || 1);
        }
      } else {
        setLoading(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses?status=active');
      if (res.data.success) {
        setCourses(res.data.data);
        sessionStorage.setItem('cache_courses', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students', {
        params: { search: debouncedSearch, course_id: courseId, status, page, limit }
      });
      if (res.data.success) {
        setStudents(res.data.data);
        if (res.data.pagination) {
          setTotal(res.data.pagination.total || 0);
          setTotalPages(res.data.pagination.totalPages || 1);
        }
        sessionStorage.setItem('cache_students', JSON.stringify({
          data: res.data.data,
          pagination: res.data.pagination
        }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, courseId, status, limit]);

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch, courseId, status, page, limit]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', formData);
      if (res.data.success) {
        toast.success('Thêm học viên thành công!');
        setShowAddModal(false);
        fetchStudents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Vui lòng chọn file dữ liệu (.xml hoặc .xlsx)');
      return;
    }

    const isXml = importFile.name.toLowerCase().endsWith('.xml');
    if (!isXml && !importCourseId) {
      toast.error('Vui lòng chọn khóa học khi nhập file Excel');
      return;
    }

    const data = new FormData();
    data.append('file', importFile);
    if (importCourseId) {
      data.append('course_id', importCourseId);
    }

    try {
      const res = await api.post('/students/import', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message, { duration: 6000 });
        setShowImportModal(false);
        setImportFile(null);
        fetchCourses();
        fetchStudents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi nhập file');
    }
  };

  const handleUpdateCabin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await api.patch(`/students/${selectedStudent.id}/cabin`, cabinData);
      if (res.data.success) {
        toast.success('Cập nhật báo cáo Cabin thành công!');
        setShowCabinModal(false);
        fetchStudents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật Cabin');
    }
  };

  const handleCancelStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await api.patch(`/students/${selectedStudent.id}/cancel`, {
        cancel_reason: cancelReason
      });
      if (res.data.success) {
        toast.success('Hủy hồ sơ học viên thành công!');
        setShowCancelModal(false);
        setCancelReason('');
        fetchStudents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy hồ sơ');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Quản Lý Danh Sách Học Viên" />

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Controls Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-4 border border-slate-800 rounded-2xl">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Họ tên, số CCCD, SĐT..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả khóa học</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang học</option>
                <option value="cancelled">Đã hủy hồ sơ</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl flex items-center space-x-2 border border-slate-700 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Import File Báo Cáo 1</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Thủ Công</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Họ & Tên</th>
                    <th className="px-6 py-4">CCCD / Ngày Sinh</th>
                    <th className="px-6 py-4">Khóa Học / Hạng</th>
                    <th className="px-6 py-4">Số Điện Thoại</th>
                    <th className="px-6 py-4">Báo Cáo Cabin</th>
                    <th className="px-6 py-4">Trạng Thái Hồ Sơ</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">Không tìm thấy học viên nào</td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{student.full_name}</td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <span className="text-blue-400 font-bold block">{student.cccd}</span>
                          <span className="text-slate-400">{student.dob}</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-bold text-slate-200 block">{student.course?.code}</span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-[10px] font-bold">
                            Hạng {student.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{student.phone || '-'}</td>
                        <td className="px-6 py-4">
                          {student.cabin_status === 'submitted' ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center w-max space-x-1">
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Đã Nộp ({student.cabin_submit_date})</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-semibold flex items-center w-max space-x-1">
                              <span>Chưa Nộp</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.student_status === 'active' ? (
                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">
                              Đang Học
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold" title={student.cancel_reason}>
                              Đã Hủy Hồ Sơ
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setCabinData({
                                cabin_status: student.cabin_status || 'submitted',
                                cabin_submit_date: student.cabin_submit_date || new Date().toISOString().split('T')[0]
                              });
                              setShowCabinModal(true);
                            }}
                            title="Cập nhật Cabin"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>

                          {student.student_status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowCancelModal(true);
                              }}
                              title="Hủy hồ sơ"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {total > 0 && (
              <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Hiển thị <strong className="text-white">{(page - 1) * limit + 1}</strong> - <strong className="text-white">{Math.min(page * limit, total)}</strong> trên tổng số <strong className="text-emerald-400">{total}</strong> học viên
                  </span>
                  <span className="text-slate-700 hidden md:inline">|</span>
                  <div className="flex items-center space-x-2">
                    <span>Số lượng hiển thị:</span>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value={10}>10 dòng / trang</option>
                      <option value={20}>20 dòng / trang</option>
                      <option value={50}>50 dòng / trang</option>
                      <option value={100}>100 dòng / trang</option>
                      <option value={250}>250 dòng / trang</option>
                      <option value={500}>500 dòng (Tất cả)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-xs">
                    Trang {page} / {totalPages}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Add Student Manually */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Thêm Mới Học Viên Thủ Công</h3>
            <form onSubmit={handleAddStudent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Khóa Học *</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Chọn Khóa Học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Họ Và Tên *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Số CCCD *</label>
                  <input
                    type="text"
                    value={formData.cccd}
                    onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                    placeholder="12 chữ số..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ngày Sinh *</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Hạng *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Thêm Học Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel/XML File (Báo cáo 1) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Import File Báo Cáo 1 (BC1)</span>
            </h3>

            <form onSubmit={handleImportFile} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Khóa Đào Tạo <span className="text-slate-500 font-normal">(Tùy chọn với file XML BC1)</span>
                </label>
                <select
                  value={importCourseId}
                  onChange={(e) => setImportCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Tự Động Đọc Từ File XML --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">File Báo Cáo (.xml / .xlsx) *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.xml"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  required
                />
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-blue-500/20 text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-blue-400 flex items-center space-x-1">
                  <span>⚡ Tự Động Hóa Nhập Dữ Liệu Báo Cáo 1:</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  • <strong className="text-white">File XML:</strong> Hệ thống tự động trích xuất thông tin và <strong className="text-emerald-400">tạo mới Khóa học</strong> (nếu chưa có) & toàn bộ danh sách Học viên.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  • <strong className="text-white">File Excel:</strong> Vui lòng chọn Khóa học tương ứng trước khi bấm Import.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30"
                >
                  Import Dữ Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cabin Update */}
      {showCabinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Cập Nhật Báo Cáo Cabin</h3>
            <p className="text-xs text-slate-400">Học viên: <span className="font-bold text-white">{selectedStudent?.full_name}</span></p>

            <form onSubmit={handleUpdateCabin} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Trạng Thái Báo Cáo *</label>
                <select
                  value={cabinData.cabin_status}
                  onChange={(e) => setCabinData({ ...cabinData, cabin_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="submitted">Đã Nộp Phiếu Giấy</option>
                  <option value="not_submitted">Chưa Nộp</option>
                </select>
              </div>

              {cabinData.cabin_status === 'submitted' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ngày Nộp *</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={cabinData.cabin_submit_date}
                    onChange={(e) => setCabinData({ ...cabinData, cabin_submit_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCabinModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cancel Student */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-400">Hủy Hồ Sơ Học Viên</h3>
            <p className="text-xs text-slate-400">Xác nhận hủy hồ sơ của học viên <span className="font-bold text-white">{selectedStudent?.full_name}</span>?</p>

            <form onSubmit={handleCancelStudent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Lý Do Hủy Hồ Sơ *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="VD: Rút hồ sơ / Bỏ học..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Bỏ Qua
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-600/30"
                >
                  Xác Nhận Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
