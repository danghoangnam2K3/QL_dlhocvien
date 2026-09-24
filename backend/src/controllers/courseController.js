const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');

// GET /api/courses
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', category = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('courses')
      .select('*, created_by_user:users!created_by(full_name, username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[CourseController] getCourses:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });
    }

    // Đếm số học viên
    const { count: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact' })
      .eq('course_id', id)
      .eq('student_status', 'active');

    return res.status(200).json({
      success: true,
      data: { ...course, student_count: studentCount || 0 }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/courses
const createCourse = async (req, res) => {
  try {
    const { code, name, category, start_date, end_date, dat_km_target, dat_hours_target, notes } = req.body;

    // Validate required fields
    if (!code || !name || !category || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
    }

    // Kiểm tra ngày hợp lệ
    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ success: false, message: 'Ngày kết thúc phải sau ngày bắt đầu.' });
    }

    // Kiểm tra trùng mã khóa học
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code.trim())
      .single();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Mã khóa học đã tồn tại.' });
    }

    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        start_date,
        end_date,
        dat_km_target: parseFloat(dat_km_target) || 0,
        dat_hours_target: parseFloat(dat_hours_target) || 0,
        notes: notes?.trim() || null,
        status: 'active',
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'courses',
      entityId: newCourse.id,
      afterData: { code: newCourse.code, name: newCourse.name },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Tạo khóa học thành công!', data: newCourse });
  } catch (err) {
    console.error('[CourseController] createCourse:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, dat_km_target, dat_hours_target, notes, status } = req.body;

    const { data: old, error: fetchErr } = await supabase.from('courses').select('*').eq('id', id).single();
    if (fetchErr || !old) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });

    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ success: false, message: 'Ngày kết thúc phải sau ngày bắt đầu.' });
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
      ...(dat_km_target !== undefined && { dat_km_target: parseFloat(dat_km_target) }),
      ...(dat_hours_target !== undefined && { dat_hours_target: parseFloat(dat_hours_target) }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(status && { status }),
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'courses',
      entityId: id,
      beforeData: old,
      afterData: updated,
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Cập nhật khóa học thành công!', data: updated });
  } catch (err) {
    console.error('[CourseController] updateCourse:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// DELETE /api/courses/:id (Xóa mềm)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: course } = await supabase.from('courses').select('*').eq('id', id).single();
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });

    // Kiểm tra có học viên không
    const { count: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact' })
      .eq('course_id', id);

    let newStatus, message;
    if (studentCount > 0) {
      // Xóa mềm - chỉ đổi trạng thái
      newStatus = 'cancelled';
      message = 'Khóa học được chuyển sang trạng thái Đã hủy (có học viên đăng ký nên không xóa vĩnh viễn).';
    } else {
      // Xóa vĩnh viễn
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;

      await writeAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        entity: 'courses',
        entityId: id,
        beforeData: course,
        ipAddress: req.ip
      });

      return res.status(200).json({ success: true, message: 'Xóa khóa học thành công!' });
    }

    const { data: updated, error } = await supabase
      .from('courses')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'SOFT_DELETE',
      entity: 'courses',
      entityId: id,
      beforeData: { status: course.status },
      afterData: { status: newStatus },
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message, data: updated });
  } catch (err) {
    console.error('[CourseController] deleteCourse:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
