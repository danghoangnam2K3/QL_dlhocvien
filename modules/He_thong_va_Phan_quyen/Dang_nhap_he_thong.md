# Use Case: Đăng nhập hệ thống

**Description:** Người dùng đăng nhập vào hệ thống để bắt đầu làm việc.

**Precondition:** Người dùng có tài khoản hợp lệ trong hệ thống.

**Postcondition:** Người dùng được xác thực và vào trang Dashboard quản trị thành công.

## Actors
- **Admin**
- **Nhân viên**

## Data Entities
- **Tài khoản người dùng**

## Flows
### EXCEPTION: Sai thông tin đăng nhập
Nhập sai tên đăng nhập hoặc mật khẩu: Hệ thống thông báo 'Thông tin đăng nhập không chính xác', không tiết lộ cụ thể sai ở đâu để bảo mật.

### MAIN: MAIN
Nhân viên/Admin truy cập vào trang đăng nhập.
Nhân viên/Admin nhập Tên đăng nhập và Mật khẩu.
Nhân viên/Admin nhấn nút "Đăng nhập".
Hệ thống kiểm tra thông tin đăng nhập:
- Kiểm tra tài khoản tồn tại trong CSDL.
- Kiểm tra trạng thái tài khoản (phải là kích hoạt).
- Kiểm tra khớp Mật khẩu (đã băm).
Nếu hợp lệ, hệ thống tạo phiên làm việc (Session) và điều hướng vào Dashboard quản trị.

## Business Rules
- Tài khoản phải ở trạng thái kích hoạt mới được phép đăng nhập
- Mật khẩu phải có độ dài tối thiểu 8 ký tự
- Tên đăng nhập không được để trống

