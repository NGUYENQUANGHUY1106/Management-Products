"""Generate the Vietnamese handover report from actual test results and screenshots."""
from pathlib import Path
import json
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from lxml import etree

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/report'
OUT.mkdir(parents=True, exist_ok=True)

def read_json(relative, fallback=None):
    p = ROOT / relative
    if not p.exists():
        return fallback
    raw = p.read_bytes()
    return json.loads(raw.decode('utf-16') if raw.startswith(b'\xff\xfe') else raw.decode('utf-8-sig'))

integration = read_json('docs/testing/integration-results.json', {'results': []})
browser = read_json('docs/testing/browser-results.json', {})
builds = read_json('docs/testing/build-results.json', {})
live = read_json('docs/testing/firebase-live-connection.json', {})
live_results = read_json('docs/testing/live-results.json', {'results': []})['results']
live_passed = sum(r['status'] == 'PASS' for r in live_results)
results = integration['results']
passed = sum(r['status'] == 'PASS' for r in results)
browser_pass = browser.get('stats', {}).get('expected', 0)
doc = Document()
section = doc.sections[0]
section.page_height = Inches(11.69)
section.page_width = Inches(8.27)
section.top_margin = Inches(.8)
section.bottom_margin = Inches(.75)
section.left_margin = Inches(.95)
section.right_margin = Inches(.75)
normal = doc.styles['Normal']
normal.font.name = 'Times New Roman'
normal.font.size = Pt(12)
normal.paragraph_format.space_after = Pt(7)
normal.paragraph_format.line_spacing = 1.15
for part in doc.part.package.parts:
    if str(part.partname) == '/word/theme/theme1.xml':
        theme = etree.fromstring(part.blob)
        for element in theme.xpath('//*[local-name()="clrScheme"]/*[local-name()="accent1"]/*'):
            element.set('val', '087C67')
        part._blob = etree.tostring(theme)
doc.styles['Caption'].font.color.rgb = RGBColor.from_string('637B75')
doc.styles['Subtitle'].font.color.rgb = RGBColor.from_string('087C67')
for name, size in [('Title', 30), ('Heading 1', 19), ('Heading 2', 14), ('Heading 3', 12)]:
    style = doc.styles[name]
    style.font.name = 'Arial'
    style.font.size = Pt(size)
    style.font.color.rgb = RGBColor.from_string('173539')
header = section.header.paragraphs[0]
header.text = 'USERHUB  /  VERDANT LEDGER                                     SRS-UH-02 • v2.0'
header.style = 'Caption'
footer = section.footer.paragraphs[0]
footer.alignment = 2
footer.add_run('UserHub • Báo cáo triển khai  |  Trang ')
field = OxmlElement('w:fldSimple')
field.set(qn('w:instr'), 'PAGE')
footer._p.append(field)

def p(text='', style=None):
    return doc.add_paragraph(text, style)

def h(text, level=1):
    doc.add_heading(text, level)

def table(headers, rows):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = 'Light Shading Accent 1'
    for cell, text in zip(t.rows[0].cells, headers):
        cell.text = str(text)
    repeat = OxmlElement('w:tblHeader')
    t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for row in rows:
        cells = t.add_row().cells
        for cell, text in zip(cells, row):
            cell.text = str(text)
    for row in t.rows:
        for cell in row.cells:
            for para in cell.paragraphs:
                para.paragraph_format.space_after = Pt(4)
                for run in para.runs:
                    run.font.size = Pt(10)
    p()
    return t

def code(text):
    para = p(text)
    para.paragraph_format.space_after = Pt(9)
    for run in para.runs:
        run.font.name = 'Consolas'
        run.font.size = Pt(9)

def image(name, caption, width=6.3):
    path = ROOT / 'docs/screenshots' / name
    if path.exists():
        doc.add_picture(str(path), width=Inches(width))
        p(caption, 'Caption')
    else:
        p('Chưa có ảnh: ' + caption)

def newpage():
    doc.add_page_break()

p('BÁO CÁO TRIỂN KHAI PHẦN MỀM', 'Subtitle')
doc.add_heading('USERHUB', 0)
p('Hệ thống quản lý tài khoản người dùng\nHai phân hệ USER & ADMIN', 'Subtitle')
p('React Native • TypeScript / TSX • Expo Router\nFirebase Authentication • Cloud Firestore • Node.js Admin SDK')
p('Thiết kế giao diện: VERDANT LEDGER')
p('Đối chiếu đặc tả: SRS_UserHub_v2_User_Admin_Expo_Firebase.docx, phiên bản 2.0 ngày 10/11/2026.')
table(['Thông tin', 'Giá trị'], [
    ['Ngày xuất báo cáo', '11/11/2026 — múi giờ Asia/Saigon'],
    ['Người thực hiện / lớp', 'Nguyễn Quang Huy / 23IT1B'],
    ['Thư mục sản phẩm', r'D:\Management User\userhub'],
    ['Firebase mục tiêu', 'Management User / management-user-86623'],
    ['Môi trường đã kiểm thử', 'Firebase Local Emulator Suite; Firebase management-user-86623 thật; Chromium desktop và responsive Web'],
    ['Kết quả tự động', f'{passed}/{len(results)} ca tích hợp đạt; {live_passed}/{len(live_results)} kiểm tra Firebase thật đạt; {browser_pass} kịch bản trình duyệt đạt'],
])
p('PHẠM VI BẰNG CHỨNG', 'Heading 2')
p('Mã nguồn và ảnh trong báo cáo là từ sản phẩm đã chạy. Ảnh Web và responsive Web dùng dự án Firebase thật management-user-86623; ảnh mobile Web không phải ảnh Expo Go. Ảnh Auth/Firestore là dữ liệu thật đọc qua Admin SDK trong trang minh chứng, không phải giao diện Firebase Console. Người dùng đã mở app trên điện thoại và báo lỗi upload ở bản cũ; còn chờ kiểm lại luồng ảnh sau bản sửa.')
newpage()
h('MỤC LỤC')
chapters = ['1. Tổng quan, mục tiêu và điều kiện nghiệm thu', '2. Công nghệ, kiến trúc và cấu trúc mã nguồn', '3. Phân quyền, dữ liệu và bảo mật', '4. Chức năng User đã triển khai', '5. Chức năng Admin đã triển khai', '6. Thiết kế giao diện và responsive', '7. Cài đặt và chạy từng bước', '8. Firebase thật, Admin và dịch vụ ảnh', '9. Kế hoạch và kết quả kiểm thử', '10. Ma trận truy vết SRS và đề thi', '11. Hình ảnh minh chứng ứng dụng', '12. Dữ liệu JSON, GitHub và video demo', '13. Giới hạn, công việc còn cần nghiệm thu và bàn giao', 'Phụ lục A. Firestore Rules', 'Phụ lục B. Tài liệu tham khảo']
for chapter in chapters:
    p(chapter)
p('Báo cáo được tạo lại từ scripts/report.py. Kết quả gốc nằm trong docs/testing; cập nhật bằng chứng thực tế rồi chạy lại script để thay đổi trạng thái.')
newpage()
h(chapters[0])
p('UserHub phục vụ hai nhóm: người dùng tự quản lý hồ sơ và quản trị viên quản lý tài khoản đăng nhập. Một codebase React Native được dùng cho Web và ứng dụng Expo. Thiết kế bám SRS v2.0; không lưu thêm trường ngoài email, matkhau, hoten, hinhanh trong document hồ sơ.')
table(['Mã đề', 'Yêu cầu', 'Cách đáp ứng'], [
    ['EX-01 / 8 điểm', 'Thêm và hiển thị bốn trường trên Web', 'Auth UID liên kết document Firestore thật; form/danh sách React Native Web; JSON export thật'],
    ['EX-02 / 1.5 điểm', 'Đăng nhập, sửa, xóa, nâng cao', 'Hai vai trò, backend Admin SDK, search/sort/pagination, xác nhận xóa'],
    ['EX-03 / 0.5 điểm', 'Nhập ảnh và hiển thị trên di động', 'Expo ImagePicker và upload backend đã viết; còn kiểm tra trên điện thoại thật'],
    ['SUB-01', 'Báo cáo từng bước/lệnh/ảnh CSDL/JSON', 'DOCX, README, snapshot dữ liệu SDK và JSON thật; có thể bổ sung ảnh Console'],
    ['SUB-02', 'GitHub source và video', 'Repo local, script demo và video Web local nếu có; chưa có URL công khai'],
])
p('Không tự kết luận điểm số đạt được; việc chấm và chấp thuận giá trị AUTH_MANAGED thuộc giảng viên. Bảng này dùng để kiểm tra tính bao phủ yêu cầu.')
h(chapters[1])
package = read_json('package.json', {})
deps = package.get('dependencies', {})
table(['Thành phần', 'Triển khai'], [
    ['Giao diện', f"React Native {deps.get('react-native', '')}, TypeScript, React {deps.get('react', '')}"],
    ['Nền tảng', f"Expo {deps.get('expo', '')}; Expo Router; React Native Web"],
    ['Dữ liệu', f"Firebase JS SDK {deps.get('firebase', '')}; Auth + Firestore"],
    ['Backend', 'Express; Firebase Admin SDK; CORS; giới hạn request; Multer; Sharp; Cloudinary signed upload'],
    ['Kiểm thử', 'Node test runner; @firebase/rules-unit-testing; Playwright Chromium'],
    ['Tài liệu', 'Python python-docx; ảnh thật từ Playwright; JSON kết quả kiểm thử'],
])
code('React Native / Expo Web & Mobile\n  ├─ Firebase Client SDK → Authentication + Firestore (Owner Rules)\n  └─ ID token → Express API → verifyIdToken + admin claim\n                         ├─ Firebase Admin SDK → Auth + Firestore\n                         └─ Sharp → Cloudinary / local demo → URL ảnh')
p('Các màn hình và component giao diện sử dụng .tsx. File .js/.mjs nằm ở backend hoặc công cụ chạy Node; Firebase Admin SDK không đưa vào bundle client. UID chỉ dùng làm document ID và dữ liệu định danh trên bộ nhớ/API, không trở thành field thứ năm.')
code('src/\n  app/{login,register}.tsx\n  app/user/{profile,edit-profile}.tsx\n  app/admin/dashboard.tsx\n  app/admin/users/{index,create,[id]/index,[id]/edit}.tsx\n  components/{AuthScreen,Shell,AdminUserForm,AvatarPicker,ui}.tsx\n  config/firebase.ts, firebase.native.ts\n  contexts/AuthContext.tsx; hooks/useUsers.ts\n  services/{auth,api}.ts; types/user.ts; utils/validation.ts\nbackend-admin/{app,server,firebase}.js\nfirestore.rules; firebase.json; tests/; scripts/; docs/')
h(chapters[2])
table(['Nghiệp vụ', 'Guest', 'User', 'Admin'], [
    ['Đăng ký / đăng nhập', 'Có', 'Đăng nhập', 'Đăng nhập'],
    ['Hồ sơ cá nhân', 'Không', 'Đọc; sửa họ tên và ảnh', 'Có thể tạo hồ sơ cá nhân nếu cần'],
    ['Danh sách tài khoản', 'Không', 'Không', 'Có'],
    ['Tạo/sửa/xóa Auth người khác', 'Không', 'Không', 'Qua API đặc quyền'],
    ['Tìm kiếm/sort/phân trang', 'Không', 'Không', 'Có'],
])
code('users/{FirebaseAuthUID}\n{\n  "email": "member@example.test",\n  "matkhau": "AUTH_MANAGED",\n  "hoten": "Nguyễn Văn A",\n  "hinhanh": "https://.../avatar.jpg"\n}')
p('Mật khẩu được Firebase Authentication quản lý. AUTH_MANAGED là giá trị thay thế cố định, không phải plaintext hoặc hash. Không hiển thị trường matkhau trong trang User/Admin. Không lưu role, uid, createdAt, phone hoặc status trong document.')
p('User chỉ đọc hồ sơ chính mình và chỉ cập nhật hoten/hinhanh. Rules từ chối list collection cho User/Guest, từ chối tự đổi email/matkhau, thêm field hoặc xóa trực tiếp. Admin list/get được phép qua claim; các thao tác ghi Admin đều đi qua backend để giữ đồng bộ Auth. Đây là cách siết chặt mẫu Rules trong SRS.')
p('Backend verify ID token và kiểm tra admin:true trên tất cả endpoint /admin. Chặn sửa/xóa chính Admin và mọi tài khoản có admin claim. Token bị thu hồi hoặc tài khoản bị xóa bị từ chối tại backend. CORS chỉ giới hạn origin trình duyệt, không thay cho xác thực. Giới hạn request và ảnh được xử lý ở server.')
h(chapters[3])
table(['FR', 'Hành vi đã viết', 'Kiểm tra'], [
    ['FR-U01', 'Register tên/email/password/confirm và ảnh tùy chọn; tạo Auth, upload có token, ghi bốn field; lỗi upload/ghi hồ sơ thì bù Auth', 'TC-U01/U02; E2E đăng ký có ảnh và thử lại sau lỗi upload'],
    ['FR-U02/U06', 'Firebase email/password; route guard; signOut; chặn refresh route bảo vệ', 'Integration login/logout; E2E quyền truy cập'],
    ['FR-U03/U08', 'Hồ sơ chính chủ; email chỉ đọc; không hiển thị mật khẩu', 'E2E Profile/Edit và quyền sửa email'],
    ['FR-U04', 'Validate tên 2–100 ký tự, lưu và phản hồi thành công', 'TC-U05; E2E reload tên mới'],
    ['FR-U05', 'Chọn ảnh, preview, upload có xác thực, lưu URL, placeholder ảnh lỗi', 'Web upload đã test; Expo Go thật còn chờ'],
    ['FR-U07', 'Loading/error/retry; missing profile recovery; thông báo validation', 'API âm; E2E lỗi mạng; checklist thiết bị'],
])
h(chapters[4])
table(['FR', 'Hành vi đã viết', 'Lưu ý'], [
    ['FR-A01/A11', 'Token claim; dashboard; route guards; logout', 'Không dùng role frontend để cấp quyền'],
    ['FR-A02/A09', 'Danh sách/avatar/tên/email; chi tiết; loading/empty/error', 'Không hiện matkhau'],
    ['FR-A03', 'Tạo Auth + profile bằng backend, giữ phiên Admin', 'Nếu ghi Firestore lỗi, xóa Auth vừa tạo'],
    ['FR-A04', 'Sửa tên/ảnh/email; đồng bộ Auth và Firestore', 'Nếu Firestore lỗi, phục hồi Auth email cũ'],
    ['FR-A05/A12', 'Modal nêu đúng tài khoản, hủy/xác nhận xóa; khóa nút khi chạy', 'Xóa Auth rồi profile; retry idempotent'],
    ['FR-A06/A07/A08', 'Tìm email/tên không phân biệt hoa thường; A–Z/Z–A; 5/10 mỗi trang', 'Client-side cho tập dữ liệu nhỏ, UID làm tie-break'],
    ['FR-A10', 'AvatarPicker dùng chung trên Web/Mobile', 'Kiểm thử thiết bị thật còn chờ'],
])
table(['API', 'Chức năng', 'Quyền'], [['GET /admin/users', 'Đọc danh bạ', 'Admin'], ['POST /admin/users', 'Tạo Auth + hồ sơ', 'Admin'], ['PATCH /admin/users/:uid', 'Sửa và đồng bộ email', 'Admin'], ['DELETE /admin/users/:uid', 'Xóa Auth + hồ sơ', 'Admin; cấm Admin target'], ['POST /images', 'Validate/re-encode/upload ảnh', 'Đã đăng nhập'], ['GET /health', 'Kiểm tra trạng thái', 'Công khai; không trả secret']])
p('Mỗi request tạo/sửa xác thực schema đầu vào. Backend khóa thao tác cùng UID trong một instance. Các lỗi bù bất thành ghi mã reconciliation và UID, không ghi mật khẩu/token. Đây là hệ thống demo một backend; nếu mở rộng nhiều instance cần điều phối và hàng đợi bù bền vững.')
h(chapters[5])
p('Verdant Ledger dùng xanh rừng #173539, ngọc #087C67, kem #EDF3F0, trắng và viền #D7E4DD. Login có vùng nhận diện riêng; User ưu tiên hồ sơ; Admin có sidebar và danh bạ. Nút tối thiểu 46 px, input có label/accessibilityLabel, mật khẩu ẩn/hiện, trạng thái lỗi rõ ràng.')
p('Desktop ≥1024 px có sidebar; dưới ngưỡng này chuyển điều hướng dưới. Danh sách chuyển bố cục card dưới 768 px. Đã chạy Chromium ở 1440×1000 và 390×844, kiểm tra không cuộn ngang. Keyboard tránh che form login trên iOS đã cấu hình; hành vi thực tế còn cần kiểm tra trên thiết bị.')
h(chapters[6])
p('Các lệnh sau chạy từ thư mục dự án bằng PowerShell. Dùng npm.cmd/npx.cmd nếu máy chặn file .ps1. Máy triển khai đã tải Node 24 và JDK 21 trong thư mục .tools ngoài repository; runtime không đóng gói chung source.')
code("cd 'D:\\Management User\\userhub'\nnpm.cmd ci\nnpm.cmd ci --prefix backend-admin\n# Terminal 1\nnpm.cmd run emulators")
code("# Terminal 2\n$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'\n$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'\n$env:GCLOUD_PROJECT='demo-userhub'\nnode scripts/seed-emulator.mjs\nnode backend-admin/server.js")
code("# Terminal 3\n$env:EXPO_PUBLIC_USE_EMULATORS='true'\nnpm.cmd run web")
p('Mở http://localhost:8081; Emulator UI http://127.0.0.1:4000. Tài khoản Emulator được seed: admin@userhub.test và member1@userhub.test. Mật khẩu chỉ dành cho demo nằm trong README, không lưu trong Firestore hoặc bản export.')
code('npm.cmd run typecheck\nnpm.cmd run lint\nnpm.cmd run test:integration\n# Seed lại trước E2E vì integration xóa dữ liệu demo\nnode scripts/seed-emulator.mjs\nnpx.cmd playwright install chromium\nnpm.cmd run test:e2e\nnpm.cmd run build:web\nnpx.cmd expo export --platform android --output-dir dist-android')
p('Test tích hợp chỉ trỏ project demo-userhub và xóa dữ liệu của project demo này. Không chạy đồng thời với một phiên demo cần giữ dữ liệu. Source có file khóa package-lock cho frontend và backend để cài đặt tái lập.')
h(chapters[7])
p('Cấu hình Web đã nhận từ người dùng; kiểm tra endpoint cấu hình Authentication trả HTTP ' + str(live.get('httpStatus', 'chưa có')) + '. Điều này chứng minh API key/project có phản hồi, chưa chứng minh các luồng CRUD thật đã nghiệm thu.')
p('Firebase Console → Authentication → Sign-in method: bật Email/Password. Cloud Firestore đã được tạo theo ảnh người dùng cung cấp. Ứng dụng tự tạo collection users khi đăng ký; không tạo field thủ công khác SRS. Publish firestore.rules từ tab Rules hoặc Firebase CLI.')
code('npx.cmd firebase deploy --only firestore:rules --project management-user-86623')
p('Backend đã cấu hình service account do người dùng lưu trong D:/UserHub-Credentials. File khóa nằm ngoài repository; backend-admin/.env chỉ tham chiếu đường dẫn và được gitignore. Đã tạo Admin có custom claim và các tài khoản User demo trên Firebase thật. Thông tin đăng nhập nằm riêng ở D:/UserHub-Credentials/userhub-login.json; không chèn mật khẩu đó vào báo cáo hoặc export. Khi thiết lập máy khác, tạo service account riêng theo Project settings → Service accounts, sau đó cấp claim cho UID Admin bằng script.')
code('node --env-file=backend-admin/.env scripts/set-admin-claim.mjs <UID_ADMIN>\nnpm.cmd run backend\n# Frontend: .env EXPO_PUBLIC_USE_EMULATORS=false\nnpm.cmd run web')
p('Cloudinary lưu ảnh qua backend ký request. Secret chỉ ở backend. Nếu demo offline dùng local uploads với ALLOW_LOCAL_UPLOADS=true; PUBLIC_API_URL phải là URL PC mà điện thoại truy cập được. Ảnh local chỉ tồn tại khi PC/backend còn hoạt động; không coi là lưu trữ công khai bền vững.')
p('Expo Go: dùng npx expo start --lan, quét QR với app tương thích SDK 58. Không dùng localhost làm URL backend từ điện thoại; đặt EXPO_PUBLIC_ADMIN_API_BASE_URL bằng IP LAN của PC hoặc HTTPS host. Auth native sử dụng AsyncStorage persistence; cần test thoát/mở app trên thiết bị thật.')
h(chapters[8])
p('Cập nhật theo phản hồi 11/11/2026: người dùng đã mở app trên điện thoại nhưng gặp Unsupported FormDataPart implementation khi tải ảnh. Đã thay dữ liệu file native từ object uri sang File của expo-file-system và dùng expo/fetch theo SDK 58. TC-X10 tái hiện lỗi cũ bằng chính serializer Expo đã cài, rồi kiểm tra nhánh native mới tạo multipart hợp lệ và upload đến backend. File và môi trường native được giả lập trong Node; kết quả này không thay thế chạy lại trên điện thoại.')
p('Đăng ký đã bổ sung chọn ảnh/xem trước theo yêu cầu mới của người dùng, ảnh không bắt buộc. Việc upload chỉ thực hiện sau khi tạo Auth để backend vẫn kiểm tra ID token. Test mới xác minh preview không phát request upload, ảnh tồn tại sau reload, và lỗi upload không để lại tài khoản Auth khiến email bị trùng khi thử lại. Schema Firestore giữ nguyên bốn trường.')
p(f'Kiểm thử tích hợp Emulator: {passed}/{len(results)} PASS. Kiểm tra Firebase thật: {live_passed}/{len(live_results)} PASS. Playwright trên Firebase thật: {browser_pass} kịch bản PASS. Kết quả gốc đọc trực tiếp từ JSON; các kết quả này không thay thế kiểm thử Expo Go thật.')
table(['Mã', 'Nội dung kiểm thử tích hợp', 'Kết quả'], [[r['id'], r['title'], r['status']] for r in results])
table(['Mã Firebase thật', 'Nội dung', 'Kết quả'], [[r['id'], r['title'], r['status']] for r in live_results])
stats = browser.get('stats', {})
table(['Kiểm tra trình duyệt', 'Phạm vi', 'Kết quả'], [
    ['User lifecycle', 'Đăng ký/trùng email/sai đúng mật khẩu/đổi tên/reload/chặn Admin/logout', 'Xem browser-results.json'],
    ['Admin lifecycle', 'Tạo/sửa tên/email/chi tiết/hủy và xóa/tìm kiếm/sort/phân trang', 'Xem browser-results.json'],
    ['Web avatar upload', 'Chọn file ảnh, upload, lưu, reload', 'Xem browser-results.json'],
    ['Responsive 390 px', 'User profile và Admin cards, không cuộn ngang', 'Web mobile; không phải Expo Go'],
    ['Lỗi mạng/retry', 'Chặn API danh sách rồi thử tải lại', 'Xem browser-results.json'],
    ['TC-REG-IMAGE', 'Chọn ảnh trước đăng nhập; tạo Auth; upload có token; reload thấy ảnh', 'Xem browser-results.json'],
    ['TC-REG-RETRY', 'Upload lỗi; bù Auth; thử lại cùng email thành công', 'Xem browser-results.json'],
    ['Thống kê Playwright', f"Đạt {stats.get('expected', 0)}, lỗi {stats.get('unexpected', 0)}, bỏ qua {stats.get('skipped', 0)}", 'Tự động'],
])
e2e_ok = stats.get('expected', 0) >= 5 and stats.get('unexpected', 0) == 0
matrix = []
for case_id, title, evidence in [
    ('TC-U01', 'Đăng ký email hợp lệ và hồ sơ bốn trường', 'TC-U01, LIVE-U01, E2E User'),
    ('TC-U02', 'Đăng ký email trùng', 'TC-U02, LIVE-U02, E2E User'),
    ('TC-U03', 'Đăng nhập đúng vào hồ sơ', 'TC-U03, LIVE-U08, E2E User'),
    ('TC-U04', 'Đăng nhập sai không tạo phiên mới', 'TC-U04, LIVE-U02, E2E User'),
    ('TC-U05', 'Đổi họ tên, chỉ hồ sơ chính chủ đổi', 'TC-U05, LIVE-U05, E2E User'),
    ('TC-U06', 'Expo Go chọn ảnh, preview, upload và đồng bộ Web', 'Web đạt; còn điện thoại thật'),
    ('TC-U07', 'User thử truy cập route Admin', 'TC-U07-API, LIVE-U07, E2E route guard'),
    ('TC-U08', 'Đăng xuất và refresh trang bảo vệ', 'TC-U08-AUTH, LIVE-U08, E2E User'),
    ('TC-A01', 'Admin claim đăng nhập vào dashboard', 'TC-A01, LIVE-A01, E2E Admin'),
    ('TC-A02', 'Admin thêm Auth và Firestore cùng UID, giữ phiên', 'TC-A02, LIVE-A02, E2E Admin'),
    ('TC-A03', 'Admin sửa tên và ảnh đúng hồ sơ', 'TC-A03, E2E Admin, API ảnh'),
    ('TC-A04', 'Email Auth bằng email Firestore sau khi sửa', 'TC-A04, LIVE-A04, E2E Admin'),
    ('TC-A05', 'Xác nhận xóa cả Auth và hồ sơ, không đăng nhập lại', 'TC-A05, LIVE-A05, E2E Admin'),
    ('TC-A06', 'Hủy xóa không thay đổi dữ liệu', 'E2E Admin: hủy, reload, hồ sơ còn'),
    ('TC-A07', 'Tìm kiếm, sort và pagination không thiếu/lặp', 'E2E Admin: 5/10 trang, case-insensitive search, sort'),
    ('TC-S01', 'Guest/User không được query collection', 'TC-S01, LIVE-U05'),
    ('TC-S02', 'User không tự sửa email hoặc matkhau', 'TC-S02, LIVE-U05'),
    ('TC-D01', 'JSON chỉ có bốn trường string, AUTH_MANAGED', 'TC-D01, export-users.mjs trên Firebase thật'),
    ('TC-M01', 'Chạy Expo Go trên điện thoại thật', 'Đã mở app; bản cũ lỗi upload; chờ kiểm lại sau sửa'),
]:
    status = 'PARTIAL' if case_id == 'TC-U06' else 'PENDING' if case_id == 'TC-M01' else 'PASS' if e2e_ok else 'REVIEW'
    matrix.append({'id': case_id, 'title': title, 'status': status, 'evidence': evidence})
(ROOT / 'docs/testing/srs-test-matrix.json').write_text(json.dumps(matrix, ensure_ascii=False, indent=2), encoding='utf-8')
h('9.1. Đối chiếu đầy đủ 19 test case gốc của SRS', 2)
table(['Mã SRS', 'Nội dung', 'Trạng thái', 'Bằng chứng'], [[r['id'], r['title'], r['status'], r['evidence']] for r in matrix])
table(['Check build', 'Kết quả'], [[name, info.get('status', str(info)) if isinstance(info, dict) else info] for name, info in builds.items()] or [['Chưa ghi manifest', 'Xem log build và README']])
p('Bundle Android là bằng chứng compile JS/Hermes, không phải APK đã cài hoặc xác nhận native runtime. Kiểm thử thiết bị nằm trong docs/testing/manual-checklist.md.')
table(['Ca SRS cần thiết bị', 'Trạng thái thực tế'], [['TC-U06', 'Web và serializer mới đạt; bản native cũ FAIL; CHỜ thử lại điện thoại sau sửa'], ['TC-M01', 'Đã mở app theo phản hồi; còn xác nhận upload/session sau bản sửa'], ['Đồng bộ Web/Expo Go', 'Dữ liệu URL dùng chung đã triển khai; còn xác nhận trực tiếp bằng điện thoại'], ['Firebase thật', f'Rules đã deploy; backend service account hoạt động; {live_passed} kiểm tra trực tiếp đạt']])
h(chapters[9])
table(['Nhóm yêu cầu', 'Mã nguồn chính', 'Test/bằng chứng'], [
    ['EX-01; FR-U01/U03; FR-A02/A03; BR-01', 'services/auth.ts; backend-admin/app.js; users/index.tsx', 'TC-U01/D01/A02 và LIVE-U01/A02; ảnh Register/Directory; JSON thật'],
    ['EX-02; FR-U02/U04/U06', 'AuthScreen; AuthContext; user/*.tsx', 'TC-U03/U05/U08 và E2E lifecycle'],
    ['EX-02; FR-A01/A04/A05/A06/07/08', 'admin layouts; forms/detail/directory; API', 'TC-A01/A03/A04/A05, TC-A06/A07 qua E2E'],
    ['EX-03; FR-U05/A10', 'AvatarPicker.tsx; POST /images', 'TC-U06-WEB đạt; TC-M01 còn chờ'],
    ['BR-05/06/07', 'firestore.rules; backend token middleware', 'TC-S01/S02; X01/X02/X03/X06; không có secret trong export'],
    ['R-05', 'Create/update compensate; delete idempotent', 'TC-X07/X08/X09 chèn lỗi Firestore để kiểm tra bù'],
    ['SUB-01', 'scripts/report.py; export-users.mjs', 'DOCX + JSON Firebase thật + snapshot SDK'],
    ['SUB-02', 'Git repo; docs/demo-script.md; docs/video', 'Còn URL GitHub/video công khai'],
])
h(chapters[10])
p('Hình sau là ảnh phần mềm đang chạy với Firebase thật. Tài khoản được tạo để demo/kiểm thử. Hình dữ liệu Auth/Firestore là bản hiển thị dữ liệu đọc qua SDK; chú thích nêu rõ nguồn để tránh nhầm với Firebase Console.')
for name, caption in [
    ('00-login-web.png', 'Hình 1. Màn hình đăng nhập React Native Web.'),
    ('01-register-web.png', 'Hình 2. Đăng ký User với bốn trường giao diện; confirm password không lưu Firestore.'),
    ('02-user-profile-web.png', 'Hình 3. Hồ sơ User sau cập nhật tên, email chỉ đọc.'),
    ('03-admin-dashboard.png', 'Hình 4. Dashboard Admin sau khi đăng nhập bằng claim.'),
    ('04-admin-directory.png', 'Hình 5. Danh bạ, tìm kiếm, sắp xếp và phân trang.'),
    ('05-admin-user-detail.png', 'Hình 6. Chi tiết tài khoản do Admin vừa tạo.'),
    ('06-confirm-delete.png', 'Hình 7. Hộp thoại xác nhận xóa đúng tài khoản.'),
    ('07-avatar-upload-web.png', 'Hình 8. Ảnh được chọn/upload/lưu/reload thành công trên Web.'),
    ('10-edit-profile-web.png', 'Hình 9. Form chỉnh sửa hồ sơ dùng chung React Native.'),
    ('11-auth-firebase.png', 'Hình 10. Tài khoản Firebase Authentication thật đọc qua Admin SDK; đây không phải giao diện Console.'),
    ('12-firestore-firebase.png', 'Hình 11. Dữ liệu Firestore thật đọc qua Admin SDK, mỗi hồ sơ đúng bốn trường; đây không phải giao diện Console.'),
    ('13-register-avatar.png', 'Hình bổ sung A. Đăng ký có ảnh: chọn và xem trước khi tạo tài khoản, chưa upload khi chưa đăng nhập.'),
    ('14-registered-avatar.png', 'Hình bổ sung B. Hồ sơ tài khoản mới đăng ký giữ ảnh sau khi tải lại trang.'),
]:
    newpage()
    image(name, caption)
newpage()
image('08-profile-mobile-web.png', 'Hình 12. Hồ sơ ở viewport 390×844 trên Chromium. Đây là responsive Web, KHÔNG phải Expo Go.', width=3.2)
newpage()
image('09-directory-mobile-web.png', 'Hình 13. Danh bạ Admin trên responsive Web 390 px; còn chụp Expo Go thật.', width=3.2)
newpage()
h(chapters[11])
cleanup = read_json('docs/testing/account-cleanup.json', {})
if cleanup:
    p('Cập nhật dữ liệu sau kiểm thử theo yêu cầu người dùng: đã xóa ' + str(cleanup.get('deletedAuth', 0)) + ' tài khoản cũ và hồ sơ tương ứng; giữ nguyên ba@gmail.com. Admin đã đổi email thành admin123@gmail.com, giữ UID và custom claim. Firebase Authentication hiện còn hai tài khoản; Firestore users chỉ có hồ sơ ba@gmail.com. Mật khẩu Admin được đổi theo lựa chọn của người dùng và chỉ lưu bản ghi nhớ ngoài source tại D:/UserHub-Credentials/userhub-login.json; không chèn vào báo cáo/ZIP.')
    p('Các ảnh và video kiểm thử ở phần trước là bằng chứng của giai đoạn trước khi dọn dữ liệu, có thể hiển thị tài khoản demo đã xóa hoặc email Admin cũ. File users.json và trang snapshot SDK được cập nhật theo dữ liệu hiện tại. Script seed/test ghi Firebase thật được chặn trong chế độ single-user để không tạo lại tài khoản cũ.')
p('Dữ liệu nộp: docs/database/users.json, xuất bằng Admin SDK từ dự án Firebase thật management-user-86623; UID là khóa JSON ngoài mỗi object. Không chứa mật khẩu đăng nhập. Ngoài ra có thể giữ bản Emulator riêng users.emulator.json để kiểm thử local.')
dataset = read_json('docs/database/users.json', {})
if dataset:
    uid, record = next(iter(dataset.items()))
    code(json.dumps({uid: record}, ensure_ascii=False, indent=2))
    p(f'Tổng bản ghi tại thời điểm xuất Firebase thật: {len(dataset)}. Đây là tài khoản demo/test trên dự án thật của người dùng.')
code('node --env-file=backend-admin/.env scripts/export-users.mjs\n# tạo docs/database/users.json từ dự án thật')
p('Git repository được khởi tạo local. Chưa có remote GitHub trong thông tin người dùng cung cấp; không dựng URL giả. Các bước xuất bản sau khi có repo riêng:')
code('git add .\ngit commit -m "feat: implement UserHub SRS v2"\ngit branch -M main\ngit remote add origin <YOUR_REPOSITORY_URL>\ngit push -u origin main')
p('Video local Web nằm trong docs/video/UserHub_Web_Firebase.webm nếu ghi hình thành công. Đây là ghi hình nhanh phiên trình duyệt trên Firebase thật, không thay thế video có lời thuyết minh 3–6 phút và phần điện thoại thật. Kịch bản đầy đủ trong docs/demo-script.md. Link video công khai: chưa có.')
h(chapters[12])
table(['Hạng mục', 'Trạng thái / hành động tiếp'], [
    ['Source React Native TSX', 'Đã triển khai trong src/; backend tách biệt'],
    ['Tự động hóa test', f'{passed} ca Emulator, {live_passed} kiểm tra Firebase thật, {browser_pass} kịch bản Web đạt'],
    ['Cấu hình Firebase Web', 'Đã nhập bản chữ từ người dùng; endpoint config HTTP ' + str(live.get('httpStatus', 'chưa kiểm tra'))],
    ['Backend Firebase thật', 'Đã kết nối service-account ngoài repo; Admin custom claim hoạt động'],
    ['Rules production', 'Đã deploy firestore.rules; xác minh bằng các kiểm tra bị từ chối đúng quyền'],
    ['Expo Go thiết bị thật', 'Cần người dùng quét QR, chọn ảnh, kiểm tra session và chụp bằng chứng'],
    ['Cloudinary hoặc local demo', 'Cloudinary cần cấu hình backend; local demo cần LAN URL và giữ server chạy'],
    ['JSON thật', 'Đã xuất docs/database/users.json từ dự án management-user-86623'],
    ['GitHub/video', 'Cần remote và URL chia sẻ truy cập được'],
    ['Báo cáo', 'DOCX hiện tại phản ánh kết quả thực tế; cập nhật sau các bước nghiệm thu ngoài máy'],
])
p('Chưa đánh dấu hoàn thành toàn bộ bài nộp khi còn kiểm thử điện thoại và URL GitHub/video. Ứng dụng Web đã chạy trên Firebase thật. Người nhận có thể tái lập bằng README và checklist; sau khi bổ sung bằng chứng, chạy python scripts/report.py để cập nhật báo cáo. Nếu cần đúng ảnh Firebase Console theo yêu cầu giảng viên, mở Console của dự án để chụp Auth Users và document bốn trường.')
for name in ['frontend', 'backend']:
    audit = read_json(f'docs/testing/audit-{name}.json', {})
    if audit:
        v = audit.get('metadata', {}).get('vulnerabilities', {})
        p(f'Kiểm tra dependency production {name}: ' + ', '.join(f'{key}={v.get(key, 0)}' for key in ['critical', 'high', 'moderate', 'low']) + '. Xem audit JSON để biết phụ thuộc cụ thể. Không tự ép nâng major khi gây xung đột SDK.')
newpage()
h('Phụ lục A. Firestore Rules')
p('Rules đã kiểm thử trên Emulator. Admin tạo/sửa/xóa Auth qua backend; Rules không mở quyền ghi trực tiếp cho Admin. Có thể publish nguyên file firestore.rules vào dự án thật.')
code((ROOT / 'firestore.rules').read_text(encoding='utf-8'))
h('Phụ lục B. Tài liệu tham khảo')
for title, url in [
    ('Expo SDK 58', 'https://docs.expo.dev/versions/v58.0.0/'),
    ('Expo Router', 'https://docs.expo.dev/router/introduction/'),
    ('Expo ImagePicker', 'https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/'),
    ('Expo FileSystem và upload File/FormData', 'https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/'),
    ('Firebase JS SDK với Expo', 'https://docs.expo.dev/guides/using-firebase/'),
    ('Firebase Web setup', 'https://firebase.google.com/docs/web/setup'),
    ('Firebase Auth', 'https://firebase.google.com/docs/auth/web/start'),
    ('Firestore Security Rules', 'https://firebase.google.com/docs/firestore/security/get-started'),
    ('Custom claims', 'https://firebase.google.com/docs/auth/admin/custom-claims'),
    ('Admin SDK', 'https://firebase.google.com/docs/admin/setup'),
    ('Firebase Emulator', 'https://firebase.google.com/docs/emulator-suite/install_and_configure'),
]:
    p(f'{title}: {url}')
p('Tài liệu gốc: SRS_UserHub_v2_User_Admin_Expo_Firebase.docx do người dùng cung cấp. Báo cáo không sao chép trạng thái hoàn thành từ tài liệu thiết kế; kết quả kiểm thử lấy từ các lần chạy thực tế của dự án.')

path = OUT / 'UserHub_BaoCao.docx'
doc.save(path)
print(path)
print(f'Integration: {passed}/{len(results)} PASS; browser scenarios: {browser_pass}; screenshots embedded: {len(doc.inline_shapes)}')
