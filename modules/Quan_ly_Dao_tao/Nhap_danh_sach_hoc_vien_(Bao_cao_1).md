# Use Case: Nhập danh sách học viên (Báo cáo 1)

**Description:** Tải lên file (XML/Excel) Báo cáo 1 để nhập danh sách học viên vào khóa học.

**Precondition:** Admin/Nhân viên đã đăng nhập và khóa học đang ở trạng thái 'Đang đào tạo'.

**Postcondition:** Danh sách học viên được nhập vào hệ thống và liên kết với khóa học.

## Actors
- **Nhân viên**
- **Admin**

## Data Entities
- **Học viên**
- **Khóa học**

## Flows
### ALT: Dữ liệu học viên không hợp lệ
Phát hiện lỗi dữ liệu (ví dụ: trùng CCCD): Hệ thống ghi nhận lỗi vào log và hiển thị danh sách học viên lỗi để Admin sửa.

### EXCEPTION: Sai định dạng file
File lỗi format: Hệ thống báo 'File không đúng định dạng'.

### MAIN: MAIN
Admin/Nhân viên chọn khóa học cần nhập danh sách.
Admin/Nhân viên nhấn 'Nhập học viên' và tải lên file (XML/Excel).
Hệ thống kiểm tra định dạng file:
- Nếu sai format, hiển thị thông báo lỗi 'File không đúng định dạng'.
- Nếu đúng format, hệ thống bóc tách dữ liệu.
Hệ thống thực hiện:
- Kiểm tra trùng lặp CCCD trong file và so với CSDL.
- Lưu danh sách học viên vào CSDL, liên kết với Khóa học.
Hệ thống báo cáo kết quả: Số học viên thành công, số học viên lỗi (kèm lý do lỗi).

## Business Rules
- Không được nhập học viên vào khóa học đã kết thúc
- Số CCCD của học viên là định danh duy nhất trong khóa học
- File nhập liệu phải đúng định dạng XML hoặc Excel (template chuẩn)

