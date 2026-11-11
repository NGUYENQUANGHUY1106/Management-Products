import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { auth as adminAuth } from '../backend-admin/firebase.js';
import { app as serverApp } from '../backend-admin/app.js';

test('main admin login and grant/revoke roles for an Authentication account', async () => {
  if (process.env.FIREBASE_PROJECT_ID !== 'management-product-e97a1') throw Error('Wrong project');
  const login = JSON.parse(await readFile('D:/ManagementProduct-Credentials/admin-login.json', 'utf8'));
  const config = { projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY };
  const mainApp = initializeApp(config, 'role-main'); const targetApp = initializeApp(config, 'role-target');
  const mainAuth = getAuth(mainApp); const targetAuth = getAuth(targetApp);
  const server = serverApp.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/admin/roles`;
  let target; const results = [];
  async function request(body, token) {
    const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  }
  async function check(name, fn) { await fn(); results.push({ name, status: 'PASS' }); }
  try {
    const credential = await signInWithEmailAndPassword(mainAuth, login.adminEmail, login.password);
    await check('Requested Gmail and UID can login as admin', async () => { assert.equal(credential.user.uid, 'ej1v0UNUKogn81JLB9c90Tkn9GA3'); assert.equal((await credential.user.getIdTokenResult()).claims.admin, true); });
    const mainToken = await credential.user.getIdToken();
    const password = randomBytes(18).toString('base64url');
    target = await adminAuth.createUser({ email: `role-${randomUUID()}@management-product.example`, password });
    await adminAuth.setCustomUserClaims(target.uid, { testClaim: 'preserve' });
    await signInWithEmailAndPassword(targetAuth, target.email, password);
    const memberToken = await targetAuth.currentUser.getIdToken();
    await check('Anonymous role change denied', async () => assert.equal((await request({ identifier: target.uid, admin: true })).status, 401));
    await check('Non-admin cannot promote themselves', async () => assert.equal((await request({ identifier: target.uid, admin: true }, memberToken)).status, 403));
    await check('Input and missing account validation', async () => { assert.equal((await request({ identifier: '', admin: true }, mainToken)).status, 400); assert.equal((await request({ identifier: target.uid, admin: 'true' }, mainToken)).status, 400); assert.equal((await request({ identifier: 'missing-' + randomUUID(), admin: true }, mainToken)).status, 404); });
    await check('Grant admin by email and preserve other claims', async () => { const result = await request({ identifier: target.email, admin: true }, mainToken); assert.equal(result.status, 200); const account = await adminAuth.getUser(target.uid); assert.equal(account.customClaims.admin, true); assert.equal(account.customClaims.testClaim, 'preserve'); });
    await check('New admin token can read products', async () => { assert.equal((await targetAuth.currentUser.getIdTokenResult(true)).claims.admin, true); await getDocs(collection(getFirestore(targetApp), 'products')); });
    const grantedToken = await targetAuth.currentUser.getIdToken();
    await check('Self revoke rejected', async () => assert.equal((await request({ identifier: login.adminEmail, admin: false }, mainToken)).status, 409));
    await check('Revoke admin by UID and preserve other claims', async () => { assert.equal((await request({ identifier: target.uid, admin: false }, mainToken)).status, 200); const account = await adminAuth.getUser(target.uid); assert.equal(account.customClaims.admin, undefined); assert.equal(account.customClaims.testClaim, 'preserve'); });
    await check('Revoked admin cannot grant using an old token', async () => { const response = await request({ identifier: target.uid, admin: true }, grantedToken); assert.ok([401,403].includes(response.status)); });
  } finally {
    if (target) await adminAuth.deleteUser(target.uid);
    await Promise.all([deleteApp(mainApp), deleteApp(targetApp)]);
    await new Promise(resolve => server.close(resolve));
    await writeFile('docs/testing/admin-roles-results.json', JSON.stringify({ checkedAt: new Date().toISOString(), results, temporaryAccountRemoved: !!target }, null, 2));
  }
});
