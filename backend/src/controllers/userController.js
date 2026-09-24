const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('users')
      .select('id, username, email, full_name, role, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[UserController] getUsers:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Validate
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập, mật khẩu và vai trò là bắt buộc.'
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự.'
      });
    }
    if (!['admin', 'nhan_vien'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }

    // Kiểm tra trùng username
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Tạo user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username: username.trim(),
        email: email?.trim() || null,
        password_hash,
        full_name: full_name?.trim() || null,
        role,
        status: 'active'
      })
      .select('id, username, email, full_name, role, status, created_at')
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'users',
      entityId: newUser.id,
      afterData: { username: newUser.username, role: newUser.role },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Tạo tài khoản thành công!', data: newUser });
  } catch (err) {
    console.error('[UserController] createUser:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, role } = req.body;

    // Lấy dữ liệu cũ để log
    const { data: oldUser } = await supabase.from('users').select('*').eq('id', id).single();
    if (!oldUser) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

    const updateData = {};
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (full_name !== undefined) updateData.full_name = full_name?.trim() || null;
    if (role && ['admin', 'nhan_vien'].includes(role)) updateData.role = role;
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, full_name, role, status, created_at')
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'users',
      entityId: id,
      beforeData: { email: oldUser.email, role: oldUser.role },
      afterData: { email: updated.email, role: updated.role },
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Cập nhật thành công!', data: updated });
  } catch (err) {
    console.error('[UserController] updateUser:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// PATCH /api/users/:id/lock
const toggleLockUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Không được tự khóa chính mình
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản của chính mình.' });
    }

    const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

    const newStatus = user.status === 'active' ? 'locked' : 'active';

    const { data: updated, error } = await supabase
      .from('users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, username, status')
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: newStatus === 'locked' ? 'LOCK' : 'UNLOCK',
      entity: 'users',
      entityId: id,
      beforeData: { status: user.status },
      afterData: { status: newStatus },
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: `Tài khoản đã được ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} thành công!`,
      data: updated
    });
  } catch (err) {
    console.error('[UserController] toggleLock:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// PATCH /api/users/:id/reset-password (Admin reset mật khẩu)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    const { error } = await supabase
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await writeAuditLog({
      userId: req.user.id,
      action: 'RESET_PASSWORD',
      entity: 'users',
      entityId: id,
      ipAddress: req.ip
    });

    return res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
  } catch (err) {
    console.error('[UserController] resetPassword:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

module.exports = { getUsers, createUser, updateUser, toggleLockUser, resetPassword };
