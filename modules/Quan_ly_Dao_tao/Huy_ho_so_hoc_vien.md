# Use Case: Hủy hồ sơ học viên

**Description:** Hủy hồ sơ học viên (trạng thái) nếu học viên rút hồ sơ hoặc bỏ học

**Precondition:** Nhân viên đã đăng nhập và có quyền.

**Postcondition:** Hồ sơ học viên chuyển sang trạng thái Đã hủy, không xuất hiện trong danh sách đào tạo hiện tại.

## Actors
- **Admin**
- **Nhân viên**

## Data Entities
- **Học viên**

## Flows
### ALT: Học viên đã có dữ liệu DAT
1. Học viên đã có dữ liệu DAT, hệ thống không cho phép xóa vĩnh viễn.
2. Nhân viên chỉ có thể chuyển trạng thái hồ sơ sang "Đã hủy".
3. Hệ thống ghi lại lịch sử thao tác này.

### MAIN
1. Nhân viên tìm kiếm và chọn học viên cần hủy hồ sơ.
2. Nhân viên nhấn nút Hủy hồ sơ.
3. Nhân viên nhập lý do hủy.
4. Hệ thống yêu cầu xác nhận.
5. Nhân viên xác nhận.
6. Hệ thống cập nhật trạng thái học viên thành "Đã hủy" và lưu lý do.
7. Hệ thống hiển thị thông báo thành công.

## Business Rules
- Học viên đã có dữ liệu DAT thực hành không được xóa vĩnh viễn, chỉ chuyển trạng thái sang "Đã hủy"

