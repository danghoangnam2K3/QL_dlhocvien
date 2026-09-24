# Use Case: Quản lý Khóa đào tạo

**Description:** Quản lý thông tin các khóa đào tạo (cập nhật, xóa mềm, xem danh sách)

**Precondition:** Người dùng đã đăng nhập và có quyền Quản lý đào tạo.

**Postcondition:** Thông tin khóa đào tạo được cập nhật hoặc khóa học được chuyển trạng thái sang "Đã hủy" (xóa mềm).

## Actors
- **Nhân viên quản lý đào tạo**
- **Admin**

## Data Entities
- **Khóa đào tạo**

## Flows
### ALT: Xóa khóa đào tạo
1. Nhân viên/Admin chọn "Xóa" khóa đào tạo.
2. Hệ thống kiểm tra: Nếu khóa học đã có học viên đăng ký, hệ thống chỉ cho phép "xóa mềm" (chuyển trạng thái sang "Đã đóng" hoặc "Đã hủy").
3. Hệ thống cập nhật trạng thái và ghi log thao tác xóa vào hệ thống Audit Trail.
4. Hệ thống thông báo xóa thành công.

### EXCEPTION: Lỗi nhập liệu
1. Nếu người dùng nhập thiếu trường bắt buộc hoặc dữ liệu sai định dạng (vd: ngày kết thúc trước ngày bắt đầu), hệ thống thông báo lỗi chi tiết cho từng trường.

### ALT: Xóa khóa học
1. Nhân viên chọn xóa khóa đào tạo.
2. Hệ thống kiểm tra: Nếu khóa đào tạo đã có học viên, thực hiện xóa mềm (chuyển trạng thái). Nếu không, cho phép xóa vĩnh viễn (hoặc theo quy định).
3. Hệ thống lưu nhật ký hành động.

### ALT: Dữ liệu không hợp lệ
Người dùng nhập dữ liệu không hợp lệ (ví dụ: ngày kết thúc trước ngày bắt đầu).
Hệ thống hiển thị thông báo lỗi chi tiết cho từng trường.
Người dùng chỉnh sửa lại dữ liệu cho đúng.

### MAIN: MAIN
1. Nhân viên tìm kiếm hoặc lọc khóa đào tạo theo trạng thái hoặc tên.
2. Hệ thống hiển thị danh sách khóa đào tạo.
3. Nhân viên chọn một khóa đào tạo để xem chi tiết hoặc sửa thông tin.
4. Nhân viên thay đổi các thông tin (Tên khóa học, Ngày bắt đầu, Ngày kết thúc).
5. Nhân viên lưu thay đổi.
6. Hệ thống kiểm tra các ràng buộc: Ngày kết thúc phải sau ngày bắt đầu, Tên khóa học không trùng với khóa học khác.
7. Hệ thống cập nhật thông tin khóa học và lưu nhật ký thay đổi.

## Business Rules
- Không được nhập học viên vào khóa học đã kết thúc
- Chỉ được xóa mềm khóa học đã có học viên đăng ký
- Mã khóa học phải là duy nhất
- Tên khóa học không được để trống
- Mọi thao tác thay đổi phải được ghi log (Audit Trail)
- Chỉ được xóa mềm (chuyển trạng thái) khóa học đã có học viên đăng ký
- Ngày kết thúc phải sau ngày bắt đầu
- Tên khóa học không được trùng

