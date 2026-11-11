# Kiểm thử cần thiết bị và Firebase thật

Ngày lập: 11/11/2026. Chỉ đổi sang PASS khi đã thực hiện và có bằng chứng. Các ca tự động xem integration-results.json và browser-results.json.

| Mã | Thao tác | Kỳ vọng | Trạng thái |
| --- | --- | --- | --- |
| LIVE-01 | Kiểm tra firebaseConfig bản chữ và Auth provider | API key hợp lệ, Email/Password bật | PASS — HTTP 200 và live login/register |
| LIVE-02 | Publish firestore.rules vào dự án Management User | Owner/Admin đúng quyền | PASS — deploy và live negative tests |
| LIVE-03 | Service account local, tạo Admin và cấp custom claim | Admin thực hiện CRUD Auth thật | PASS — live-results.json |
| LIVE-04 | Đăng ký, đăng nhập, sửa/xóa bằng Firebase thật | Auth/Firestore cùng UID, đủ bốn trường | PASS — 10 kiểm tra live |
| TC-U06 | Expo Go điện thoại thật chọn ảnh | Preview, upload thành công, Web cùng URL | CHƯA CHẠY TRÊN ĐIỆN THOẠI |
| TC-M01 | Expo Go: đăng nhập, lưu ảnh, thoát/mở lại | Không lỗi native, session tồn tại | CHƯA CHẠY TRÊN ĐIỆN THOẠI |
| MOBILE-KB | Mở form trên Android/iOS và bật bàn phím | Trường/nút truy cập được | CHƯA CHẠY TRÊN ĐIỆN THOẠI |
| MOBILE-PERM | Hủy chọn ảnh / từ chối quyền (nếu OS hỏi) | Không crash; có thể chọn lại | CHƯA CHẠY TRÊN ĐIỆN THOẠI |
| SUB-01-LIVE | Export Firebase thật và ảnh CSDL | JSON đủ bốn trường, không secret | PASS JSON/snapshot SDK; có thể bổ sung ảnh Firebase Console |
| SUB-02-GIT | Push repo và mở URL | Người chấm truy cập được | CHƯA CÓ REMOTE |
| SUB-02-VIDEO | Quay demo 3–6 phút và upload | Link mở được, đủ luồng SRS | CHƯA CÓ LINK |

Ảnh 390 px trong docs/screenshots là Chromium responsive Web, không phải bằng chứng Expo Go.
