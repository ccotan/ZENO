import {playerStatus} from './minecraft-ui.js';
import {accessText} from './minecraft-data.js';
import { initTrading, trading } from "./trading-ui.js";
import { initQuality } from "./quality.js";
import { initExperience, experience } from "./experience.js";
import { initAdmin, openReport } from "./admin.js";
import * as m from "./market.js";
import {
  initDiscordAuth,
  showDiscordAuth,
  refreshDiscordAuth,
} from "./discord-auth.js";
const $ = (s) => document.querySelector(s),
  node = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  },
  icon = (name) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
      use = document.createElementNS(svg.namespaceURI, "use");
    use.setAttribute("href", "./assets/icons.svg#icon-" + name);
    svg.append(use);
    svg.setAttribute("aria-hidden", "true");
    return svg;
  };
let lang = "ru",
  catalog,
  dict,
  enchantments,
  category = "all",
  page = 0,
  pickerPage = 0,
  selected = null,
  ench = new Map(),
  currentLot = null,
  currentThread = null,
  currentMessageCursor = null,
  older = [],
  latest = [],
  stopMessages = null,
  chatVersion = 0,
  favSignature = "",
  photoURL = null,
  preparedPhoto = null,
  photoVersion = 0,
  photoBusy = false,
  quality = null,
  sellerId = null,
  toastTimer;
const catKeys = [
    "all",
    "blocks",
    "materials",
    "tools",
    "armor",
    "weapons",
    "potions",
    "books",
    "food",
    "rare",
  ],
  catItems = {
    all: "crafting_table",
    blocks: "grass_block",
    materials: "diamond",
    tools: "diamond_pickaxe",
    armor: "diamond_chestplate",
    weapons: "diamond_sword",
    potions: "potion",
    books: "enchanted_book",
    food: "golden_apple",
    rare: "nether_star",
  };
const x = (ru, en) => (lang === "en" ? en : ru),
  txt = (k) => {
    const v = labels[k];
    return v ? x(...v) : k;
  },
  item = (k) => catalog.items.find((i) => i.key === k),
  name = (i) => i?.[lang] || i?.key || "-",
  format = (n) => new Intl.NumberFormat(lang).format(n),
  time = (v) =>
    v?.toDate
      ? new Intl.DateTimeFormat(lang, {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(v.toDate())
      : "";
const labels = {
  account: ["Аккаунт", "Account"],
  verifyMinecraft: ["Проверить привязку Minecraft", "Verify Minecraft link"],
  verificationHelp: ["Ник берётся из Minecraft-аккаунта, привязанного к твоему Discord на Chromacube. Ввод чужого ника отключён. Для торговли нужны доступ к ваниле и отсутствие бана.", "Your nickname comes from the Minecraft account linked to your Discord on Chromacube. Manual nickname entry is disabled. Trading requires vanilla access and no ban."],
  linkChromacube: ["Открыть Chromacube для привязки ↗", "Open Chromacube to link accounts ↗"],
  minecraftName: ["Ник Minecraft", "Minecraft nickname"],
  nicknameHelp: [
    "3-16 символов: A-Z, a-z, цифры и _. Ник виден другим игрокам.",
    "3-16 characters: A-Z, a-z, digits and _. Your nickname is public.",
  ],
  save: ["Сохранить", "Save"],
  myLots: ["Мои объявления", "My listings"],
  deals: ["Сделки", "Deals"],
  logout: ["Выйти", "Sign out"],
  newLot: ["Новое объявление", "New listing"],
  selectItem: ["Выбери предмет", "Select an item"],
  itemSearch: ["Название предмета…", "Search items…"],
  quantity: ["Количество, шт.", "Quantity, items"],
  unitPrice: ["Цена за 1 шт., АР", "Unit price, AR"],
  customName: [
    "Название предмета (необязательно)",
    "Custom item name (optional)",
  ],
  enchantments: ["Чары (необязательно)", "Enchantments (optional)"],
  enchantSearch: ["Поиск чар…", "Search enchantments…"],
  photo: ["Фото предмета", "Item photo"],
  photoHelp: [
    "JPG, PNG или WebP до 5 МБ. Перед загрузкой изображение уменьшается и сжимается.",
    "JPG, PNG or WebP up to 5 MB. Images are resized and compressed before upload.",
  ],
  total: ["За весь лот", "Total price"],
  saveDraft: ["Сохранить черновик", "Save draft"],
  loadDraft: ["Открыть черновик", "Load draft"],
  publish: ["Опубликовать", "Publish"],
  favorites: ["Избранное", "Favorites"],
  chats: ["Чаты", "Chats"],
  message: ["Сообщение…", "Write a message…"],
  olderMessages: ["Ранние сообщения", "Earlier messages"],
  notifications: ["Уведомления", "Notifications"],
  rules: ["Правила", "Rules"],
  exchangeNotice: [
    "Обмен происходит в Minecraft. Сначала договоритесь с продавцом, проверьте предмет и количество. Подтверждайте завершение только после обмена.",
    "Trade takes place in Minecraft. Agree with the seller and check the item and quantity. Confirm completion only after the exchange.",
  ],
  rulesBody: [
    "Не передавай пароли и коды входа. Ник и чары указывает сам игрок. Сайт не проверяет игровой инвентарь. Запрос сделки резервирует количество; любой участник может отменить незавершённую сделку. Завершение фиксируется после подтверждения обоих участников.",
    "Never share passwords or sign-in codes. Nicknames and enchantments are provided by players; the website cannot verify game inventories. A deal request reserves stock; either participant can cancel an unfinished deal. Completion requires both participants to confirm.",
  ],
  footer: [
    "Независимый маркетплейс Minecraft. Без кошельков и онлайн-оплаты.",
    "Independent Minecraft marketplace. No wallets or online payments.",
  ],
};
function t(k) {
  return k.split(".").reduce((v, p) => v?.[p], dict?.[lang]) || k;
}
function sprite(i) {
  const s = node("span", undefined, "item-icon");
  s.style.setProperty("--col", (i?.index || 0) % catalog.meta.columns);
  s.style.setProperty(
    "--row",
    Math.floor((i?.index || 0) / catalog.meta.columns) % 8,
  );
  const atlasPart = Math.floor((i?.index || 0) / (catalog.meta.columns * 8));
  s.style.setProperty("--item-atlas", `url("../assets/items-${atlasPart}.webp")`);
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", name(i));
  return s;
}
function head(nick) {
  const img = node("img", undefined, "p-head");
  img.alt = "";
  img.width = img.height = 54;
  img.referrerPolicy = "no-referrer";
  img.loading = "lazy";
  img.src = /^[A-Za-z0-9_]{3,16}$/.test(nick || "")
    ? "https://minotar.net/helm/" + encodeURIComponent(nick) + "/64.png"
    : "./assets/head-placeholder.svg";
  img.classList.add("q-head-loading");
  img.onload = () => img.classList.remove("q-head-loading");
  img.onerror = () => {
    img.onerror = null;
    img.src = "./assets/head-placeholder.svg";
  };
  return img;
}
function money(n) {
  const e = node("span", format(n)),
    img = node("img", undefined, "currency");
  img.src = "./assets/ar-icon.png";
  img.alt = "АР";
  e.append(" ", img);
  return e;
}
function toast(text) {
  clearTimeout(toastTimer);
  $("#toast").textContent = text;
  $("#toast").style.display = "block";
  toastTimer = setTimeout(() => ($("#toast").style.display = "none"), 4000);
}
function error(e) {
  if(e?.code?.startsWith('minecraft-'))return accessText(e.code.slice(10),lang==='en');
  if(e?.code?.startsWith('counterparty-'))return x('У второго участника торговля недоступна. Нужны привязка Minecraft, доступ к ваниле и отсутствие бана.','The other participant cannot trade. A linked Minecraft account, vanilla access and no ban are required.');
  const code = m.codeOf(e),
    messages = {
      "subscription-limit": x("Достигнут лимит интерфейса: 50 подписок. Удали ненужную.","Interface limit: 50 subscriptions. Remove an unused one."),
      "deal-expired": x("48 часов истекли. Отмените сделку, чтобы освободить резерв.","48 hours elapsed. Cancel the trade to release stock."),
      "listing-paused": x("Продавец снял лот с продажи.","Seller paused this listing."),
      "promo-limit": x(
        "Заняты все 10 рекламных мест. Удалите ненужный баннер.",
        "All 10 banner slots are occupied. Delete an unused banner.",
      ),
      "dates-invalid": x(
        "Дата окончания должна быть позже начала.",
        "The end must be after the start.",
      ),
      "link-invalid": x(
        "Нужна HTTPS-ссылка без логина и пароля.",
        "Use an HTTPS link without a username or password.",
      ),
      "nickname-ambiguous": x(
        "Этот ник используют несколько аккаунтов. Найдите пользователя по UID.",
        "Several accounts use this nickname. Search by UID.",
      ),
      "profile-required": x(
        "Сначала подтверди Minecraft-привязку в аккаунте.",
        "Verify your Minecraft link in Account first.",
      ),
      "auth/sign-in-required": x(
        "Сначала войди через Discord.",
        "Sign in with Discord first.",
      ),
      "nickname-invalid": x(
        "Проверь ник: 3-16 латинских букв, цифры или _.",
        "Use 3-16 letters, digits or _.",
      ),
      "listing-limit": x(
        "Не больше 50 активных объявлений.",
        "Maximum 50 active listings.",
      ),
      "listing-reserved": x(
        "В лоте есть резерв. Заверши или отмени сделки перед удалением.",
        "The listing has reservations. Complete or cancel its deals before deleting.",
      ),
      "listing-changed": x(
        "Лот изменился. Обнови каталог.",
        "The listing changed. Refresh the catalog.",
      ),
      "listing-unavailable": x(
        "Лот уже недоступен.",
        "This listing is no longer available.",
      ),
      "quantity-unavailable": x(
        "Такого количества уже нет в наличии.",
        "That quantity is no longer available.",
      ),
      "bump-cooldown": x("Поднять лот можно раз в 24 часа.","A listing can be bumped once every 24 hours."),
      "listing-hidden": x("Лот скрыт модератором. Правка недоступна.","Listing hidden by moderation. Editing unavailable."),
      "price-changed": x(
        "Цена изменилась. Обнови лот перед подтверждением.",
        "The price changed. Refresh the listing before confirming.",
      ),
      "photo-too-large": x(
        "Выбери фото до 5 МБ.",
        "Choose a photo up to 5 MB.",
      ),
      "photo-type": x(
        "Поддерживаются JPG, PNG и WebP.",
        "JPG, PNG and WebP are supported.",
      ),
      "photo-dimensions": x(
        "Фото слишком большого разрешения.",
        "The image dimensions are too large.",
      ),
      "photo-compression": x(
        "Не удалось уменьшить фото. Выбери другое изображение.",
        "Could not compress this photo. Choose another image.",
      ),
      "permission-denied": x(
        "Нет доступа к операции. Проверь вход и обнови страницу.",
        "This action is not allowed. Check sign-in and refresh.",
      ),
      "favorite-limit": x(
        "Можно сохранить до 100 избранных записей.",
        "Up to 100 favorite entries can be saved.",
      ),
      "deal-state-changed": x(
        "Состояние сделки изменилось. Открой её снова.",
        "The deal status changed. Open it again.",
      ),
    };
  return (
    messages[code] ||
    x(
      "Не удалось выполнить запрос. Проверь соединение и попробуй ещё раз.",
      "Request failed. Check your connection and try again.",
    )
  );
}
async function task(button, status, fn) {
  if (button?.disabled) return;
  const old = button?.disabled;
  if (button) button.disabled = true;
  if (status) status.textContent = "";
  try {
    return await fn();
  } catch (e) {
    if (status) status.textContent = error(e);
    else toast(error(e));
  } finally {
    if (button) button.disabled = old || false;
  }
}
function show(id) {
  for (const d of document.querySelectorAll("dialog[open]"))
    if (d.id !== id) d.close();
  if (!$("#" + id).open) $("#" + id).showModal();
}
function requireAccount(reason = "") {
  if (!m.state.user || !m.state.profile) {
    showDiscordAuth();
    if(reason === "favorites") $("#auth-note").textContent = x("Войди через Discord, чтобы сохранять избранное.","Sign in with Discord to save favorites.");
    return false;
  }
  return true;
}
function setUI() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-t]").forEach((e) => {
    const v = t(e.dataset.t);
    if (typeof v === "string") e.textContent = v;
  });
  document
    .querySelectorAll("[data-placeholder]")
    .forEach((e) => (e.placeholder = t(e.dataset.placeholder)));
  document
    .querySelectorAll("[data-label]")
    .forEach((e) => e.setAttribute("aria-label", t(e.dataset.label)));
  document
    .querySelectorAll("[data-ui]")
    .forEach((e) => (e.textContent = txt(e.dataset.ui)));
  document
    .querySelectorAll("[data-ph]")
    .forEach((e) => (e.placeholder = txt(e.dataset.ph)));
  $("#language").replaceChildren(
    ...["ru", "en"].map((k) =>
      node("span", k.toUpperCase(), k === lang ? "current" : ""),
    ),
  );
  $("#refresh").textContent = x("Обновить", "Refresh");
  $("#load-more").textContent = x("Загрузить ещё", "Load more");
  refreshDiscordAuth();
  renderAccount();
  renderCategories();
  renderCatalog();
  renderThreads();
  renderDeals();
  renderNotifications();
  if ($("#sale-dialog").open) {
    renderPicker();
    renderEnchants();
    renderSelection();
  }
  quality?.sync();
}
function renderAccount() {
  const signed = !!m.state.user,
    nick = m.state.profile?.minecraftName;
  $("#profile-form").hidden = $("#account-links").hidden = !signed;
  $("#my-lots").disabled = !m.state.profile;
  $("#auth-note").hidden = signed;
  $("#account-connection").textContent = signed
    ? x("Discord подключён", "Discord connected")
    : "";
  const old = $("#account-head"),
    img = head(nick);
  img.id = "account-head";
  old.replaceWith(img);
  const field = $("#minecraft-name");
  field.value = nick || "";
  field.readOnly=true;field.required=false;
  $("#minecraft-access").textContent=signed?accessText(m.state.minecraftAccess?.reason,lang==='en'):"";
  $("#minecraft-access").classList.toggle("is-allowed",m.state.minecraftAccess?.allowed===true);
  if(signed&&m.state.publicId&&$("#account-minecraft-status").querySelector("[data-mc-player]")?.dataset.mcPlayer!==m.state.publicId)$("#account-minecraft-status").replaceChildren(playerStatus(m.state.publicId));
  if(!signed)$("#account-minecraft-status").replaceChildren();
  const login = $('[data-action="login"]'),
    oldImg = login.querySelector(".p-head");
  if (oldImg) oldImg.remove();
  const mini = head(nick);
  mini.hidden = !signed;
  login.prepend(mini);
  const span = login.querySelector("span");
  span.textContent = signed ? x("Аккаунт", "Account") : x("Войти", "Sign in");
  if (m.state.privateError)
    $("#profile-status").textContent = error({ code: m.state.privateError });
}
function matches(i, q) {
  const all = (i.ru + " " + i.en + " " + i.key).toLowerCase();
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((w) => all.includes(w));
}
function renderCategories() {
  for (const id of ["categories", "side-categories"]) {
    $("#" + id).replaceChildren(
      ...catKeys.map((k) => {
        const b = node(
          "button",
          undefined,
          id === "categories" ? "chip" : "side-category",
        );
        b.type = "button";
        b.classList.toggle("active", category === k);
        b.setAttribute("aria-pressed", String(category === k));
        b.append(sprite(item(catItems[k])), node("span", t("categories." + k)));
        b.onclick = () => {
          category = k;
          page = 0;
          renderCategories();
          renderCatalog();
        };
        return b;
      }),
    );
  }
}
const photoObservers = new Map();
function prunePhotoObservers() {
  for (const [el, observer] of photoObservers)
    if (!el.isConnected) {
      observer.disconnect();
      photoObservers.delete(el);
    }
}
const available = (l) => l.availableQty ?? l.quantity;
function renderCatalog() {
  prunePhotoObservers();
  if (!catalog) return;
  const query = $("#search").value;
  let rows = m.state.rows.filter(l => l.visibility !== "hidden" && !l.salePaused && item(l.itemKey)).filter(l => {
    let traits = "";
    try { traits = (JSON.parse(l.traitData || "{}").enchantmentSelections || []).map(v => {const e = enchantments.find(e=>e.id === v.id);return e ? e.ru+" "+e.en+" "+v.level : v.id}).join(" "); } catch {}
    return (category === "all" || item(l.itemKey).category === category) && matches({...item(l.itemKey),ru:item(l.itemKey).ru+" "+(l.customName||"")+" "+l.nickname+" "+traits,en:item(l.itemKey).en+" "+(l.customName||"")+" "+l.nickname+" "+traits},query);
  });
  const min=$("#min-price").value,max=$("#max-price").value;
  if(min!=="")rows=rows.filter(l=>l.unitPrice*available(l)>=Number(min));
  if(max!=="")rows=rows.filter(l=>l.unitPrice*available(l)<=Number(max));
  if($("#has-photo").checked)rows=rows.filter(l=>l.hasPhoto);
  if($("#has-enchants").checked)rows=rows.filter(l=>{try{return !!JSON.parse(l.traitData||"{}").enchantmentSelections?.length}catch{return false}});
  const sort=$("#sort").value;
  rows.sort(sort === "priceAsc" ? (a,b)=>a.unitPrice*available(a)-b.unitPrice*available(b) : sort === "priceDesc" ? (a,b)=>b.unitPrice*available(b)-a.unitPrice*available(a) : sort === "name" ? (a,b)=>name(item(a.itemKey)).localeCompare(name(item(b.itemKey)),lang) : (a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
  const box=$("#results"),status=$("#catalog-status");
  box.replaceChildren();box.setAttribute("aria-busy",String(m.state.status === "loading"));
  status.dataset.state=m.state.status === "error" ? "error" : m.state.status === "loading" ? "loading" : m.state.catalogFromCache ? "offline" : "success";
  status.classList.toggle("v-offline",m.state.catalogFromCache);
  $(".cloud-controls").hidden = m.state.status === "error";
  if(m.state.status === "error") {
    const empty=node("div",undefined,"q-empty q-error"),retry=node("button",x("Повторить","Try again"),"v-primary");retry.type="button";retry.onclick=()=>m.loadCatalog();empty.setAttribute("role","alert");empty.append(icon("refresh"),node("h3",x("Не удалось загрузить объявления","Could not load listings")),node("p",error({code:m.state.error})),retry);box.append(empty);
  } else if(!rows.length && m.state.status === "loading") {
    for(let i=0;i<6;i++){const sk=node("div",undefined,"q-skeleton-card");sk.setAttribute("aria-hidden","true");sk.append(node("div"),node("span"),node("span"));box.append(sk)}
  } else if(!rows.length) {
    const empty=node("div",undefined,"q-empty"),reset=node("button",x("Сбросить фильтры","Reset filters"),"v-secondary");reset.type="button";reset.onclick=()=>$("#reset-filters").click();empty.append(icon("grid"),node("h3",x("Объявлений пока нет","No listings found")),node("p",x("Попробуй другой поиск или создай свой лот.","Try another search or publish a listing.")),reset);box.append(empty);
  } else box.append(...rows.map(card));
  status.textContent=m.state.status === "loading" ? x("Обновляем объявления…","Updating listings…") : (m.state.catalogFromCache ? x("Нет соединения. Показаны сохранённые данные.","Offline. Showing cached data.") : x("Обновляется автоматически","Updates automatically"))+" · "+x("Загружено: ","Loaded: ")+m.state.rows.length;
  $("#result-count").textContent=x(`Найдено: ${rows.length} из загруженных`,`Found: ${rows.length} in loaded listings`);
  $("#load-more").hidden=!m.state.more||m.state.status === "error";$("#load-more").disabled=m.state.status === "loading";
  quality?.catalogChanged();
}

function art(l) {
  const a = node("div", undefined, "listing-art inventory-slot");
  a.append(
    sprite(item(l.itemKey)),
    node("span", String(available(l)), "slot-count"),
  );
  if (l.hasPhoto) {
    const img = node("img", undefined, "p-photo");
    img.alt = name(item(l.itemKey));
    img.hidden = true;
    img.loading = "lazy";
    a.append(img);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        photoObservers.delete(a);
        m.loadPhoto(l)
          .then((src) => {
            if (src) {
              img.src = src;
              img.hidden = false;
              a.querySelector(".item-icon").hidden = true;
            }
          })
          .catch(() => {
            img.hidden = true;
          });
      }
    });
    photoObservers.set(a, observer);
    observer.observe(a);
  }
  return a;
}
function person(l) {
  const b = node("button", undefined, "p-person seller-open");
  b.type = "button";
  const nick=node("span",l.nickname||"-");nick.dataset.mcName=l.sellerId;b.append(head(l.nickname),nick);
  b.onclick = () => openSeller(l.sellerId, l.nickname);
  return b;
}
function card(l) {
 const c=node("article",undefined,"listing-card"),open=node("button",undefined,"listing-open");open.type="button";open.setAttribute("aria-label",l.customName||name(item(l.itemKey)));open.append(art(l));open.onclick=()=>openLot(l);
 const f=node("button",undefined,"listing-heart");f.type="button";const saved=m.state.favorites.some(v=>v.docId===m.favoriteId(l));f.setAttribute("aria-label",x("В избранное","Favorite"));f.setAttribute("aria-pressed",String(saved));f.classList.toggle("selected",saved);f.append(icon("heart"));f.onclick=()=>{if(requireAccount("favorites"))task(f,null,()=>m.toggleFavorite(l))};
 const title=node("h3",l.customName||name(item(l.itemKey)),"listing-title"),price=node("div",undefined,"listing-price"),unit=node("small",x("за штуку","per item"),"q-price-caption");price.append(money(l.unitPrice),unit);
 const quantity=node("p",x(`В наличии: ${format(available(l))} шт.`,`Available: ${format(available(l))}`),"listing-quantity");c.append(open,f,title,price,quantity);
 if(available(l)>1){const total=node("p",undefined,"listing-unit-price");total.append(x("Весь лот: ","Whole lot: "),money(l.unitPrice*available(l)));c.append(total)}
 c.append(person(l),playerStatus(l.sellerId));trading.decorate(c,l);c.addEventListener("click",e=>{if(!e.target.closest("button,a,input,select"))openLot(l)});return c;
}

function renderSellerFavorite() {
  const b = $("[data-favorite-seller]");
  if (!b) return;
  const saved = m.state.favorites.some(
    (v) => v.docId === "s_" + b.dataset.favoriteSeller,
  );
  b.setAttribute("aria-pressed", String(saved));
  b.classList.toggle("selected", saved);
  b.querySelector("span").textContent = saved
    ? x("В избранном", "Saved seller")
    : x("В избранное", "Save seller");
}
async function openSeller(id, nickname) {
  try {
    await experience.openSeller(id, nickname);
  } catch (e) {
    $("#seller-status").textContent = error(e);
  }
}
async function openLot(l) {
  currentLot = l;
  quality?.lotOpened(l);
  $("#lot-title").textContent = name(item(l.itemKey));
  $("#lot-content").replaceChildren();
  const layout = node("div", undefined, "p-lot-layout"),
    media = node("div", undefined, "p-lot-art"),
    info = node("div", undefined, "p-lot-info");
  media.append(art(l));
  info.append(node("h3", l.customName || name(item(l.itemKey))), person(l),playerStatus(l.sellerId));
  const share=node("button",x("Поделиться лотом","Share listing"),"v-secondary");share.type="button";share.onclick=()=>quality?.shareLot(l);info.append(share);
  const price = node("div", undefined, "p-price");
  price.append(money(l.unitPrice * available(l)));
  info.append(
    node("small", txt("total")),
    price,
    node(
      "p",
      x(
        `В наличии: ${available(l)} • В резерве: ${l.reservedQty || 0}`,
        `Available: ${available(l)} • Reserved: ${l.reservedQty || 0}`,
      ),
    ),
  );
  const trait = node("div");
  try {
    const data = JSON.parse(l.traitData || "{}");
    for (const en of (data.enchantmentSelections || []).slice(0, 43)) {
      const e = enchantments.find((v) => v.id === en.id);
      if (
        e &&
        Number.isInteger(en.level) &&
        en.level > 0 &&
        en.level <= e.maxLevel
      )
        trait.append(node("p", e[lang] + " " + en.level));
    }
  } catch {}
  info.append(trait);
  if (l.visibility === "hidden")
    info.append(
      node(
        "p",
        x(
          "Объявление скрыто модерацией. Новые сделки недоступны.",
          "Listing hidden by moderation. New deals are disabled.",
        ),
        "a-hidden-lot",
      ),
    );
  const report = node(
    "button",
    x("Пожаловаться", "Report"),
    "a-report-link text-button",
  );
  report.type = "button";
  report.onclick = () =>
    openReport({
      kind: "lot",
      id: l.docId,
      generation: m.generation(l),
      label: l.customName || name(item(l.itemKey)),
    });
  info.append(report);trading.lotActions(info,l);
  const status = node("p", undefined, "p-status");
  status.id = "lot-status";
  if (m.owns(l)) {
    const del = node(
      "button",
      x("Удалить объявление", "Delete listing"),
      "text-button",
    );
    del.id = "delete-lot";
    del.type = "button";
    del.append(icon("close"));
    del.onclick = () => {
      if (
        confirm(
          x("Удалить объявление и фото?", "Delete the listing and photo?"),
        )
      )
        task(del, status, async () => {
          await m.deleteLot(l);
          $("#lot-dialog").close();
          toast(x("Объявление удалено", "Listing deleted"));
        });
    };
    info.append(del);
  } else {
    const chat = node("button", undefined, "primary");
    chat.id = "start-chat";
    chat.append(
      icon("message"),
      node("span", x("Написать игроку", "Message player")),
    );
    chat.onclick = () => {
      if (requireAccount())
        task(chat, status, async () => {
          const id = await m.startThread(l);
          await openChat(id);
        });
    };
    const order = node("form", undefined, "p-order");
    order.id = "order-form";
    const label = node("label", undefined, "p-label");
    label.append(node("span", txt("quantity")));
    const input = node("input");
    input.id = "order-quantity";
    input.type = "number";
    input.min = "1";
    input.max = String(available(l));
    input.step = "1";
    input.value = "1";
    input.required = true;
    label.append(input);
    const total = node("strong");
    total.id = "order-total";
    const update = () =>
      total.replaceChildren(money(Number(input.value) * l.unitPrice));
    input.oninput = update;
    update();
    const submit = node(
      "button",
      x("Запросить сделку", "Request a deal"),
      "primary",
    );
    submit.id = "request-deal";
    submit.type = "submit";
    submit.disabled = available(l) <= 0 || l.visibility === "hidden" || l.salePaused;
    order.append(
      label,
      total,
      node(
        "p",
        x(
          "Выбранное количество будет зарезервировано. Продавец должен принять запрос.",
          "The selected quantity will be reserved. The seller must accept the request.",
        ),
        "p-hint",
      ),
      submit,
    );
    order.onsubmit = (e) => {
      e.preventDefault();
      if (requireAccount())
        task(submit, status, async () => {
          await m.createDeal(l, Number(input.value));
          $("#lot-dialog").close();
          openDeals();
          toast(x("Запрос отправлен", "Request sent"));
        });
    };
    info.append(chat, order);
  }
  info.append(status);
  layout.append(media, info);
  $("#lot-content").append(layout);
  show("lot-dialog");
}
function renderPicker() {
  let rows = catalog.items.filter((i) => matches(i, $("#picker-search").value));
  const pages = Math.max(1, Math.ceil(rows.length / 24));
  pickerPage = Math.min(Math.max(0, pickerPage), pages - 1);
  $("#picker-items").replaceChildren(
    ...rows.slice(pickerPage * 24, pickerPage * 24 + 24).map((i) => {
      const b = node(
        "button",
        undefined,
        selected?.key === i.key ? "active" : "",
      );
      b.type = "button";
      b.title = i.id;
      b.append(sprite(i), node("span", name(i)));
      b.onclick = () => {
        selected = i;
        ench.clear();
        renderSelection();
        renderPicker();
        renderEnchants();
      };
      return b;
    }),
  );
  $("#picker-page").textContent = pickerPage + 1 + " / " + pages;
  $("#picker-prev").disabled = pickerPage === 0;
  $("#picker-next").disabled = pickerPage === pages - 1;
}
function renderSelection() {
  $("#selected-item").replaceChildren(
    ...(selected
      ? [sprite(selected), node("span", name(selected))]
      : [node("span", txt("selectItem"))]),
  );
  $("#publish").disabled = !selected;
  updateTotal();
}
function updateTotal() {
 const q=Number($("#quantity").value),p=Number($("#unit-price").value),n=q*p,validQ=Number.isSafeInteger(q)&&q>=1&&q<=1000000,validP=Number.isSafeInteger(p)&&p>=1&&p<=1000000000;
 $("#lot-total").replaceChildren(...(validQ&&validP&&Number.isSafeInteger(n)?[money(n)]:[node("span",x("Укажи количество и цену","Set quantity and price"))]));
 $("#publish").disabled=!selected||!validQ||!validP||photoBusy||!!$("#photo-error").textContent;
 for(const [id,valid] of [["quantity",validQ],["unit-price",validP]]){const field=$("#"+id),invalid=!!field.value&&!valid;field.setAttribute("aria-invalid",String(invalid));$("#"+id+"-error").textContent=invalid?x(id==="quantity"?"Целое число от 1 до 1 000 000":"Целое число от 1 до 1 000 000 000","Enter a positive integer within the allowed range"):""}
}
async function changePhoto() {
 const version=++photoVersion,file=$("#lot-photo").files[0];preparedPhoto=null;photoBusy=false;
 $("#photo-preview").removeAttribute("src");if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;$("#photo-error").textContent="";$("#photo-info").textContent="";$("#photo-preview-wrap").hidden=true;
 if(!file){updateTotal();return}
 if(file.size>5*1024*1024){$("#photo-error").textContent=x("Файл больше 5 МиБ. Выбери изображение поменьше.","File exceeds 5 MiB. Choose a smaller image.");updateTotal();return}
 photoBusy=true;updateTotal();$("#photo-info").textContent=x("Подготавливаем фото…","Preparing photo…");
 try {const photo=await m.preparePhoto(file);if(version!==photoVersion)return;preparedPhoto=photo;photoURL=URL.createObjectURL(file);$("#photo-preview").src=photoURL;$("#photo-preview").hidden=false;$("#photo-preview-wrap").hidden=false;const kb=Math.ceil((photo.length-photo.indexOf(',')-1)*.75/1024);$("#photo-info").textContent=x(`Исходник: ${format(Math.ceil(file.size/1024))} КиБ. После сжатия: ${format(kb)} КиБ.`,`Original: ${format(Math.ceil(file.size/1024))} KiB. Compressed: ${format(kb)} KiB.`)}catch(e){if(version===photoVersion)$("#photo-error").textContent=error(e)}finally{if(version===photoVersion){photoBusy=false;updateTotal()}}
}

function renderEnchants() {
  const q = $("#enchant-search").value.toLowerCase();
  $("#enchant-options").replaceChildren(
    ...enchantments
      .filter((e) => (e.ru + " " + e.en).toLowerCase().includes(q))
      .map((e) => {
        const row = node("label", undefined, "p-enchant-row"),
          select = node("select");
        select.setAttribute("aria-label", e[lang]);
        for (let n = 0; n <= e.maxLevel; n++) {
          const o = node("option", n ? String(n) : "-");
          o.value = String(n);
          o.selected = (ench.get(e.id) || 0) === n;
          select.append(o);
        }
        select.onchange = () => {
          const v = Number(select.value);
          if (v) ench.set(e.id, v);
          else ench.delete(e.id);
        };
        row.append(node("span", e[lang]), select);
        return row;
      }),
  );
}
function formValue() {
  if (!selected) throw { code: "item-required" };
  const quantity = Number($("#quantity").value),
    unitPrice = Number($("#unit-price").value);
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 1000000 ||
    !Number.isSafeInteger(unitPrice) ||
    unitPrice < 1 ||
    unitPrice > 1000000000
  )
    throw { code: "quantity-invalid" };
  return {
    itemKey: selected.key,
    quantity,
    unitPrice,
    customName: $("#custom-name").value.trim(),
    traitData: JSON.stringify({
      enchantmentSelections: [...ench].map(([id, level]) => ({ id, level })),
    }),
  };
}
function openSale() {
  if (!requireAccount()) return;
  $("#sale-status").textContent = "";
  renderPicker();
  renderSelection();
  renderEnchants();
  show("sale-dialog");
}
async function renderFavorites(force = false) {
  if (!$("#favorites-dialog").open) return;
  const sig = m.state.favorites.map((x) => x.docId).join("|");
  if (!force && sig === favSignature) return;
  favSignature = sig;
  const version = sig;
  $("#favorites-status").textContent = x("Загрузка…", "Loading…");
  try {
    const cards = await Promise.all(
      m.state.favorites.map(async (f) => {
        if (f.kind === "lot") {
          const l = await m.fetchLot(f.lotDoc, f.generationId);
          if (l) return card(l);
        }
        const box = node("article", undefined, "p-archived");
        if (f.kind === "seller") {
          const p = await m.publicProfile(f.sellerId),
            b = node("button", undefined, "p-person");
          b.append(
            head(p?.minecraftName),
            node("strong", p?.minecraftName || "-"),
          );
          b.onclick = () => openSeller(f.sellerId, p?.minecraftName);
          box.append(b);
        } else
          box.append(
            node(
              "p",
              x("Объявление больше недоступно", "Listing no longer available"),
            ),
          );
        const remove = node(
          "button",
          x("Убрать из избранного", "Remove favorite"),
          "text-button",
        );
        remove.onclick = () =>
          task(remove, $("#favorites-status"), async () => {
            const a = await m.sdk();
            await a.f.deleteDoc(
              a.f.doc(a.db, "users", m.state.user.uid, "favorites", f.docId),
            );
          });
        box.append(remove);
        return box;
      }),
    );
    if (favSignature !== version) return;
    $("#favorites-results").replaceChildren(...cards);
    $("#favorites-status").textContent = cards.length
      ? ""
      : x("Пока нет избранного.", "No favorites yet.");
  } catch (e) {
    $("#favorites-status").textContent = error(e);
  }
}
function openFavorites() {
  if (!requireAccount("favorites")) return;
  show("favorites-dialog");
  renderFavorites(true);
}
let peerNames = new Map();
async function peerName(id) {
  if (!peerNames.has(id)) {
    try {
      peerNames.set(id, (await m.publicProfile(id))?.minecraftName || "-");
    } catch {
      peerNames.set(id, "-");
    }
  }
  return peerNames.get(id);
}
function renderThreads() {
  experience.renderThreads();
}
async function openChat(id = null) {
  if (!requireAccount()) return;
  show("chat-dialog");
  renderThreads();
  if (!id) {
    chatVersion++;
    stopMessages?.();
    stopMessages = null;
    currentThread = null;
    $("#chat-dialog").classList.remove("has-thread");
    experience.chatOpened(null, null);
    return;
  }
  const version = ++chatVersion;
  stopMessages?.();
  stopMessages = null;
  currentThread = id;
  older = [];
  latest = [];
  currentMessageCursor = null;
  $("#messages").replaceChildren();
  $("#message-text").value = "";
  $("#chat-status").textContent = x("Загрузка сообщений…", "Loading messages…");
  $("#chat-dialog").classList.add("has-thread");
  let th = m.state.threads.find((t) => t.docId === id);
  if (!th) {
    try {
      const a = await m.sdk(),
        d = await a.f.getDocFromServer(a.f.doc(a.db, "threads", id));
      if (d.exists()) th = { ...d.data(), docId: d.id };
    } catch (e) {
      $("#chat-status").textContent = error(e);
      return;
    }
  }
  if (version !== chatVersion) return;
  if (th) {
    const peer = th.sellerId === m.state.publicId ? th.buyerId : th.sellerId;
    const nick = await peerName(peer);
    $("#chat-peer").replaceChildren();
    const back = node("button", "←", "icon-button p-back");
    back.type = "button";
    back.setAttribute("aria-label", x("Диалоги", "Conversations"));
    back.onclick = () => {
      $("#chat-dialog").classList.remove("has-thread");
    };
    const identity = node("button", undefined, "p-person");
    const peerCopy=node("span",undefined,"mc-peer-copy"),confirmedName=node("strong",nick);confirmedName.dataset.mcName=peer;peerCopy.append(confirmedName,playerStatus(peer));identity.append(head(nick),peerCopy);
    identity.onclick = () => openSeller(peer, nick);
    $("#chat-peer").append(back, identity);
  }
  experience.chatOpened(id, th);
  const stop = await m.listenMessages(
    id,
    (rows, cursor) => {
      if (version !== chatVersion) return;
      if (older.length)
        older = [
          ...new Map([...older, ...latest].map((v) => [v.docId, v])).values(),
        ];
      latest = rows;
      if (!older.length) {
        currentMessageCursor = cursor;
        $("#older-messages").hidden = rows.length < 50;
      }
      renderMessages();
      $("#chat-status").textContent = "";
      if ($("#chat-dialog").open) m.markRead("thread", id).catch(() => {});
    },
    (code) => {
      $("#chat-status").textContent = error({ code });
    },
  );
  if (version !== chatVersion) stop();
  else stopMessages = stop;
  renderThreads();
}
function renderMessages() {
  const rows = [
    ...new Map([...older, ...latest].map((v) => [v.docId, v])).values(),
  ].sort(
    (a, b) =>
      (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0),
  );
  experience.renderMessages(rows);
}
const statusLabel = (s) =>
  ({
    pending: x("Ожидает продавца", "Awaiting seller"),
    accepted: x("Обмен согласован", "Trade agreed"),
    completed: x("Завершена", "Completed"),
    cancelled: x("Отменена", "Cancelled"),
  })[s] || s;
function openDeals() {
  if (!requireAccount()) return;
  show("deals-dialog");
  renderDeals();
  for (const d of m.state.deals)
    if (m.unread("deal", d)) m.markRead("deal", d.docId).catch(() => {});
}
function renderDeals() {
  experience.renderDeals();
}
function renderNotifications() {
  const rows = [
    ...m.state.threads
      .filter((d) => m.unread("thread", d))
      .map((d) => ({ kind: "thread", d })),
    ...m.state.deals
      .filter((d) => m.unread("deal", d))
      .map((d) => ({ kind: "deal", d })),
  ];
  $("#notification-count").textContent = String(rows.length+trading.unreadCount());
  $("#notification-count").hidden = !(rows.length+trading.unreadCount());
  $("#notification-list").replaceChildren(
    ...rows.map(({ kind, d }) => {
      const b = node("button");
      b.type = "button";
      b.append(
        icon(kind === "thread" ? "message" : "trade"),
        node(
          "span",
          kind === "thread"
            ? x("Новое сообщение: ", "New message: ") +
                (d.title || name(item(d.itemKey)))
            : x("Сделка: ", "Deal: ") + statusLabel(d.status),
        ),
      );
      b.onclick = () => {
        m.markRead(kind, d.docId).catch(() => {});
        if (kind === "thread") openChat(d.docId);
        else openDeals();
      };
      return b;
    }),
  );
  if (!rows.length && !trading.unreadCount())
    $("#notification-list").append(
      node(
        "p",
        x("Новых уведомлений нет.", "No new notifications."),
        "p-empty",
      ),
    );
}
function renderState() {
  renderSellerFavorite();
  renderAccount();
  renderCatalog();
  renderThreads();
  renderDeals();
  renderNotifications();
  $("#favorite-count").textContent = String(m.state.favorites.length);
  renderFavorites();
  if (!m.state.publicId) {
    for (const id of [
      "chat-dialog",
      "deals-dialog",
      "favorites-dialog",
      "sale-dialog",
    ])
      if ($("#" + id).open) $("#" + id).close();
  }
  if (m.state.privateError && $("#chat-dialog").open)
    $("#chat-status").textContent = error({ code: m.state.privateError });
}
async function init() {
  [catalog, dict, enchantments] = await Promise.all([
    fetch("./data/items.json").then((r) => r.json()),
    Promise.all(
      ["ru", "en"].map(async (l) => [
        l,
        await fetch("./locales/" + l + ".json").then((r) => r.json()),
      ]),
    ).then(Object.fromEntries),
    fetch("./data/enchantments.json").then((r) => r.json()),
  ]);
  document.documentElement.style.setProperty(
    "--atlas-rows",
    Math.ceil(catalog.meta.count / catalog.meta.columns),
  );
  for (const key of ["diamond_block", "grass_block", "shulker_box"]) {
    const tile = node("div", undefined, "banner-item hero-block");
    tile.append(sprite(item(key)));
    $("#banner-items").append(tile);
  }
  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close]");
    if (close) $("#" + close.dataset.close).close();
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const action = b.dataset.action;
    if (action === "login") showDiscordAuth();
    if (action === "sell") openSale();
    if (action === "chats") openChat();
    if (action === "deals") openDeals();
    if (action === "rules") show("rules-dialog");
  });
  $("#language").onclick = () => {
    lang = lang === "ru" ? "en" : "ru";
    setUI();
  };
  $("#refresh").onclick = () => m.loadCatalog();
  $("#load-more").onclick = () => m.loadCatalog(true);
  $("#search-form").onsubmit = (e) => {
    e.preventDefault();
    page = 0;
    renderCatalog();
    $("#catalog").scrollIntoView();
  };
  $("#search").oninput = () => {
    page = 0;
    renderCatalog();
  };
  for (const k of ["min-price", "max-price", "sort"])
    $("#" + k).oninput = () => {
      page = 0;
      renderCatalog();
    };
  $("#reset-filters").onclick = () => {
    $("#search").value = $("#min-price").value = $("#max-price").value = "";
    category = "all";
    page = 0;
    renderCategories();
    renderCatalog();
  };
  $("#favorites-toggle").onclick = openFavorites;
  $("#open-notifications").onclick = () => {
    if (requireAccount()) {
      show("notifications-dialog");
      renderNotifications();
    }
  };
  $("#profile-form").onsubmit = (e) => {
    e.preventDefault();
    task($("#save-profile"), $("#profile-status"), async () => {
      await m.saveProfile();
      peerNames.clear();
      $("#profile-status").textContent = accessText(m.state.minecraftAccess?.reason,lang==='en');
      renderAccount();
    });
  };
  $("#my-lots").onclick = () => trading.openOwn();
  $("#account-deals").onclick = openDeals;
  $("#picker-search").oninput = () => {
    pickerPage = 0;
    renderPicker();
  };
  $("#picker-prev").onclick = () => {
    pickerPage--;
    renderPicker();
  };
  $("#picker-next").onclick = () => {
    pickerPage++;
    renderPicker();
  };
  $("#enchant-search").oninput = renderEnchants;
  for (const id of ["quantity", "unit-price"])
    $("#" + id).oninput = updateTotal;
  $("#lot-photo").onchange = changePhoto;
  $("#lot-form").onsubmit = (e) => {
    e.preventDefault();
    task($("#publish"), $("#sale-status"), async () => {
      const value = formValue();
      $("#sale-status").textContent = x("Публикуем…", "Publishing…");
      const photo = preparedPhoto;
      await m.publishLot(value, photo);
      $("#sale-dialog").close();
      $("#lot-form").reset();
      $("#photo-preview").removeAttribute("src");
      if (photoURL) {
        URL.revokeObjectURL(photoURL);
        photoURL = null;
      }
      selected = null;
      preparedPhoto = null;
      $("#photo-error").textContent="";$("#photo-info").textContent="";$("#photo-preview-wrap").hidden=true;
      ench.clear();
      $("#photo-preview").hidden = true;
      toast(x("Объявление опубликовано", "Listing published"));
      $("#catalog").scrollIntoView();
    });
  };
  $("#save-draft").onclick = () =>
    task($("#save-draft"), $("#sale-status"), async () => {
      await m.saveDraft(formValue());
      $("#sale-status").textContent = x("Черновик сохранён", "Draft saved");
    });
  $("#load-draft").onclick = () =>
    task($("#load-draft"), $("#sale-status"), async () => {
      const d = await m.getDraft();
      if (!d) {
        $("#sale-status").textContent = x(
          "Черновика пока нет",
          "No draft saved",
        );
        return;
      }
      selected = item(d.itemKey);
      $("#quantity").value = d.quantity;
      $("#unit-price").value = d.unitPrice;
      $("#custom-name").value = d.customName;
      try {
        ench = new Map(
          JSON.parse(d.traitData).enchantmentSelections.map((e) => [
            e.id,
            e.level,
          ]),
        );
      } catch {
        ench.clear();
      }
      renderPicker();
      renderSelection();
      renderEnchants();
      $("#sale-status").textContent = x("Черновик открыт", "Draft loaded");
    });
  $("#chat-dialog").addEventListener("close", () => {
    chatVersion++;
    stopMessages?.();
    stopMessages = null;
    currentThread = null;
  });
  $("#message-form").onsubmit = (e) => {
    e.preventDefault();
    if (!currentThread) return;
    const body = $("#message-text").value;
    task($("#send-message"), $("#chat-status"), async () => {
      await experience.send(currentThread, body);
      $("#message-text").value = "";
    });
  };
  $("#message-text").onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $("#message-form").requestSubmit();
    }
  };
  $("#older-messages").onclick = () =>
    task($("#older-messages"), $("#chat-status"), async () => {
      const keep = $("#messages").scrollHeight,
        result = await m.olderMessages(currentThread, currentMessageCursor);
      older = [...result.rows, ...older];
      currentMessageCursor = result.cursor;
      renderMessages();
      $("#messages").scrollTop = $("#messages").scrollHeight - keep;
      $("#older-messages").hidden = result.rows.length < 50;
    });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !document.querySelector("dialog[open]") &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      e.preventDefault();
      $("#search").focus();
    }
  });
  window.addEventListener("zeno-open-lot", (e) => openLot(e.detail));
  window.addEventListener("zeno-account-needed", () => {
    show("auth-dialog");
  });
  window.addEventListener("zeno-data", renderState);
  initExperience({
    $,
    node,
    icon,
    x,
    show,
    task,
    toast,
    head,
    item,
    name,
    card,
    money,
    sprite,
    peerName,
    peerNames,
    openChat,
    openDeals,
    openFavorites,
    openLot,
    requireAccount,
    error,
    openReport,
    get currentThread() {
      return currentThread;
    },
  });
  quality=initQuality({$,node,icon,x,t,show,toast,catalog,enchantments,m,renderCatalog,renderCategories,openLot,changePhoto,updateTotal,get category(){return category},set category(v){category=v}});
  initTrading({$,node,icon,x,show,task,toast,item,name,card,money,openLot,openDeals,openChat,requireAccount,error,openReport,catalog,async template(l){selected=item(l.itemKey);$("#quantity").value=Math.max(1,l.availableQty??l.quantity);$("#unit-price").value=l.unitPrice;$("#custom-name").value=l.customName||"";try{ench=new Map((JSON.parse(l.traitData||"{}").enchantmentSelections||[]).map(e=>[e.id,e.level]))}catch{ench.clear()}$("#lot-photo").value="";await changePhoto();if(l.hasPhoto){preparedPhoto=await m.loadPhoto(l);if(preparedPhoto){$("#photo-preview").src=preparedPhoto;$("#photo-preview-wrap").hidden=false;$("#photo-preview").hidden=false;$("#photo-info").textContent=x("Фото скопировано из шаблона","Photo copied from template")}}renderPicker();renderSelection();renderEnchants();updateTotal();openSale();}});
  initAdmin();
  initDiscordAuth();
  setUI();
  m.initMarket();
  document.documentElement.classList.remove("app-loading");
  document.documentElement.classList.add("app-ready");
  await document.fonts.ready;
}
init().catch(() => {
  $("#boot-text").textContent =
    "Не удалось загрузить сайт. Проверь соединение и обнови страницу / Could not load. Check your connection and reload.";
  $("#boot-screen").classList.add("has-error");
  $("#boot-retry").onclick=()=>location.reload();
});
