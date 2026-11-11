// Uses an existing Firebase CLI login. Credential contents never leave local storage.
const { getGlobalDefaultAccount } = require("firebase-tools/lib/auth");
const {
  getCredentialPathAsync,
} = require("firebase-tools/lib/defaultCredentials");
const { writeFileSync } = require("node:fs");
(async () => {
  const account = getGlobalDefaultAccount();
  if (!account)
    throw Error("Run npx firebase login first, or use a service account.");
  const path = await getCredentialPathAsync(account);
  if (!path) throw Error("Could not resolve local ADC.");
  writeFileSync(
    "backend-admin/.env",
    [
      "FIREBASE_PROJECT_ID=management-user-86623",
      "GOOGLE_APPLICATION_CREDENTIALS=" + path.replace(/\\/g, "/"),
      "PORT=3001",
      "PUBLIC_API_URL=http://localhost:3001",
      "ALLOWED_ORIGINS=http://localhost:8081",
      "ALLOW_LOCAL_UPLOADS=true",
    ].join("\n") + "\n",
  );
  console.log(
    "Local ADC configured outside the repository; backend env written without exposing credentials.",
  );
})().catch(() => {
  console.error(
    "Unable to configure local ADC. Use the documented service-account method.",
  );
  process.exitCode = 1;
});
