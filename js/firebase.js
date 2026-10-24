import { config } from './config.js';
let pending;
export function connectFirebase() {
  if (!config.firebase?.projectId) return Promise.resolve(null);
  pending ??= initialize();
  return pending;
}
async function initialize() {
  const version = '11.10.0';
  const base = `https://www.gstatic.com/firebasejs/${version}/`;
  const [appSDK, authSDK, firestoreSDK, functionsSDK] = await Promise.all([
    import(`${base}firebase-app.js`), import(`${base}firebase-auth.js`),
    import(`${base}firebase-firestore.js`), import(`${base}firebase-functions.js`),
  ]);
  const app = appSDK.initializeApp(config.firebase);
  // Fail closed when production App Check has not been configured.
  if (!config.useEmulators) {
    if (!config.appCheckSiteKey) throw new Error('app-check-required');
    const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import(`${base}firebase-app-check.js`);
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(config.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
  }
  const auth = authSDK.getAuth(app);
  const db = firestoreSDK.getFirestore(app);
  const functions = functionsSDK.getFunctions(app, config.functionsRegion);
  if (config.useEmulators) {
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('local-emulators-only');
    authSDK.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    firestoreSDK.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    functionsSDK.connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }
  return { app, auth, db, functions };
}
