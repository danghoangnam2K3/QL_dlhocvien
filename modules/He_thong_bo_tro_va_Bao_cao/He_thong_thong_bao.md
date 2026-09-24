# Use Case: Hệ thống thông báo

**Description:** Hệ thống tự động nhắc lịch chạy DAT và học Cabin cho nhân viên.

**Precondition:** Người dùng đã đăng nhập và được phân quyền.

**Postcondition:** Thông báo được tạo hoặc cập nhật thành công.

## Actors
- **Nhân viên quản lý đào tạo**
- **Admin**
- **Hệ thống**
- **Nhân viên**

## Data Entities
- **Thông báo**
- **Lịch học DAT/Cabin**
- **Lịch học Cabin**
- **Lịch học DAT**

## Flows
### ALT: Tạo thông báo tự động
1. Hệ thống tự động tạo thông báo nhắc lịch trước 24 giờ so với thời gian lịch học.
2. Hệ thống kiểm tra đối tượng nhận (chỉ gửi cho Nhân viên quản lý đào tạo).
3. Hệ thống ghi log việc tạo thông báo tự động.

### ALT: Xóa thông báo
1. Nếu người dùng xóa một thông báo chưa gửi, hệ thống xóa hoàn toàn khỏi cơ sở dữ liệu.
2. Nếu thông báo đã gửi, chỉ có thể chuyển sang trạng thái 'Hủy' (không hiển thị nữa).

### EXCEPTION: Lỗi hệ thống ghi nhận thông báo
1. Nếu hệ thống không thể kết nối tới cơ sở dữ liệu để tạo thông báo:
   a. Hệ thống ghi nhận lỗi vào file log.
   b. Hệ thống thử lại tự động sau 5 phút.
   c. Nếu sau 3 lần vẫn lỗi, hệ thống gửi cảnh báo tới Admin.

### ALT: Không có lịch học
1. Hệ thống không tìm thấy lịch học nào trong vòng 24 giờ tới.
2. Hệ thống không gửi thông báo.

### MAIN
1. Admin hoặc Nhân viên truy cập "Quản lý Thông báo".
2. Hệ thống hiển thị danh sách các thông báo đã tạo.
3. Người dùng chọn "Tạo mới" hoặc "Chỉnh sửa" thông báo.
4. Người dùng nhập các thông tin: Tiêu đề, Nội dung, Đối tượng nhận (Học viên/Nhân viên), Thời gian gửi.
5. Hệ thống lưu thông báo và thiết lập lịch gửi (nếu cần).
6. Hệ thống thông báo thành công.

## Business Rules
- Thông báo tự động nhắc lịch phải được tạo trước 24 giờ so với lịch học
- Thông báo phải bao gồm: Tiêu đề, Nội dung, Đối tượng nhận (Học viên/Nhân viên), Thời gian gửi
- Chỉ nhân viên quản lý đào tạo mới nhận được thông báo nhắc lịch.
- Thông báo phải được gửi tự động trước 24 giờ so với lịch học DAT hoặc Cabin.

