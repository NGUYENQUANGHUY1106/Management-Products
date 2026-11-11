# UserHub — React Native / Expo / Firebase

Ứng dụng quản lý tài khoản User và Admin theo **SRS-UH-02 v2.0**. Giao diện viết bằng **TypeScript/TSX**, dùng React Native và Expo Router; backend Node.js dùng Firebase Admin SDK. Nhận diện Verdant Ledger: xanh rừng, ngọc, kem.

## Trạng thái bàn giao

- Đã triển khai các luồng đăng ký, đăng nhập, hồ sơ, ảnh, đăng xuất; Admin tạo/sửa/xóa tài khoản Auth và Firestore, tìm kiếm/sắp xếp/phân trang.
- Đã kiểm thử 25 ca trên Firebase Emulator, 10 kiểm tra trực tiếp Firebase thật và 5 kịch bản Chromium trên dự án thật. Ảnh trong `docs/screenshots` lấy từ ứng dụng chạy với `management-user-86623`.
- Build Web và bundle Android được kiểm tra riêng. Bundle Android **không thay thế** kiểm thử trên điện thoại Expo Go.
- Firebase thật đã cấu hình Web, service account ngoài source, Rules đã deploy và Admin có custom claim. Expo Go trên điện thoại thật vẫn cần người dùng xác nhận.
- Báo cáo: `docs/report/UserHub_BaoCao.docx`. Kết quả máy đọc được: `docs/testing/`. Dữ liệu Firebase thật: `docs/database/users.json`.

## Chạy bản đã cấu hình trên máy này

Mở `http://localhost:8082` để dùng bản Web đã build; Expo/Expo Go dùng port 8081. Có thể chạy lại bằng `start-userhub.cmd`, hoặc các terminal:

```powershell
cd 'D:\Management User\userhub'
npm.cmd run backend
# terminal khác, cùng thư mục
npm.cmd run web
# terminal thứ ba: phục vụ dist/ đã build
node scripts/serve-export.cjs
```

Thông tin Admin/User demo thật lưu riêng tại `D:\UserHub-Credentials\userhub-login.json`. Không đưa file đó lên GitHub hoặc vào báo cáo. Backend tham chiếu service account tại thư mục này qua `.env` đã được gitignore. Trên máy khác phải cung cấp file xác thực riêng, không sao chép khóa chung source.

Điện thoại cùng Wi-Fi: mở Expo Go và quét `docs/ExpoGo_QR.png`. Địa chỉ hiện tại là `exp://172.20.10.2:8081`. Nếu IP máy đổi, cập nhật `.env` (API URL), `backend-admin/.env` (PUBLIC_API_URL, ALLOWED_ORIGINS) và khởi động lại. Ảnh hiện dùng backend local demo, cần PC hoạt động để truy cập URL ảnh.

## Chạy nhanh bằng Emulator trên Windows

Yêu cầu Node.js 22.13+ (khuyến nghị Node 24 LTS), Java 21+, Python 3 nếu tạo lại DOCX. Không cần Firebase trả phí, service account hay tài khoản Google để chạy Emulator.

```powershell
cd 'D:\Management User\userhub'
npm.cmd ci
npm.cmd ci --prefix backend-admin
```

Mở **3 terminal PowerShell** tại thư mục dự án:

```powershell
# Terminal 1
npm.cmd run emulators
```

```powershell
# Terminal 2 — chỉ dùng dữ liệu demo-userhub
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
$env:GCLOUD_PROJECT='demo-userhub'
node scripts/seed-emulator.mjs
node backend-admin/server.js
```

```powershell
# Terminal 3
$env:EXPO_PUBLIC_USE_EMULATORS='true'
npm.cmd run web
```

Mở http://localhost:8081. Xem CSDL/Auth ở http://127.0.0.1:4000.

Tài khoản **chỉ dành cho Emulator**:

| Vai trò | Email | Mật khẩu demo |
| --- | --- | --- |
| Admin | admin@userhub.test | EmulatorOnly!42 |
| User | member1@userhub.test | EmulatorOnly!42 |

Các mật khẩu demo này không phải mật khẩu Firestore và không được dùng cho Firebase thật. Seed chỉ chạy trên `demo-userhub`, không ghi vào dự án thật.

Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd`/`npx.cmd` như ví dụ. Máy đang triển khai có runtime hỗ trợ tại `D:\Management User\.tools`; có thể thêm tạm vào PATH khi cần:

```powershell
$env:Path='D:\Management User\.tools;'+$env:Path
$env:JAVA_HOME='D:\Management User\.tools\jdk-21.0.9+10'
$env:Path=$env:JAVA_HOME+'\bin;'+$env:Path
```

## Kết nối Firebase Management User thật

1. Firebase Console → Project settings → General → Your apps → Web → SDK setup and configuration → Config. Sao chép chính xác vào `.env` theo `.env.example`. Không suy đoán API key từ ảnh.
2. Authentication → Sign-in method → bật Email/Password, tắt Email link nếu không dùng.
3. Tạo Firestore ở chế độ production. Vào Rules, dán toàn bộ `firestore.rules`, bấm Publish; hoặc dùng Firebase CLI đã đăng nhập: `npx.cmd firebase deploy --only firestore:rules --project management-user-86623`.
4. Project settings → Service accounts → Generate new private key. Lưu ngoài repository, ví dụ `D:\UserHub-Credentials\service-account.json`. Không gửi nội dung lên chat/GitHub.
5. Sao chép `backend-admin/.env.example` thành `backend-admin/.env`, đặt `GOOGLE_APPLICATION_CREDENTIALS` là đường dẫn tuyệt đối. File này đã được gitignore.
6. Authentication → Users → Add user để tạo Admin với mật khẩu riêng. Sao chép UID. Cấp claim từ terminal:

```powershell
node --env-file=backend-admin/.env scripts/set-admin-claim.mjs <UID_ADMIN>
npm.cmd run backend
```

7. Terminal frontend phải bỏ biến Emulator nếu đã đặt:

```powershell
Remove-Item Env:EXPO_PUBLIC_USE_EMULATORS -ErrorAction SilentlyContinue
# .env: EXPO_PUBLIC_USE_EMULATORS=false
npm.cmd run web
```

8. Admin đăng xuất/đăng nhập lại để token có claim mới. Tài khoản User tự đăng ký từ app; ứng dụng tự tạo `users/{uid}`.

## Ảnh và Expo Go

Mặc định production cần Cloudinary cấu hình trên **backend**, không dùng secret trên Expo. Đặt `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `backend-admin/.env`. Backend xác thực ID token, kiểm tra nội dung ảnh bằng Sharp, giới hạn 5 MB/25 megapixel, chuyển JPEG tối đa 800 px, ký upload server-side. Firestore chỉ giữ URL ở `hinhanh`.

Demo local không dùng dịch vụ ngoài: đặt `ALLOW_LOCAL_UPLOADS=true` và `PUBLIC_API_URL=http://<IP-LAN-PC>:3001` trong backend. Ảnh nằm trên PC; cần giữ backend chạy và sao lưu thư mục `backend-admin/uploads`. Local storage này dành cho demo; khi host thật nên dùng Cloudinary. Thay/xóa hồ sơ không tự xóa file ảnh cũ do không có metadata sở hữu ảnh trong schema bốn trường; cần dọn ảnh bằng quản trị dịch vụ lưu ảnh.

Để dùng điện thoại thật:

1. Cài Expo Go tương thích Expo SDK 58; điện thoại và PC cùng mạng.
2. `.env`: `EXPO_PUBLIC_ADMIN_API_BASE_URL=http://<IP-LAN-PC>:3001`.
3. Dùng Firebase thật để Auth/Firestore truy cập qua Internet; nếu dùng Emulator cần cấu hình host LAN trong `firebase.json` và `EXPO_PUBLIC_EMULATOR_HOST` (mặc định Emulator chỉ nghe loopback).
4. `npx.cmd expo start --lan`, quét QR. Nếu không kết nối, kiểm tra firewall cho đúng mạng LAN riêng và port cần thiết.
5. Đăng nhập User → Chỉnh sửa hồ sơ → Chọn ảnh → Lưu. Mở Web cùng tài khoản → xác nhận cùng ảnh. Thoát app/mở lại để kiểm tra AsyncStorage persistence.
6. Ghi kết quả vào `docs/testing/manual-checklist.md`, chụp màn hình thật để bổ sung báo cáo. Không gọi ảnh mobile Web là ảnh Expo Go.

## Kiểm thử và build

Giữ Emulator chạy. **Test tích hợp xóa dữ liệu của project `demo-userhub`**, nên không chạy đồng thời với demo đang cần giữ dữ liệu; không tác động project Firebase thật.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:integration
# Sau integration, seed lại và giữ backend/frontend Emulator chạy
node scripts/seed-emulator.mjs
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run build:web
npx.cmd expo export --platform android --output-dir dist-android
```

Khi seed/export cần các biến Emulator ở Terminal 2. Báo cáo kết quả test là JSON; Playwright tạo thêm `playwright-report/index.html`. Bundle Web ở `dist/`, Android ở `dist-android/` (bundle JS/Hermes, không phải APK).

Xuất dữ liệu Firebase thật từ môi trường có service account:

```powershell
node --env-file=backend-admin/.env scripts/export-users.mjs
# Kết quả: docs/database/users.json, kiểm tra đúng bốn trường và AUTH_MANAGED
```

Tạo lại báo cáo sau khi thêm bằng chứng:

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/report.py
```

## Cấu trúc và nguyên tắc

`src/app/**/*.tsx`: màn hình/Expo Router. `src/components`: UI dùng chung. `src/config/firebase.ts` và `.native.ts`: Firebase Web/native, AsyncStorage persistence trên mobile. `backend-admin`: API tin cậy, không import vào client. `tests`: integration/Rules/Playwright. `scripts`: claim, seed, export, báo cáo.

Hồ sơ Firestore đúng `{email, matkhau, hoten, hinhanh}` kiểu string; UID nằm ở document ID. `matkhau` luôn `AUTH_MANAGED`, không lưu plaintext/hash. Vai trò lấy từ custom claim `admin:true`; frontend chỉ điều hướng, server và Rules mới quyết định quyền. Mọi thay đổi Admin qua backend để giữ nhất quán Auth/Firestore. Create/update có xử lý bù; delete Auth trước rồi profile, có thể retry nếu còn profile. Backend khóa thao tác cùng UID trong một tiến trình; demo chạy một instance. Khi cần nhiều instance phải bổ sung điều phối giao dịch và reconciliation bền vững.

Git repository đã khởi tạo tại thư mục này. Chưa có URL GitHub nếu chưa cung cấp remote/đăng nhập. Xem `docs/demo-script.md` để quay video trình diễn và điền link thật khi nộp.
