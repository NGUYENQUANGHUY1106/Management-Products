import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import assert from 'node:assert/strict';
import { auth as adminAuth, db as adminDb, emulator } from '../backend-admin/firebase.js';
import { app as expressApp } from '../backend-admin/app.js';
if (emulator) throw Error('Do not run live-smoke with Emulator variables.');
const credentials = JSON.parse(await readFile('D:/UserHub-Credentials/userhub-login.json', 'utf8'));
const config = Object.fromEntries((await readFile('.env', 'utf8')).split(/\r?\n/).filter(l => l.includes('=')).map(l => l.split(/=(.*)/s).slice(0,2)));
const app = initializeApp({ apiKey: config.EXPO_PUBLIC_FIREBASE_API_KEY, authDomain: config.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: config.EXPO_PUBLIC_FIREBASE_PROJECT_ID, appId: config.EXPO_PUBLIC_FIREBASE_APP_ID }, 'live-test');
const auth = getAuth(app); const db = getFirestore(app); const results = []; const cleanup = [];
const server = expressApp.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); const base = `http://127.0.0.1:${server.address().port}`;
let token, uid, managedUid, userToken;
const request = (path, method='GET', body, t=token) => fetch(base+path,{method,headers:{Authorization:`Bearer ${t || ''}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
async function tc(id,title,fn){try{await fn(); results.push({id,title,status:'PASS',environment:'Firebase management-user-86623'});console.log(id,'PASS');}catch(e){results.push({id,title,status:'FAIL',detail:e.message,environment:'Firebase management-user-86623'});console.log(id,'FAIL',e.code || 'assertion');}}
const email=`live-${Date.now()}@userhub.example`;
try {
 await tc('LIVE-U01','Register actual Auth and exact four-field Firestore profile',async()=>{const c=await createUserWithEmailAndPassword(auth,email,credentials.password); uid=c.user.uid;cleanup.push(uid);await setDoc(doc(db,'users',uid),{email,hoten:'Live Smoke User',matkhau:'AUTH_MANAGED',hinhanh:''});assert.equal((await getDoc(doc(db,'users',uid))).data().email,email);userToken=await c.user.getIdToken();});
 await tc('LIVE-U02','Duplicate email and invalid password rejected',async()=>{await assert.rejects(createUserWithEmailAndPassword(auth,email,credentials.password));await assert.rejects(signInWithEmailAndPassword(auth,email,'incorrect-password'));});
 await tc('LIVE-U05','Own name update persisted, sensitive fields denied by deployed Rules',async()=>{await updateDoc(doc(db,'users',uid),{hoten:'Live Name Updated'});assert.equal((await getDoc(doc(db,'users',uid))).data().hoten,'Live Name Updated');await assert.rejects(updateDoc(doc(db,'users',uid),{email:'changed@userhub.example'}));await assert.rejects(updateDoc(doc(db,'users',uid),{matkhau:'plaintext'}));await assert.rejects(getDocs(collection(db,'users')));});
 await tc('LIVE-U07','User denied Admin endpoints on real Firebase token',async()=>{assert.equal((await request('/admin/users','GET',undefined,userToken)).status,403);});
 await tc('LIVE-U08','Sign out and sign in again',async()=>{await signOut(auth);assert.equal(auth.currentUser,null);await signInWithEmailAndPassword(auth,email,credentials.password);});
 await tc('LIVE-A01','Real Admin claim and backend verification',async()=>{await signInWithEmailAndPassword(auth,credentials.adminEmail,credentials.password);assert.equal((await auth.currentUser.getIdTokenResult()).claims.admin,true);token=await auth.currentUser.getIdToken();assert.equal((await request('/admin/users')).status,200);});
 await tc('LIVE-A02','Backend creates actual Auth account and profile without changing Admin session',async()=>{const current=auth.currentUser.uid;const r=await request('/admin/users','POST',{email:`managed-${Date.now()}@userhub.example`,hoten:'Live Managed User',hinhanh:'',password:credentials.password});assert.equal(r.status,201);managedUid=(await r.json()).uid;cleanup.push(managedUid);assert.ok(await adminAuth.getUser(managedUid));assert.equal(auth.currentUser.uid,current);assert.ok((await adminDb.doc(`users/${managedUid}`).get()).exists);});
 await tc('LIVE-A04','Email update consistent in real Auth and Firestore',async()=>{const changed=`changed-${Date.now()}@userhub.example`;assert.equal((await request(`/admin/users/${managedUid}`,'PATCH',{email:changed,hoten:'Live Edited',hinhanh:''})).status,200);assert.equal((await adminAuth.getUser(managedUid)).email,changed);assert.equal((await adminDb.doc(`users/${managedUid}`).get()).data().email,changed);});
 await tc('LIVE-A05','Real account delete prevents login and removes profile',async()=>{const old=await adminAuth.getUser(managedUid);assert.equal((await request(`/admin/users/${managedUid}`,'DELETE')).status,204);await assert.rejects(adminAuth.getUser(managedUid));assert.equal((await adminDb.doc(`users/${managedUid}`).get()).exists,false);await assert.rejects(signInWithEmailAndPassword(auth,old.email,credentials.password));});
 await tc('LIVE-IMAGE','Authenticated local-demo image upload and public URL retrieval',async()=>{const require=createRequire(new URL('../backend-admin/package.json',import.meta.url));const png=await require('sharp')({create:{width:40,height:40,channels:3,background:'#087C67'}}).png().toBuffer();const body=new FormData();body.set('image',new Blob([png],{type:'image/png'}),'avatar.png');const r=await fetch(base+'/images',{method:'POST',headers:{Authorization:`Bearer ${token}`},body});assert.equal(r.status,201);const data=await r.json();assert.match(data.url,/^http/);const u=new URL(data.url);assert.equal((await fetch(base+u.pathname)).status,200);});
} finally {
 for(const id of cleanup){try{await adminAuth.deleteUser(id);}catch(e){if(e.code!=='auth/user-not-found')throw e;}await adminDb.doc(`users/${id}`).delete();}
 await signOut(auth);await deleteApp(app);await new Promise(r=>server.close(r));
 await mkdir('docs/testing',{recursive:true});await writeFile('docs/testing/live-results.json',JSON.stringify({date:new Date().toISOString(),project:'management-user-86623',results},null,2));
}
if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
