# Use Case: Ghi nhận lịch sử thao tác (Audit Trail)

**Description:** Ghi lại lịch sử thao tác của người dùng

**Precondition:** Hệ thống đang hoạt động và có yêu cầu ghi log từ một Use Case thay đổi dữ liệu.

**Postcondition:** Bản ghi nhật ký được lưu trữ thành công hoặc đã lưu vào file tạm trong trường hợp lỗi.

## Actors
- **Hệ thống**

## Data Entities
- **AuditLog**
- **Người dùng**
- **Nhật ký thao tác**

## Flows
### EXCEPTION: Lỗi hệ thống ghi log
1. Hệ thống gặp lỗi kết nối khi ghi vào CSDL Audit Log.
2. Hệ thống chuyển hướng ghi log vào file lưu trữ tạm thời (local file log).
3. Hệ thống gửi cảnh báo về lỗi ghi log cho Admin qua kênh thông báo hệ thống.
4. Hệ thống đảm bảo luồng nghiệp vụ chính của người dùng KHÔNG bị gián đoạn hay bị chặn.

### EXCEPTION: Lỗi ghi nhật ký
1. Nếu hệ thống thất bại trong việc ghi vào cơ sở dữ liệu Nhật ký thao tác (ví dụ: mất kết nối), hệ thống phải ghi lỗi này vào tệp log an toàn cục bộ.
2. Hệ thống gửi cảnh báo đến Admin thông qua Module Thông báo rằng tính năng ghi log đang bị gián đoạn.

### MAIN: MAIN
1. Hệ thống phát hiện sự kiện thay đổi dữ liệu (Thêm/Sửa/Xóa) từ các use case khác.
2. Hệ thống thu thập thông tin: Timestamp, ID người dùng hiện tại, Loại thao tác, Đối tượng (tên bảng/ID thực thể), và dữ liệu trước/sau thay đổi (định dạng JSON).
3. Hệ thống lưu bản ghi vào bảng AuditLog.
4. Hệ thống hoàn tất quá trình ghi log dưới dạng bất đồng bộ (async) để không ảnh hưởng đến trải nghiệm người dùng.

## Business Rules
- Việc ghi log không được làm gián đoạn hoặc chặn luồng nghiệp vụ chính của người dùng.
- Thông tin ghi lại bắt buộc bao gồm: Thời gian (timestamp), ID người dùng, Loại thao tác, Đối tượng (Entity) và Chi tiết thay đổi (trước/sau).
- Mọi thao tác thay đổi dữ liệu (Thêm, Sửa, Xóa) phải được ghi lại.

