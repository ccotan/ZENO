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
export function accessText(reason,en=false){const values={
 ok:['Ник подтверждён. Торговля разрешена.','Nickname verified. Trading is allowed.'],
 'not-linked':['Торговля закрыта: привяжи Minecraft к своему Discord на Chromacube.','Trading is locked: link Minecraft to your Discord on Chromacube.'],
 'no-vanilla':['Торговля закрыта: нет доступа к ваниле на Chromacube.','Trading is locked: no Chromacube vanilla access.'],
 banned:['Торговля закрыта: на Chromacube действует бан.','Trading is locked: banned on Chromacube.'],
 'site-blocked':['Торговля закрыта: аккаунт заблокирован на ZENO.','Trading is locked: account blocked on ZENO.'],
 unavailable:['Проверка недоступна. Торговля закрыта до успешной проверки.','Verification is unavailable. Trading is locked until a successful check.']};return (values[reason]||values.unavailable)[en?1:0]}
