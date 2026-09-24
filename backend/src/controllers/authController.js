const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const { writeAuditLog } = require('../middleware/auditTrail');
require('dotenv').config();

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu.'
      });
    }

    const cleanUsername = username.trim();

    // Tìm user theo username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', cleanUsername)
      .single();

    if (error) {
      console.error(`[Auth] Lỗi truy vấn Supabase cho user "${cleanUsername}":`, error.message);
    }

    if (!user) {
      console.warn(`[Auth] Không tìm thấy user "${cleanUsername}" trong database.`);
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không chính xác.'
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === 'locked') {
      console.warn(`[Auth] Tài khoản "${cleanUsername}" đang bị khóa.`);
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.'
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.warn(`[Auth] Mật khẩu nhập vào không khớp cho user "${cleanUsername}".`);
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không chính xác.'
      });
    }

    // Tạo JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    console.log(`[Auth] Đăng nhập thành công cho user: "${cleanUsername}" (${user.role})`);

    // Ghi audit log bất đồng bộ
    writeAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entity: 'users',
      entityId: user.id,
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[AuthController] Lỗi không xác định:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, full_name, role, status, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

module.exports = { login, getMe };
