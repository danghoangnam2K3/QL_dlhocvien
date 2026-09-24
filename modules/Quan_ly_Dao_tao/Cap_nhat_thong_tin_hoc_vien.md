# Use Case: Cập nhật thông tin học viên

**Description:** Cập nhật thông tin học viên khi có sai sót hoặc thay đổi

**Precondition:** Nhân viên đã đăng nhập và có quyền.

**Postcondition:** Thông tin học viên được cập nhật mới nhất.

## Actors
- **Nhân viên**

## Data Entities
- **Học viên**

## Flows
### EXCEPTION: Thiếu trường bắt buộc
1. Hệ thống phát hiện các trường bắt buộc bị để trống.
2. Hệ thống hiển thị lỗi: "Các trường bắt buộc không được để trống".
3. Nhân viên hoàn thiện thông tin trước khi lưu.

### MAIN
1. Nhân viên tìm kiếm và chọn học viên cần cập nhật thông tin.
2. Nhân viên sửa đổi các thông tin cần thiết: Họ tên, Số điện thoại, Hạng đào tạo.
3. Nhân viên nhấn nút Lưu.
4. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.
5. Hệ thống cập nhật thông tin học viên trong cơ sở dữ liệu.
6. Hệ thống hiển thị thông báo thành công.

## Business Rules
- Không được thay đổi số CCCD nếu học viên đã có dữ liệu DAT

