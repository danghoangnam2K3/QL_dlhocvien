'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  Upload, Search, Filter, Activity, AlertTriangle,
  CheckCircle, Clock, FileSpreadsheet, Eye, Info
} from 'lucide-react';

export default function DATPage() {
  const [datList, setDatList] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [hasError, setHasError] = useState(false);

  // Import DAT Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCourseId, setImportCourseId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);

  // Student DAT Detail Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses?status=active');
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDAT = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dat', {
        params: { search, course_id: courseId, has_error: hasError }
      });
      if (res.data.success) {
        setDatList(res.data.data);
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu DAT');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchDAT();
  }, [search, courseId, hasError]);

  const handleImportDAT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !importCourseId) {
      toast.error('Vui lòng chọn khóa học và file dữ liệu DAT');
      return;
    }

    const data = new FormData();
    data.append('file', importFile);
    data.append('course_id', importCourseId);

    try {
      const res = await api.post('/dat/import', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowImportModal(false);
        setImportFile(null);
        fetchDAT();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi import file DAT');
    }
  };

  const handleViewDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    try {
      const res = await api.get(`/dat/student/${studentId}`);
      if (res.data.success) {
        setStudentDetail(res.data.data);
      }
    } catch (err) {
      toast.error('Không thể lấy chi tiết DAT');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Quản Lý & Đối Soát Dữ Liệu DAT" />

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-4 border border-slate-800 rounded-2xl">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Họ tên, số CCCD..."
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

              <button
                onClick={() => setHasError(!hasError)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  hasError
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Chỉ hiện hồ sơ có lỗi</span>
              </button>
            </div>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import File DAT (Excel)</span>
            </button>
          </div>

          {/* DAT Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Họ & Tên</th>
                    <th className="px-6 py-4">CCCD / Khóa Học</th>
                    <th className="px-6 py-4">Tổng Quãng Đường (KM)</th>
                    <th className="px-6 py-4">Tổng Thời Gian (Giờ)</th>
                    <th className="px-6 py-4">Trạng Thái Đạt DAT</th>
                    <th className="px-6 py-4 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">Đang tải dữ liệu DAT...</td>
                    </tr>
                  ) : datList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">Chưa có dữ liệu DAT nào được ghi nhận</td>
                    </tr>
                  ) : (
                    datList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{item.full_name}</td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <span className="text-blue-400 font-bold block">{item.cccd}</span>
                          <span className="text-slate-400">{item.course?.code} (Định mức: {item.course?.dat_km_target}km/{item.course?.dat_hours_target}h)</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{item.total_distance_km} KM</span>
                              <span className="text-slate-400">{item.km_progress_pct}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, item.km_progress_pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{item.total_hours} Giờ</span>
                              <span className="text-slate-400">{item.hours_progress_pct}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div
                                className="bg-indigo-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, item.hours_progress_pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.dat_status === 'dat' ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center w-max space-x-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Đạt Định Mức</span>
                            </span>
                          ) : item.dat_status === 'co_loi' ? (
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold flex items-center w-max space-x-1" title={item.dat_log?.error_notes}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Phát Hiện Lỗi DAT</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-semibold">
                              Chưa Đủ Đơn Vị
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetail(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Modal Import DAT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <span>Import Dữ Liệu DAT Tự Động</span>
            </h3>

            <form onSubmit={handleImportDAT} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Khóa Đào Tạo Đối Soát *</label>
                <select
                  value={importCourseId}
                  onChange={(e) => setImportCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Chọn Khóa Đào Tạo --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">File Báo Cáo DAT (.xlsx) *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-blue-300 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Quy tắc đối soát dữ liệu:</span>
                </p>
                <p>• Tự động ghép nối qua số CCCD trong khóa học.</p>
                <p>• Dữ liệu KM/Giờ mới phải lớn hơn hoặc bằng dữ liệu đã lưu.</p>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Import Đối Soát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Student DAT Logs Detail */}
      {selectedStudentId && studentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{studentDetail.student?.full_name}</h3>
                <p className="text-xs text-slate-400 font-mono">CCCD: {studentDetail.student?.cccd} | Hạng {studentDetail.student?.category}</p>
              </div>
              <button onClick={() => setSelectedStudentId(null)} className="text-slate-400 hover:text-white text-sm">
                ✕ Đóng
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Tổng Quãng Đường:</span>
                <span className="text-lg font-bold text-blue-400">{studentDetail.summary?.total_km} / {studentDetail.summary?.km_target} KM</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tổng Thời Gian:</span>
                <span className="text-lg font-bold text-indigo-400">{studentDetail.summary?.total_hours} / {studentDetail.summary?.hours_target} Giờ</span>
              </div>
            </div>

            {/* Log History */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lịch Sử Nhập File DAT</h4>
              <div className="space-y-2">
                {studentDetail.dat_logs?.length > 0 ? (
                  studentDetail.dat_logs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200">{log.total_distance_km} KM - {log.total_hours} Giờ</span>
                        <span className="block text-[10px] text-slate-500">Mã thiết bị: {log.device_code || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">{new Date(log.import_date).toLocaleDateString('vi-VN')}</span>
                        {log.has_error && (
                          <span className="text-[10px] font-semibold text-amber-400">{log.error_notes || 'Lỗi dữ liệu'}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Chưa có bản ghi DAT nào</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
