const { supabase } = require('../config/database');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    // Chạy song song tất cả queries để nhanh hơn
    const [
      coursesResult,
      studentsResult,
      datErrorResult,
      graduationResult,
      recentLogsResult,
      upcomingSchedulesResult
    ] = await Promise.all([
      // Số khóa học đang chạy
      supabase.from('courses').select('id, name, category, status', { count: 'exact' }).eq('status', 'active'),

      // Tổng học viên đang học
      supabase.from('students').select('id, category', { count: 'exact' }).eq('student_status', 'active'),

      // Học viên có lỗi DAT
      supabase.from('dat_logs').select('student_id', { count: 'exact' }).eq('has_error', true),

      // Học viên đủ điều kiện tốt nghiệp gần nhất
      supabase.from('graduation_registrations')
        .select('id, eligibility_status', { count: 'exact' })
        .eq('eligibility_status', 'eligible'),

      // Hoạt động gần đây (audit logs)
      supabase.from('audit_logs')
        .select('action, entity, created_at, user:users(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(10),

      // Lịch học sắp tới trong 7 ngày
      supabase.from('schedules')
        .select('id, schedule_type, scheduled_at, student:students(full_name)', )
        .eq('status', 'pending')
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5)
    ]);

    // Thống kê học viên theo hạng
    const categoryStats = {};
    studentsResult.data?.forEach(s => {
      categoryStats[s.category] = (categoryStats[s.category] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_active_courses: coursesResult.count || 0,
          total_active_students: studentsResult.count || 0,
          total_dat_errors: datErrorResult.count || 0,
          total_eligible_students: graduationResult.count || 0
        },
        category_breakdown: categoryStats,
        recent_activities: recentLogsResult.data || [],
        upcoming_schedules: upcomingSchedulesResult.data || []
      }
    });
  } catch (err) {
    console.error('[DashboardController] getStats:', err);
    return res.status(500).json({ success: false, message: 'Không thể tải dữ liệu Dashboard.' });
  }
};

module.exports = { getDashboardStats };
