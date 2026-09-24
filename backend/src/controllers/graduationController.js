const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');

// GET /api/graduation/batches
const getBatches = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('graduation_batches')
      .select('*, created_by_user:users!created_by(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    // Thêm số lượng đăng ký cho mỗi đợt
    const batchesWithCounts = await Promise.all(data.map(async (batch) => {
      const { count: total } = await supabase
        .from('graduation_registrations')
        .select('id', { count: 'exact' })
        .eq('batch_id', batch.id);

      const { count: eligible } = await supabase
        .from('graduation_registrations')
        .select('id', { count: 'exact' })
        .eq('batch_id', batch.id)
        .eq('eligibility_status', 'eligible');

      return { ...batch, total_registered: total || 0, total_eligible: eligible || 0 };
    }));

    return res.status(200).json({ success: true, data: batchesWithCounts, total: count });
  } catch (err) {
    console.error('[GraduationController] getBatches:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/graduation/batches
const createBatch = async (req, res) => {
  try {
    const { batch_name, exam_date, location, notes } = req.body;
    if (!batch_name) return res.status(400).json({ success: false, message: 'Tên đợt tốt nghiệp là bắt buộc.' });

    const { data: newBatch, error } = await supabase
      .from('graduation_batches')
      .insert({ batch_name, exam_date, location, notes, status: 'open', created_by: req.user.id })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({ userId: req.user.id, action: 'CREATE', entity: 'graduation_batches', entityId: newBatch.id, afterData: newBatch, ipAddress: req.ip });
    return res.status(201).json({ success: true, message: 'Tạo đợt tốt nghiệp thành công!', data: newBatch });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// GET /api/graduation/batches/:id
const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: batch } = await supabase.from('graduation_batches').select('*').eq('id', id).single();
    if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy đợt tốt nghiệp.' });

    const { data: registrations } = await supabase
      .from('graduation_registrations')
      .select(`
        *,
        student:students(id, full_name, cccd, dob, category, course:courses(code, name, dat_km_target, dat_hours_target))
      `)
      .eq('batch_id', id)
      .order('created_at', { ascending: true });

    return res.status(200).json({ success: true, data: { ...batch, registrations: registrations || [] } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/graduation/batches/:id/register (Cập nhật danh sách đăng ký)
const registerStudents = async (req, res) => {
  try {
    const { id: batch_id } = req.params;
    const { student_ids, file } = req.body;

    const { data: batch } = await supabase.from('graduation_batches').select('*').eq('id', batch_id).single();
    if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy đợt tốt nghiệp.' });
    if (batch.status === 'closed') return res.status(400).json({ success: false, message: 'Đợt tốt nghiệp đã đóng.' });

    // Hỗ trợ import từ file
    let targetStudentIds = student_ids || [];

    if (req.file) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

      const cccdList = rows.map(r => (r['CCCD'] || r['cccd'] || '').toString().trim()).filter(Boolean);

      if (cccdList.length > 0) {
        const { data: studentsFromFile } = await supabase
          .from('students')
          .select('id, cccd')
          .in('cccd', cccdList)
          .eq('student_status', 'active');
        targetStudentIds = studentsFromFile?.map(s => s.id) || [];
      }
    }

    if (!targetStudentIds.length) {
      return res.status(400).json({ success: false, message: 'Không có học viên nào được thêm vào danh sách.' });
    }

    // Lấy danh sách đã đăng ký
    const { data: existing } = await supabase
      .from('graduation_registrations')
      .select('student_id')
      .eq('batch_id', batch_id);
    const existingSet = new Set(existing?.map(r => r.student_id) || []);

    const toInsert = targetStudentIds
      .filter(sid => !existingSet.has(sid))
      .map(student_id => ({ batch_id, student_id, eligibility_status: 'pending' }));

    if (toInsert.length === 0) {
      return res.status(200).json({ success: true, message: 'Tất cả học viên đã có trong danh sách đăng ký.', data: { inserted: 0 } });
    }

    const { error } = await supabase.from('graduation_registrations').insert(toInsert);
    if (error) throw error;

    await writeAuditLog({ userId: req.user.id, action: 'REGISTER', entity: 'graduation_registrations', entityId: batch_id, afterData: { count: toInsert.length }, ipAddress: req.ip });
    return res.status(200).json({ success: true, message: `Đã thêm ${toInsert.length} học viên vào đợt tốt nghiệp!`, data: { inserted: toInsert.length } });
  } catch (err) {
    console.error('[GraduationController] registerStudents:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/graduation/batches/:id/review (Xét duyệt điều kiện tốt nghiệp)
const reviewBatch = async (req, res) => {
  try {
    const { id: batch_id } = req.params;

    const { data: batch } = await supabase.from('graduation_batches').select('*').eq('id', id).single();
    if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy đợt tốt nghiệp.' });

    // Lấy danh sách đăng ký kèm thông tin học viên và khóa học
    const { data: registrations } = await supabase
      .from('graduation_registrations')
      .select(`
        id, student_id,
        student:students(id, category, course:courses(dat_km_target, dat_hours_target))
      `)
      .eq('batch_id', batch_id);

    if (!registrations?.length) {
      return res.status(400).json({ success: false, message: 'Đợt tốt nghiệp chưa có học viên đăng ký.' });
    }

    // Lấy DAT logs mới nhất cho từng học viên
    const studentIds = registrations.map(r => r.student_id);
    const { data: allDatLogs } = await supabase
      .from('dat_logs')
      .select('student_id, total_distance_km, total_hours')
      .in('student_id', studentIds)
      .order('import_date', { ascending: false });

    const latestDatMap = new Map();
    allDatLogs?.forEach(log => {
      if (!latestDatMap.has(log.student_id)) latestDatMap.set(log.student_id, log);
    });

    // Xét duyệt từng học viên
    const reviewNow = new Date().toISOString();
    const updates = registrations.map(reg => {
      const datLog = latestDatMap.get(reg.student_id);
      const kmTarget = reg.student?.course?.dat_km_target || 0;
      const hoursTarget = reg.student?.course?.dat_hours_target || 0;
      const totalKm = datLog?.total_distance_km || 0;
      const totalHours = datLog?.total_hours || 0;

      const isEligible = totalKm >= kmTarget && totalHours >= hoursTarget;
      const reasons = [];
      if (totalKm < kmTarget) reasons.push(`Thiếu ${(kmTarget - totalKm).toFixed(1)} km`);
      if (totalHours < hoursTarget) reasons.push(`Thiếu ${(hoursTarget - totalHours).toFixed(1)} giờ`);

      return {
        id: reg.id,
        eligibility_status: isEligible ? 'eligible' : 'not_eligible',
        eligibility_reason: isEligible ? 'Đủ điều kiện tốt nghiệp' : reasons.join(', '),
        dat_km_actual: totalKm,
        dat_hours_actual: totalHours,
        reviewed_at: reviewNow
      };
    });

    // Bulk update
    for (const upd of updates) {
      const { id: reg_id, ...updateFields } = upd;
      await supabase.from('graduation_registrations').update(updateFields).eq('id', reg_id);
    }

    // Cập nhật trạng thái đợt
    await supabase.from('graduation_batches').update({ status: 'reviewed', updated_at: reviewNow }).eq('id', batch_id);

    const eligible = updates.filter(u => u.eligibility_status === 'eligible').length;

    await writeAuditLog({ userId: req.user.id, action: 'REVIEW', entity: 'graduation_batches', entityId: batch_id, afterData: { total: updates.length, eligible }, ipAddress: req.ip });

    return res.status(200).json({
      success: true,
      message: `Xét duyệt hoàn tất! ${eligible}/${updates.length} học viên đủ điều kiện.`,
      data: { total: updates.length, eligible, not_eligible: updates.length - eligible }
    });
  } catch (err) {
    console.error('[GraduationController] reviewBatch:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// GET /api/graduation/batches/:id/export (Xuất báo cáo Excel)
const exportBatch = async (req, res) => {
  try {
    const { id: batch_id } = req.params;
    const { format = 'excel' } = req.query;

    const { data: batch } = await supabase.from('graduation_batches').select('*').eq('id', batch_id).single();
    if (!batch) return res.status(404).json({ success: false, message: 'Không tìm thấy đợt tốt nghiệp.' });
    if (batch.status !== 'reviewed') {
      return res.status(400).json({ success: false, message: 'Đợt tốt nghiệp chưa được xét duyệt. Vui lòng thực hiện xét duyệt trước khi xuất báo cáo.' });
    }

    const { data: registrations } = await supabase
      .from('graduation_registrations')
      .select(`
        eligibility_status, eligibility_reason, dat_km_actual, dat_hours_actual,
        student:students(full_name, dob, cccd, category)
      `)
      .eq('batch_id', batch_id)
      .order('eligibility_status', { ascending: false });

    // Tạo file Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Danh sách tốt nghiệp');

    // Header row
    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Họ tên', key: 'full_name', width: 30 },
      { header: 'Ngày sinh', key: 'dob', width: 15 },
      { header: 'CCCD', key: 'cccd', width: 20 },
      { header: 'Hạng ĐT', key: 'category', width: 12 },
      { header: 'KM thực tế', key: 'km', width: 14 },
      { header: 'Giờ thực tế', key: 'hours', width: 14 },
      { header: 'Kết quả', key: 'result', width: 20 },
      { header: 'Ghi chú', key: 'note', width: 30 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } };

    registrations?.forEach((reg, idx) => {
      const row = sheet.addRow({
        stt: idx + 1,
        full_name: reg.student?.full_name,
        dob: reg.student?.dob,
        cccd: reg.student?.cccd,
        category: reg.student?.category,
        km: reg.dat_km_actual,
        hours: reg.dat_hours_actual,
        result: reg.eligibility_status === 'eligible' ? '✓ Đủ điều kiện' : '✗ Chưa đủ điều kiện',
        note: reg.eligibility_reason
      });
      if (reg.eligibility_status === 'eligible') {
        row.getCell('result').font = { color: { argb: 'FF16a34a' }, bold: true };
      } else {
        row.getCell('result').font = { color: { argb: 'FFdc2626' } };
      }
    });

    await writeAuditLog({ userId: req.user.id, action: 'EXPORT', entity: 'graduation_batches', entityId: batch_id, ipAddress: req.ip });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tot-nghiep-${batch.batch_name.replace(/\s+/g, '-')}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[GraduationController] exportBatch:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tạo file.' });
  }
};

module.exports = { getBatches, createBatch, getBatchById, registerStudents, reviewBatch, exportBatch };
