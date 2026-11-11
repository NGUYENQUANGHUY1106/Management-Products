"""Create the concise submission report: steps, commands, screenshots and JSON."""
from pathlib import Path
import json
import subprocess
from html import escape
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/report'
OUT.mkdir(parents=True, exist_ok=True)
target = OUT / 'ManagementProduct_BaoCao.docx'
student = 'Nguyễn Quang Huy_23IT.B080'
if target.exists():
    for paragraph in Document(target).paragraphs[:5]:
        if '23IT.B080' in paragraph.text:
            student = paragraph.text.strip()
            break

# Show only the four exported product fields, without Authentication details.
products = json.loads((ROOT / 'docs/database/products.json').read_text(encoding='utf-8-sig'))
assert isinstance(products, list) and products, 'The product JSON must contain data.'
assert all(set(item) == {'name', 'price', 'soluong', 'image'} for item in products)
rows = ''.join('<tr>' + ''.join(f'<td>{escape(str(item[field]))}</td>' for field in ['name', 'price', 'soluong', 'image']) + '</tr>' for item in products)
html = '''<!doctype html><html lang="vi"><meta charset="utf-8"><title>CSDL products</title>
<style>body{font:17px Arial;color:#142740;margin:32px;background:#fff}h1{font-size:25px;margin:0 0 12px}p{color:#536173;line-height:1.5}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #d7dee7;padding:14px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#e9f2f1;color:#006c63}th:nth-child(1){width:20%}th:nth-child(2){width:12%}th:nth-child(3){width:9%}td:last-child{font:14px/1.5 Consolas,monospace}.note{font-size:14px}</style>
<h1>CƠ SỞ DỮ LIỆU FIRESTORE — COLLECTION products</h1>
<p>Dự án: management-product-e97a1 · Bốn trường: name, price, soluong, image</p>
<table><thead><tr><th>name (string)</th><th>price (number)</th><th>soluong (integer)</th><th>image (string)</th></tr></thead><tbody>''' + rows + '''</tbody></table>
<p class="note">Nguồn: docs/database/products.json — dữ liệu Firestore đã xuất. Đây là ảnh minh chứng dữ liệu, không phải giao diện Firebase Console.</p></html>'''
html_path = ROOT / 'docs/database/products-report.html'
png_path = ROOT / 'docs/screenshots/13-products-database.png'
html_path.write_text(html, encoding='utf-8')
subprocess.run(['node', '--input-type=module', '-e', '''
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 620 } });
  await page.setContent(await readFile(process.argv[1], 'utf8'));
  await page.screenshot({ path: process.argv[2], fullPage: true });
} finally { await browser.close(); }
''', str(html_path), str(png_path)], cwd=ROOT, check=True)

doc = Document()
section = doc.sections[0]
section.orientation = WD_ORIENT.LANDSCAPE
section.page_width, section.page_height = Inches(11.69), Inches(8.27)
section.top_margin = section.bottom_margin = Inches(.48)
section.left_margin = section.right_margin = Inches(.65)
normal = doc.styles['Normal']
normal.font.name, normal.font.size = 'Times New Roman', Pt(11)
normal.paragraph_format.line_spacing = 1.05
normal.paragraph_format.space_after = Pt(4)
for name in ['Title', 'Heading 1', 'Heading 2']:
    doc.styles[name].font.name = 'Arial'
    doc.styles[name].font.color.rgb = RGBColor.from_string('142740')
doc.styles['Title'].font.size = Pt(19)
doc.styles['Heading 1'].font.size = Pt(15)
doc.styles['Heading 2'].font.size = Pt(12)
footer = section.footer.paragraphs[0]
footer.alignment = 2
footer.add_run('Management Product | ')
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)

def p(text, style=None): return doc.add_paragraph(text, style)
def page(title): doc.add_page_break(); doc.add_heading(title, 1)
def code(text):
    run = p(text).runs[0]
    run.font.name, run.font.size = 'Consolas', Pt(9)
def picture(container, name, caption, max_width=10.2, max_height=5.1, crop=(0, 0, 0, 0)):
    path = ROOT / 'docs/screenshots' / name
    left, top, right, bottom = crop
    assert 0 <= left + right < 1 and 0 <= top + bottom < 1
    with Image.open(path) as im: width, height = im.size
    visible_width, visible_height = width * (1-left-right), height * (1-top-bottom)
    scale = min(max_width / visible_width, max_height / visible_height)
    paragraph = container.add_paragraph(); paragraph.alignment = 1
    shape = paragraph.add_run().add_picture(str(path), width=Inches(visible_width*scale), height=Inches(visible_height*scale))
    if any(crop):
        rect = OxmlElement('a:srcRect')
        for key, value in zip(['l', 't', 'r', 'b'], crop): rect.set(key, str(round(value*100000)))
        shape._inline.graphic.graphicData.pic.blipFill.insert(1, rect)
    caption_paragraph = container.add_paragraph(caption)
    caption_paragraph.alignment = 1
    for run in caption_paragraph.runs: run.font.size = Pt(9); run.italic = True

p('BÁO CÁO GIỮA KỲ', 'Title')
p(student)
p('Ứng dụng quản lý sản phẩm — phân hệ admin')
doc.add_heading('1. Cài đặt và chạy dự án', 1)
p('Bước 1. Cài thư viện React Native/Expo, Firebase và backend theo package-lock.json:')
code('npm.cmd ci\nnpm.cmd ci --prefix backend-admin\nnpx.cmd expo install --check')
p('Các thư viện liên quan: firebase, expo-router, expo-image-picker, expo-file-system; backend dùng firebase-admin, express, multer và sharp. Lệnh cài module Expo khi cần:')
code('npx.cmd expo install expo-image-picker expo-file-system @react-native-async-storage/async-storage')
p('Bước 2. Mở Firebase project management-product-e97a1, bật Authentication Email/Password và Firestore. Tạo collection products chỉ có name, price, soluong, image. Sao chép .env.example và backend-admin/.env.example thành các file .env tương ứng, điền cấu hình dự án và thông tin xác thực backend.')
code('npx.cmd firebase login\nnode scripts/local-adc.cjs\nnpm.cmd run setup:live\nnpx.cmd firebase deploy --only auth,firestore:rules --project management-product-e97a1')
p('Bước 3. Chạy backend và ứng dụng:')
code('npm.cmd run start:local')
p('Web: mở http://localhost:8081. Điện thoại cùng Wi-Fi: mở địa chỉ exp://IP-MAY-TINH:8081 được in trong terminal bằng Expo Go. Đăng nhập tài khoản admin để thao tác.')

page('2. Đăng nhập và hiển thị sản phẩm')
p('Bước 4. Nhập email/mật khẩu admin, bấm Đăng nhập. Ứng dụng mở danh sách sản phẩm lấy từ Firestore, hiển thị tên, giá, số lượng và hình ảnh.')
picture(doc, '01-products-web.png', 'Hình 1. Danh sách sản phẩm của phân hệ admin.', max_height=5.55, crop=(0, 0, 0, .16))

page('3. Thêm và sửa sản phẩm')
table = doc.add_table(rows=1, cols=2)
for cell, heading, text, image, caption in [
    (table.cell(0,0), 'Bước 5. Thêm sản phẩm', 'Bấm Thêm sản phẩm; nhập tên, giá và số lượng; chọn ảnh hoặc dán URL. Bấm Thêm sản phẩm để lưu vào Firestore.', '02-create-product-web.png', 'Hình 2. Nhập sản phẩm và chọn hình ảnh.'),
    (table.cell(0,1), 'Bước 6. Sửa sản phẩm', 'Bấm Chỉnh sửa tại sản phẩm; cập nhật tên, giá, số lượng hoặc ảnh. Bấm Lưu thay đổi để cập nhật Firestore.', '03-edit-product-web.png', 'Hình 3. Chỉnh sửa thông tin sản phẩm.')]:
    cell.add_paragraph(heading, 'Heading 2'); cell.add_paragraph(text)
    picture(cell, image, caption, max_width=4.6, max_height=4.85, crop=(.30, .14, .30, .14))

page('4. Xóa sản phẩm và nhập ảnh trên di động')
table = doc.add_table(rows=1, cols=2)
left, right = table.rows[0].cells
left.add_paragraph('Bước 7. Xóa sản phẩm', 'Heading 2')
left.add_paragraph('Bấm Xóa; kiểm tra tên và ảnh trong hộp thoại; bấm Xác nhận xóa để xóa document khỏi Firestore. Bấm Hủy nếu không xóa.')
picture(left, '06-delete-product.png', 'Hình 4. Xác nhận xóa sản phẩm.', max_width=4.6, max_height=4.6, crop=(.33, .27, .33, .25))
right.add_paragraph('Bước 8. Chọn và hiển thị ảnh', 'Heading 2')
right.add_paragraph('Mở form trên thiết bị, chọn ảnh, lưu sản phẩm và kiểm tra ảnh trong danh sách. Ảnh được tải lên backend; Firestore lưu URL tại image.')
picture(right, '05-image-mobile-web.png', 'Hình 5. Giao diện nhập ảnh ở kích thước điện thoại (mobile web).', max_width=4.6, max_height=4.6)

page('5. Ảnh cơ sở dữ liệu và file JSON nộp kèm')
p('Bước 9. Kiểm tra collection products: name (string), price (number), soluong (integer), image (string URL). Mỗi sản phẩm chỉ có đúng bốn trường.')
picture(doc, '13-products-database.png', 'Hình 6. Dữ liệu products từ file xuất Firestore, trình bày đủ bốn trường.', max_height=4.5)
p('Bước 10. Xuất dữ liệu cơ sở dữ liệu:')
code('npm.cmd run export:products')
p('File nộp kèm: docs/database/products.json. File là mảng JSON; mỗi phần tử gồm name, price, soluong, image. Nộp file JSON cùng báo cáo này.')
assert len(doc.inline_shapes) == 6
doc.save(target)
print(target)
