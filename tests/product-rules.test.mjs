import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

test('products: admin CRUD, permissions and exactly four fields', async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-management-product', firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') } });
  const admin = env.authenticatedContext('admin-test', { admin: true }).firestore();
  const member = env.authenticatedContext('member-test').firestore();
  const guest = env.unauthenticatedContext().firestore();
  const data = { name: 'Bàn phím', price: 250000, soluong: 10, image: 'https://example.com/product.jpg' };
  const ref = doc(admin, 'products/rule-test');
  try {
    await assertSucceeds(setDoc(ref, data));
    assert.equal((await assertSucceeds(getDocs(collection(admin, 'products')))).size >= 1, true);
    await assertSucceeds(updateDoc(ref, { price: 300000 }));
    for (const invalid of [{ ...data, extra: 1 }, { name: data.name, price: 1, soluong: 1 }, { ...data, price: -1 }, { ...data, price: '100' }, { ...data, soluong: 1.5 }, { ...data, soluong: -1 }, { ...data, name: '   ' }, { ...data, image: 'javascript:alert(1)' }]) {
      await assertFails(setDoc(ref, invalid));
    }
    for (const db of [member, guest]) {
      await assertFails(getDocs(collection(db, 'products')));
      await assertFails(setDoc(doc(db, 'products/forbidden'), data));
      await assertFails(deleteDoc(doc(db, 'products/rule-test')));
    }
    await assertFails(setDoc(doc(admin, 'users/old-user'), { name: 'Old user' }));
    await assertSucceeds(deleteDoc(ref));
  } finally { await env.cleanup(); }
});
