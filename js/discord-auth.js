import { initializeAppCheckIfConfigured } from './app-check.js';
import { config } from './config.js';
let client, sdkPromise, user=null, busy=false, initialized=false, statusText=['',''];
const $=s=>document.querySelector(s), en=()=>document.documentElement.lang==='en';
const text=(ru,english)=>en()?english:ru;
function status(ru,english=ru) { statusText=[ru,english];$('#auth-status').textContent=text(...statusText); }
function origin() {
 try { const u=new URL(config.discordAuthOrigin);return u.protocol==='https:'&&u.origin===config.discordAuthOrigin?u.origin:null; } catch {return null}
}
async function sdk() {
 if(!sdkPromise) sdkPromise=(async()=>{
  const base='https://www.gstatic.com/firebasejs/11.10.0/';
  const [app,auth]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js')]);
  const firebaseApp=app.getApps().length?app.getApp():app.initializeApp(config.firebase);
  await initializeAppCheckIfConfigured(firebaseApp);
  const instance=auth.getAuth(firebaseApp);
  await auth.setPersistence(instance,auth.browserLocalPersistence);
  await instance.authStateReady();
  client={instance,auth,firebaseApp};
  auth.onAuthStateChanged(instance,value=>{user=value;refreshDiscordAuth();window.dispatchEvent(new Event('zeno-auth-change'))});
  return client;
 })().catch(error=>{sdkPromise=null;throw error});
 return sdkPromise;
}
export function refreshDiscordAuth() {
 if(!initialized)return;
 $('#auth-status').textContent=text(...statusText);
 $('#auth-title').textContent=user?text('Профиль','Profile'):text('Вход','Sign in');
 $('#auth-note').textContent=user?'':text('Используй Discord, чтобы публиковать объявления и общаться с игроками.','Use Discord to publish listings and talk to players.');
 $('#auth-close').ariaLabel=text('Закрыть','Close');
 $('#auth-login').replaceChildren();const logo=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS(logo.namespaceURI,'use');use.setAttribute('href','./assets/icons.svg#icon-discord');logo.append(use);const caption=document.createElement('span');caption.textContent=busy?text('Ожидаем Discord…','Waiting for Discord…'):text('Войти через Discord','Sign in with Discord');$('#auth-login').append(logo,caption);
 $('#auth-login').hidden=!!user;$('#auth-login').disabled=busy;
 $('#auth-logout').querySelector('span').textContent=text('Выйти','Sign out');$('#auth-logout').hidden=!user;
 const label=$('[data-action="login"] span');label.textContent=user?text('Аккаунт','Account'):text('Войти','Sign in');
}
async function login() {
 if(busy)return;
 const authOrigin=origin();
 if(!authOrigin){status('Вход временно недоступен. Попробуй позже.','Sign-in is temporarily unavailable. Try again later.');return}
 const requestId=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
 // Open synchronously on the user click, before loading the Firebase SDK.
 const popup=window.open('about:blank','zeno-discord-login','popup,width=520,height=760');
 if(!popup){status('Разреши всплывающие окна для ZENO и повтори вход.','Allow popups for ZENO and try again.');return}
 busy=true;refreshDiscordAuth();status('Открой окно Discord и подтверди вход.','Complete sign-in in the Discord window.');
 let stopped=false,timer,timeout;
 const clean=()=>{stopped=true;clearInterval(timer);clearTimeout(timeout);window.removeEventListener('message',receive);busy=false;refreshDiscordAuth()};
 async function receive(event) {
  if(event.origin!==authOrigin||event.source!==popup||event.data?.type!=='zeno-discord-auth'||event.data.requestId!==requestId)return;
  const data=event.data;clean();popup.close();
  if(data.error){
   const code=typeof data.error==='string'&&/^[a-z0-9-]{1,100}$/.test(data.error)?data.error:'unknown';
   status('Вход не выполнен. Код: '+code,'Sign-in failed. Code: '+code);return;
  }
  if(typeof data.customToken!=='string'||data.customToken.length>12000){status('Некорректный ответ входа.','Invalid authentication response.');return}
  busy=true;refreshDiscordAuth();
  try {
   const {auth,instance}=await sdk();
   const result=await auth.signInWithCustomToken(instance,data.customToken);
   // Cosmetic profile name only. Never use the display name for authorization or seller ownership.
   if(typeof data.profile?.displayName==='string')try{await auth.updateProfile(result.user,{displayName:data.profile.displayName.slice(0,80)})}catch{/* sign-in still succeeded */}
   user=result.user;status('Вход выполнен.','Signed in.');
  }catch(error){
   const code=typeof error?.code==='string'&&/^auth\/[a-z0-9-]{1,80}$/.test(error.code)?error.code:'sign-in-failed';
   status('Не удалось завершить вход. Повтори попытку.','Could not complete sign-in. Try again.');
  }
  finally{busy=false;refreshDiscordAuth()}
 }
 window.addEventListener('message',receive);
 timer=setInterval(()=>{if(popup.closed&&!stopped){clean();status('Окно входа закрыто.','Sign-in window closed.')}},500);
 timeout=setTimeout(()=>{if(!stopped){clean();popup.close();status('Время входа истекло. Повтори попытку.','Sign-in timed out. Try again.')}},600000);
 popup.location.replace(`${authOrigin}/auth/discord/start?request=${requestId}`);
}
export function showDiscordAuth() {
 if(!initialized)initDiscordAuth();refreshDiscordAuth();status('');
 if(!$('#auth-dialog').open)$('#auth-dialog').showModal();
}
export function initDiscordAuth() {
 if(initialized)return;initialized=true;
 $('#auth-close').onclick=()=>$('#auth-dialog').close();$('#auth-login').onclick=login;
 $('#auth-logout').onclick=async()=>{if(busy)return;try{const {auth,instance}=await sdk();await auth.signOut(instance);user=null;status('Выход выполнен.','Signed out.')}catch{status('Не удалось выйти. Попробуй снова.','Sign-out failed. Try again.')}refreshDiscordAuth()};
 refreshDiscordAuth();
 // No external Firebase requests until the backend is configured.
 if(origin())sdk().catch(()=>{status('Не удалось восстановить вход. Проверь соединение.','Could not restore sign-in. Check the connection.')});
}

// Reuse the same Firebase app and Auth instance for Firestore.
export async function getFirebaseSession(){return sdk()}
