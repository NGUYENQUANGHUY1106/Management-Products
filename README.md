# Management Product

Hướng dẫn chạy web + Expo Go: [docs/run-project.md](docs/run-project.md).

Ứng dụng React Native / Expo SDK 58 quản lý sản phẩm **chỉ dành cho admin**, chạy trên web và hỗ trợ Android/iOS. Firebase mới: `management-product-e97a1`.

## Chức năng

- Đăng nhập/đăng xuất admin bằng Firebase Authentication, kiểm tra custom claim `admin: true`.
- Thêm, hiển thị, sửa, xóa sản phẩm trong Firestore; xác nhận trước khi xóa.
- Chọn và tải ảnh từ thư viện thiết bị hoặc nhập URL ảnh; hiển thị ảnh sản phẩm.
- Tìm theo tên, lọc khoảng giá từ–đến (gồm cả hai đầu, có thể bỏ trống một đầu), sắp xếp theo tên/giá, thống kê tồn kho và giá trị kho tính từ dữ liệu hiện có.
- Giao diện sidebar và bảng sản phẩm trên web; popup thêm/sửa, xem trước ảnh, xác nhận xóa; bố cục gọn trên điện thoại.
- Đồng bộ danh sách theo thời gian thực, kiểm tra dữ liệu và hiển thị lỗi.

Đã bỏ đăng ký, hồ sơ cá nhân, phân hệ user và quản lý tài khoản người dùng. Tài liệu UserHub cũ được giữ riêng trong `docs/archive-userhub/`, không thuộc bài nộp mới.

## Cấp quyền admin cho tài khoản khác

Tài khoản chính: `nguyenquanghuy110605@gmail.com`, UID `ej1v0UNUKogn81JLB9c90Tkn9GA3`. Mật khẩu được lưu trong file riêng, không đưa vào source/báo cáo.

1. Mở Firebase Console → Authentication → Users → Add user để tạo email/mật khẩu cho người cần cấp quyền.
2. Đăng nhập ứng dụng bằng admin hiện có, mở **Cài đặt hệ thống → Phân quyền admin**.
3. Nhập email hoặc UID, chọn **Cấp quyền admin**, kiểm tra tài khoản và xác nhận.
4. Người được cấp quyền đăng xuất rồi đăng nhập lại. Muốn thu hồi, nhập email/UID và chọn **Thu hồi quyền admin**. Ứng dụng chặn tự thu hồi quyền đang sử dụng.

Authentication Console không có nút sửa custom claim `admin`; tạo tài khoản ở Console xong cần cấp quyền qua ứng dụng hoặc lệnh sau:

```sh
npm run admin:role -- email@example.com grant
npm run admin:role -- UID revoke
```

Backend kiểm tra quyền admin hiện tại khi nhận lệnh phân quyền; tài khoản chưa có quyền không thể tự cấp quyền. Thu hồi quyền sẽ xóa claim và thu hồi refresh token. ID token Firestore đã phát có thể còn quyền đến khi hết hạn, tối đa khoảng một giờ. Không thêm trường hoặc collection vào Firestore để phân quyền.

## Cơ sở dữ liệu

Collection `products`, mỗi document **đúng bốn trường**:

| Trường | Kiểu | Quy tắc |
|---|---|---|
| name | string | Tên từ 1 đến 150 ký tự, không chỉ khoảng trắng |
| price | number | Từ 0 đến 1.000.000.000.000, đơn vị VNĐ |
| soluong | integer | Từ 0 đến 1.000.000.000 |
| image | string | URL HTTP/HTTPS, tối đa 2.048 ký tự |

Document ID do Firestore quản lý, không ghi thêm trường `id`. Không thêm category, description, createdAt hay role vào document sản phẩm. Admin nằm trong **Firebase Authentication**, quyền nằm trong custom claim; không lưu mật khẩu trong Firestore. Rules chặn toàn bộ truy cập sản phẩm của người chưa đăng nhập hoặc không có quyền admin.

## Chạy trên máy hiện tại

1. Mở `start-management-product.cmd`, hoặc chạy `npm run start:local`.
2. Mở http://localhost:8081. Nếu đã build, bản xem trước có ở http://localhost:8082.
3. Tài khoản admin đã tạo trong Firebase. Xem email/mật khẩu tại `D:/ManagementProduct-Credentials/admin-login.json` (ngoài mã nguồn).

Script khởi động tự cấu hình IP LAN cho backend ảnh và Expo Go. Điện thoại cần cùng Wi-Fi, quét QR từ Expo. Sau khi thay IP, chạy lại `npm run build:web` nếu dùng bản `dist` ở cổng 8082.

## Cài trên máy khác

Yêu cầu Node.js >=22.13, Python 3 với python-docx để tạo báo cáo. Dùng `npm.cmd`/`npx.cmd` trên PowerShell nếu execution policy chặn file `.ps1`.

```sh
npm ci
npm ci --prefix backend-admin
npx expo install --check
```

Sao chép `.env.example` thành `.env`. Frontend chỉ chứa cấu hình Firebase web công khai, không chứa service account. Sao chép `backend-admin/.env.example` thành `backend-admin/.env`, điền đường dẫn service account có quyền với dự án mới. Trên máy đã đăng nhập Firebase CLI, có thể chạy `node scripts/local-adc.cjs` để dùng ADC cục bộ.

```sh
npx firebase login
npx firebase deploy --only auth,firestore:rules --project management-product-e97a1
node scripts/configure-product.cjs
npm run setup:live
npm run start:local
```

`setup:live` tạo admin và ba sản phẩm mẫu nếu chưa có; không đặt lại mật khẩu hay ghi đè sản phẩm đã có. Đường dẫn lưu tài khoản trong script là đường dẫn riêng cho máy bàn giao; đổi sang thư mục riêng trên máy khác. Với admin hiện có, dùng `node --env-file=backend-admin/.env scripts/set-admin-claim.mjs UID` để cấp quyền theo chủ đích.

## Hình ảnh

Backend `/images` xác minh token và quyền admin, giới hạn 5 MB, kiểm tra ảnh bằng Sharp rồi chuyển JPEG. Trong bản chạy tại máy, ảnh được lưu ở `backend-admin/uploads/` và trường `image` lưu URL backend. Khi dùng điện thoại, backend phải truy cập được qua IP LAN. Khi đưa ứng dụng lên Internet, cấu hình Cloudinary trong backend hoặc triển khai backend ảnh có lưu trữ bền vững; URL localhost/LAN không dùng được từ Internet.

## Kiểm tra và xuất bài

```sh
npm run typecheck
npm run lint
npm run build:web
npx expo export --platform android --output-dir dist-android
node --env-file=.env scripts/verify-live.mjs
node --env-file=.env --env-file=backend-admin/.env scripts/verify-permissions.mjs
npm run test:e2e
npm run export:products
node --env-file=backend-admin/.env scripts/database-evidence.mjs
python -m pip install -r scripts/requirements.txt
npm run report
python scripts/package.py
```

Các kiểm thử trực tiếp tạo dữ liệu tạm rồi dọn dữ liệu của chính lần kiểm thử. Playwright cần backend cổng 3001 và bản web đã build tại cổng 8082. Kiểm thử rules riêng trên emulator: Java **21 trở lên**, `npx firebase emulators:exec --only firestore --project demo-management-product "npm run test:integration"`.

Kết quả thật nằm ở `docs/testing/`. Web và thao tác chọn ảnh ở kích thước điện thoại đã được kiểm thử bằng Chromium; Android đã export bundle, **chưa kiểm thử trên thiết bị thật**. Máy hiện tại chỉ có Java 17 hoạt động nên chưa chạy được bộ rules emulator; quyền truy cập đã được kiểm tra trực tiếp với Firebase thật.

Báo cáo: `docs/report/ManagementProduct_BaoCao.docx`. CSDL nộp: `docs/database/products.json` (mảng dữ liệu chỉ gồm bốn trường). Minh chứng dữ liệu thật: `docs/database/firebase-evidence.json` và ảnh 07; trang HTML minh chứng được ghi rõ là trang của dự án, không giả làm Firebase Console.

Source GitHub: https://github.com/NGUYENQUANGHUY1106/Management-Products. Video demo được lưu trong `docs/video/ManagementProduct_Demo.webm`; chưa tải lên dịch vụ video riêng. Có thể xem/tải video từ thư mục `docs/video` trên GitHub; nếu đề yêu cầu nền tảng video riêng, bổ sung URL thực tế trước khi nộp.
