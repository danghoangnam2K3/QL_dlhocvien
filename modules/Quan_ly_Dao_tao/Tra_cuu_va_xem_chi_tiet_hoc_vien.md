# Use Case: Tra cứu và xem chi tiết học viên

**Description:** Tìm kiếm và xem chi tiết thông tin học viên trong khóa học

**Precondition:** Nhân viên đã đăng nhập vào hệ thống.

**Postcondition:** Thông tin học viên được hiển thị đầy đủ cho nhân viên xem.

## Actors
- **Nhân viên**

## Data Entities
- **Khóa học**
- **Học viên**

## Flows
### ALT: Không tìm thấy học viên
1. Hệ thống không tìm thấy học viên khớp với thông tin tìm kiếm.
2. Hệ thống hiển thị thông báo: "Không tìm thấy học viên phù hợp".

### MAIN
1. Nhân viên chọn chức năng tra cứu học viên.
2. Nhân viên nhập thông tin tìm kiếm: Số CCCD hoặc Họ tên hoặc Mã khóa học.
3. Hệ thống tìm kiếm và hiển thị danh sách học viên tương ứng.
4. Nhân viên chọn một học viên để xem chi tiết.
5. Hệ thống hiển thị đầy đủ thông tin hồ sơ của học viên.

## Business Rules
- Các trường bắt buộc: Họ tên, Ngày sinh, Số CCCD, Hạng đào tạo
- CCCD phải là duy nhất trong toàn hệ thống

