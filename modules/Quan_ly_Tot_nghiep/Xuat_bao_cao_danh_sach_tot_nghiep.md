# Use Case: Xuất báo cáo danh sách tốt nghiệp

**Description:** Xuất báo cáo danh sách học viên đủ điều kiện tốt nghiệp ra file Excel hoặc PDF.

**Precondition:** Học viên đã được xét duyệt điều kiện tốt nghiệp.

**Postcondition:** File báo cáo tốt nghiệp được tạo và tải về thành công.

## Actors
- **Nhân viên**
- **Admin**

## Data Entities
- **Danh sách thi tốt nghiệp**
- **Báo cáo Tốt nghiệp**

## Flows
### EXCEPTION: Lỗi hệ thống
1. Hệ thống xảy ra lỗi khi tạo file -> Hệ thống thông báo lỗi và không tạo file.

### ALT: Đợt thi chưa xét duyệt
1. Đợt tốt nghiệp chưa được xét duyệt -> Hệ thống thông báo lỗi và yêu cầu thực hiện "Xét duyệt điều kiện tốt nghiệp" trước.

### MAIN: MAIN
1. Admin/Nhân viên chọn đợt tốt nghiệp cần xuất báo cáo.
2. Hệ thống kiểm tra trạng thái của đợt thi (Phải đã xét duyệt hoàn tất).
3. Admin/Nhân viên chọn định dạng file xuất (Excel hoặc PDF).
4. Hệ thống truy xuất dữ liệu học viên đã được đánh dấu "Đạt" trong đợt thi.
5. Hệ thống tạo file báo cáo với các thông tin: Họ tên, Ngày sinh, CCCD, Hạng đào tạo, Kết quả xét duyệt.
6. Hệ thống ghi nhật ký (Audit Trail) hành động xuất báo cáo.
7. Hệ thống cung cấp file để người dùng tải về.

## Business Rules
- Dữ liệu xuất bao gồm: Họ tên, Ngày sinh, Số CCCD, Hạng đào tạo, Kết quả xét duyệt.
- Định dạng file báo cáo phải là Excel hoặc PDF.
- Mọi hành động xuất báo cáo phải được ghi log vào hệ thống.
- Chỉ được xuất báo cáo cho đợt thi đã hoàn tất xét duyệt.

