const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');
const xlsx = require('xlsx');

// GET /api/dat?course_id=&search=&has_error=
const getDATProgress = async (req, res) => {
  try {
    const { page = 1, limit = 20, course_id, search, has_error } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Lấy học viên kèm DAT log mới nhất + thông tin khóa học
    let query = supabase
      .from('students')
      .select(`
        id, full_name, cccd, category, student_status,
        course:courses(id, code, name, dat_km_target, dat_hours_target),
        dat_logs(total_distance_km, total_hours, has_error, error_notes, import_date)
      `, { count: 'exact' })
      .eq('student_status', 'active')
      .order('full_name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (course_id) query = query.eq('course_id', course_id);
    if (search) query = query.or(`full_name.ilike.%${search}%,cccd.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    // Tính trạng thái DAT cho mỗi học viên
    const processedData = data.map(student => {
      // Lấy dat log mới nhất
      const latestLog = student.dat_logs?.sort((a, b) =>
        new Date(b.import_date) - new Date(a.import_date)
      )[0] || null;

      const kmTarget = student.course?.dat_km_target || 0;
      const hoursTarget = student.course?.dat_hours_target || 0;
      const totalKm = latestLog?.total_distance_km || 0;
      const totalHours = latestLog?.total_hours || 0;

      let dat_status = 'chua_dat';
      if (latestLog?.has_error) dat_status = 'co_loi';
      else if (totalKm >= kmTarget && totalHours >= hoursTarget) dat_status = 'dat';

      return {
        ...student,
        dat_logs: undefined,
        dat_log: latestLog,
        total_distance_km: totalKm,
        total_hours: totalHours,
        dat_status,
        km_progress_pct: kmTarget > 0 ? Math.min(100, (totalKm / kmTarget) * 100).toFixed(1) : 0,
        hours_progress_pct: hoursTarget > 0 ? Math.min(100, (totalHours / hoursTarget) * 100).toFixed(1) : 0
      };
    });

    // Filter has_error sau khi process
    const filteredData = has_error === 'true'
      ? processedData.filter(s => s.dat_status === 'co_loi')
      : processedData;

    return res.status(200).json({
      success: true,
      data: filteredData,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[DATController] getDATProgress:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// GET /api/dat/student/:studentId
const getStudentDAT = async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: student } = await supabase
      .from('students')
      .select(`*, course:courses(*)`)
      .eq('id', studentId)
      .single();

    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });

    const { data: datLogs } = await supabase
      .from('dat_logs')
      .select(`*, imported_by_user:users!imported_by(full_name, username)`)
      .eq('student_id', studentId)
      .order('import_date', { ascending: false });

    const latestLog = datLogs?.[0] || null;
    const kmTarget = student.course?.dat_km_target || 0;
    const hoursTarget = student.course?.dat_hours_target || 0;

    return res.status(200).json({
      success: true,
      data: {
        student,
        dat_logs: datLogs || [],
        latest: latestLog,
        summary: {
          total_km: latestLog?.total_distance_km || 0,
          total_hours: latestLog?.total_hours || 0,
          km_target: kmTarget,
          hours_target: hoursTarget,
          km_progress_pct: kmTarget > 0 ? ((latestLog?.total_distance_km || 0) / kmTarget * 100).toFixed(1) : 0,
          hours_progress_pct: hoursTarget > 0 ? ((latestLog?.total_hours || 0) / hoursTarget * 100).toFixed(1) : 0,
          dat_status: latestLog?.has_error ? 'co_loi' :
            ((latestLog?.total_distance_km || 0) >= kmTarget && (latestLog?.total_hours || 0) >= hoursTarget) ? 'dat' : 'chua_dat'
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/dat/import (Import file DAT - Excel)
const importDAT = async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên file dữ liệu DAT.' });
    }

    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Định dạng tệp không hợp lệ. Vui lòng sử dụng tệp mẫu chuẩn.' });
    }

    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rows.length) return res.status(400).json({ success: false, message: 'File không có dữ liệu.' });

    // Lấy học viên trong khóa học đang mở theo CCCD
    const { data: activeStudents } = await supabase
      .from('students')
      .select('id, cccd, full_name')
      .eq('course_id', course_id)
      .eq('student_status', 'active');

    const studentMap = new Map(activeStudents?.map(s => [s.cccd, s]) || []);

    // Lấy DAT logs hiện tại để kiểm tra ràng buộc
    const studentIds = activeStudents?.map(s => s.id) || [];
    const { data: existingLogs } = studentIds.length > 0 ? await supabase
      .from('dat_logs')
      .select('student_id, total_distance_km, total_hours')
      .in('student_id', studentIds)
      .order('import_date', { ascending: false }) : { data: [] };

    // Lấy log mới nhất per student
    const latestLogMap = new Map();
    existingLogs?.forEach(log => {
      if (!latestLogMap.has(log.student_id)) {
        latestLogMap.set(log.student_id, log);
      }
    });

    const successList = [];
    const errorList = [];
    const notFoundCCCDs = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const cccd = (row['CCCD'] || row['Số CCCD'] || row['cccd'] || '').toString().trim();
      const km = parseFloat(row['Tổng KM'] || row['total_km'] || row['KM'] || 0);
      const hours = parseFloat(row['Tổng giờ'] || row['total_hours'] || row['Giờ'] || 0);
      const device_code = (row['Mã thiết bị'] || row['device_code'] || '').toString().trim();
      const has_error = (row['Có lỗi'] || row['has_error'] || '').toString().toLowerCase();
      const error_notes = (row['Ghi chú lỗi'] || row['error_notes'] || '').toString().trim();

      if (!cccd) {
        errorList.push({ row: rowNum, reason: 'Thiếu CCCD' });
        continue;
      }

      const student = studentMap.get(cccd);
      if (!student) {
        notFoundCCCDs.push(cccd);
        errorList.push({ row: rowNum, cccd, reason: 'Không tìm thấy học viên có CCCD này trong khóa học đang mở' });
        continue;
      }

      // Ràng buộc: km/giờ mới >= km/giờ cũ
      const prevLog = latestLogMap.get(student.id);
      if (prevLog) {
        if (km < prevLog.total_distance_km || hours < prevLog.total_hours) {
          errorList.push({
            row: rowNum,
            cccd,
            reason: `Dữ liệu mới không được nhỏ hơn dữ liệu đã lưu (KM: ${prevLog.total_distance_km}, Giờ: ${prevLog.total_hours})`
          });
          continue;
        }
      }

      successList.push({
        student_id: student.id,
        total_distance_km: km,
        total_hours: hours,
        device_code: device_code || null,
        has_error: ['true', '1', 'có', 'x'].includes(has_error),
        error_notes: error_notes || null,
        imported_by: req.user.id
      });
    }

    let insertedCount = 0;
    if (successList.length > 0) {
      const { error } = await supabase.from('dat_logs').insert(successList);
      if (error) throw error;
      insertedCount = successList.length;
    }

    await writeAuditLog({
      userId: req.user.id,
      action: 'IMPORT_DAT',
      entity: 'dat_logs',
      afterData: { course_id, inserted: insertedCount, not_found: notFoundCCCDs },
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: `Nhập thành công ${insertedCount} bản ghi DAT. ${errorList.length > 0 ? `${errorList.length} dòng lỗi.` : ''}`,
      data: { inserted: insertedCount, errors: errorList, not_found_cccd: notFoundCCCDs }
    });
  } catch (err) {
    console.error('[DATController] importDAT:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý file.' });
  }
};

module.exports = { getDATProgress, getStudentDAT, importDAT };
