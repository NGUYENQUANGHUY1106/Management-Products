# Kịch bản demo Management Product (chỉ admin)

1. Mở `start-management-product.cmd`, truy cập web ở cổng 8081 hoặc bản đã build ở cổng 8082.
2. Đăng nhập bằng tài khoản admin trong file riêng `D:/ManagementProduct-Credentials/admin-login.json`.
3. Hiển thị danh sách sản phẩm: tên, giá VNĐ, số lượng, hình ảnh.
4. Thêm sản phẩm; thử nhập giá âm để minh họa kiểm tra dữ liệu, sau đó nhập đúng và chọn ảnh từ máy.
5. Lưu, tải lại trang để chứng minh dữ liệu được lưu trên Firebase.
6. Tìm theo tên, chuyển sắp xếp theo giá. Nhập Giá từ `300000` và Giá đến `800000`, bấm Áp dụng; thử bỏ trống một đầu và Xóa bộ lọc.
   Bấm trái tim một sản phẩm, mở Sản phẩm yêu thích, tải lại trang để chứng minh lưu trên thiết bị; sau đó Hủy yêu thích và kiểm tra sản phẩm vẫn còn trong danh sách chính. Firestore vẫn chỉ có name, price, soluong, image.
7. Bấm Chỉnh sửa để mở popup, sửa giá/số lượng, Lưu thay đổi và đối chiếu kết quả.
8. Xóa sản phẩm: xem popup có ảnh/tên/giá/số lượng, thử hủy, sau đó xác nhận xóa.
9. Mở Firebase Console dự án `management-product-e97a1`, hiển thị `products` và đúng bốn trường; mở Authentication để hiển thị admin. Không trình chiếu mật khẩu.
10. Trên điện thoại cùng Wi-Fi, mở Expo Go và quét QR, đăng nhập admin, chọn ảnh và hiển thị sản phẩm. Phần này cần quay bổ sung trên thiết bị thật.
11. Đăng xuất, truy cập lại đường dẫn admin để chứng minh bị chuyển về đăng nhập.

Video trong `docs/video/ManagementProduct_Demo.webm` được ghi từ kiểm thử web bằng Playwright, gồm cả kích thước màn hình điện thoại. Đây không phải video chạy trên thiết bị Android/iOS thật.
