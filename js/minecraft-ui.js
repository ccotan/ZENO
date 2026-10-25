import {getSitePresence,siteOnline} from './site-presence.js';
const cache=new Map();let pending=false,next=0;
const en=()=>document.documentElement.lang==='en';
function paint(el,value){
 el.replaceChildren();el.className='mc-status';
 if(value?.name){for(const n of document.querySelectorAll('[data-mc-name]'))if(n.dataset.mcName===el.dataset.mcPlayer){n.textContent=value.name;const img=n.parentElement.querySelector('img.p-head');if(img&&img.dataset.mcName!==value.name){img.dataset.mcName=value.name;img.src='https://chromacube.deforce.site/api/head/'+encodeURIComponent(value.name)+'?s=64'}}}
 const badge=document.createElement('span');badge.className='mc-verified';badge.textContent=value?.verified?(en()?'✓ Nickname verified':'✓ Ник подтверждён'):(en()?'Nickname not verified':'Ник не подтверждён');el.append(badge);
 const status=document.createElement('span');const stale=!value.checkedAt||Date.now()-Date.parse(value.checkedAt)>75000;
 const online=stale||value.online===null?null:siteOnline(value.lastSeen);status.className='mc-online '+(online===true?'is-online':'');status.textContent=online===true?(en()?'● On site':'● На сайте'):online===false?(en()?'○ Not on site':'○ Не на сайте'):(en()?'◌ Site status unknown':'◌ Статус на сайте неизвестен');
 if(value.lastSeen&&online===false)status.title=(en()?'Last seen on site: ':'Был на сайте: ')+new Date(value.lastSeen).toLocaleString(document.documentElement.lang);
 el.append(status);if(value.checkedAt)el.title=en()?'On site = a visible ZENO tab sent a heartbeat in the last 2 minutes. Updates may be delayed.':'На сайте = видимая вкладка ZENO сообщила об активности за последние 2 минуты. Статус обновляется с задержкой.';
}
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)e.target.dataset.mcVisible='yes';else delete e.target.dataset.mcVisible;void tick()});
export function playerStatus(id){const el=document.createElement('span');el.className='mc-status';el.dataset.mcPlayer=id;el.textContent=en()?'Checking site status…':'Проверка статуса на сайте…';const v=cache.get(id);if(v)paint(el,v);observer.observe(el);return el}
function nodes(){return [...document.querySelectorAll('[data-mc-player]')].filter(e=>e.dataset.mcVisible==='yes'&&e.getClientRects().length)}
async function tick(){
 // Observe at most three unique visible profiles per batch. Never scan the full catalogue.
 if(pending||document.hidden||Date.now()<next)return;
 const ids=[...new Set(nodes().map(e=>e.dataset.mcPlayer))].filter(id=>!cache.has(id)||Date.now()-cache.get(id)._at>60000).slice(0,3);if(!ids.length)return;
 pending=true;next=Date.now()+5000;
 try{const rows=await getSitePresence(ids);if(!Array.isArray(rows))throw Error('response');for(const row of rows)if(ids.includes(row.publicId))cache.set(row.publicId,{...row,_at:Date.now()})}
 catch{for(const id of ids){const prev=cache.get(id);cache.set(id,{...prev,verified:prev?.verified??false,online:null,checkedAt:null,_at:Date.now(),failed:true})}}
 finally{pending=false;for(const el of nodes()){const v=cache.get(el.dataset.mcPlayer);if(v){if(v.failed&&!v.verified){el.textContent=en()?'Site status unavailable':'Статус на сайте недоступен'}else paint(el,v)}}}
}
setInterval(()=>{for(const el of nodes()){const v=cache.get(el.dataset.mcPlayer);if(v&&!v.failed)paint(el,v)}void tick()},5000);
// Clean up detached catalogue cards and dialogs; do not retain historical render trees.
new MutationObserver(records=>{for(const r of records)for(const n of r.removedNodes)if(n.nodeType===1){if(n.matches('[data-mc-player]'))observer.unobserve(n);for(const el of n.querySelectorAll('[data-mc-player]'))observer.unobserve(el)}}).observe(document.documentElement,{childList:true,subtree:true});
