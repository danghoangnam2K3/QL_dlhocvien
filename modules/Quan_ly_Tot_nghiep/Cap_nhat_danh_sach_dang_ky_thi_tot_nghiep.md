# Use Case: Cập nhật danh sách đăng ký thi tốt nghiệp

**Description:** Nhân viên/Admin nhập/cập nhật danh sách học viên đăng ký thi cho đợt tốt nghiệp.

**Precondition:** Người dùng đã đăng nhập, Đợt tốt nghiệp đã được tạo.

**Postcondition:** Danh sách thi tốt nghiệp được cập nhật thành công và ghi log.

## Actors
- **Admin**
- **Nhân viên**

## Data Entities
- **Học viên**
- **Danh sách thi tốt nghiệp**

## Flows
### ALT: Invalid Input
Nếu file không đúng định dạng hoặc có học viên không hợp lệ, hệ thống từ chối nhập và thông báo lỗi chi tiết cho người dùng.

### MAIN
1. Người dùng chọn Đợt tốt nghiệp. 2. Người dùng chọn 'Import danh sách' (tải lên file Excel mẫu) hoặc 'Thêm thủ công'. 3. Hệ thống kiểm tra định dạng file và tính hợp lệ của CCCD (phải tồn tại trong khóa học đang mở). 4. Hệ thống lưu danh sách vào 'Danh sách thi tốt nghiệp'.

## Business Rules
- Mọi thao tác thay đổi danh sách thi phải được ghi log (Audit Trail)
- Học viên không được trùng đợt thi tốt nghiệp
- File nhập liệu phải ở định dạng chuẩn (Excel)
- CCCD phải tồn tại trong khóa học đang mở

