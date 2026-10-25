import { config } from "./config.js";
let instance;
export async function initializeAppCheckIfConfigured(app) {
  const key = (config.appCheckSiteKey || "").trim();
  if (!key) return null;
  if (instance) return instance;
  const { initializeAppCheck, ReCaptchaV3Provider } =
    await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js");
  instance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(key),
    isTokenAutoRefreshEnabled: true,
  });
  return instance;
}
