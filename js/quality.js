/* ZENO usability layer. Public counts and presence are never fabricated. */
export function initQuality(h) {
 const {$,node:n,icon,x,t,show,toast,m}=h;
 const words={filters:['Фильтры','Filters'],apply:['Показать объявления','Show listings'],category:['Категория','Category'],hasPhoto:['Только с фото','With a photo'],hasEnchants:['С чарами','Enchanted'],scope:['Фильтры и сортировка применяются к загруженным объявлениям.','Filters and sorting apply to loaded listings.'],loadedScope:['Из загруженных','Loaded listings only'],dropPhoto:['Перетащи фото или нажми','Drop a photo or click'],photoTypes:['JPG, PNG или WebP. До 5 МиБ.','JPG, PNG or WebP. Up to 5 MiB.'],removePhoto:['Убрать фото','Remove photo'],selectChat:['Выбери диалог слева','Select a conversation'],chatPrivate:['Переписка доступна только участникам.','Only participants can access the conversation.']};
 const text=k=>x(...words[k]);let routeBusy=false,routeTimer,retryTimer,retries=0,lastState='';
 const mobile=matchMedia('(max-width:900px)'),sheet=matchMedia('(max-width:760px)');
 const body=$('#filter-panel-body'),note=$('.filter-note'),sort=$('.sort-control'),sortHome=sort.parentElement;
 const categories=['all','blocks','materials','tools','armor','weapons','potions','books','food','rare'];
 function placeFilters(){if(mobile.matches){body.append(note,sort)}else{$('.filters').append(note);sortHome.append(sort)}if($('#filters-dialog').open)$('#filters-dialog').close()}
 mobile.addEventListener('change',placeFilters);placeFilters();
 $('#open-filters').onclick=()=>show('filters-dialog');$('#apply-filters').onclick=()=>$('#filters-dialog').close();
 $('#filter-category').onchange=()=>{h.category=$('#filter-category').value;h.renderCategories();h.renderCatalog();saveRoute()};
 function params(){const p=new URLSearchParams();if(h.category!=='all')p.set('cat',h.category);for(const [id,key] of [['search','q'],['min-price','min'],['max-price','max']])if($('#'+id).value)p.set(key,$('#'+id).value);if($('#sort').value!=='default')p.set('sort',$('#sort').value);if($('#has-photo').checked)p.set('photo','1');if($('#has-enchants').checked)p.set('ench','1');return p}
 function saveRoute(){if(routeBusy)return;clearTimeout(routeTimer);routeTimer=setTimeout(()=>{if(location.hash.startsWith('#lot='))return;const q=params().toString();history.replaceState(null,'','#catalog'+(q?'?'+q:''))},160)}
 async function readRoute(){if(location.hash.startsWith('#lot=')){const p=new URLSearchParams(location.hash.slice(1)),id=p.get('lot');if(!id||!/^[A-Za-z0-9_-]{1,200}$/.test(id))return;try{const l=await m.fetchLot(id,p.get('v')||undefined);if(l&&l.visibility!=='hidden')await h.openLot(l);else toast(x('Лот больше не доступен','This listing is no longer available'))}catch{toast(x('Не удалось открыть лот. Проверь соединение и доступ.','Could not open the listing. Check your connection and access.'))}return}
  if(!location.hash.startsWith('#catalog'))return;const p=new URLSearchParams(location.hash.split('?')[1]||'');routeBusy=true;h.category=categories.includes(p.get('cat'))?p.get('cat'):'all';$('#filter-category').value=h.category;
  for(const [id,key] of [['search','q'],['min-price','min'],['max-price','max']]){const v=(p.get(key)||'').slice(0,100);$('#'+id).value=id==='search'?v:/^\d{1,16}$/.test(v)?v:''}
  $('#sort').value=['default','priceAsc','priceDesc','name'].includes(p.get('sort'))?p.get('sort'):'default';$('#has-photo').checked=p.get('photo')==='1';$('#has-enchants').checked=p.get('ench')==='1';h.renderCategories();h.renderCatalog();routeBusy=false;
 }
 for(const id of ['search','min-price','max-price','sort','has-photo','has-enchants'])$('#'+id).addEventListener('input',()=>{h.renderCatalog();saveRoute()});
 document.addEventListener('click',e=>{if(e.target.closest('#categories button,#side-categories button,#reset-filters')){if(e.target.closest('#reset-filters')){$('#has-photo').checked=$('#has-enchants').checked=false;h.renderCatalog()}$('#filter-category').value=h.category;saveRoute()}});
 function suggestions(){const q=$('#search').value.trim().toLowerCase();const list=$('#search-suggestions');list.replaceChildren();if(q.length<2)return;const en=document.documentElement.lang==='en';const options=h.catalog.items.filter(i=>(i.ru+' '+i.en+' '+i.key).toLowerCase().includes(q)).slice(0,7).map(i=>i[en?'en':'ru']);options.push(...h.enchantments.filter(i=>(i.ru+' '+i.en).toLowerCase().includes(q)).slice(0,3).map(i=>i[en?'en':'ru']));for(const v of options){const o=n('option');o.value=v;list.append(o)}}
 $('#search').addEventListener('input',suggestions);
 // Menu anchored to the real topbar bounds, with a separate backdrop.
 const menu=$('#menu'),nav=$('#navigation'),backdrop=$('#menu-backdrop');
 function closeMenu(focus=false){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');backdrop.hidden=true;document.body.classList.remove('q-menu-open');if(focus)menu.focus()}
 function menuPosition(){const r=$('.topbar').getBoundingClientRect();nav.style.setProperty('--menu-top',Math.round(r.bottom+8)+'px')}
 menu.onclick=()=>{if(nav.classList.contains('open'))return closeMenu();menuPosition();nav.classList.add('open');menu.setAttribute('aria-expanded','true');backdrop.hidden=false;document.body.classList.add('q-menu-open')};
 backdrop.onclick=()=>closeMenu(true);nav.addEventListener('click',()=>closeMenu());window.addEventListener('resize',()=>{closeMenu();menuPosition()});window.addEventListener('scroll',menuPosition,{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){e.preventDefault();closeMenu(true)}});
 // File drop uses the same validation/compression pipeline as the file picker.
 const drop=$('#photo-dropzone'),photo=$('#lot-photo');
 drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();photo.click()}});
 for(const ev of ['dragenter','dragover'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('q-drag')});
 for(const ev of ['dragleave','drop'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('q-drag')});
 drop.addEventListener('drop',e=>{if(!e.dataTransfer?.files.length)return;const dt=new DataTransfer();dt.items.add(e.dataTransfer.files[0]);photo.files=dt.files;h.changePhoto()});
 $('#remove-photo').onclick=()=>{photo.value='';h.changePhoto()};
 // Standardized dialog focus and header swipe. Never swipe-close edited forms silently.
 const original=HTMLDialogElement.prototype.showModal;
 HTMLDialogElement.prototype.showModal=function(){closeMenu();original.call(this);this.dataset.qDirty='';queueMicrotask(()=>{const input=[...this.querySelectorAll('input:not([type=file]):not([type=checkbox]),textarea,select')].find(e=>!e.disabled&&!e.hidden&&e.getClientRects().length);const heading=this.querySelector('h2');if(!input&&heading)heading.tabIndex=-1;(input||heading)?.focus({preventScroll:true})})};
 for(const dialog of document.querySelectorAll('dialog')){
  dialog.addEventListener('input',()=>dialog.dataset.qDirty='1');let start=null;
  dialog.addEventListener('touchstart',e=>{if(!sheet.matches||!e.target.closest('header')||e.target.closest('button,input,a,select'))return;start={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
  dialog.addEventListener('touchend',e=>{if(!start)return;const dy=e.changedTouches[0].clientY-start.y,dx=Math.abs(e.changedTouches[0].clientX-start.x);start=null;if(dy>90&&dy>dx*1.5){if(dialog.dataset.qDirty==='1'&&dialog.querySelector('form')&&!confirm(x('Закрыть окно? Несохранённые изменения могут потеряться.','Close this window? Unsaved changes may be lost.')))return;dialog.close()}},{passive:true});
 }
 $('#lot-dialog').addEventListener('close',()=>{if(location.hash.startsWith('#lot=')){const q=params().toString();history.replaceState(null,'','#catalog'+(q?'?'+q:''))}});
 window.addEventListener('hashchange',readRoute);
 function catalogChanged(){const state=m.state.status;if(state==='ready'){retries=0;clearTimeout(retryTimer)}if(state==='error'&&lastState!=='error'&&navigator.onLine&&['unavailable','deadline-exceeded','network-request-failed'].some(c=>(m.state.error||'').includes(c))&&retries<3){retryTimer=setTimeout(()=>{retries++;m.loadCatalog()},Math.min(30000,3000*2**retries))}lastState=state;$('#filter-category').value=h.category}
 window.addEventListener('online',()=>{clearTimeout(retryTimer);retries=0;m.loadCatalog()});
 function sync(){for(const e of document.querySelectorAll('[data-q]'))if(words[e.dataset.q])e.textContent=text(e.dataset.q);$('#filter-category').replaceChildren(...categories.map(k=>{const o=n('option',t('categories.'+k));o.value=k;return o}));$('#filter-category').value=h.category;$('#search').placeholder=x('Найти предмет','Find an item');suggestions();catalogChanged()}
 sync();readRoute();
 return {sync,catalogChanged,lotOpened(l){const target='#lot='+encodeURIComponent(l.docId)+'&v='+encodeURIComponent(m.generation(l));if(location.hash!==target)history.pushState(null,'',target)},async shareLot(l){const url=new URL(location.href);url.hash='lot='+encodeURIComponent(l.docId)+'&v='+encodeURIComponent(m.generation(l));try{await navigator.clipboard.writeText(url.href);toast(x('Ссылка на лот скопирована','Listing link copied'))}catch{prompt(x('Скопируй ссылку на лот','Copy this listing link'),url.href)}}};
}
