# Use Case: Quản lý Lịch học DAT/Cabin

**Description:** Quản lý các lịch học DAT/Cabin (CRUD)

**Precondition:** Nhân viên đã đăng nhập và có quyền quản lý lịch học.

**Postcondition:** Lịch học được lưu hoặc cập nhật thành công, log hệ thống được ghi nhận.

## Actors
- **Nhân viên quản lý đào tạo**
- **Admin**

## Data Entities
- **Học viên**
- **Giáo viên**
- **Xe**
- **Lịch học**
- **Lịch học DAT/Cabin**

## Flows
### ALT: Hủy lịch học
1. Nhân viên chọn lịch học cần hủy.
2. Hệ thống kiểm tra: Nếu lịch đã diễn ra, không cho phép hủy.
3. Nếu hợp lệ, chuyển trạng thái lịch sang "Đã hủy" và ghi log.

### ALT: Hủy/Xóa lịch học
1. Nhân viên chọn một lịch học và chọn "Hủy/Xóa".
2. Hệ thống kiểm tra nếu lịch học đã diễn ra hoặc có dữ liệu liên quan, yêu cầu xóa mềm hoặc từ chối thao tác.
3. Hệ thống ghi log thao tác hủy/xóa.
4. Hệ thống thông báo thành công.

### EXCEPTION: Không thể sửa lịch cũ
1. Nếu lịch học đã diễn ra, không được phép chỉnh sửa hoặc xóa. Hệ thống thông báo lỗi.

### MAIN: MAIN
1. Nhân viên chọn chức năng thêm mới lịch học DAT/Cabin.
2. Nhân viên nhập thông tin: ID học viên, Xe, Giáo viên, Thời gian, Loại lịch học.
3. Hệ thống kiểm tra trùng lặp lịch (xe/giáo viên).
4. Nếu hợp lệ, hệ thống lưu lịch học và ghi log thao tác.

## Business Rules
- Cần hiển thị cảnh báo nếu học viên có phát sinh lỗi kỹ thuật DAT
- Mọi thay đổi lịch học phải được ghi log
- Lịch học không được trùng thời gian đối với cùng một xe hoặc giáo viên
- Thông tin lịch học bao gồm: ID học viên, Xe, Giáo viên, Thời gian, Loại (DAT/Cabin)

