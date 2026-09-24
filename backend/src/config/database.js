const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_KEY trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('⚠️  Cảnh báo kết nối DB:', error.message);
    } else {
      console.log('✅ Kết nối Supabase thành công!');
    }
  } catch (err) {
    console.warn('⚠️  Không thể kiểm tra kết nối DB:', err.message);
  }
}

module.exports = { supabase, testConnection };
