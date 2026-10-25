import {config} from './config.js';
import {getFirebaseSession} from './discord-auth.js';
const fail=code=>Object.assign(new Error(code),{code});
export async function callMinecraft(name,data={},signed=true){
 const headers={'Content-Type':'application/json'};
 if(signed){const a=await getFirebaseSession(),u=a.instance.currentUser;if(!u)throw fail('auth/sign-in-required');headers.Authorization='Bearer '+await u.getIdToken()}
 let base;try{const u=new URL(config.marketApiOrigin||config.discordAuthOrigin);if(u.protocol!=='https:'||u.origin!==(config.marketApiOrigin||config.discordAuthOrigin))throw Error();base=u.origin+'/api/market'}catch{throw fail('minecraft-unavailable')}
 let r,b;try{r=await fetch(base+'/'+name,{method:'POST',headers,body:JSON.stringify({data}),signal:AbortSignal.timeout(45000)});b=await r.json()}catch{throw fail('minecraft-unavailable')}
 if(!r.ok||b.error){const reason=b.error?.details?.reason;throw fail(typeof reason==='string'?reason:b.error?.status==='RESOURCE_EXHAUSTED'?'minecraft-rate':'minecraft-unavailable')}
 return b.result??b.data;
}
export async function verifyOwn(){return callMinecraft('verifyMinecraft')}
export async function ensureTrade(data){const result=await callMinecraft('verifyTradeParticipants',data);if(!result?.allowed)throw fail('minecraft-unavailable');return result}
// Public JSON supports CORS; no partner key, ID token or server writes are needed.
export async function getPresence(profileIds){
 if(!Array.isArray(profileIds)||profileIds.length>3)throw fail('minecraft-unavailable');
 const market=await import('./market.js');
 return Promise.all(profileIds.map(async id=>{const p=await market.publicProfile(id,true);if(!p?.minecraftVerified||!/^[A-Za-z0-9_]{3,16}$/.test(p.minecraftName||'')||!/^[a-f0-9]{32}$/i.test(p.minecraftUuid||''))return {publicId:id,verified:false,online:null,lastSeen:null};
 let online=null,lastSeen=null;try{const r=await fetch('https://chromacube.deforce.site/u/'+encodeURIComponent(p.minecraftName)+'?format=json',{credentials:'omit',headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});const b=await r.json();if(r.ok&&b.v===1&&b.name?.toLowerCase()===p.minecraftName.toLowerCase()&&typeof b.uuid==='string'&&b.uuid.toLowerCase().replaceAll('-','')===p.minecraftUuid&&typeof b.online==='boolean'){online=b.online;if(typeof b.last_seen==='string'&&Number.isFinite(Date.parse(b.last_seen)))lastSeen=new Date(b.last_seen).toISOString()}}catch{}
 return {publicId:id,verified:true,name:p.minecraftName,online,lastSeen,checkedAt:new Date().toISOString()};
 }));
}
export function accessText(reason,en=false){const values={
 ok:['Ник подтверждён. Торговля разрешена.','Nickname verified. Trading is allowed.'],
 'not-linked':['Торговля закрыта: привяжи Minecraft к своему Discord на Chromacube.','Trading is locked: link Minecraft to your Discord on Chromacube.'],
 'no-vanilla':['Торговля закрыта: нет доступа к ваниле на Chromacube.','Trading is locked: no Chromacube vanilla access.'],
 banned:['Торговля закрыта: на Chromacube действует бан.','Trading is locked: banned on Chromacube.'],
 'site-blocked':['Торговля закрыта: аккаунт заблокирован на ZENO.','Trading is locked: account blocked on ZENO.'],
 unavailable:['Проверка недоступна. Торговля закрыта до успешной проверки.','Verification is unavailable. Trading is locked until a successful check.']};return (values[reason]||values.unavailable)[en?1:0]}
