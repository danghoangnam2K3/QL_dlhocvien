# Use Case: Nhập và đối soát dữ liệu DAT

**Description:** Tự động hóa việc nhập báo cáo DAT từ thiết bị, đối soát với danh sách học viên và cập nhật tiến độ thực hành.

**Precondition:** Nhân viên đã đăng nhập vào hệ thống.

**Postcondition:** Dữ liệu DAT được cập nhật chính xác, mọi thay đổi được lưu vào Nhật ký thao tác.

## Actors
- **Nhân viên**

## Data Entities
- **Khóa đào tạo**
- **DAT Data**
- **Khóa học**
- **Học viên**
- **Dữ liệu DAT**
- **Course**
- **Student**
- **DATLog**

## Flows
### EXCEPTION: Dữ liệu không hợp lệ (Ràng buộc logic)
Nếu dữ liệu mới có quãng đường hoặc thời gian nhỏ hơn dữ liệu đã lưu (và không thuộc trường hợp sửa lỗi thủ công), hệ thống hủy bỏ quá trình nhập cho bản ghi đó, hiển thị thông báo lỗi cụ thể cho bản ghi đó: 'Dữ liệu mới không được nhỏ hơn dữ liệu đã lưu'.

### ALT: File không đúng định dạng
Nếu tệp tải lên không phải là XML hoặc Excel theo template, hệ thống từ chối tệp và hiển thị thông báo lỗi: 'Định dạng tệp không hợp lệ. Vui lòng sử dụng tệp mẫu chuẩn'.

### EXCEPTION: Dữ liệu không khớp hoặc lỗi logic
1. Hệ thống phát hiện các dòng không hợp lệ (ví dụ: quãng đường mới < quãng đường cũ).
2. Hệ thống yêu cầu nhân viên loại bỏ các dòng này hoặc xác nhận ghi đè (cần quyền hạn đặc biệt).
3. Nhân viên thực hiện loại bỏ hoặc xác nhận, hệ thống chỉ cập nhật các dòng hợp lệ còn lại.

### ALT: File không hợp lệ
1. Hệ thống báo lỗi "File không đúng định dạng hoặc cấu trúc" khi định dạng sai.
2. Nhân viên tải lên file khác hoặc hủy bỏ thao tác.

### ALT: Không tìm thấy học viên
1. Hệ thống không tìm thấy học viên có CCCD tương ứng trong file nhập.
2. Hệ thống ghi nhận các CCCD này vào báo cáo lỗi cuối cùng để nhân viên kiểm tra lại thủ công, không dừng quá trình import.

### EXCEPTION: File không hợp lệ
1. Hệ thống phát hiện định dạng file không hợp lệ hoặc file bị hỏng.
2. Hệ thống dừng quá trình import và hiển thị thông báo lỗi cụ thể (ví dụ: 'Sai định dạng file', 'Thiếu cột bắt buộc').

### MAIN: Luồng chính (Main Flow)
1. Nhân viên chọn chức năng 'Nhập và đối soát dữ liệu DAT'.
2. Nhân viên tải lên tệp dữ liệu (XML/Excel).
3. Hệ thống kiểm tra định dạng tệp (phải theo template chuẩn).
4. Hệ thống đọc tệp, trích xuất dữ liệu: Mã học viên, CCCD, Tổng quãng đường, Tổng thời gian, Mã thiết bị DAT.
5. Hệ thống tìm kiếm học viên theo CCCD trong khóa học đang mở.
6. Hệ thống đối chiếu dữ liệu mới với dữ liệu hiện có: Tổng quãng đường mới >= Tổng quãng đường cũ AND Tổng thời gian mới >= Tổng thời gian cũ.
7. Nếu hợp lệ, hệ thống cập nhật vào hồ sơ học viên.
8. Hệ thống ghi lại hành động vào nhật ký hệ thống (Audit Trail).
9. Hệ thống hiển thị thông báo nhập dữ liệu thành công.

## Business Rules
- Mọi thao tác nhập/đối soát phải được ghi nhận lại trong nhật ký hệ thống (Audit Trail)
- Phải ghi nhận lại các lỗi kỹ thuật phát sinh từ thiết bị DAT vào hồ sơ học viên
- Tổng quãng đường và thời gian không được nhỏ hơn dữ liệu đã lưu trước đó (trừ khi sửa lỗi thủ công)
- Chỉ cập nhật dữ liệu cho học viên có CCCD tồn tại trong khóa học đang mở
- File nhập liệu phải ở định dạng chuẩn (XML/Excel) theo quy định của trung tâm

