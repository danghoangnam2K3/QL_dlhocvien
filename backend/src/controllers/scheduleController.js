const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');

// GET /api/schedules
const getSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 20, course_id, type, status, date_from, date_to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('schedules')
      .select(`
        *,
        student:students(id, full_name, cccd, course_id, course:courses(code, name))
      `, { count: 'exact' })
      .order('scheduled_at', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (type) query = query.eq('schedule_type', type);
    if (status) query = query.eq('status', status);
    if (date_from) query = query.gte('scheduled_at', date_from);
    if (date_to) query = query.lte('scheduled_at', date_to + 'T23:59:59');

    const { data, error, count } = await query;
    if (error) throw error;

    // Filter by course_id qua student
    const filteredData = course_id
      ? data.filter(s => s.student?.course_id === course_id)
      : data;

    return res.status(200).json({
      success: true,
      data: filteredData,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[ScheduleController] getSchedules:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/schedules
const createSchedule = async (req, res) => {
  try {
    const { student_id, instructor, vehicle_code, schedule_type, scheduled_at, notes } = req.body;

    if (!student_id || !schedule_type || !scheduled_at) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
    }
    if (!['DAT', 'Cabin'].includes(schedule_type)) {
      return res.status(400).json({ success: false, message: 'Loại lịch học không hợp lệ.' });
    }

    // Kiểm tra trùng lịch (cùng xe hoặc giáo viên trong ±1 giờ)
    if (vehicle_code || instructor) {
      const windowStart = new Date(new Date(scheduled_at).getTime() - 60 * 60 * 1000).toISOString();
      const windowEnd = new Date(new Date(scheduled_at).getTime() + 60 * 60 * 1000).toISOString();

      let conflictQuery = supabase
        .from('schedules')
        .select('id, vehicle_code, instructor, scheduled_at')
        .neq('status', 'cancelled')
        .gte('scheduled_at', windowStart)
        .lte('scheduled_at', windowEnd);

      const { data: conflicts } = await conflictQuery;
      const conflict = conflicts?.find(c =>
        (vehicle_code && c.vehicle_code === vehicle_code) ||
        (instructor && c.instructor === instructor)
      );

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Lịch học bị trùng: ${vehicle_code && conflict.vehicle_code === vehicle_code ? `Xe ${vehicle_code}` : `Giáo viên ${instructor}`} đã có lịch vào khung giờ này.`
        });
      }
    }

    const { data: newSchedule, error } = await supabase
      .from('schedules')
      .insert({
        student_id,
        instructor: instructor?.trim() || null,
        vehicle_code: vehicle_code?.trim() || null,
        schedule_type,
        scheduled_at,
        status: 'pending',
        notes: notes?.trim() || null,
        created_by: req.user.id
      })
      .select(`*, student:students(full_name, cccd)`)
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'schedules',
      entityId: newSchedule.id,
      afterData: { student_id, schedule_type, scheduled_at },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Tạo lịch học thành công!', data: newSchedule });
  } catch (err) {
    console.error('[ScheduleController] createSchedule:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// PUT /api/schedules/:id
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructor, vehicle_code, scheduled_at, status, notes } = req.body;

    const { data: schedule } = await supabase.from('schedules').select('*').eq('id', id).single();
    if (!schedule) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học.' });

    // Không được sửa lịch đã diễn ra
    if (schedule.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Không được chỉnh sửa lịch học đã hoàn thành.' });
    }

    const updateData = {
      ...(instructor !== undefined && { instructor: instructor?.trim() || null }),
      ...(vehicle_code !== undefined && { vehicle_code: vehicle_code?.trim() || null }),
      ...(scheduled_at && { scheduled_at }),
      ...(status && { status }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'schedules',
      entityId: id,
      beforeData: schedule,
      afterData: updateData,
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Cập nhật lịch học thành công!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// DELETE /api/schedules/:id (Hủy lịch học)
const cancelSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: schedule } = await supabase.from('schedules').select('*').eq('id', id).single();
    if (!schedule) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học.' });

    if (schedule.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Không được hủy lịch học đã diễn ra.' });
    }

    const { data: updated, error } = await supabase
      .from('schedules')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'CANCEL',
      entity: 'schedules',
      entityId: id,
      beforeData: { status: schedule.status },
      afterData: { status: 'cancelled' },
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Hủy lịch học thành công!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

module.exports = { getSchedules, createSchedule, updateSchedule, cancelSchedule };
