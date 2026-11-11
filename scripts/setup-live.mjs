import { randomBytes } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { auth, db, emulator } from '../backend-admin/firebase.js';
if (emulator) throw Error('This script configures the real project; use seed-emulator for demo.');
const folder = 'D:/UserHub-Credentials'; const file = folder + '/userhub-login.json';
await mkdir(folder, { recursive: true });
let credentials;
try { credentials = JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
if (credentials?.liveDataMode === 'single-user') throw Error('Live demo seeding is disabled after cleanup. Use seed-emulator.mjs.');
if (!credentials) {
  credentials = { adminEmail: 'admin@userhub.example', userEmail: 'member1@userhub.example', password: randomBytes(18).toString('base64url') + '!42' };
  // Do not reset any pre-existing account with a colliding name.
  for (const email of [credentials.adminEmail, credentials.userEmail]) {
    try { await auth.getUserByEmail(email); throw Error('Account already exists. Preserve it and choose another demo email.'); }
    catch (e) { if (e.code !== 'auth/user-not-found') throw e; }
  }
  await writeFile(file, JSON.stringify(credentials, null, 2), { mode: 0o600, flag: 'wx' });
}
async function account(email, name, admin = false) {
  let u; try { u = await auth.getUserByEmail(email); } catch (e) { if (e.code !== 'auth/user-not-found') throw e; u = await auth.createUser({ email, password: credentials.password, displayName: name }); }
  if (admin) await auth.setCustomUserClaims(u.uid, { ...u.customClaims, admin: true });
  else if (!(await db.doc(`users/${u.uid}`).get()).exists) await db.doc(`users/${u.uid}`).set({ email, hoten: name, hinhanh: '', matkhau: 'AUTH_MANAGED' });
}
await account(credentials.adminEmail, 'UserHub Admin', true);
const names = ['Nguyễn Quang Huy', 'Trần Bảo An', 'Lê Minh Anh', 'Phạm Hoàng Nam', 'Đỗ Ngọc Hà', 'Vũ Thanh Tâm', 'Bùi Khánh Linh', 'Hoàng Gia Bảo', 'Phan Thùy Dương', 'Đặng Đức Minh', 'Mai Phương Thảo', 'Ngô Hải Yến'];
for (let i = 0; i < names.length; i++) await account(`member${i + 1}@userhub.example`, names[i]);
console.log('Live demo accounts ready. Private login details saved outside source at D:/UserHub-Credentials/userhub-login.json');
