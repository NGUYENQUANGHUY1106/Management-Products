import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth as adminAuth } from '../backend-admin/firebase.js';
if (process.env.FIREBASE_PROJECT_ID !== 'management-product-e97a1') throw Error('Wrong project.');
const app = initializeApp({ projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY });
const auth = getAuth(app); const db = getFirestore(app);
const results = []; let member;
async function check(name, action) { await action(); results.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
try {
  const password = randomBytes(18).toString('base64url');
  member = await adminAuth.createUser({ email: `permission-${randomUUID()}@management-product.example`, password });
  await signInWithEmailAndPassword(auth, member.email, password);
  await check('Non-admin cannot list products', () => assert.rejects(getDocs(collection(db, 'products')), e => e.code === 'permission-denied'));
  await check('Non-admin cannot create products', () => assert.rejects(setDoc(doc(db, 'products/permission-test'), { name: 'Forbidden', price: 1, soluong: 1, image: 'https://example.com/image.png' }), e => e.code === 'permission-denied'));
  await check('Non-admin cannot delete products', () => assert.rejects(deleteDoc(doc(db, 'products/permission-test')), e => e.code === 'permission-denied'));
  await check('Non-admin image upload denied', async () => { const r = await fetch('http://localhost:3001/images', { method: 'POST', headers: { Authorization: 'Bearer ' + await auth.currentUser.getIdToken() } }); assert.equal(r.status, 403); });
  await check('Anonymous image upload denied', async () => { const r = await fetch('http://localhost:3001/images', { method: 'POST' }); assert.equal(r.status, 401); });
  await check('Removed user API returns 404', async () => { assert.equal((await fetch('http://localhost:3001/admin/users')).status, 404); });
} finally {
  if (member) await adminAuth.deleteUser(member.uid);
  await deleteApp(app);
  await mkdir('docs/testing', { recursive: true });
  await writeFile('docs/testing/permissions-results.json', JSON.stringify({ checkedAt: new Date().toISOString(), results, temporaryAccountRemoved: !!member }, null, 2));
}
