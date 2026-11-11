import { auth, db } from '../backend-admin/firebase.js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const login = JSON.parse(await readFile('D:/ManagementProduct-Credentials/admin-login.json', 'utf8'));
const user = await auth.getUserByEmail(login.adminEmail);
const products = (await db.collection('products').get()).docs.map(d => ({ documentId: d.id, fields: d.data() }));
const evidence = { projectId: 'management-product-e97a1', capturedAt: new Date().toISOString(), source: 'Firebase Admin SDK live read', authentication: { uid: user.uid, email: user.email, admin: user.customClaims?.admin === true }, firestore: { collection: 'products', products } };
await mkdir('docs/database', { recursive: true }); await mkdir('docs/screenshots', { recursive: true });
await writeFile('docs/database/firebase-evidence.json', JSON.stringify(evidence, null, 2));
const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Management Product — Firebase evidence</title><style>body{font:16px Arial;margin:48px;background:#f3f6f4;color:#173539}h1{font-size:34px}pre{background:white;padding:24px;border-radius:16px;white-space:pre-wrap;line-height:1.6;border:1px solid #ccd8d0}p{line-height:1.6}</style><h1>Management Product / Dữ liệu Firebase</h1><p>Bản chụp dữ liệu thực đọc bằng Firebase Admin SDK. Đây là trang minh chứng của dự án, không phải giao diện Firebase Console.<br>Project: management-product-e97a1 • ${escape(evidence.capturedAt)}</p><h2>Firebase Authentication — tài khoản admin</h2><pre>${escape(JSON.stringify(evidence.authentication,null,2))}</pre><h2>Firestore — collection products</h2><pre>${escape(JSON.stringify(products,null,2))}</pre></html>`;
await writeFile('docs/database/firebase-evidence.html', html);
const browser = await chromium.launch();
try { const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } }); await page.setContent(html); await page.screenshot({ path: 'docs/screenshots/07-firebase-data.png', fullPage: true }); } finally { await browser.close(); }
console.log('Captured live Firebase Auth and products evidence.');
