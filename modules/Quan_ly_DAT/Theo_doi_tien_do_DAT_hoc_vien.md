# Use Case: Theo dõi tiến độ DAT học viên

**Description:** Theo dõi tiến độ và cảnh báo DAT học viên

**Precondition:** Người dùng đã đăng nhập.

**Postcondition:** Nhân viên nắm bắt được tình hình tiến độ và các lỗi của học viên.

## Actors
- **Nhân viên**

## Data Entities
- **DATLog**
- **Student**

## Flows
### ALT: Lọc theo học viên có lỗi
1. Nhân viên lọc theo trạng thái 'Có lỗi kỹ thuật'.
2. Hệ thống chỉ hiển thị danh sách các học viên có các lỗi kỹ thuật DAT chưa được xử lý.

### MAIN
1. Nhân viên truy cập trang 'Theo dõi tiến độ DAT'.
2. Hệ thống hiển thị danh sách tất cả học viên hoặc cho phép lọc theo Khóa học.
3. Nhân viên chọn Khóa học hoặc tìm kiếm học viên theo CCCD/Họ tên.
4. Hệ thống hiển thị danh sách học viên với các thông số: Tổng quãng đường, Tổng thời gian, Trạng thái (Đạt/Chưa đạt/Có lỗi).
5. Nhân viên chọn một học viên để xem chi tiết.
6. Hệ thống hiển thị chi tiết nhật ký DAT, các lỗi kỹ thuật phát sinh và so sánh với định mức cần đạt.

## Business Rules
- Cần hiển thị cảnh báo nếu học viên có phát sinh lỗi kỹ thuật DAT
- Học viên được coi là 'Đạt DAT' nếu Tổng thời gian >= định mức giờ và Tổng quãng đường >= định mức km của hạng đào tạo

