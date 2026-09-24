# Use Case: Quản lý tài khoản người dùng

**Description:** Quản trị viên quản lý tài khoản người dùng: tạo mới, cập nhật, khóa tài khoản.

**Precondition:** Người dùng đã đăng nhập vào hệ thống với vai trò Admin.

**Postcondition:** Thông tin tài khoản người dùng được lưu hoặc cập nhật thành công trong hệ thống, đảm bảo tính bảo mật.

## Actors
- **Admin**

## Data Entities
- **Tài khoản người dùng**

## Flows
### EXCEPTION: Lỗi dữ liệu đầu vào
1. Hệ thống kiểm tra dữ liệu: Email sai định dạng, Tên đăng nhập trùng, hoặc Mật khẩu quá ngắn. 2. Hệ thống hiển thị thông báo lỗi cụ thể cho từng trường bị sai. 3. Hệ thống giữ lại dữ liệu Admin đã nhập để sửa lại.

### ALT: Cập nhật tài khoản
1. Admin chọn tài khoản cần sửa từ danh sách. 2. Hệ thống hiển thị thông tin hiện tại. 3. Admin chỉnh sửa các trường được phép (Email, Vai trò). 4. Admin nhấn 'Lưu'. 5. Hệ thống kiểm tra hợp lệ và lưu thay đổi.

### EXCEPTION: Tên đăng nhập đã tồn tại
1. Admin nhập thông tin tài khoản mới.
2. Hệ thống kiểm tra thấy Tên đăng nhập đã tồn tại trong DB.
3. Hệ thống hiển thị thông báo lỗi: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác'.
4. Admin chỉnh sửa lại Tên đăng nhập và thực hiện lại.

### ALT: Khóa tài khoản
1. Admin chọn tài khoản cần khóa.
2. Admin chọn chức năng 'Khóa tài khoản'.
3. Hệ thống cập nhật trạng thái tài khoản thành 'Bị khóa'.
4. Hệ thống ghi nhật ký hành động khóa tài khoản.

### EXCEPTION: Tên đăng nhập trùng lặp
Tên đăng nhập đã tồn tại: Hệ thống thông báo 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác'.

### MAIN: MAIN
1. Admin truy cập màn hình 'Quản lý người dùng'. 2. Admin chọn chức năng 'Thêm tài khoản mới'. 3. Hệ thống hiển thị form nhập liệu gồm các trường: Tên đăng nhập, Email, Mật khẩu, Vai trò (Admin/Nhân viên). 4. Admin nhập dữ liệu và nhấn 'Lưu'. 5. Hệ thống kiểm tra: Định dạng Email, Mật khẩu >= 8 ký tự, Tên đăng nhập không bị trùng. 6. Hệ thống lưu tài khoản vào CSDL và cập nhật danh sách.

## Business Rules
- Tài khoản phải ở trạng thái kích hoạt mới được phép đăng nhập
- Chỉ Admin mới có quyền quản lý tài khoản
- Email phải đúng định dạng
- Tên đăng nhập không được để trống
- Mật khẩu phải có độ dài tối thiểu 8 ký tự
- Tên đăng nhập không được trùng
- Không được tạo trùng tên đăng nhập
- Email tài khoản phải đúng định dạng
- Chỉ Admin mới có quyền quản lý tài khoản người dùng

