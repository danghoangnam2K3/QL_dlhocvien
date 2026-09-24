/**
 * Script tạo tài khoản Admin mặc định
 * Chạy: node src/scripts/seedAdmin.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');

async function seedAdmin() {
  const username = 'admin';
  const password = 'Admin@1234';
  const email = 'admin@laixe.vn';
  const full_name = 'Quản trị viên';

  console.log('🌱 Đang tạo tài khoản Admin mặc định...');

  try {
    // Kiểm tra đã tồn tại chưa
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      console.log('⚠️  Tài khoản admin đã tồn tại. Bỏ qua.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert({ username, password_hash, email, full_name, role: 'admin', status: 'active' })
      .select('id, username, role')
      .single();

    if (error) throw error;

    console.log('✅ Tạo tài khoản Admin thành công!');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${data.id}`);
    console.log('');
    console.log('⚠️  Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedAdmin();
