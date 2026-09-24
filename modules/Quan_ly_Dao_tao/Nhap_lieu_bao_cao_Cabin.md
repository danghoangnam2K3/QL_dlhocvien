# Use Case: Nhập liệu báo cáo Cabin

**Description:** Cho phép nhân viên nhập kết quả báo cáo Cabin từ phiếu giấy vào hệ thống.

**Precondition:** Nhân viên đã đăng nhập thành công vào hệ thống.

**Postcondition:** Thông tin báo cáo Cabin của học viên được cập nhật vào hệ thống.

## Actors
- **Nhân viên**

## Data Entities
- **Báo cáo Cabin**
- **Học viên**

## Flows
### ALT: Thiếu thông tin bắt buộc
Khi nhân viên nhập thiếu 'Trạng thái báo cáo' hoặc 'Ngày nộp' (khi trạng thái là Đã nộp), hệ thống hiển thị thông báo yêu cầu nhập đầy đủ thông tin.

### ALT: Ngày nộp không hợp lệ
Khi nhân viên nhập 'Ngày nộp' là một ngày trong tương lai, hệ thống hiển thị thông báo lỗi 'Ngày nộp không được vượt quá ngày hiện tại' và không lưu dữ liệu.

### EXCEPTION: Dữ liệu không hợp lệ
Nếu Nhân viên nhập 'Ngày nộp báo cáo' là ngày trong tương lai hoặc để trống các trường bắt buộc (Kết quả Cabin, Ngày nộp báo cáo), Hệ thống sẽ hiển thị thông báo lỗi 'Dữ liệu không hợp lệ: [Chi tiết lỗi]' và yêu cầu Nhân viên chỉnh sửa thông tin. Dữ liệu sẽ không được lưu vào hệ thống.

### EXCEPTION: Ngoại lệ: Học viên không hợp lệ
1. Nhân viên tìm kiếm học viên bằng Số CCCD hoặc Mã học viên. 2. Hệ thống thông báo học viên không tồn tại hoặc khóa đào tạo đã kết thúc. 3. Nhân viên dừng thao tác.

### MAIN: MAIN
Nhân viên truy cập chức năng nhập liệu báo cáo Cabin. Nhân viên tìm kiếm học viên theo Mã học viên hoặc Họ tên. Hệ thống hiển thị danh sách học viên phù hợp. Nhân viên chọn học viên cần cập nhật. Nhân viên nhập 'Trạng thái báo cáo' (Đã nộp/Chưa nộp) và 'Ngày nộp' từ phiếu cứng giấy. Hệ thống kiểm tra tính hợp lệ của dữ liệu. Nhân viên nhấn 'Lưu'. Hệ thống cập nhật thông tin vào hồ sơ học viên.

## Business Rules
- Nhân viên phải nhập đúng trạng thái báo cáo từ phiếu cứng (giấy).
- Ngày nộp báo cáo Cabin không được là ngày tương lai.
- Mã học viên là bắt buộc để thực hiện nhập liệu.
- Học viên phải thuộc khóa đào tạo đang diễn ra.
- Nhân viên phải nhập đúng trạng thái báo cáo từ phiếu cứng.

