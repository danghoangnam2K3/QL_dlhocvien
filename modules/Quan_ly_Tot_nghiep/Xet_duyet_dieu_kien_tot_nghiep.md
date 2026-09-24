# Use Case: Xét duyệt điều kiện tốt nghiệp

**Description:** Hệ thống tự động đối soát điều kiện và xét duyệt tốt nghiệp dựa trên danh sách đăng ký.

**Precondition:** Danh sách đăng ký thi đã được cập nhật.

**Postcondition:** Trạng thái xét duyệt được cập nhật vào danh sách thi.

## Actors
- **Hệ thống**

## Data Entities
- **Dữ liệu DAT**
- **Danh sách thi tốt nghiệp**

## Flows
### EXCEPTION: Data Connection Error
Nếu lỗi kết nối dữ liệu, hệ thống ghi log lỗi và thông báo cho người quản trị.

### MAIN
1. Hệ thống truy xuất danh sách học viên từ 'Danh sách thi tốt nghiệp'. 2. Với mỗi học viên, hệ thống tính toán tổng giờ DAT và quãng đường từ dữ liệu DAT. 3. Hệ thống đối soát với định mức của hạng đào tạo. 4. Hệ thống cập nhật trạng thái 'Đủ điều kiện' hoặc 'Chưa đủ điều kiện' (kèm lý do) vào danh sách.

## Business Rules
- Hệ thống chỉ xét duyệt học viên có trong danh sách đăng ký thi
- Học viên được coi là 'Đạt DAT' nếu Tổng thời gian >= định mức giờ và Tổng quãng đường >= định mức km của hạng đào tạo

