const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');
const xlsx = require('xlsx');
const path = require('path');

// GET /api/students
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', course_id = '', status = '', category = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('students')
      .select(`
        id, full_name, dob, cccd, phone, category, 
        cabin_status, cabin_submit_date, student_status,
        created_at,
        course:courses(id, code, name, category, status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,cccd.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (course_id) query = query.eq('course_id', course_id);
    if (status) query = query.eq('student_status', status);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
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

// POST /api/students/import (Import file Excel/XML)
const importStudents = async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên file dữ liệu.' });
    }
    if (!course_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn khóa học.' });
    }

    // Kiểm tra khóa học
    const { data: course } = await supabase.from('courses').select('*').eq('id', course_id).single();
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });
    if (course.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Không được nhập học viên vào khóa học đã kết thúc.' });
    }

    // Đọc file Excel
    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'File không đúng định dạng. Vui lòng sử dụng file Excel (.xlsx/.xls).' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'File không có dữ liệu.' });
    }

    const successList = [];
    const errorList = [];

    // Lấy danh sách CCCD đã tồn tại trong khóa học
    const { data: existingStudents } = await supabase
      .from('students')
      .select('cccd')
      .eq('course_id', course_id);
    const existingCCCDs = new Set(existingStudents?.map(s => s.cccd) || []);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Header ở dòng 1

      // Map các cột (linh hoạt với tên cột tiếng Việt/Anh)
      const full_name = (row['Họ tên'] || row['full_name'] || row['HoTen'] || '').toString().trim();
      const cccd = (row['CCCD'] || row['Số CCCD'] || row['CMND'] || row['cccd'] || '').toString().trim();
      const dob_raw = row['Ngày sinh'] || row['dob'] || row['NgaySinh'] || '';
      const phone = (row['Số điện thoại'] || row['phone'] || row['SoDienThoai'] || '').toString().trim();
      const category = (row['Hạng'] || row['category'] || row['HangDaoTao'] || '').toString().trim();

      // Validate dòng
      if (!full_name || !cccd || !category) {
        errorList.push({ row: rowNum, cccd, reason: 'Thiếu thông tin bắt buộc (Họ tên, CCCD, Hạng)' });
        continue;
      }

      if (existingCCCDs.has(cccd)) {
        errorList.push({ row: rowNum, cccd, reason: 'CCCD đã tồn tại trong khóa học' });
        continue;
      }

      // Parse ngày sinh
      let dob = null;
      if (dob_raw) {
        if (typeof dob_raw === 'number') {
          // Excel serial date
          const date = xlsx.SSF.parse_date_code(dob_raw);
          dob = `${date.y}-${String(date.m).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`;
        } else {
          dob = dob_raw.toString().trim();
        }
      }

      successList.push({
        course_id,
        full_name,
        dob,
        cccd,
        phone: phone || null,
        category,
        student_status: 'active',
        cabin_status: 'not_submitted',
        created_by: req.user.id
      });
      existingCCCDs.add(cccd); // Tránh trùng trong cùng file
    }

    // Bulk insert
    let insertedCount = 0;
    if (successList.length > 0) {
      const { error } = await supabase.from('students').insert(successList);
      if (error) throw error;
      insertedCount = successList.length;
    }

    await writeAuditLog({
      userId: req.user.id,
      action: 'IMPORT',
      entity: 'students',
      afterData: { course_id, inserted: insertedCount, errors: errorList.length },
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: `Nhập thành công ${insertedCount} học viên. ${errorList.length > 0 ? `${errorList.length} dòng lỗi.` : ''}`,
      data: { inserted: insertedCount, errors: errorList }
    });
  } catch (err) {
    console.error('[StudentController] importStudents:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý file.' });
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
