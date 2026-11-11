# Chạy Management Product trên web và Expo Go

## Chạy nhanh trên máy bàn giao

Các thư viện và Firebase đã được cấu hình. Mở PowerShell trong VS Code, chạy:

```powershell
cd "D:\Management User\userhub"
npm.cmd run start:local
```

Hoặc nhấp đúp `start-management-product.cmd` trong thư mục dự án. Giữ terminal mở khi sử dụng.

Lệnh này cấu hình IP Wi-Fi hiện tại, chạy backend ảnh/phân quyền cổng **3001**, Expo cổng **8081**, và bản xem trước cổng **8082** nếu có thư mục `dist`. Nếu dịch vụ đang chạy, script dùng lại cổng đó thay vì chạy trùng. Khi đổi Wi-Fi hoặc IP, dừng các terminal backend/Expo cũ bằng Ctrl+C rồi chạy lại để nạp IP mới.

## Mở trên web

Mở **http://localhost:8081** trên trình duyệt máy tính. Đây là bản phát triển, cập nhật khi sửa mã nguồn.

Đăng nhập email `nguyenquanghuy110605@gmail.com` bằng mật khẩu đã yêu cầu. Thông tin đăng nhập nằm ở `D:\ManagementProduct-Credentials\admin-login.json`, không đưa file này lên GitHub.

Bản web đã đóng gói mở ở **http://localhost:8082**. Khi mã nguồn hoặc IP LAN thay đổi, chạy lại:

```powershell
npm.cmd run build:web
```

Ở màn hình danh sách có tìm theo tên, sắp xếp tên/giá, lọc giá, popup thêm/sửa và xác nhận xóa. Phân quyền admin nằm ở **Cài đặt hệ thống**.

## Mở trên Expo Go

1. Cài Expo Go tương thích **Expo SDK 58** trên điện thoại. Nếu báo không tương thích, cập nhật Expo Go hoặc chọn bản Android phù hợp từ https://expo.dev/go.
2. Kết nối điện thoại và máy tính **cùng một mạng Wi-Fi**.
3. Chạy `npm.cmd run start:local`; terminal phải hiển thị **Using Expo Go** và mã QR.
4. Android: mở Expo Go → Scan QR code. iPhone: quét QR bằng Camera để mở Expo Go. Nếu iPhone yêu cầu tài khoản Expo, đăng nhập cùng tài khoản trên Expo Go và máy tính (`npx.cmd expo login`).
5. Chờ tải ứng dụng và đăng nhập cùng tài khoản admin. Cho phép truy cập ảnh khi chọn hình sản phẩm.

Địa chỉ ở thời điểm kiểm tra: **exp://172.26.100.127:8081**. Khi IP thay đổi, dùng địa chỉ/mã QR mới trong terminal. Ảnh QR lưu tại `docs/run/expo-go-qr.png` chỉ phản ánh IP ở lần bàn giao này.

Backend ảnh/phân quyền phải chạy đồng thời với Expo. Điện thoại tải ảnh qua `http://IP-MAY-TINH:3001`, không phải localhost của điện thoại. Ứng dụng tự chuyển các URL ảnh upload cục bộ cũ sang backend hiện tại khi hiển thị; không thay cấu trúc dữ liệu Firestore.

## Lọc theo khoảng giá

- Nhập **Giá từ** và **Giá đến** bằng số, ví dụ `300000` và `800000`, rồi bấm **Áp dụng**.
- Hai đầu khoảng đều được tính: sản phẩm giá 300.000 hoặc 800.000 đ vẫn xuất hiện.
- Để trống Giá từ: không đặt giới hạn thấp. Để trống Giá đến: không đặt giới hạn cao.
- **Xóa bộ lọc** xóa điều kiện giá, giữ nội dung tìm kiếm và cách sắp xếp.
- Giá âm, dữ liệu không phải số hoặc Giá từ > Giá đến sẽ được báo lỗi; bộ lọc hợp lệ trước đó được giữ nguyên.
- Số kết quả cập nhật theo tên tìm kiếm và khoảng giá cùng lúc. Lọc chỉ chạy trên ứng dụng, không thêm trường Firestore.

## Nếu không kết nối được

Trên trình duyệt điện thoại, thử mở `http://IP-MAY-TINH:3001/health`. Kết quả đúng có `"ok":true`. IP hiện tại được in ở dòng **Image API** trong terminal.

- Nếu trang health không mở: kiểm tra cùng Wi-Fi, giữ backend chạy và cho phép Node.js qua Windows Firewall trên mạng Private khi Windows hỏi. Mạng trường học/công cộng có thể chặn thiết bị truy cập nhau; thử Wi-Fi riêng hoặc cùng kết nối điểm phát sóng.
- Nếu health mở nhưng Expo không tải: kiểm tra cổng 8081, quét lại QR và phiên bản Expo Go hỗ trợ SDK 58.
- Nếu Expo tải được nhưng chọn ảnh/phân quyền báo lỗi: kiểm tra backend cổng 3001, mở lại sau khi cấu hình IP; không chỉ chạy mỗi `npm run web`.
- Nếu port đã được dùng: sử dụng dịch vụ đang chạy hoặc Ctrl+C trong terminal cũ trước khi chạy lại. Script chỉ tắt những tiến trình nó đã tự khởi chạy.
- Nếu dự án chưa cài dependencies trên máy mới: chạy `npm.cmd ci` và `npm.cmd ci --prefix backend-admin`, rồi cấu hình `.env` và `backend-admin/.env` theo README.

## Chạy riêng từng dịch vụ (hai terminal)

Terminal 1:

```powershell
cd "D:\Management User\userhub"
node scripts/configure-lan.cjs
npm.cmd run backend
```

Terminal 2:

```powershell
cd "D:\Management User\userhub"
npx.cmd expo start --web --lan --go --port 8081
```

Ctrl+C để dừng. Các hướng dẫn QR, cùng Wi-Fi và đăng nhập Expo trên iOS được đối chiếu theo tài liệu chính thức: https://docs.expo.dev/get-started/start-developing/.

Đã kiểm tra web, manifest Expo Go SDK 58, bundle Android và địa chỉ API LAN. Chưa thao tác trực tiếp trên điện thoại thật; cần mở Expo Go trên thiết bị để xác nhận kết nối từ mạng của điện thoại.
