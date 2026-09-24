'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  Award, Plus, CheckCircle2, XCircle, FileSpreadsheet,
  Download, Eye, RefreshCw, AlertCircle, Calendar
} from 'lucide-react';

export default function GraduationPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Batch Detail Modal State
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchDetail, setBatchDetail] = useState<any>(null);

  // Create Batch Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({
    batch_name: '',
    exam_date: '',
    location: '',
    notes: ''
  });

  // Register Students Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerFile, setRegisterFile] = useState<File | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/graduation/batches');
      if (res.data.success) {
        setBatches(res.data.data);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách đợt tốt nghiệp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/graduation/batches', newBatchForm);
      if (res.data.success) {
        toast.success('Tạo đợt tốt nghiệp thành công!');
        setShowCreateModal(false);
        setNewBatchForm({ batch_name: '', exam_date: '', location: '', notes: '' });
        fetchBatches();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleOpenBatchDetail = async (batch: any) => {
    setSelectedBatch(batch);
    try {
      const res = await api.get(`/graduation/batches/${batch.id}`);
      if (res.data.success) {
        setBatchDetail(res.data.data);
      }
    } catch (err) {
      toast.error('Không thể lấy danh sách học viên đăng ký');
    }
  };

  const handleReviewBatch = async (batchId: string) => {
    try {
      const res = await api.post(`/graduation/batches/${batchId}/review`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchBatches();
        if (selectedBatch?.id === batchId) {
          handleOpenBatchDetail(selectedBatch);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xét duyệt');
    }
  };

  const handleRegisterFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerFile || !selectedBatch) return;

    const data = new FormData();
    data.append('file', registerFile);

    try {
      const res = await api.post(`/graduation/batches/${selectedBatch.id}/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowRegisterModal(false);
        setRegisterFile(null);
        handleOpenBatchDetail(selectedBatch);
        fetchBatches();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi nhập danh sách đăng ký');
    }
  };

  const handleExportExcel = async (batchId: string, batchName: string) => {
    try {
      const res = await api.get(`/graduation/batches/${batchId}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `danh-sach-tot-nghiep-${batchName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Tải báo cáo Excel thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi xuất báo cáo Excel');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Xét Duyệt & Quản Lý Đợt Tốt Nghiệp" />

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Header Action */}
          <div className="flex items-center justify-between bg-slate-900/90 p-4 border border-slate-800 rounded-2xl">
            <div>
              <h3 className="font-bold text-white text-base">Danh Sách Đợt Xét Duyệt Tốt Nghiệp</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tự động kiểm tra điều kiện DAT & xuất báo cáo thi sát hạch</p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đợt Tốt Nghiệp Mới</span>
            </button>
          </div>

          {/* Batches Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="col-span-full text-center py-8 text-slate-500">Đang tải danh sách đợt tốt nghiệp...</p>
            ) : batches.length === 0 ? (
              <p className="col-span-full text-center py-8 text-slate-500">Chưa có đợt tốt nghiệp nào được khởi tạo</p>
            ) : (
              batches.map((b) => (
                <div key={b.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                        b.status === 'open'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : b.status === 'reviewed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {b.status === 'open' ? 'Mới Mở Đăng Ký' : b.status === 'reviewed' ? 'Đã Xét Duyệt' : 'Đã Đóng'}
                      </span>
                      <h4 className="font-extrabold text-white text-lg mt-2">{b.batch_name}</h4>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ngày thi: {b.exam_date ? new Date(b.exam_date).toLocaleDateString('vi-VN') : 'Chưa xếp'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-400 block">Đăng ký:</span>
                      <span className="font-bold text-white text-sm">{b.total_registered} học viên</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Đạt điều kiện:</span>
                      <span className="font-bold text-emerald-400 text-sm">{b.total_eligible} học viên</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleOpenBatchDetail(b)}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Danh Sách</span>
                    </button>

                    <button
                      onClick={() => handleReviewBatch(b.id)}
                      className="py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold text-xs rounded-xl flex items-center space-x-1 transition-colors"
                      title="Chạy thuật toán tự động đối soát điều kiện DAT"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Xét Duyệt</span>
                    </button>

                    {b.status === 'reviewed' && (
                      <button
                        onClick={() => handleExportExcel(b.id, b.batch_name)}
                        className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs rounded-xl flex items-center space-x-1 transition-colors"
                        title="Xuất file Excel báo cáo sát hạch"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất Excel</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Modal Create Batch */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Tạo Đợt Tốt Nghiệp Mới</h3>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tên Đợt Tốt Nghiệp *</label>
                <input
                  type="text"
                  value={newBatchForm.batch_name}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, batch_name: e.target.value })}
                  placeholder="VD: Đợt 1 - Tháng 10/2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ngày Thi Dự Kiến</label>
                  <input
                    type="date"
                    value={newBatchForm.exam_date}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, exam_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Địa Điểm Thi</label>
                  <input
                    type="text"
                    value={newBatchForm.location}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, location: e.target.value })}
                    placeholder="Sân sát hạch..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Tạo Đợt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Batch Detail & Registered Students */}
      {selectedBatch && batchDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedBatch.batch_name}</h3>
                <p className="text-xs text-slate-400">Danh Sách Học Viên Đăng Ký Thi Tốt Nghiệp</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Danh Sách CCCD (Excel)</span>
                </button>

                <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-white text-sm">
                  ✕ Đóng
                </button>
              </div>
            </div>

            {/* Students Registered Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Họ và Tên</th>
                    <th className="px-4 py-3">CCCD</th>
                    <th className="px-4 py-3">Khóa Học / Hạng</th>
                    <th className="px-4 py-3">Thực Tế KM DAT</th>
                    <th className="px-4 py-3">Thực Tế Giờ DAT</th>
                    <th className="px-4 py-3">Kết Quả Xét Duyệt</th>
                    <th className="px-4 py-3">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {batchDetail.registrations?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500">Chưa có học viên nào đăng ký trong đợt này</td>
                    </tr>
                  ) : (
                    batchDetail.registrations?.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-white">{reg.student?.full_name}</td>
                        <td className="px-4 py-3 font-mono text-blue-400 font-bold">{reg.student?.cccd}</td>
                        <td className="px-4 py-3">
                          <span>{reg.student?.course?.code}</span> (Hạng {reg.student?.category})
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-200">
                          {reg.dat_km_actual} KM
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-200">
                          {reg.dat_hours_actual} Giờ
                        </td>
                        <td className="px-4 py-3">
                          {reg.eligibility_status === 'eligible' ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold flex items-center w-max space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đủ Điều Kiện</span>
                            </span>
                          ) : reg.eligibility_status === 'not_eligible' ? (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-semibold flex items-center w-max space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>Không Đủ Điều Kiện</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-semibold">Chưa Xét</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 italic">{reg.eligibility_reason || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Registration file */}
      {showRegisterModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Thêm Danh Sách Đăng Ký Tốt Nghiệp</h3>
            <p className="text-xs text-slate-400">Đợt: <span className="font-bold text-white">{selectedBatch.batch_name}</span></p>

            <form onSubmit={handleRegisterFile} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">File Excel Danh Sách CCCD *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setRegisterFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Tải Lên & Ghép Đợt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
