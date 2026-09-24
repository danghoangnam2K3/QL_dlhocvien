# Use Case: Xem Dashboard tổng quan

**Description:** Dashboard tổng quan hệ thống

**Precondition:** Người dùng đã đăng nhập thành công

**Postcondition:** Người dùng thấy thông tin tổng quan của hệ thống

## Actors
- **Nhân viên**
- **Admin**

## Data Entities
- **DATLog**
- **Student**
- **Course**

## Flows
### EXCEPTION: Lỗi tải dữ liệu
1. Hệ thống không tải được dữ liệu do lỗi kết nối CSDL.
2. Hệ thống hiển thị thông báo lỗi "Không thể tải dữ liệu Dashboard, vui lòng thử lại sau".

### MAIN: MAIN
1. Người dùng đăng nhập hệ thống. 
2. Hệ thống kiểm tra quyền truy cập.
3. Người dùng truy cập trang chủ (Dashboard).
4. Hệ thống tính toán và hiển thị các số liệu thống kê: Tổng số học viên, Số khóa học đang chạy, Số học viên đạt DAT, Số học viên cảnh báo lỗi.
5. Người dùng có thể nhấn vào từng số liệu để chuyển đến trang chi tiết tương ứng.

## Business Rules
- Dữ liệu tổng hợp chỉ dựa trên khóa học đang mở hoặc chưa kết thúc
- Dashboard phải được cập nhật real-time hoặc tối đa 5 phút một lần

