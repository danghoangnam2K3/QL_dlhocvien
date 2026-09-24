-- ============================================================
-- SQL Schema: Hệ thống Số hóa Đào tạo Lái xe
-- Database: PostgreSQL (Supabase)
-- Tạo: 2026-09-24
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. BẢNG USERS (Tài khoản người dùng)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email         VARCHAR(100) UNIQUE,
  full_name     VARCHAR(255),
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'nhan_vien')),
  status        VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG COURSES (Khóa đào tạo)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             VARCHAR(30) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  category         VARCHAR(5) NOT NULL CHECK (category IN ('A1','A2','B1','B2','C','D','E','F')),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  dat_km_target    DECIMAL(10,2) NOT NULL DEFAULT 0,
  dat_hours_target DECIMAL(10,2) NOT NULL DEFAULT 0,
  status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  notes            TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_date > start_date)
);

-- ============================================================
-- 3. BẢNG STUDENTS (Học viên)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  full_name        VARCHAR(255) NOT NULL,
  dob              DATE NOT NULL,
  cccd             VARCHAR(20) NOT NULL,
  phone            VARCHAR(15),
  category         VARCHAR(5) NOT NULL,
  cabin_status     VARCHAR(20) DEFAULT 'not_submitted' CHECK (cabin_status IN ('submitted', 'not_submitted')),
  cabin_submit_date DATE,
  student_status   VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (student_status IN ('active', 'cancelled')),
  cancel_reason    TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cccd, course_id)
);

-- ============================================================
-- 4. BẢNG DAT_LOGS (Dữ liệu thực hành DAT)
-- ============================================================
CREATE TABLE IF NOT EXISTS dat_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  total_distance_km DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_hours       DECIMAL(10,2) NOT NULL DEFAULT 0,
  device_code       VARCHAR(50),
  has_error         BOOLEAN NOT NULL DEFAULT FALSE,
  error_notes       TEXT,
  import_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by       UUID REFERENCES users(id)
);

-- ============================================================
-- 5. BẢNG SCHEDULES (Lịch học DAT/Cabin)
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  instructor    VARCHAR(255),
  vehicle_code  VARCHAR(50),
  schedule_type VARCHAR(10) NOT NULL CHECK (schedule_type IN ('DAT', 'Cabin')),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. BẢNG GRADUATION_BATCHES (Đợt tốt nghiệp)
-- ============================================================
CREATE TABLE IF NOT EXISTS graduation_batches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name   VARCHAR(255) NOT NULL,
  exam_date    DATE,
  location     VARCHAR(255),
  status       VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'reviewed', 'closed')),
  notes        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. BẢNG GRADUATION_REGISTRATIONS (Danh sách đăng ký thi)
-- ============================================================
CREATE TABLE IF NOT EXISTS graduation_registrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id            UUID NOT NULL REFERENCES graduation_batches(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  eligibility_status  VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (eligibility_status IN ('pending', 'eligible', 'not_eligible')),
  eligibility_reason  TEXT,
  dat_hours_actual    DECIMAL(10,2),
  dat_km_actual       DECIMAL(10,2),
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch_id, student_id)
);

-- ============================================================
-- 8. BẢNG NOTIFICATIONS (Thông báo)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  content      TEXT NOT NULL,
  target_role  VARCHAR(20) CHECK (target_role IN ('admin', 'nhan_vien', 'all')),
  send_at      TIMESTAMPTZ,
  is_auto      BOOLEAN NOT NULL DEFAULT FALSE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. BẢNG AUDIT_LOGS (Nhật ký thao tác)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(50) NOT NULL,
  entity      VARCHAR(100) NOT NULL,
  entity_id   VARCHAR(100),
  before_data JSONB,
  after_data  JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_cccd ON students(cccd);
CREATE INDEX IF NOT EXISTS idx_dat_logs_student_id ON dat_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_schedules_student_id ON schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_at ON schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_grad_reg_batch_id ON graduation_registrations(batch_id);
CREATE INDEX IF NOT EXISTS idx_grad_reg_student_id ON graduation_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- SEED: Admin mặc định (password: Admin@1234)
-- Chạy sau khi tạo bảng để có tài khoản đăng nhập đầu tiên
-- ============================================================
-- INSERT INTO users (username, password_hash, email, full_name, role)
-- VALUES ('admin', '$2a$10$...', 'admin@laixe.vn', 'Quản trị viên', 'admin');
