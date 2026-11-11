import { test } from "node:test";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-userhub";
const { app: serverApp } = await import("../backend-admin/app.js");
const { auth: adminAuth, db: adminDb } =
  await import("../backend-admin/firebase.js");
const backendRequire = createRequire(new URL('../backend-admin/package.json', import.meta.url));
const sharp = backendRequire('sharp');
await test("UserHub integration suite", async (suite) => {
  let server,
    base,
    adminToken,
    userToken,
    adminUid,
    secondAdminUid,
    uid,
    otherUid,
    rules;
  const apps = [],
    results = [];
  const password = "EmulatorOnly!42";
  function client(name) {
    const app = initializeApp(
      { apiKey: "demo-key", projectId: "demo-userhub" },
      name,
    );
    apps.push(app);
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    const db = getFirestore(app);
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    return { auth, db };
  }
  const user = client("integration-user");
  const admin = client("integration-admin");
  const profile = (email, hoten = "Integration User") => ({
    email,
    hoten,
    hinhanh: "",
    matkhau: "AUTH_MANAGED",
  });
  const request = (path, method = "GET", body, token = adminToken) =>
    fetch(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  async function tc(id, title, run) {
    await suite.test(`${id} ${title}`, async () => {
      try {
        await run();
        results.push({
          id,
          title,
          status: "PASS",
          environment: "Firebase Emulator",
        });
      } catch (e) {
        results.push({
          id,
          title,
          status: "FAIL",
          detail: e.message,
          environment: "Firebase Emulator",
        });
        throw e;
      }
    });
  }
  suite.before(async () => {
    // Tests never target production. Clear only the explicit demo project.
    await fetch(
      "http://127.0.0.1:9099/emulator/v1/projects/demo-userhub/accounts",
      { method: "DELETE" },
    );
    await fetch(
      "http://127.0.0.1:8080/emulator/v1/projects/demo-userhub/databases/(default)/documents",
      { method: "DELETE" },
    );
    rules = await initializeTestEnvironment({
      projectId: "demo-userhub",
      firestore: {
        host: "127.0.0.1",
        port: 8080,
        rules: await readFile("firestore.rules", "utf8"),
      },
    });
    const root = await adminAuth.createUser({
      email: "integration-admin@example.test",
      password,
    });
    adminUid = root.uid;
    await adminAuth.setCustomUserClaims(adminUid, { admin: true });
    const second = await adminAuth.createUser({
      email: "second-admin@example.test",
      password,
    });
    secondAdminUid = second.uid;
    await adminAuth.setCustomUserClaims(secondAdminUid, { admin: true });
    const login = await signInWithEmailAndPassword(
      admin.auth,
      root.email,
      password,
    );
    adminToken = await login.user.getIdToken(true);
    server = serverApp.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  suite.after(async () => {
    await mkdir("docs/testing", { recursive: true });
    await writeFile(
      "docs/testing/integration-results.json",
      JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
    );
    await rules?.cleanup();
    await Promise.all(apps.map(deleteApp));
    await new Promise((resolve) => server?.close(resolve));
  });
  await tc(
    "TC-U01",
    "Register creates Auth UID and exact four-field profile",
    async () => {
      const c = await createUserWithEmailAndPassword(
        user.auth,
        "integration-user@example.test",
        password,
      );
      uid = c.user.uid;
      await setDoc(doc(user.db, "users", uid), profile(c.user.email));
      const p = (await getDoc(doc(user.db, "users", uid))).data();
      assert.deepEqual(Object.keys(p).sort(), [
        "email",
        "hinhanh",
        "hoten",
        "matkhau",
      ]);
      userToken = await c.user.getIdToken();
      const other = await adminAuth.createUser({
        email: "other@example.test",
        password,
      });
      otherUid = other.uid;
      await adminDb
        .doc(`users/${otherUid}`)
        .set(profile(other.email, "Other User"));
    },
  );
  await tc("TC-U02", "Duplicate email rejected", async () => {
    await assert.rejects(
      createUserWithEmailAndPassword(
        user.auth,
        "integration-user@example.test",
        password,
      ),
      (e) => e.code === "auth/email-already-in-use",
    );
  });
  await tc("TC-U03", "Valid login and own profile read", async () => {
    await signOut(user.auth);
    const c = await signInWithEmailAndPassword(
      user.auth,
      "integration-user@example.test",
      password,
    );
    assert.equal(c.user.uid, uid);
    assert.ok((await getDoc(doc(user.db, "users", uid))).exists());
    userToken = await c.user.getIdToken();
  });
  await tc("TC-U04", "Invalid login rejected", async () => {
    await assert.rejects(
      signInWithEmailAndPassword(
        user.auth,
        "integration-user@example.test",
        "WrongPassword!",
      ),
    );
  });
  await tc(
    "TC-U05",
    "Own name update persists; other profile protected",
    async () => {
      await updateDoc(doc(user.db, "users", uid), { hoten: "Updated User" });
      assert.equal(
        (await getDoc(doc(user.db, "users", uid))).data().hoten,
        "Updated User",
      );
      await assertFails(
        updateDoc(doc(user.db, "users", otherUid), { hoten: "Attack" }),
      );
    },
  );
  await tc(
    "TC-U06-WEB",
    "Authenticated image upload and persisted shared URL (device picker pending)",
    async () => {
      const png = await sharp({
        create: { width: 40, height: 40, channels: 3, background: "#087C67" },
      })
        .png()
        .toBuffer();
      const body = new FormData();
      body.set("image", new Blob([png], { type: "image/png" }), "avatar.png");
      const r = await fetch(base + "/images", {
        method: "POST",
        headers: { Authorization: `Bearer ${userToken}` },
        body,
      });
      assert.equal(r.status, 201);
      const { url } = await r.json();
      await updateDoc(doc(user.db, "users", uid), { hinhanh: url });
      assert.equal(
        (await adminDb.doc(`users/${uid}`).get()).data().hinhanh,
        url,
      );
    },
  );
  await tc("TC-U07-API", "User denied every admin endpoint", async () => {
    for (const [path, method] of [
      ["/admin/users", "GET"],
      ["/admin/users", "POST"],
      [`/admin/users/${otherUid}`, "PATCH"],
      [`/admin/users/${otherUid}`, "DELETE"],
    ])
      assert.equal(
        (await request(path, method, undefined, userToken)).status,
        403,
      );
  });
  await tc("TC-U08-AUTH", "Sign out clears current session", async () => {
    await signOut(user.auth);
    assert.equal(user.auth.currentUser, null);
    await assertFails(getDoc(doc(user.db, "users", uid)));
    await signInWithEmailAndPassword(
      user.auth,
      "integration-user@example.test",
      password,
    );
  });
  await tc("TC-A01", "Admin token contains server-side claim", async () => {
    const t = await admin.auth.currentUser.getIdTokenResult();
    assert.equal(t.claims.admin, true);
    assert.equal((await request("/admin/users")).status, 200);
  });
  let createdUid;
  await tc(
    "TC-A02",
    "Admin create keeps session; new account can login",
    async () => {
      const r = await request("/admin/users", "POST", {
        email: " CREATED@EXAMPLE.TEST ",
        hoten: "Created User",
        hinhanh: "",
        password,
      });
      assert.equal(r.status, 201);
      const p = await r.json();
      createdUid = p.uid;
      assert.equal(p.email, "created@example.test");
      const c = client("created");
      assert.equal(
        (await signInWithEmailAndPassword(c.auth, p.email, password)).user.uid,
        createdUid,
      );
      assert.equal(admin.auth.currentUser.uid, adminUid);
      assert.ok((await adminDb.doc(`users/${createdUid}`).get()).exists);
    },
  );
  await tc("TC-A03", "Admin edits name and image", async () => {
    const r = await request(`/admin/users/${createdUid}`, "PATCH", {
      email: "created@example.test",
      hoten: "Changed Name",
      hinhanh: "https://example.test/avatar.jpg",
    });
    assert.equal(r.status, 200);
    assert.equal(
      (await adminDb.doc(`users/${createdUid}`).get()).data().hoten,
      "Changed Name",
    );
  });
  await tc(
    "TC-A04",
    "Admin email update stays consistent in Auth and Firestore",
    async () => {
      assert.equal(
        (
          await request(`/admin/users/${createdUid}`, "PATCH", {
            email: "renamed@example.test",
            hoten: "Changed Name",
            hinhanh: "",
          })
        ).status,
        200,
      );
      assert.equal(
        (await adminAuth.getUser(createdUid)).email,
        "renamed@example.test",
      );
      assert.equal(
        (await adminDb.doc(`users/${createdUid}`).get()).data().email,
        "renamed@example.test",
      );
    },
  );
  await tc(
    "TC-A05",
    "Delete removes login and profile; retry is idempotent",
    async () => {
      assert.equal(
        (await request(`/admin/users/${createdUid}`, "DELETE")).status,
        204,
      );
      await assert.rejects(adminAuth.getUser(createdUid));
      assert.equal(
        (await adminDb.doc(`users/${createdUid}`).get()).exists,
        false,
      );
      const c = client("deleted");
      await assert.rejects(
        signInWithEmailAndPassword(c.auth, "renamed@example.test", password),
      );
      assert.equal(
        (await request(`/admin/users/${createdUid}`, "DELETE")).status,
        204,
      );
    },
  );
  await tc(
    "TC-S01",
    "Anonymous and User cannot list; User cannot read another profile",
    async () => {
      const guest = rules.unauthenticatedContext().firestore();
      const owner = rules
        .authenticatedContext(uid, { email: "integration-user@example.test" })
        .firestore();
      await assertFails(getDocs(collection(guest, "users")));
      await assertFails(getDocs(collection(owner, "users")));
      await assertFails(getDoc(doc(owner, "users", otherUid)));
      await assertSucceeds(
        getDocs(
          collection(
            rules.authenticatedContext(adminUid, { admin: true }).firestore(),
            "users",
          ),
        ),
      );
    },
  );
  await tc(
    "TC-S02",
    "Owner cannot change email/password, extra fields, delete or short name",
    async () => {
      for (const data of [
        { email: "evil@example.test" },
        { matkhau: "plaintext" },
        { role: "admin" },
        { hoten: "X" },
        { hinhanh: "javascript:alert(1)" },
      ])
        await assertFails(updateDoc(doc(user.db, "users", uid), data));
      await assertFails(deleteDoc(doc(user.db, "users", uid)));
    },
  );
  await tc(
    "TC-D01",
    "All exported records contain only four string fields; password placeholder",
    async () => {
      const s = await adminDb.collection("users").get();
      for (const d of s.docs) {
        assert.deepEqual(Object.keys(d.data()).sort(), [
          "email",
          "hinhanh",
          "hoten",
          "matkhau",
        ]);
        assert.equal(d.data().matkhau, "AUTH_MANAGED");
        assert.ok(Object.values(d.data()).every((x) => typeof x === "string"));
      }
    },
  );
  await tc("TC-X01", "Cannot delete self or any other Admin", async () => {
    for (const id of [adminUid, secondAdminUid]) {
      assert.equal((await request(`/admin/users/${id}`, "DELETE")).status, 403);
      assert.ok(await adminAuth.getUser(id));
    }
  });
  await tc(
    "TC-X02",
    "Missing, forged token and unauthenticated uploads rejected",
    async () => {
      for (const token of ["", "forged.token.signature"])
        assert.equal(
          (await request("/admin/users", "GET", undefined, token)).status,
          401,
        );
      assert.equal(
        (await fetch(base + "/images", { method: "POST" })).status,
        401,
      );
    },
  );
  await tc(
    "TC-X03",
    "Validation rejects weak password, extra schema fields and wrong types",
    async () => {
      for (const change of [
        { password: "123" },
        { role: "admin" },
        { hoten: 12 },
        { hinhanh: "javascript:alert(1)" },
        { email: "invalid" },
      ])
        assert.equal(
          (
            await request("/admin/users", "POST", {
              email: "invalid-test@example.test",
              hoten: "Valid User",
              hinhanh: "",
              password,
              ...change,
            })
          ).status,
          400,
        );
    },
  );
  await tc("TC-X04", "Fake image and oversize upload rejected", async () => {
    const body = new FormData();
    body.set("image", new Blob(["fake-image"]), "bad.png");
    assert.equal(
      (
        await fetch(base + "/images", {
          method: "POST",
          headers: { Authorization: `Bearer ${userToken}` },
          body,
        })
      ).status,
      400,
    );
    const large = new FormData();
    large.set(
      "image",
      new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]),
      "large.png",
    );
    assert.equal(
      (
        await fetch(base + "/images", {
          method: "POST",
          headers: { Authorization: `Bearer ${userToken}` },
          body: large,
        })
      ).status,
      413,
    );
  });
  await tc(
    "TC-X05",
    "Duplicate admin email creation rejected without orphan profile",
    async () => {
      const count = (await adminDb.collection("users").get()).size;
      assert.equal(
        (
          await request("/admin/users", "POST", {
            email: "integration-user@example.test",
            hoten: "Duplicate",
            hinhanh: "",
            password,
          })
        ).status,
        409,
      );
      assert.equal((await adminDb.collection("users").get()).size, count);
    },
  );
  await tc(
    "TC-X06",
    "New owner cannot create extra fields or wrong email",
    async () => {
      const c = rules
        .authenticatedContext("new-user", { email: "new@example.test" })
        .firestore();
      await assertFails(
        setDoc(doc(c, "users", "new-user"), {
          ...profile("new@example.test"),
          role: "admin",
        }),
      );
      await assertFails(
        setDoc(doc(c, "users", "new-user"), profile("wrong@example.test")),
      );
      await assertSucceeds(
        setDoc(doc(c, "users", "new-user"), profile("new@example.test")),
      );
      await adminDb.doc("users/new-user").delete();
    },
  );

  await tc(
    "TC-X07",
    "Create compensates Auth account when Firestore write fails",
    async () => {
      const original = adminDb.doc;
      adminDb.doc = function (path) {
        const ref = original.call(this, path);
        ref.create = async () => {
          throw Error("Injected Firestore failure");
        };
        return ref;
      };
      try {
        assert.equal(
          (
            await request("/admin/users", "POST", {
              email: "compensation@example.test",
              hoten: "Compensated User",
              hinhanh: "",
              password,
            })
          ).status,
          500,
        );
      } finally {
        adminDb.doc = original;
      }
      await assert.rejects(
        adminAuth.getUserByEmail("compensation@example.test"),
        (e) => e.code === "auth/user-not-found",
      );
    },
  );
  await tc(
    "TC-X08",
    "Email update rolls Auth back after Firestore failure",
    async () => {
      const old = await adminAuth.getUser(otherUid);
      const original = adminDb.doc;
      adminDb.doc = function (path) {
        const ref = original.call(this, path);
        if (path === `users/${otherUid}`)
          ref.set = async () => {
            throw Error("Injected Firestore failure");
          };
        return ref;
      };
      try {
        assert.equal(
          (
            await request(`/admin/users/${otherUid}`, "PATCH", {
              email: "rollback@example.test",
              hoten: "Rollback Test",
              hinhanh: "",
            })
          ).status,
          500,
        );
      } finally {
        adminDb.doc = original;
      }
      assert.equal((await adminAuth.getUser(otherUid)).email, old.email);
      assert.equal(
        (await adminDb.doc(`users/${otherUid}`).get()).data().email,
        old.email,
      );
    },
  );
  await tc(
    "TC-X09",
    "Delete retry completes profile cleanup after partial failure",
    async () => {
      const u = await adminAuth.createUser({
        email: "delete-retry@example.test",
        password,
      });
      await adminDb.doc(`users/${u.uid}`).set(profile(u.email));
      const original = adminDb.doc;
      adminDb.doc = function (path) {
        const ref = original.call(this, path);
        if (path === `users/${u.uid}`)
          ref.delete = async () => {
            throw Error("Injected Firestore failure");
          };
        return ref;
      };
      try {
        assert.equal(
          (await request(`/admin/users/${u.uid}`, "DELETE")).status,
          500,
        );
      } finally {
        adminDb.doc = original;
      }
      await assert.rejects(adminAuth.getUser(u.uid));
      assert.equal((await adminDb.doc(`users/${u.uid}`).get()).exists, true);
      assert.equal(
        (await request(`/admin/users/${u.uid}`, "DELETE")).status,
        204,
      );
      assert.equal((await adminDb.doc(`users/${u.uid}`).get()).exists, false);
    },
  );
});
