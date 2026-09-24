# Use Case: Thêm mới học viên thủ công

**Description:** Thêm mới học viên vào khóa học bằng cách nhập thủ công

**Precondition:** Nhân viên đã đăng nhập và có quyền thực hiện thao tác.

**Postcondition:** Thông tin học viên mới được lưu vào hệ thống.

## Actors
- **Nhân viên**

## Data Entities
- **Khóa học**
- **Học viên**

## Flows
### EXCEPTION: Trùng CCCD
1. Hệ thống phát hiện số CCCD đã tồn tại trong khóa học hoặc hệ thống.
2. Hệ thống hiển thị thông báo lỗi: "Số CCCD này đã tồn tại".
3. Nhân viên chỉnh sửa lại số CCCD hoặc hủy bỏ thao tác.

### MAIN
1. Nhân viên chọn chức năng thêm mới học viên.
2. Nhân viên nhập các thông tin học viên: Họ tên, Ngày sinh, Số CCCD, Hạng đào tạo, Số điện thoại, Mã khóa học.
3. Nhân viên nhấn nút Lưu.
4. Hệ thống kiểm tra tính hợp lệ của dữ liệu (định dạng CCCD, độ tuổi).
5. Hệ thống lưu thông tin học viên vào cơ sở dữ liệu.
6. Hệ thống hiển thị thông báo thành công.

## Business Rules
- Họ tên không được để trống
- Ngày sinh phải hợp lệ, đủ tuổi theo quy định hạng đào tạo
- CCCD phải là duy nhất trong hệ thống

