import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { auth, db, emulator } from '../backend-admin/firebase.js';
if (emulator || process.env.FIREBASE_PROJECT_ID !== 'management-product-e97a1') throw Error('Expected the new Management Product Firebase project.');
const folder = 'D:/ManagementProduct-Credentials';
const file = folder + '/admin-login.json';
await mkdir(folder, { recursive: true });
let login;
try { login = JSON.parse(await readFile(file, 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
if (!login) {
  const email = 'admin@management-product.example';
  try { await auth.getUserByEmail(email); throw Error('Existing admin email: supply its credentials locally; no password was reset.'); }
  catch (e) { if (e.code !== 'auth/user-not-found') throw e; }
  login = { projectId: 'management-product-e97a1', adminEmail: email, password: randomBytes(18).toString('base64url') + '!42' };
  await writeFile(file, JSON.stringify(login, null, 2), { flag: 'wx', mode: 0o600 });
}
if (login.projectId !== 'management-product-e97a1') throw Error('Wrong credential project.');
let user;
try { user = await auth.getUserByEmail(login.adminEmail); }
catch (e) {
  if (e.code !== 'auth/user-not-found') throw e;
  user = await auth.createUser({ email: login.adminEmail, password: login.password, displayName: 'Management Product Admin' });
}
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
const samples = [
  ['sample-keyboard', { name: 'Bàn phím cơ', price: 790000, soluong: 12, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=640' }],
  ['sample-headphones', { name: 'Tai nghe không dây', price: 1250000, soluong: 8, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=640' }],
  ['sample-mouse', { name: 'Chuột không dây', price: 350000, soluong: 25, image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=640' }],
];
for (const [id, data] of samples) {
  try { await db.doc(`products/${id}`).create(data); }
  catch (e) { if (e.code !== 6 && e.code !== 'already-exists') throw e; }
}
await mkdir('docs/testing', { recursive: true });
await writeFile('docs/testing/firebase-live-connection.json', JSON.stringify({ projectId: login.projectId, adminEmail: login.adminEmail, uid: user.uid, adminClaim: true, collection: 'products', fields: ['name','price','soluong','image'], checkedAt: new Date().toISOString() }, null, 2));
console.log('Admin and products ready in management-product-e97a1. Private login: ' + file);
