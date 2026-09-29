const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');
const xlsx = require('xlsx');
const path = require('path');

// GET /api/students
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', course_id = '', status = '', category = '' } = req.query;
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, Math.min(1000, parseInt(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;

    let query = supabase
      .from('students')
      .select(`
        id, full_name, dob, cccd, phone, category, 
        cabin_status, cabin_submit_date, student_status,
        created_at,
        course:courses(id, code, name, category, status)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,cccd.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (course_id) query = query.eq('course_id', course_id);
    if (status) query = query.eq('student_status', status);
    if (category) query = query.eq('category', category);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parsedLimit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: totalPages > 0 ? totalPages : 1
      }
    });
  } catch (err) {
    console.error('[StudentController] getStudents:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        course:courses(id, code, name, category, dat_km_target, dat_hours_target)
      `)
      .eq('id', id)
      .single();

    if (error || !student) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });
    }

    // Lấy dữ liệu DAT mới nhất
    const { data: datLog } = await supabase
      .from('dat_logs')
      .select('*')
      .eq('student_id', id)
      .order('import_date', { ascending: false })
      .limit(1)
      .single();

    return res.status(200).json({
      success: true,
      data: { ...student, dat_log: datLog || null }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/students (Thêm thủ công)
const createStudent = async (req, res) => {
  try {
    const { course_id, full_name, dob, cccd, phone, category } = req.body;

    if (!course_id || !full_name || !dob || !cccd || !category) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
    }

    // Kiểm tra khóa học tồn tại và đang mở
    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', course_id)
      .single();

    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });
    if (course.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Không được thêm học viên vào khóa học đã kết thúc.' });
    }

    // Kiểm tra trùng CCCD trong khóa học
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('cccd', cccd.trim())
      .eq('course_id', course_id)
      .single();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Số CCCD này đã tồn tại trong khóa học.' });
    }

    const { data: newStudent, error } = await supabase
      .from('students')
      .insert({
        course_id,
        full_name: full_name.trim(),
        dob,
        cccd: cccd.trim(),
        phone: phone?.trim() || null,
        category,
        student_status: 'active',
        cabin_status: 'not_submitted',
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'students',
      entityId: newStudent.id,
      afterData: { full_name: newStudent.full_name, cccd: newStudent.cccd },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Thêm học viên thành công!', data: newStudent });
  } catch (err) {
    console.error('[StudentController] createStudent:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

const xml2js = require('xml2js');

// Helper parse DOB
const parseDob = (rawDob) => {
  if (!rawDob) return null;
  const str = String(rawDob).trim();
  if (/^\d{8}$/.test(str)) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return str;
};

// Helper normalize category
const normalizeCategory = (cat) => {
  if (!cat) return 'B2';
  const upper = String(cat).trim().toUpperCase();
  if (upper === 'B') return 'B2';
  if (['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'F'].includes(upper)) return upper;
  return 'B2';
};

// Helper DAT targets
const getDatTargets = (category) => {
  const upper = (category || '').toUpperCase();
  if (upper === 'B1') return { km: 710, hours: 12 };
  if (upper === 'B2' || upper === 'B') return { km: 810, hours: 24 };
  if (upper === 'C') return { km: 825, hours: 28 };
  return { km: 800, hours: 24 };
};

// POST /api/students/import (Import file Excel/XML Báo Cáo 1)
const importStudents = async (req, res) => {
  try {
    let { course_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên file dữ liệu.' });
    }

    const fileContent = req.file.buffer.toString('utf8');
    const isXml = req.file.originalname.toLowerCase().endsWith('.xml') ||
                  req.file.mimetype.includes('xml') ||
                  fileContent.trim().startsWith('<?xml') ||
                  fileContent.trim().startsWith('<BAO_CAO1>');

    let targetCourse = null;
    let studentsToInsert = [];
    let errorList = [];

    if (isXml) {
      // Xử lý file XML Báo cáo 1 (BC1)
      let parsedXml;
      try {
        parsedXml = await xml2js.parseStringPromise(fileContent, { explicitArray: false });
      } catch (xmlErr) {
        console.error('[StudentController] XML Parse Error:', xmlErr);
        return res.status(400).json({ success: false, message: 'Cấu trúc file XML không hợp lệ.' });
      }

      const reportData = parsedXml?.BAO_CAO1?.DATA;
      if (!reportData || !reportData.KHOA_HOC) {
        return res.status(400).json({ success: false, message: 'File XML không chứa thông tin Báo Cáo 1 (Thiếu thẻ KHOA_HOC).' });
      }

      const kh = reportData.KHOA_HOC;
      const courseCode = (kh.MA_KHOA_HOC || '').toString().trim().toUpperCase();
      const courseName = (kh.TEN_KHOA_HOC || '').toString().trim();
      const rawCategory = kh.HANG_GPLX || kh.MA_HANG_DAO_TAO || 'B2';
      const category = normalizeCategory(rawCategory);
      const startDate = kh.NGAY_KHAI_GIANG || new Date().toISOString().split('T')[0];
      const endDate = kh.NGAY_BE_GIANG || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

      if (!courseCode || !courseName) {
        return res.status(400).json({ success: false, message: 'Thông tin khóa học trong XML thiếu Mã hoặc Tên khóa.' });
      }

      // 1. Kiểm tra khóa học đã tồn tại chưa
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('*')
        .eq('code', courseCode)
        .single();

      if (existingCourse) {
        targetCourse = existingCourse;
      } else {
        // Tự động tạo khóa học mới
        const targets = getDatTargets(category);
        const { data: newCourse, error: createCourseErr } = await supabase
          .from('courses')
          .insert({
            code: courseCode,
            name: courseName,
            category: category,
            start_date: startDate,
            end_date: endDate,
            dat_km_target: targets.km,
            dat_hours_target: targets.hours,
            status: 'active',
            notes: `Tự động khởi tạo từ file Báo Cáo 1 (${req.file.originalname})`,
            created_by: req.user.id
          })
          .select()
          .single();

        if (createCourseErr) {
          console.error('[StudentController] Auto-create course error:', createCourseErr);
          return res.status(500).json({ success: false, message: `Lỗi khi tự động tạo khóa học [${courseCode}]: ${createCourseErr.message}` });
        }

        targetCourse = newCourse;
      }

      // 2. Parse danh sách học viên từ XML
      const rawStudents = reportData.NGUOI_LXS?.NGUOI_LX;
      if (!rawStudents) {
        return res.status(400).json({ success: false, message: 'Khóa học không có danh sách học viên (Thiếu NGUOI_LX).' });
      }

      const studentList = Array.isArray(rawStudents) ? rawStudents : [rawStudents];
      course_id = targetCourse.id;

      // Lấy danh sách CCCD đã có trong khóa
      const { data: existingStudents } = await supabase
        .from('students')
        .select('cccd')
        .eq('course_id', course_id);
      const existingCCCDs = new Set(existingStudents?.map(s => s.cccd) || []);

      for (let i = 0; i < studentList.length; i++) {
        const item = studentList[i];
        const full_name = (item.HO_VA_TEN || [item.HO_TEN_DEM, item.TEN].filter(Boolean).join(' ') || '').toString().trim();
        const cccd = (item.SO_CMT || '').toString().trim();
        const dob = parseDob(item.NGAY_SINH);
        const phone = (item.SO_DIEN_THOAI || item.DIEN_THOAI || '').toString().trim() || null;
        const studentCat = normalizeCategory(item.HO_SO?.HANG_GPLX || item.HO_SO?.HANG_DAOTAO || category);

        if (!full_name || !cccd) {
          errorList.push({ row: i + 1, cccd, reason: 'Thiếu Họ tên hoặc CCCD' });
          continue;
        }

        if (existingCCCDs.has(cccd)) {
          errorList.push({ row: i + 1, cccd, reason: 'Học viên đã tồn tại trong khóa học' });
          continue;
        }

        studentsToInsert.push({
          course_id,
          full_name,
          dob: dob || '2000-01-01',
          cccd,
          phone,
          category: studentCat,
          student_status: 'active',
          cabin_status: 'not_submitted',
          created_by: req.user.id
        });

        existingCCCDs.add(cccd);
      }
    } else {
      // Xử lý file Excel (.xlsx / .xls)
      if (!course_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn khóa học khi nhập file Excel.' });
      }

      const { data: course } = await supabase.from('courses').select('*').eq('id', course_id).single();
      if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });
      targetCourse = course;

      let workbook;
      try {
        workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      } catch (e) {
        return res.status(400).json({ success: false, message: 'File không đúng định dạng. Vui lòng sử dụng file Excel (.xlsx/.xls) hoặc XML (Báo cáo 1).' });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'File không có dữ liệu.' });
      }

      const { data: existingStudents } = await supabase
        .from('students')
        .select('cccd')
        .eq('course_id', course_id);
      const existingCCCDs = new Set(existingStudents?.map(s => s.cccd) || []);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const full_name = (row['Họ tên'] || row['full_name'] || row['HoTen'] || '').toString().trim();
        const cccd = (row['CCCD'] || row['Số CCCD'] || row['CMND'] || row['cccd'] || '').toString().trim();
        const dob_raw = row['Ngày sinh'] || row['dob'] || row['NgaySinh'] || '';
        const phone = (row['Số điện thoại'] || row['phone'] || row['SoDienThoai'] || '').toString().trim();
        const cat = (row['Hạng'] || row['category'] || row['HangDaoTao'] || targetCourse.category || '').toString().trim();

        if (!full_name || !cccd) {
          errorList.push({ row: rowNum, cccd, reason: 'Thiếu thông tin bắt buộc (Họ tên, CCCD)' });
          continue;
        }

        if (existingCCCDs.has(cccd)) {
          errorList.push({ row: rowNum, cccd, reason: 'CCCD đã tồn tại trong khóa học' });
          continue;
        }

        let dob = null;
        if (dob_raw) {
          if (typeof dob_raw === 'number') {
            const date = xlsx.SSF.parse_date_code(dob_raw);
            dob = `${date.y}-${String(date.m).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`;
          } else {
            dob = parseDob(dob_raw);
          }
        }

        studentsToInsert.push({
          course_id,
          full_name,
          dob: dob || '2000-01-01',
          cccd,
          phone: phone || null,
          category: normalizeCategory(cat),
          student_status: 'active',
          cabin_status: 'not_submitted',
          created_by: req.user.id
        });
        existingCCCDs.add(cccd);
      }
    }

    // Bulk Insert theo batch (tránh quá tải)
    let insertedCount = 0;
    if (studentsToInsert.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < studentsToInsert.length; i += BATCH_SIZE) {
        const batch = studentsToInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('students').insert(batch);
        if (error) throw error;
        insertedCount += batch.length;
      }
    }

    await writeAuditLog({
      userId: req.user.id,
      action: 'IMPORT',
      entity: 'students',
      afterData: {
        course_id: targetCourse.id,
        course_code: targetCourse.code,
        inserted: insertedCount,
        skipped: errorList.length
      },
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: `Tải lên thành công! Khóa học: ${targetCourse.code} (${targetCourse.name}). Đã thêm ${insertedCount} học viên.${errorList.length > 0 ? ` (${errorList.length} học viên đã tồn tại hoặc bỏ qua)` : ''}`,
      data: {
        course: targetCourse,
        inserted: insertedCount,
        skipped: errorList.length,
        errors: errorList
      }
    });
  } catch (err) {
    console.error('[StudentController] importStudents:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý file import.' });
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, category, dob } = req.body;

    const { data: student } = await supabase.from('students').select('*').eq('id', id).single();
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });

    // Nếu có dữ liệu DAT - không cho đổi CCCD (được đảm bảo vì CCCD không trong update body)
    const updateData = {
      ...(full_name && { full_name: full_name.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(category && { category }),
      ...(dob && { dob }),
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'students',
      entityId: id,
      beforeData: { full_name: student.full_name, phone: student.phone },
      afterData: updateData,
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Cập nhật thông tin học viên thành công!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// PATCH /api/students/:id/cancel (Hủy hồ sơ)
const cancelStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body;

    if (!cancel_reason || !cancel_reason.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do hủy hồ sơ.' });
    }

    const { data: student } = await supabase.from('students').select('*').eq('id', id).single();
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });
    if (student.student_status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Hồ sơ học viên đã bị hủy trước đó.' });
    }

    const { data: updated, error } = await supabase
      .from('students')
      .update({
        student_status: 'cancelled',
        cancel_reason: cancel_reason.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'CANCEL',
      entity: 'students',
      entityId: id,
      beforeData: { student_status: student.student_status },
      afterData: { student_status: 'cancelled', cancel_reason },
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Hủy hồ sơ học viên thành công!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// PATCH /api/students/:id/cabin (Cập nhật báo cáo Cabin)
const updateCabin = async (req, res) => {
  try {
    const { id } = req.params;
    const { cabin_status, cabin_submit_date } = req.body;

    if (!cabin_status || !['submitted', 'not_submitted'].includes(cabin_status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái báo cáo không hợp lệ.' });
    }

    if (cabin_status === 'submitted' && !cabin_submit_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập ngày nộp báo cáo.' });
    }

    // Kiểm tra ngày nộp không được là tương lai
    if (cabin_submit_date && new Date(cabin_submit_date) > new Date()) {
      return res.status(400).json({ success: false, message: 'Ngày nộp báo cáo không được vượt quá ngày hiện tại.' });
    }

    const { data: student } = await supabase.from('students').select('*').eq('id', id).single();
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });

    const { data: updated, error } = await supabase
      .from('students')
      .update({
        cabin_status,
        cabin_submit_date: cabin_status === 'submitted' ? cabin_submit_date : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE_CABIN',
      entity: 'students',
      entityId: id,
      beforeData: { cabin_status: student.cabin_status },
      afterData: { cabin_status, cabin_submit_date },
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Cập nhật báo cáo Cabin thành công!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

module.exports = { getStudents, getStudentById, createStudent, importStudents, updateStudent, cancelStudent, updateCabin };
