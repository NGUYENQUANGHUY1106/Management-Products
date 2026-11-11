"""Build the updated Vietnamese report using current product evidence only."""
from pathlib import Path
import json
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/report'
OUT.mkdir(parents=True, exist_ok=True)
doc = Document()
section = doc.sections[0]
section.page_width, section.page_height = Inches(8.27), Inches(11.69)
section.top_margin = section.bottom_margin = Inches(.7)
section.left_margin, section.right_margin = Inches(.85), Inches(.7)
normal = doc.styles['Normal']
normal.font.name, normal.font.size = 'Times New Roman', Pt(12)
normal.paragraph_format.line_spacing = 1.12
normal.paragraph_format.space_after = Pt(6)
for name in ['Title', 'Subtitle', 'Heading 1', 'Heading 2']:
    doc.styles[name].font.name = 'Arial'
    doc.styles[name].font.color.rgb = RGBColor.from_string('173539')
section.header.paragraphs[0].text = 'MANAGEMENT PRODUCT  |  QUẢN LÝ SẢN PHẨM — PHÂN HỆ ADMIN'
footer = section.footer.paragraphs[0]
footer.alignment = 2
footer.add_run('Management Product | Trang ')
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)

def p(text='', style=None): return doc.add_paragraph(text, style)
def h(text, level=1): doc.add_heading(text, level)
def page(title): doc.add_page_break(); h(title)
def table(headers, rows):
    t = doc.add_table(rows=1, cols=len(headers)); t.style = 'Light Shading Accent 1'
    for cell, text in zip(t.rows[0].cells, headers): cell.text = str(text)
    for row in rows:
        for cell, text in zip(t.add_row().cells, row): cell.text = str(text)
    for row in t.rows:
        for cell in row.cells:
            for para in cell.paragraphs:
                for run in para.runs: run.font.size = Pt(10)
    p()
def code(text):
    run = p().add_run(text); run.font.name = 'Consolas'; run.font.size = Pt(9)
def screenshot(name, caption, max_height=6.6):
    path = ROOT / 'docs/screenshots' / name
    if not path.exists(): p('Chưa có minh chứng: ' + caption); return
    with Image.open(path) as im: width, height = im.size
    scale = min(6.3 / width, max_height / height)
    doc.add_picture(str(path), width=Inches(width * scale), height=Inches(height * scale))
    p(caption, 'Caption')
def read(name, fallback):
    path = ROOT / name
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else fallback

p('BÁO CÁO THỰC HÀNH', 'Subtitle')
p('MANAGEMENT\nPRODUCT', 'Title')
p('Ứng dụng quản lý sản phẩm\nChỉ triển khai phân hệ quản trị viên', 'Subtitle')
p('Công nghệ: React Native • Expo SDK 58 • Firebase Authentication • Cloud Firestore')
p('Dự án Firebase: management-product-e97a1')
p('Sinh viên: Nguyễn Quang Huy')
p('Ngày cập nhật: 11/11/2026 (giờ Việt Nam)')
p('Phạm vi: đăng nhập admin; nhập, hiển thị, sửa, xóa sản phẩm; chọn và hiển thị ảnh; chạy web và hỗ trợ ứng dụng di động.')
p('Dữ liệu sản phẩm chỉ gồm: name, price, soluong, image.')
p('Báo cáo trình bày triển khai Management Product, gồm mã nguồn, cơ sở dữ liệu, kết quả kiểm thử, hình minh họa và video quản lý sản phẩm.')

page('1. Yêu cầu đề bài và phạm vi thực hiện')
table(['Yêu cầu', 'Triển khai / minh chứng'], [
    ['React Native, Flutter hoặc .NET MAUI', 'Giữ React Native và Expo Router từ mã nguồn hiện có.'],
    ['Nhập và hiển thị trên web (8 điểm)', 'Firestore products, form thêm và danh sách hiển thị đủ bốn trường.'],
    ['Đăng nhập, xóa, sửa; nâng cao (1,5 điểm)', 'Firebase Auth, custom claim admin, sửa và xác nhận xóa; tìm kiếm, sắp xếp, thống kê tính toán.'],
    ['Nhập ảnh và hiển thị trên di động (0,5 điểm)', 'expo-image-picker, backend ảnh, Image; đã kiểm tra mobile web và export Android, cần xác minh thiết bị thật.'],
    ['Không thêm trường dữ liệu', 'Rules hasOnly + hasAll; id chỉ lấy từ metadata document.'],
    ['Báo cáo, hình ảnh, lệnh cài thư viện, CSDL JSON', 'DOCX này, docs/screenshots, README và docs/database/products.json.'],
    ['Link GitHub và video demo', 'GitHub: NGUYENQUANGHUY1106/Management-Products; video đính kèm trong docs/video của repository. Chưa tải lên nền tảng video riêng.']])
p('Hệ thống dành cho quản trị viên, với các chức năng đăng nhập, phân quyền, thêm, xem, sửa, xóa sản phẩm, chọn ảnh và lọc theo khoảng giá.')
h('1.1. Thông tin ứng dụng', 2)
p('Tên ứng dụng: Management Product, phiên bản 3.0.0. Dữ liệu sản phẩm lưu tại collection products của dự án Firebase management-product-e97a1. Web và ứng dụng di động dùng cùng dự án Firebase và cùng bộ chức năng quản trị.')

page('2. Kiến trúc và tổ chức mã nguồn')
p('Web / Android / iOS dùng chung giao diện React Native. Expo Router điều hướng về /login hoặc /admin/products. Firebase Authentication cấp ID token; custom claim admin xác nhận quyền. Firestore nhận thao tác CRUD trực tiếp từ Firebase client SDK và kiểm tra quyền bằng Security Rules. Backend Node/Express xử lý ảnh và cấp/thu hồi quyền có xác thực admin.')
table(['Thành phần', 'File / trách nhiệm'], [
    ['Đăng nhập', 'src/app/login.tsx — email/mật khẩu, chặn tài khoản thiếu claim.'],
    ['Phiên và phân quyền', 'src/contexts/AuthContext.tsx; src/app/admin/_layout.tsx.'],
    ['Danh sách, tìm, sắp xếp, xóa', 'src/app/admin/products.tsx — onSnapshot theo thời gian thực.'],
    ['Form thêm/sửa và chọn ảnh', 'src/components/ProductForm.tsx.'],
    ['Dữ liệu và kiểm tra', 'src/types/product.ts; src/services/products.ts.'],
    ['Kết nối Firebase', 'src/config/firebase.ts; firebase.native.ts.'],
    ['API ảnh', 'backend-admin/app.js; src/services/image.ts và image.native.ts.'],
    ['Bảo vệ dữ liệu', 'firestore.rules; firebase.json; .firebaserc.'],
    ['Tạo admin / xuất JSON', 'scripts/setup-live.mjs; scripts/export-products.mjs.'],
    ['Kiểm thử và báo cáo', 'tests/e2e/products.spec.ts; scripts/verify-live.mjs; scripts/verify-permissions.mjs; scripts/report.py.']])
p('Không có mật khẩu hoặc service account trong mã nguồn frontend hay báo cáo. Các file .env và thông tin đăng nhập riêng đã được loại khỏi gói mã nguồn.')

page('3. Thiết kế cơ sở dữ liệu đúng đề')
p('Cloud Firestore, database (default), collection products. Mỗi document biểu diễn một sản phẩm và chỉ có đúng bốn trường. Document ID không phải trường dữ liệu.')
table(['Trường', 'Kiểu', 'Ràng buộc / ý nghĩa'], [
    ['name', 'string', 'Tên sản phẩm, 1–150 ký tự; không chỉ khoảng trắng.'],
    ['price', 'number', 'Giá VNĐ, từ 0 đến 1.000.000.000.000.'],
    ['soluong', 'integer', 'Số lượng, từ 0 đến 1.000.000.000.'],
    ['image', 'string', 'URL ảnh HTTP/HTTPS, tối đa 2.048 ký tự.']])
code(json.dumps({'name':'Bàn phím cơ','price':790000,'soluong':12,'image':'https://example.com/product.jpg'}, ensure_ascii=False, indent=2))
p('Không ghi id, uid, email, role, category, description hoặc thời gian tạo vào sản phẩm. Số sản phẩm, tổng số lượng và giá trị kho được tính trên ứng dụng, không thêm trường mới.')
h('3.1. Admin nằm trong Firebase Authentication', 2)
connection = read('docs/testing/firebase-live-connection.json', {})
p('Email admin: ' + connection.get('adminEmail', 'Xem file đăng nhập riêng.'))
p('Custom claim: admin = true. Tài khoản quản trị và mật khẩu được Firebase Authentication quản lý. Firestore lưu dữ liệu sản phẩm với đúng bốn trường theo đề bài.')
h('3.2. File cơ sở dữ liệu nộp kèm', 2)
p('docs/database/products.json là mảng JSON xuất từ Firestore thật. Mỗi phần tử giữ đúng bốn trường. Có thể đọc file và dùng addDoc để nạp vào collection products; đây là file dữ liệu ứng dụng, không phải định dạng backup nhị phân của dịch vụ gcloud export.')
code('npm run export:products')

page('4. Cài đặt thư viện và môi trường')
table(['Nhóm', 'Phiên bản theo package.json'], [
    ['Runtime', 'Node.js >=22.13; React 19.3.0; React Native 0.88.1.'],
    ['Expo', 'expo ~58.0.23; expo-router ~58.0.30; expo-image-picker ~58.0.10.'],
    ['Firebase', 'Client SDK 12.19.0; backend firebase-admin ^14.5.0.'],
    ['Ảnh / API', 'Express ^5.1.0; multer ^2.0.2; sharp ^0.35.5; cors; express-rate-limit.'],
    ['Kiểm thử', 'TypeScript ~6.0.3, ESLint, Playwright ^1.65.0.'],
    ['Báo cáo', 'Python 3, python-docx 1.2.0, Pillow >=11.3.0.']])
p('Bước 1. Cài dependencies theo lockfile:')
code('npm ci\nnpm ci --prefix backend-admin\nnpx expo install --check')
p('Khi cần cài lại các module Expo, dùng bộ cài tương thích SDK:')
code('npx expo install expo-image-picker expo-file-system @react-native-async-storage/async-storage')
p('Bước 2. Sao chép .env.example sang .env và backend-admin/.env.example sang backend-admin/.env. Firebase web config thuộc dự án management-product-e97a1. Backend sử dụng service account hoặc ADC có quyền trên chính dự án đó.')
p('Bước 3. Với tài khoản Firebase CLI đã đăng nhập:')
code('npx firebase login\nnode scripts/local-adc.cjs\nnpx firebase deploy --only auth,firestore:rules --project management-product-e97a1\nnode scripts/configure-product.cjs\nnpm run setup:live')
p('setup:live tạo admin và sản phẩm mẫu nếu chưa có; không ghi đè sản phẩm cũ. Email/mật khẩu riêng nằm ở D:/ManagementProduct-Credentials/admin-login.json trên máy bàn giao. Không đóng gói file này vào source hoặc báo cáo.')
p('PowerShell có thể chặn npm.ps1/npx.ps1: dùng npm.cmd và npx.cmd cho các lệnh tương ứng. Bộ rules emulator cần Java 21 trở lên.')

page('5. Kết nối Firebase mới và bảo vệ dữ liệu')
p('Đã đăng ký web app Management Product Admin trong dự án management-product-e97a1, bật email/password Authentication, tạo tài khoản admin và cấp claim admin=true. Backend và frontend cùng sử dụng project mới. .firebaserc mặc định trỏ sang dự án mới; dự án emulator riêng là demo-management-product.')
h('5.1. Các lớp kiểm soát', 2)
p('Giao diện admin chỉ mount khi phiên đã tải xong và token có quyền admin. Khi đăng nhập bằng tài khoản không có quyền, ứng dụng đăng xuất và báo lỗi. Route guard chuyển người chưa được phép về màn hình đăng nhập.')
p('Security Rules kiểm tra claim cho đọc, thêm, sửa, xóa. Khi thêm/sửa, rules yêu cầu có đủ và chỉ có name, price, soluong, image, đồng thời kiểm tra kiểu, miền giá trị và URL ảnh. Các collection khác mặc định bị chặn.')
code("d.keys().hasAll(['name','price','soluong','image'])\n&& d.keys().hasOnly(['name','price','soluong','image'])\n// allow create, update: if admin() && validProduct();")
p('API /images xác thực Firebase ID token và claim admin, giới hạn tốc độ, dung lượng ảnh 5 MB và kiểm tra nội dung ảnh. API /admin/roles kiểm tra quyền quản trị hiện tại trước khi cấp hoặc thu hồi quyền. Security Rules bảo vệ thao tác đọc và ghi sản phẩm trực tiếp.')
h('5.2. Lưu trữ ảnh', 2)
p('Chọn ảnh bằng expo-image-picker; gửi ảnh tới backend để kiểm tra, đổi JPEG và nhận URL. Ở chế độ chạy tại máy, ảnh nằm trong backend-admin/uploads; Firestore chỉ lưu URL ở image. Có hỗ trợ Cloudinary qua biến môi trường để dùng URL công khai khi triển khai. Backend phải đang chạy để hiển thị ảnh cục bộ.')
p('Trên điện thoại, dùng cùng Wi-Fi và IP LAN của máy chạy backend, không dùng localhost của điện thoại. Script khởi động tự cập nhật IP. Nếu dùng bản web đã export, cần build lại khi thay IP.')

page('5.3. Cấp và thu hồi quyền admin')
p('Tài khoản quản trị chính đã được chuyển sang nguyenquanghuy110605@gmail.com, UID ej1v0UNUKogn81JLB9c90Tkn9GA3. Mật khẩu chỉ lưu trong file đăng nhập riêng, không ghi trong báo cáo hoặc mã nguồn.')
p('Tạo tài khoản mới tại Firebase Console → Authentication → Users → Add user. Sau đó đăng nhập ứng dụng bằng admin hiện có, mở Cài đặt hệ thống → Phân quyền admin, nhập email hoặc UID, bấm Cấp quyền admin và xác nhận. Người nhận cần đăng xuất rồi đăng nhập lại. Console Authentication không có nút chỉnh custom claim admin trực tiếp.')
p('Thu hồi quyền bằng cùng giao diện. Backend kiểm tra claim admin hiện tại, chặn tài khoản thường tự nâng quyền và chặn tự thu hồi quyền đang sử dụng. Khi thu hồi, xóa riêng claim admin, giữ các claim khác và thu hồi refresh token. ID token Firestore đã phát có thể còn hiệu lực đến khi hết hạn, tối đa khoảng một giờ.')
code('npm run admin:role -- email@example.com grant\nnpm run admin:role -- UID revoke')
screenshot('08-admin-roles.png', 'Hình bổ sung. Phân quyền admin bằng email hoặc UID.', 5.5)

page('6. Giao diện đăng nhập admin')
p('Mở ứng dụng, nhập email/mật khẩu admin, bấm Đăng nhập. Không có đăng ký hoặc điều hướng sang phân hệ user. Màn hình hiển thị trạng thái chờ và lỗi đăng nhập; mật khẩu có thể ẩn/hiện.')
screenshot('00-login-web.png', 'Hình 1. Màn hình đăng nhập Management Product.')

page('7. Hiển thị và tìm kiếm sản phẩm')
p('Giao diện có sidebar Kho Hàng, khu vực danh sách dạng bảng, thanh tìm kiếm và sắp xếp mặc định/tên/giá tăng/giá giảm. Bảng hiển thị hình ảnh, tên, giá VNĐ, số lượng và thao tác. onSnapshot nhận thay đổi Firestore theo thời gian thực. Trên điện thoại, sidebar chuyển thành thanh điều hướng và sản phẩm hiển thị theo thẻ để tránh tràn ngang.')
screenshot('01-products-web.png', 'Hình 2. Danh sách sản phẩm trên web.')
page('7.1. Lọc theo khoảng giá sản phẩm')
p('Nhập Giá từ và Giá đến (VNĐ), bấm Áp dụng. Hai biên đều được bao gồm; có thể để trống một đầu để lọc từ mức giá tối thiểu hoặc đến mức giá tối đa. Xóa bộ lọc đưa điều kiện giá về rỗng, giữ nguyên tìm kiếm/sắp xếp. Giá âm, sai kiểu hoặc Giá từ lớn hơn Giá đến được báo lỗi; ứng dụng giữ bộ lọc hợp lệ trước đó.')
p('Ví dụ: khoảng 300000–800000 hiển thị sản phẩm có giá từ 300.000 đến 800.000 VNĐ. Lọc kết hợp với tên tìm kiếm, sắp xếp và dữ liệu cập nhật thời gian thực. Không thêm trường hoặc collection Firestore.')
screenshot('09-price-filter.png', 'Hình 2a. Lọc theo khoảng giá, gồm cả hai đầu khoảng.')

page('8. Thêm và sửa sản phẩm')
p('Bấm Thêm sản phẩm để mở popup, nhập tên, giá, số lượng và chọn ảnh hoặc URL. Khung xem trước có thể gỡ hoặc thay ảnh. Kiểm tra dữ liệu trước khi ghi Firestore; chỉ bốn trường được gửi đi. Bấm Thêm sản phẩm trong popup và chờ thông báo thành công trước khi tải lại trang.')
screenshot('02-create-product-web.png', 'Hình 3. Form thêm sản phẩm và ảnh đã tải lên.', 5.7)
p('Chỉnh sửa mở popup nạp dữ liệu sản phẩm; đổi tên, giá, số lượng hoặc ảnh rồi bấm Lưu thay đổi. Nút Hủy hoặc đóng biểu mẫu không ghi dữ liệu. Trong lúc tải ảnh hoặc lưu, các nút được khóa để tránh gửi lặp.')
doc.add_page_break()
h('8.1. Minh họa cập nhật sản phẩm')
screenshot('03-edit-product-web.png', 'Hình 4. Chỉnh sửa giá và số lượng sản phẩm.', 7.0)

page('9. Xóa sản phẩm và đăng xuất')
p('Bấm Xóa tại sản phẩm tương ứng để mở popup xác nhận trên nền làm mờ. Popup hiển thị rõ tên, ảnh, giá và số lượng. Hủy giữ nguyên dữ liệu; Xác nhận xóa gọi deleteDoc. Lỗi thao tác hiển thị ngay trong popup.')
screenshot('06-delete-product.png', 'Hình 5. Xác nhận xóa sản phẩm.', 6.2)
p('Đăng xuất gọi Firebase signOut, route guard chuyển về đăng nhập. Truy cập lại /admin/products sau đăng xuất không xem được dữ liệu.')

page('10. Hiển thị và chọn ảnh trên màn hình di động')
p('Bố cục React Native tự xuống dòng ở chiều rộng nhỏ. Đã kiểm tra bằng Chromium viewport 390 × 844: hiển thị danh sách và chọn ảnh trong form. Hai hình dưới là mobile web, không phải ảnh chụp thiết bị Android/iOS thật.')
screenshot('04-products-mobile-web.png', 'Hình 6. Danh sách ở kích thước màn hình điện thoại.', 6.8)
doc.add_page_break()
h('10.1. Form chọn ảnh trên mobile web')
screenshot('05-image-mobile-web.png', 'Hình 7. Chọn và tải ảnh ở kích thước điện thoại.', 6.8)
p('Đã export bundle Android bằng Expo thành công. Chưa chạy kiểm thử trên điện thoại thật; cần bổ sung phần quay thao tác chọn ảnh trên Expo Go/Android để xác nhận đầy đủ yêu cầu di động của đề.')

page('11. Minh chứng Firebase thật')
p('Ảnh sau được dựng từ dữ liệu đọc thực qua Firebase Admin SDK. Trang minh chứng ghi rõ nguồn, thời điểm, project ID, tài khoản admin và document products; không phải ảnh Firebase Console. Có thể đối chiếu trực tiếp tại console bằng đường dẫn trong phần 13.')
screenshot('07-firebase-data.png', 'Hình 8. Bản chụp dữ liệu Auth và Firestore thật từ dự án mới.', 7.3)

page('12. Kiểm thử và kết quả thực tế')
live = read('docs/testing/live-results.json', {'results': []})
permissions = read('docs/testing/permissions-results.json', {'results': []})
roles = read('docs/testing/admin-roles-results.json', {'results': []})
rows = [(r['name'], r['status']) for r in live['results'] + permissions['results'] + roles['results']]
table(['Kịch bản kiểm thử Firebase / API', 'Kết quả'], rows)
browser = read('docs/testing/browser-results.json', {})
stats = browser.get('stats', {})
p(f"Playwright: {stats.get('expected', 0)} kịch bản đạt; {stats.get('unexpected', 0)} kịch bản lỗi. Kịch bản bao gồm đăng nhập, ảnh, kiểm tra giá âm, thêm, tải lại trang, tìm, sửa, chọn ảnh mobile web, hủy xóa, xóa, đăng xuất và route guard.")
p('Bổ sung đã kiểm tra khoảng giá gồm hai đầu, khoảng mở, khoảng rỗng, điều kiện sai, xóa lọc, kết hợp tìm kiếm/sắp xếp; kiểm tra ảnh upload localhost cũ được hiển thị qua IP LAN hiện tại. Bố cục 820px và 390px không tràn ngang. Popup thêm/sửa/xóa có thể hủy mà không thay đổi dữ liệu.')
build = read('docs/testing/build-results.json', {})
table(['Kiểm tra mã nguồn / build', 'Trạng thái'], [(k, v) for k, v in build.items() if k != 'checkedAt'])
p('Bộ rules emulator chưa chạy do môi trường Java hiện tại chưa đủ yêu cầu Java 21. Các quyền admin, khách, tài khoản không có claim và schema đã được kiểm tra trực tiếp với dự án Firebase mới. Tài khoản tạm và sản phẩm kiểm thử được dọn sau kiểm thử; ba sản phẩm mẫu được giữ lại.')
p('Video demo được ghi từ lần Playwright đạt. Kết quả và ảnh chỉ phản ánh các kiểm thử nêu trên; export Android không thay thế kiểm thử trên thiết bị thật.')

page('13. Chạy demo và danh sách tệp nộp')
code('npm run start:local\n# Hoặc mở start-management-product.cmd\n# Web: http://localhost:8081\n# Bản build xem trước: http://localhost:8082')
p('Expo Go: cài phiên bản tương thích SDK 58, điện thoại và máy tính cùng Wi-Fi, quét QR trong terminal. Backend ảnh cổng 3001 phải chạy đồng thời. Địa chỉ Expo hiện tại là exp://172.26.100.127:8081; khi đổi mạng dùng QR mới. Nếu iPhone yêu cầu tài khoản Expo, đăng nhập cùng tài khoản trên máy tính và Expo Go. Hướng dẫn chi tiết: docs/run-project.md.')
p('Đăng nhập bằng file tài khoản riêng. Khi chạy từ máy khác, cài dependencies, tạo .env, cấu hình ADC/service account và tạo/cấp quyền admin phù hợp. Không phát hành thông tin đăng nhập lên GitHub.')
table(['Nội dung', 'Đường dẫn / trạng thái'], [
    ['Báo cáo mới', 'docs/report/ManagementProduct_BaoCao.docx'],
    ['CSDL JSON', 'docs/database/products.json'],
    ['Minh chứng dữ liệu thật', 'docs/database/firebase-evidence.json; docs/screenshots/07-firebase-data.png'],
    ['Ảnh minh họa thao tác', 'docs/screenshots/00–07'],
    ['Video demo web', 'docs/video/ManagementProduct_Demo.webm (tệp cục bộ)'],
    ['Kết quả kiểm thử', 'docs/testing/*.json'],
    ['Mã nguồn', 'Thư mục dự án và ManagementProduct_Submission.zip sau khi chạy script đóng gói.'],
    ['GitHub source code', 'https://github.com/NGUYENQUANGHUY1106/Management-Products'],
    ['Link video demo', 'https://github.com/NGUYENQUANGHUY1106/Management-Products/blob/main/docs/video/ManagementProduct_Demo.webm (tệp đính kèm; chưa tải lên nền tảng video riêng).']])
h('13.1. Đối chiếu Firebase Console', 2)
p('Firestore: https://console.firebase.google.com/project/management-product-e97a1/firestore/databases/-default-/data')
p('Authentication: https://console.firebase.google.com/project/management-product-e97a1/authentication/users')
h('13.2. Tài liệu tham khảo chính thức', 2)
for url in ['https://docs.expo.dev/versions/v58.0.0/', 'https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/', 'https://firebase.google.com/docs/firestore/security/rules-fields', 'https://firebase.google.com/docs/auth/admin/custom-claims']:
    p(url)

target = OUT / 'ManagementProduct_BaoCao.docx'
doc.save(target)
print(target)
