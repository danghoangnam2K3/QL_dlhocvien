# Use Case: Tạo khóa học mới

**Description:** Tạo khóa học mới, thiết lập thông tin cơ bản: mã khóa, tên khóa, hạng đào tạo, thời gian.

**Precondition:** Người dùng đã đăng nhập hệ thống và có quyền quản lý khóa học.

**Postcondition:** Hệ thống đã lưu thông tin khóa học mới vào cơ sở dữ liệu.

## Actors
- **Nhân viên**
- **Admin**

## Data Entities
- **Khóa học**

## Flows
### ALT: Dữ liệu không hợp lệ
1. Nếu dữ liệu nhập vào không hợp lệ (trùng mã, ngày kết thúc <= Ngày bắt đầu, hoặc bỏ trống trường bắt buộc), hệ thống hiển thị lỗi cụ thể tại trường tương ứng. 2. Người dùng chỉnh sửa thông tin và nhấn 'Lưu' để tiếp tục quy trình.

### EXCEPTION: Trùng mã khóa học
Mã khóa học đã tồn tại: Hệ thống thông báo 'Mã khóa học đã tồn tại'.

### MAIN: MAIN
1. Admin/Nhân viên truy cập chức năng 'Tạo khóa học mới'. 2. Hệ thống hiển thị biểu mẫu bao gồm các trường: Mã khóa học (String), Tên khóa học (String), Ngày bắt đầu (Date), Ngày kết thúc (Date), Hạng đào tạo (Enum). 3. Người dùng nhập thông tin vào các trường. 4. Người dùng nhấn nút 'Lưu'. 5. Hệ thống thực hiện kiểm tra tính hợp lệ: Mã khóa học phải duy nhất, Ngày kết thúc phải > Ngày bắt đầu. 6. Hệ thống lưu khóa học vào cơ sở dữ liệu với trạng thái 'Đang hoạt động' và hiển thị thông báo thành công.

## Business Rules
- Tên khóa học không được để trống
- Ngày kết thúc phải sau ngày bắt đầu
- Mã khóa học phải là duy nhất

