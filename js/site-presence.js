// Site presence is independent of Minecraft online and never authorizes trades.
import {sdk,state} from './market.js';
export const SITE_ONLINE_MS=120000;
const HEARTBEAT_MS=60000;
let busy=false,nextAttempt=0,lastAccount='';
const pidOK=id=>typeof id==='string'&&/^[A-Za-z0-9]{20}$/.test(id);
export function siteOnline(lastSeen,now=Date.now()){
 const at=typeof lastSeen==='string'?Date.parse(lastSeen):lastSeen?.toMillis?.();
 return Number.isFinite(at)&&at<=now+5000&&now-at<SITE_ONLINE_MS;
}
export async function heartbeat(){
 if(busy||document.hidden||!navigator.onLine)return;
 const uid=state.user?.uid,id=state.publicId;
 if(!uid||!pidOK(id)||!state.profile)return;
 const account=uid+'/'+id;if(account!==lastAccount){lastAccount=account;nextAttempt=0}
 if(Date.now()<nextAttempt)return;
 busy=true;nextAttempt=Date.now()+HEARTBEAT_MS;
 try{
  const a=await sdk();if(document.hidden||a.instance.currentUser?.uid!==uid||state.publicId!==id)return;
  const ref=a.f.doc(a.db,'sitePresence',id);
  // Shared per-account document avoids false offline when another tab remains open.
  // The transaction also coalesces concurrent tabs and avoids frequent writes.
  await a.f.runTransaction(a.db,async tx=>{
   const s=await tx.get(ref),seen=s.exists()?s.data().seenAt?.toMillis?.():0;
   if(document.hidden||a.instance.currentUser?.uid!==uid||state.publicId!==id)return;
   if(Number.isFinite(seen)&&Date.now()-seen<HEARTBEAT_MS)return;
   tx.set(ref,{seenAt:a.f.serverTimestamp()});
  });
 }catch{console.warn('[ZENO site presence] heartbeat-unavailable')}
 finally{busy=false}
}
export async function getSitePresence(ids){
 if(!Array.isArray(ids)||ids.length>3||!ids.every(pidOK))throw new Error('invalid-presence-ids');
 const a=await sdk();
 return Promise.all(ids.map(async id=>{
  const [profile,snap]=await Promise.all([
   import('./market.js').then(m=>m.publicProfile(id)),
   a.f.getDocFromServer(a.f.doc(a.db,'sitePresence',id))
  ]);
  const ms=snap.exists()?snap.data().seenAt?.toMillis?.():null;
  const lastSeen=Number.isFinite(ms)?new Date(ms).toISOString():null;
  return {publicId:id,verified:profile?.minecraftVerified===true,name:profile?.minecraftName||null,online:siteOnline(lastSeen),lastSeen,checkedAt:new Date().toISOString()};
 }));
}
window.addEventListener('zeno-data',()=>{void heartbeat()});
window.addEventListener('zeno-auth-change',()=>{nextAttempt=0;void heartbeat()});
window.addEventListener('online',()=>{nextAttempt=0;void heartbeat()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){nextAttempt=0;void heartbeat()}});
window.addEventListener('pageshow',()=>{void heartbeat()});
setInterval(()=>{void heartbeat()},15000);
void heartbeat();
