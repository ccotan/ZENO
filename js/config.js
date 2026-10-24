// Public web configuration, not a server credential. Analytics is not enabled.
export const config = Object.freeze({
  firebase: {
    apiKey: "AIzaSyBai4QPq1kdq0i5-Gd3CiL1_3jn3LQrNMo",
    authDomain: "zeno-33e37.firebaseapp.com",
    projectId: "zeno-33e37",
    storageBucket: "zeno-33e37.firebasestorage.app",
    messagingSenderId: "645233286455",
    appId: "1:645233286455:web:3a69561fc76de550c8ceb2",
  },
  // Paste ONLY the public HTTPS origin of your deployed Worker. No trailing slash.
  discordAuthOrigin: "https://zeno-discord-auth.ccotanno.workers.dev",
  appCheckSiteKey: "",
  useEmulators: false,
  functionsRegion: "europe-west1",
});
