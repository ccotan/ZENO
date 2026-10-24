// Public records contain a random seller ID, never the Discord/Firebase UID.
import { getFirebaseSession } from './discord-auth.js';
let promise, cursor=null, listingBusy=false, hasMore=false;
let profile=null, ownerId=null, sessionUid=null, profileEpoch=0;
const profiles=new Map(), sellerRows=new Map();
const $=s=>document.querySelector(s);
const english=()=>document.documentElement.lang==='en';
const tr=(ru,en)=>english()?en:ru;
const emit=()=>window.dispatchEvent(new Event('zeno-cloud-change'));
let statusKey='loading', errorCode='';
export const cloud={rows:[],get loadState(){return statusKey}, get profile(){return profile},get ownerId(){return ownerId},get hasMore(){return hasMore},get busy(){return listingBusy}};
function safeCode(e){return typeof e?.code==='string'&&/^[a-z0-9/-]{1,80}$/.test(e.code)?e.code:'unavailable'}
export function cloudError(e){return tr('База не выполнила запрос. Код: ','Database request failed. Code: ')+safeCode(e)+tr('. Проверь соединение и опубликованные правила Firestore.','. Check the connection and published Firestore rules.')}
async function api(){
 if(!promise)promise=(async()=>{const session=await getFirebaseSession();const f=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');return {...session,f,db:f.getFirestore(session.firebaseApp)}})().catch(e=>{promise=null;throw e});
 return promise;
}
function row(d){const v=d.data();return {...v,id:d.id+':'+v.id,generationId:v.id,cloud:true,docId:d.id,createdAt:v.createdAt?.toMillis?.()||0,traits:parseTraits(v.traitData)}}
function parseTraits(s){try{const o=JSON.parse(s);return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch{return {}}}
function liveUser(a){const u=a.instance.currentUser;if(!u)throw Object.assign(new Error('Sign in'),{code:'auth/sign-in-required'});return u}
export function cloudProfile(id){return profiles.get(id)}
export function cloudSellerRows(id){return sellerRows.get(id)||cloud.rows.filter(r=>r.sellerId===id)}
export function allCloudRows(){return [...new Map([...cloud.rows,...[...sellerRows.values()].flat()].map(r=>[r.id,r])).values()]}
export async function refreshCloud(more=false){
 if(listingBusy)return;listingBusy=true;statusKey='loading';errorCode='';refreshCloudUI();emit();
 try{const {f,db}=await api();const constraints=[f.orderBy('createdAt','desc'),f.limit(100)];if(more&&cursor)constraints.push(f.startAfter(cursor));const snap=await f.getDocsFromServer(f.query(f.collection(db,'lots'),...constraints));
 if(!more)sellerRows.clear();cloud.rows=more?[...new Map([...cloud.rows,...snap.docs.map(row)].map(r=>[r.id,r])).values()]:snap.docs.map(row);cursor=snap.docs.at(-1)||null;hasMore=snap.size===100;statusKey='ready';emit();
 }catch(e){statusKey='error';errorCode=safeCode(e);emit()}finally{listingBusy=false;refreshCloudUI()}
}
export async function fetchSeller(id){
 const {f,db}=await api();const [p,rows]=await Promise.all([f.getDocFromServer(f.doc(db,'publicProfiles',id)),f.getDocsFromServer(f.query(f.collection(db,'lots'),f.where('sellerId','==',id),f.limit(50)))]);
 if(p.exists())profiles.set(id,p.data());else profiles.delete(id);sellerRows.set(id,rows.docs.map(row));return p.exists()?p.data():null;
}
async function readOwnProfile(){
 const epoch=++profileEpoch;profile=null;ownerId=null;sessionUid=null;$('#profile-status').textContent='';refreshCloudUI();emit();
 try{const a=await api(),u=a.instance.currentUser;if(!u)return;sessionUid=u.uid;const m=await a.f.getDocFromServer(a.f.doc(a.db,'users',u.uid));if(epoch!==profileEpoch||a.instance.currentUser?.uid!==u.uid)return;
 if(m.exists()){const id=m.data().publicId,p=await a.f.getDocFromServer(a.f.doc(a.db,'publicProfiles',id));if(epoch!==profileEpoch||a.instance.currentUser?.uid!==u.uid)return;if(!p.exists())throw Object.assign(Error('profile'),{code:'profile-missing'});ownerId=id;profile=p.data();profiles.set(id,profile)}
 $('#profile-status').textContent='';
 }catch(e){if(epoch===profileEpoch)$('#profile-status').textContent=cloudError(e)}finally{if(epoch===profileEpoch){fillProfileFields();refreshCloudUI();emit()}}
}
function fillProfileFields(){
 $('#public-display-name').value=profile?.displayName||'';$('#public-minecraft-name').value=profile?.minecraftName||'';
 if(profile?.minecraftName)$('#seller-nickname').value=profile.minecraftName;
}
export async function saveCloudProfile(displayName,minecraftName){
 const a=await api(),u=liveUser(a);displayName=displayName.trim();minecraftName=minecraftName.trim();
 if(!displayName||displayName.length>80||!(minecraftName===''||/^[A-Za-z0-9_]{3,16}$/.test(minecraftName)))throw Object.assign(Error('profile'),{code:'profile-invalid'});
 const privateRef=a.f.doc(a.db,'users',u.uid),existing=await a.f.getDocFromServer(privateRef);let id=existing.exists()?existing.data().publicId:a.f.doc(a.f.collection(a.db,'publicProfiles')).id;
 const publicRef=a.f.doc(a.db,'publicProfiles',id),stamp=a.f.serverTimestamp();
 if(a.instance.currentUser?.uid!==u.uid)throw Object.assign(Error('auth'),{code:'auth/user-changed'});
 const data={displayName,minecraftName,updatedAt:stamp};
 if(existing.exists())await a.f.updateDoc(publicRef,data);
 else {const batch=a.f.writeBatch(a.db);batch.set(privateRef,{publicId:id,createdAt:stamp});batch.set(publicRef,{...data,createdAt:stamp});await batch.commit()}
 if(a.instance.currentUser?.uid===u.uid){sessionUid=u.uid;ownerId=id;profile={displayName,minecraftName};profiles.set(id,profile);fillProfileFields();refreshCloudUI();emit()}
 return id;
}
export async function publishCloudLot(data){
 const a=await api(),u=liveUser(a);
 if(sessionUid!==u.uid||!profile||!ownerId)throw Object.assign(Error('profile'),{code:'profile-required'});
 if(!profile.minecraftName||data.nickname!==profile.minecraftName)throw Object.assign(Error('nickname'),{code:'profile-nickname-mismatch'});
 const sellerId=ownerId,snap=await a.f.getDocsFromServer(a.f.query(a.f.collection(a.db,'lots'),a.f.where('sellerId','==',sellerId),a.f.limit(50)));
 const occupied=new Set(snap.docs.map(d=>d.data().slot));let slot=0;while(occupied.has(slot))slot++;if(slot>=50)throw Object.assign(Error('limit'),{code:'listing-limit'});
 if(a.instance.currentUser?.uid!==u.uid)throw Object.assign(Error('auth'),{code:'auth/user-changed'});
 const stamp=a.f.serverTimestamp(),payload={id:crypto.randomUUID(),sellerId,slot,itemKey:data.itemKey,nickname:data.nickname,quantity:data.quantity,unitPrice:data.unitPrice,customName:data.customName,traitData:JSON.stringify(data.traits),createdAt:stamp};
 // Rules reject updates: a simultaneous publication cannot overwrite an occupied slot.
 await a.f.setDoc(a.f.doc(a.db,'lots',sellerId+'_'+slot),payload);sellerRows.delete(sellerId);await refreshCloud();return payload.id;
}
export async function deleteCloudLot(lot){
 const a=await api();liveUser(a);if(lot.sellerId!==ownerId)throw Object.assign(Error('owner'),{code:'permission-denied'});
 // Generation guard: never delete a new listing that reused the same slot.
 const ref=a.f.doc(a.db,'lots',lot.docId);await a.f.runTransaction(a.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;if(snap.data().id!==lot.generationId)throw Object.assign(Error('stale'),{code:'listing-changed'});tx.delete(ref)});
 cloud.rows=cloud.rows.filter(r=>r.id!==lot.id);sellerRows.delete(lot.sellerId);emit();refreshCloudUI();
}
export function refreshCloudUI(){
 if(!$('#cloud-status'))return;
 $('#cloud-status').textContent=statusKey==='loading'?tr('Загружаем общие объявления…','Loading shared listings…'):statusKey==='error'?cloudError({code:errorCode}):tr(`Загружено объявлений: ${cloud.rows.length}. Поиск и фильтры — по загруженным; обновление вручную.`,`Loaded listings: ${cloud.rows.length}. Search and filters use loaded records; refresh manually.`);
 $('#cloud-refresh').textContent=tr('Обновить','Refresh');$('#cloud-more').textContent=tr('Загрузить ещё','Load more');$('#cloud-more').hidden=!hasMore;$('#cloud-refresh').disabled=$('#cloud-more').disabled=listingBusy;
 const signed=!!sessionUid;$('#cloud-profile-form').hidden=!signed;
 $('#cloud-profile-heading').textContent=tr('Публичный профиль','Public profile');$('#display-name-label').textContent=tr('Имя на сайте','Display name');$('#minecraft-name-label').textContent=tr('Ник Minecraft (3–16 символов: A–Z, 0–9, _)','Minecraft name (3–16 characters: A–Z, 0–9, _)');$('#save-public-profile').textContent=tr('Сохранить профиль','Save profile');
 $('#cloud-profile-help').textContent=tr('Имя и ник видны всем. Ник Minecraft не проверен. Чат, сделки, избранное и реклама пока не синхронизируются.','Name and nickname are public. Minecraft names are not verified. Chat, deals, favorites and ads are not synced yet.');
}
export function initCloudMarket(){
 $('#cloud-refresh').onclick=()=>refreshCloud();$('#cloud-more').onclick=()=>refreshCloud(true);
 window.addEventListener('zeno-auth-change',readOwnProfile);
 $('#cloud-profile-form').onsubmit=async e=>{e.preventDefault();const b=$('#save-public-profile');b.disabled=true;$('#profile-status').textContent='';try{await saveCloudProfile($('#public-display-name').value,$('#public-minecraft-name').value);$('#profile-status').textContent=tr('Профиль сохранён.','Profile saved.')}catch(e){$('#profile-status').textContent=cloudError(e)}finally{b.disabled=false}};
 refreshCloud();readOwnProfile();
}
