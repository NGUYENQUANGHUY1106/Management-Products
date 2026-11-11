import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
const login = JSON.parse(await readFile('D:/ManagementProduct-Credentials/admin-login.json', 'utf8'));
const app = initializeApp({ projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY, appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID });
if (app.options.projectId !== 'management-product-e97a1') throw Error('Wrong project');
const auth = getAuth(app); const db = getFirestore(app);
const ref = doc(db, 'products', 'verification-' + randomUUID());
const results = [];
async function check(name, action) { await action(); results.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
try {
  await check('Anonymous product access denied', () => assert.rejects(getDocs(collection(db, 'products')), e => e.code === 'permission-denied'));
  await check('Admin email/password login and claim', async () => { const c = await signInWithEmailAndPassword(auth, login.adminEmail, login.password); assert.equal((await c.user.getIdTokenResult()).claims.admin, true); });
  const data = { name: 'Sản phẩm kiểm thử', price: 150000, soluong: 3, image: 'https://example.com/product.jpg' };
  await check('Create and read product', async () => { await setDoc(ref, data); assert.deepEqual((await getDoc(ref)).data(), data); });
  await check('Update product', async () => { await updateDoc(ref, { price: 175000, soluong: 4 }); assert.equal((await getDoc(ref)).data().soluong, 4); });
  await check('Reject fifth field', () => assert.rejects(updateDoc(ref, { category: 'forbidden' }), e => e.code === 'permission-denied'));
  await check('Reject negative price and fractional quantity', async () => { for (const patch of [{ price: -1 }, { soluong: 1.5 }]) await assert.rejects(updateDoc(ref, patch), e => e.code === 'permission-denied'); });
  await check('Reject missing fields, wrong types, blank names and invalid images', async () => {
    for (const invalid of [{ name: 'Missing', price: 1, soluong: 1 }, { ...data, price: '100' }, { ...data, soluong: -1 }, { ...data, name: '   ' }, { ...data, image: 'javascript:alert(1)' }]) {
      await assert.rejects(setDoc(ref, invalid), e => e.code === 'permission-denied');
    }
  });
  await check('Delete product', async () => { await deleteDoc(ref); assert.equal((await getDoc(ref)).exists(), false); });
  await check('Export schema contains exactly four fields', async () => { for (const d of (await getDocs(collection(db, 'products'))).docs) assert.deepEqual(Object.keys(d.data()).sort(), ['image', 'name', 'price', 'soluong']); });
} finally {
  if (auth.currentUser) await deleteDoc(ref).catch(() => {});
  await mkdir('docs/testing', { recursive: true });
  await writeFile('docs/testing/live-results.json', JSON.stringify({ projectId: app.options.projectId, checkedAt: new Date().toISOString(), results }, null, 2));
  await deleteApp(app);
}
