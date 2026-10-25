import { message } from "./localization.js";
import { initFinishUI } from "./finish-ui.js";
import {
  loadItemIndex,
  loadFullCatalog,
  THUMBNAIL_KEYS,
} from "./item-catalog.js";
import { notificationCenter } from "./notification-center.js";
import { initReleaseTools } from "./release-tools.js";
import {
  pair,
  loadLocales,
  markLocalized,
  translateMarked,
} from "./localization.js";
import { activeTask } from "./active-scheduler.js";
import { normalizeSearch } from "./search-utils.js";
import { playerStatus } from "./minecraft-ui.js";
import { accessText, nextManualCheck } from "./minecraft-data.js";
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
    if (text !== undefined) {
      e.textContent = text;
      markLocalized(e, text);
    }
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
  itemIndex = new Map(),
  item = (k) => itemIndex.get(k),
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
const labels = new Proxy({}, { get: (_, key) => pair("app", key) });
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
  s.style.setProperty(
    "--item-atlas",
    `url("../assets/items-${atlasPart}.webp")`,
  );
  if (THUMBNAIL_KEYS.has(i?.key)) {
    s.style.backgroundImage = 'url("./assets/item-thumbs/' + i.key + '.webp")';
    s.style.backgroundSize = "contain";
    s.style.backgroundPosition = "center";
    s.style.backgroundRepeat = "no-repeat";
  }
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
  if (e?.code?.startsWith("minecraft-"))
    return accessText(e.code.slice(10), lang === "en");
  if (e?.code?.startsWith("counterparty-"))
    return x(...pair("inline", "t955683645df7"));
  const code = m.codeOf(e),
    messages = {
      "subscription-limit": x(...pair("inline", "t8263437b617c")),
      "deal-expired": x(...pair("inline", "t745568b0f055")),
      "listing-paused": x(...pair("inline", "tc68285da296d")),
      "promo-limit": x(...pair("inline", "te98bedbbf677")),
      "dates-invalid": x(...pair("inline", "t62706171b25c")),
      "link-invalid": x(...pair("inline", "tf7c561cfcde7")),
      "nickname-ambiguous": x(...pair("inline", "t0669910f7a32")),
      "profile-required": x(...pair("inline", "tc204cf9a728c")),
      "auth/sign-in-required": x(...pair("inline", "t6c2825bb5051")),
      "nickname-invalid": x(...pair("inline", "t2a4f82b53d12")),
      "listing-limit": x(...pair("inline", "t368154a35408")),
      "listing-reserved": x(...pair("inline", "t97a3bd10659b")),
      "listing-changed": x(...pair("inline", "tf73a7188d380")),
      "listing-unavailable": x(...pair("inline", "td16d490598e5")),
      "quantity-unavailable": x(...pair("inline", "t5d80c5559514")),
      "bump-cooldown": x(...pair("inline", "ta16d984a3480")),
      "listing-hidden": x(...pair("inline", "t408ec7eb38e5")),
      "price-changed": x(...pair("inline", "tad0d697d8337")),
      "photo-too-large": x(...pair("inline", "tcb2f6c50b3d1")),
      "photo-type": x(...pair("inline", "t4960ce6b4e68")),
      "photo-dimensions": x(...pair("inline", "t5b2f09d3fbee")),
      "photo-compression": x(...pair("inline", "t6f09bd92dbc6")),
      "permission-denied": x(...pair("inline", "tbaacd978f62c")),
      "favorite-limit": x(...pair("inline", "tf964a85ff26e")),
      "deal-state-changed": x(...pair("inline", "t9a676372f991")),
    };
  return messages[code] || x(...pair("inline", "t81eff89d9be6"));
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
  if (m.state.accountLoading) {
    toast(x(...pair("finish", "loading")));
    return false;
  }
  if (!m.state.user || !m.state.profile) {
    showDiscordAuth();
    if (reason === "favorites")
      $("#auth-note").textContent = x(...pair("inline", "tfc19e88ba6b3"));
    return false;
  }
  return true;
}
function setUI() {
  document.documentElement.lang = lang;
  translateMarked();
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
  $("#refresh").textContent = x(...pair("inline", "t6c317d069a14"));
  $("#load-more").textContent = x(...pair("inline", "tcde9f6e977c6"));
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
    ? x(...pair("inline", "te5af1702dfb6"))
    : "";
  const old = $("#account-head"),
    img = head(nick);
  img.id = "account-head";
  old.replaceWith(img);
  const field = $("#minecraft-name");
  field.value = nick || "";
  field.readOnly = true;
  field.required = false;
  if (signed) {
    const remaining = nextManualCheck(m.state.user.uid);
    $("#save-profile").disabled = remaining > 0;
    $("#save-profile").title =
      remaining > 0 ? x(...pair("inline", "tf060e2be0a7a")) : "";
  }
  $("#minecraft-access").textContent = signed
    ? accessText(m.state.minecraftAccess?.reason, lang === "en")
    : "";
  $("#minecraft-access").classList.toggle(
    "is-allowed",
    m.state.minecraftAccess?.allowed === true,
  );
  if (
    signed &&
    m.state.publicId &&
    $("#account-minecraft-status").querySelector("[data-mc-player]")?.dataset
      .mcPlayer !== m.state.publicId
  )
    $("#account-minecraft-status").replaceChildren(
      playerStatus(m.state.publicId),
    );
  if (!signed) $("#account-minecraft-status").replaceChildren();
  const login = $('[data-action="login"]'),
    oldImg = login.querySelector(".p-head");
  if (oldImg) oldImg.remove();
  const mini = head(nick);
  mini.hidden = !signed;
  login.prepend(mini);
  const span = login.querySelector("span");
  span.textContent = signed
    ? x(...pair("inline", "t37ec4fa696cb"))
    : x(...pair("inline", "t954917073a3d"));
  if (m.state.privateError)
    $("#profile-status").textContent = error({ code: m.state.privateError });
}
function matches(i, q) {
  const all = normalizeSearch(i.ru + " " + i.en + " " + i.key);
  return normalizeSearch(q)
    .trim()
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
let ratingLoad = false,
  ratingFailed = false,
  ratingVersion = 0,
  catalogSignature = "";
function renderCatalog() {
  prunePhotoObservers();
  if (!catalog) return;
  const signature = JSON.stringify([
    m.state.rows.map((l) => [
      l.id,
      l.updatedAt?.toMillis?.(),
      l.unitPrice,
      l.availableQty,
      l.quantity,
      l.salePaused,
      l.visibility,
      l.customName,
    ]),
    m.state.favorites.map((f) => f.docId),
    m.state.publicId,
    m.state.status,
    m.state.error,
    m.state.catalogFromCache,
    m.state.more,
    lang,
    category,
    ...[
      "search",
      "min-price",
      "max-price",
      "sort",
      "has-photo",
      "has-enchants",
      "qty-min",
      "qty-max",
      "only-available",
      "rating-four",
    ].map((id) => {
      const e = $("#" + id);
      return e?.type === "checkbox" ? e.checked : e?.value;
    }),
    ratingVersion,
  ]);
  if (signature === catalogSignature) return;
  catalogSignature = signature;

  const query = $("#search").value;
  let rows = m.state.rows
    .filter(
      (l) => l.visibility !== "hidden" && !l.salePaused && item(l.itemKey),
    )
    .filter((l) => {
      let traits = "";
      try {
        traits = (JSON.parse(l.traitData || "{}").enchantmentSelections || [])
          .map((v) => {
            const e = enchantments.find((e) => e.id === v.id);
            return e ? e.ru + " " + e.en + " " + v.level : v.id;
          })
          .join(" ");
      } catch {}
      return (
        (category === "all" || item(l.itemKey).category === category) &&
        matches(
          {
            ...item(l.itemKey),
            ru:
              item(l.itemKey).ru +
              " " +
              (l.customName || "") +
              " " +
              l.nickname +
              " " +
              traits,
            en:
              item(l.itemKey).en +
              " " +
              (l.customName || "") +
              " " +
              l.nickname +
              " " +
              traits,
          },
          query,
        )
      );
    });
  const min = $("#min-price").value,
    max = $("#max-price").value;
  if (min !== "")
    rows = rows.filter((l) => l.unitPrice * available(l) >= Number(min));
  if (max !== "")
    rows = rows.filter((l) => l.unitPrice * available(l) <= Number(max));
  if ($("#has-photo").checked) rows = rows.filter((l) => l.hasPhoto);
  if ($("#has-enchants").checked)
    rows = rows.filter((l) => {
      try {
        return !!JSON.parse(l.traitData || "{}").enchantmentSelections?.length;
      } catch {
        return false;
      }
    });
  const qmin = $("#qty-min")?.value,
    qmax = $("#qty-max")?.value;
  if (qmin) rows = rows.filter((l) => available(l) >= Number(qmin));
  if (qmax) rows = rows.filter((l) => available(l) <= Number(qmax));
  if ($("#only-available")?.checked)
    rows = rows.filter((l) => available(l) > 0);
  if ($("#rating-four")?.checked) {
    const missing = [...new Set(rows.map((l) => l.sellerId))].filter(
      (id) => m.cachedSellerRating(id) === null,
    );
    if (missing.length && !ratingLoad && !ratingFailed) {
      ratingLoad = true;
      Promise.all(missing.map(m.loadSellerRating))
        .catch(() => {
          ratingFailed = true;
          toast(x(...pair("inline", "tc370e7508557")));
        })
        .finally(() => {
          ratingLoad = false;
          ratingVersion++;
          renderCatalog();
        });
    }
    rows = rows.filter((l) => (m.cachedSellerRating(l.sellerId) || 0) >= 4);
  } else ratingFailed = false;
  const sort = $("#sort").value;
  rows.sort(
    sort === "priceAsc"
      ? (a, b) => a.unitPrice * available(a) - b.unitPrice * available(b)
      : sort === "priceDesc"
        ? (a, b) => b.unitPrice * available(b) - a.unitPrice * available(a)
        : sort === "name"
          ? (a, b) =>
              name(item(a.itemKey)).localeCompare(name(item(b.itemKey)), lang)
          : (a, b) =>
              (b.createdAt?.toMillis?.() || 0) -
              (a.createdAt?.toMillis?.() || 0),
  );
  const box = $("#results"),
    status = $("#catalog-status");
  box.replaceChildren();
  box.setAttribute("aria-busy", String(m.state.status === "loading"));
  status.dataset.state =
    m.state.status === "error"
      ? "error"
      : m.state.status === "loading"
        ? "loading"
        : m.state.catalogFromCache
          ? "offline"
          : "success";
  status.classList.toggle("v-offline", m.state.catalogFromCache);
  $(".cloud-controls").hidden = m.state.status === "error";
  if (m.state.status === "error") {
    const empty = node("div", undefined, "q-empty q-error"),
      retry = node(
        "button",
        x(...pair("inline", "t1c2a28e4fbce")),
        "v-primary",
      );
    retry.type = "button";
    retry.onclick = () => m.loadCatalog();
    empty.setAttribute("role", "alert");
    empty.append(
      icon("refresh"),
      node("h3", x(...pair("inline", "tda6cf58d8389"))),
      node("p", error({ code: m.state.error })),
      retry,
    );
    box.append(empty);
  } else if (!rows.length && m.state.status === "loading") {
    for (let i = 0; i < 6; i++) {
      const sk = node("div", undefined, "q-skeleton-card");
      sk.setAttribute("aria-hidden", "true");
      sk.append(node("div"), node("span"), node("span"));
      box.append(sk);
    }
  } else if (!rows.length) {
    const empty = node("div", undefined, "q-empty"),
      reset = node(
        "button",
        x(...pair("inline", "t5f1cb2c20575")),
        "v-secondary",
      );
    reset.type = "button";
    reset.onclick = () => $("#reset-filters").click();
    empty.append(
      icon("grid"),
      node("h3", x(...pair("inline", "t733b19de0d27"))),
      node("p", x(...pair("inline", "t4ef1891382c7"))),
      reset,
    );
    box.append(empty);
  } else box.append(...rows.map(card));
  status.textContent =
    m.state.status === "loading"
      ? x(...pair("inline", "te43cb9882656"))
      : (m.state.catalogFromCache
          ? x(...pair("inline", "tc667e5c2aa21"))
          : x(...pair("inline", "ta5f073567686"))) +
        " · " +
        x(...pair("inline", "t520cab3183a4")) +
        m.state.rows.length;
  $("#result-count").textContent = message("dynamic", "m16beb1c0cad6", {
    v0: rows.length,
  });
  $("#load-more").hidden = !m.state.more || m.state.status === "error";
  $("#load-more").disabled = m.state.status === "loading";
  quality?.catalogChanged();
  prunePhotoObservers();
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
  const badges = node("div", undefined, "release-card-badges");
  if (l.hasPhoto)
    badges.append(node("span", x(...pair("inline", "t7d82a20d5713"))));
  try {
    if (JSON.parse(l.traitData || "{}").enchantmentSelections?.length)
      badges.append(node("span", x(...pair("inline", "t2c6de8460f1d"))));
  } catch {}
  if (badges.childElementCount) a.append(badges);
  return a;
}
function person(l) {
  const b = node("button", undefined, "p-person seller-open");
  b.type = "button";
  const nick = node("span", l.nickname || "-");
  nick.dataset.mcName = l.sellerId;
  b.append(head(l.nickname), nick);
  b.onclick = () => openSeller(l.sellerId, l.nickname);
  return b;
}
function card(l) {
  const c = node("article", undefined, "listing-card"),
    open = node("button", undefined, "listing-open");
  open.type = "button";
  open.setAttribute(
    "aria-label",
    (l.customName || name(item(l.itemKey))) + ", " + available(l),
  );
  open.append(art(l));
  open.onclick = () => openLot(l);
  const f = node("button", undefined, "listing-heart");
  f.type = "button";
  const saved = m.state.favorites.some((v) => v.docId === m.favoriteId(l));
  f.setAttribute("aria-label", x(...pair("inline", "tae891889e9d9")));
  f.setAttribute("aria-pressed", String(saved));
  f.classList.toggle("selected", saved);
  f.append(icon("heart"));
  f.onclick = () => {
    if (requireAccount("favorites")) task(f, null, () => m.toggleFavorite(l));
  };
  const title = node(
      "h3",
      l.customName || name(item(l.itemKey)),
      "listing-title",
    ),
    price = node("div", undefined, "listing-price"),
    unit = node(
      "small",
      x(...pair("inline", "t890027861a74")),
      "q-price-caption",
    );
  price.append(money(l.unitPrice), unit);
  const quantity = node(
    "p",
    message("dynamic", "m40ca2e137527", { v0: format(available(l)) }),
    "listing-quantity",
  );
  c.append(open, f, title, price, quantity);
  if (available(l) > 1) {
    const total = node("p", undefined, "listing-unit-price");
    total.append(
      x(...pair("inline", "t57215423476a")),
      money(l.unitPrice * available(l)),
    );
    c.append(total);
  }
  c.append(person(l), playerStatus(l.sellerId, { presence: false }));
  trading.decorate(c, l);
  c.addEventListener("click", (e) => {
    if (!e.target.closest("button,a,input,select")) openLot(l);
  });
  return c;
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
    ? x(...pair("inline", "t43a7e0005d53"))
    : x(...pair("inline", "tdc489cc4402d"));
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
  info.append(
    node("h3", l.customName || name(item(l.itemKey))),
    person(l),
    playerStatus(l.sellerId),
  );
  const share = node(
    "button",
    x(...pair("inline", "t7fbb75f74d19")),
    "v-secondary",
  );
  share.type = "button";
  share.onclick = () => quality?.shareLot(l);
  info.append(share);
  const price = node("div", undefined, "p-price");
  price.append(money(l.unitPrice * available(l)));
  info.append(
    node("small", txt("total")),
    price,
    node(
      "p",
      message("dynamic", "mb4a567ee28d0", {
        v0: available(l),
        v1: l.reservedQty || 0,
      }),
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
      node("p", x(...pair("inline", "t76bcf394e14c")), "a-hidden-lot"),
    );
  const report = node(
    "button",
    x(...pair("inline", "t2341294be242")),
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
  info.append(report);
  trading.lotActions(info, l);
  const status = node("p", undefined, "p-status");
  status.id = "lot-status";
  if (m.owns(l)) {
    const del = node(
      "button",
      x(...pair("inline", "t6fafefa0f3e3")),
      "text-button",
    );
    del.id = "delete-lot";
    del.type = "button";
    del.append(icon("close"));
    del.onclick = () => {
      if (confirm(x(...pair("inline", "t9e8a4a057eb8"))))
        task(del, status, async () => {
          await m.deleteLot(l);
          $("#lot-dialog").close();
          toast(x(...pair("inline", "t6a93cc3f7ca2")));
        });
    };
    info.append(del);
  } else {
    const chat = node("button", undefined, "primary");
    chat.id = "start-chat";
    chat.append(
      icon("message"),
      node("span", x(...pair("inline", "taa29aa3443cc"))),
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
      x(...pair("inline", "te703bdedb011")),
      "primary",
    );
    submit.id = "request-deal";
    submit.type = "submit";
    submit.disabled =
      available(l) <= 0 || l.visibility === "hidden" || l.salePaused;
    order.append(
      label,
      total,
      node("p", x(...pair("inline", "t3cd4ea01a3c2")), "p-hint"),
      submit,
    );
    order.onsubmit = (e) => {
      e.preventDefault();
      if (requireAccount())
        task(submit, status, async () => {
          await m.createDeal(l, Number(input.value));
          $("#lot-dialog").close();
          openDeals();
          toast(x(...pair("inline", "tffd8a6b7f19b")));
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
  const q = Number($("#quantity").value),
    p = Number($("#unit-price").value),
    n = q * p,
    validQ = Number.isSafeInteger(q) && q >= 1 && q <= 1000000,
    validP = Number.isSafeInteger(p) && p >= 1 && p <= 1000000000;
  $("#lot-total").replaceChildren(
    ...(validQ && validP && Number.isSafeInteger(n)
      ? [money(n)]
      : [node("span", x(...pair("inline", "tc61d680697de")))]),
  );
  $("#publish").disabled =
    !selected ||
    !validQ ||
    !validP ||
    photoBusy ||
    !!$("#photo-error").textContent;
  for (const [id, valid] of [
    ["quantity", validQ],
    ["unit-price", validP],
  ]) {
    const field = $("#" + id),
      invalid = !!field.value && !valid;
    field.setAttribute("aria-invalid", String(invalid));
    $("#" + id + "-error").textContent = invalid
      ? x(
          id === "quantity"
            ? "Целое число от 1 до 1 000 000"
            : "Целое число от 1 до 1 000 000 000",
          "Enter a positive integer within the allowed range",
        )
      : "";
  }
}
async function changePhoto() {
  const version = ++photoVersion,
    file = $("#lot-photo").files[0];
  preparedPhoto = null;
  photoBusy = false;
  $("#photo-preview").removeAttribute("src");
  if (photoURL) URL.revokeObjectURL(photoURL);
  photoURL = null;
  $("#photo-error").textContent = "";
  $("#photo-info").textContent = "";
  $("#photo-preview-wrap").hidden = true;
  if (!file) {
    updateTotal();
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    $("#photo-error").textContent = x(...pair("inline", "tf793b0622611"));
    updateTotal();
    return;
  }
  photoBusy = true;
  updateTotal();
  $("#photo-info").textContent = x(...pair("inline", "t26d7473919e0"));
  try {
    const photo = await m.preparePhoto(file);
    if (version !== photoVersion) return;
    preparedPhoto = photo;
    photoURL = URL.createObjectURL(file);
    $("#photo-preview").src = photoURL;
    $("#photo-preview").hidden = false;
    $("#photo-preview-wrap").hidden = false;
    const kb = Math.ceil(
      ((photo.length - photo.indexOf(",") - 1) * 0.75) / 1024,
    );
    $("#photo-info").textContent = message("dynamic", "m12c3b67787c0", {
      v0: format(Math.ceil(file.size / 1024)),
      v1: format(kb),
    });
  } catch (e) {
    if (version === photoVersion) $("#photo-error").textContent = error(e);
  } finally {
    if (version === photoVersion) {
      photoBusy = false;
      updateTotal();
    }
  }
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
async function openSale() {
  try {
    await m.accountReady();
  } catch {
    toast(x(...pair("finish", "errorRetry")));
    return;
  }
  if (!requireAccount()) return;
  try {
    const full = await loadFullCatalog();
    Object.assign(catalog, full);
    itemIndex.clear();
    for (const row of catalog.items) itemIndex.set(row.key, row);
    if (selected) selected = item(selected.key) || selected;
  } catch {
    toast(x(...pair("finish", "catalogRetry")));
    return;
  }
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
  $("#favorites-status").textContent = x(...pair("inline", "tbea6af89e92a"));
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
        } else box.append(node("p", x(...pair("inline", "t19378f5f89f1"))));
        const remove = node(
          "button",
          x(...pair("inline", "t269ae7ab899d")),
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
      : x(...pair("inline", "td9f26afe5892"));
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
  delete $("#chat-status").dataset.sendState;
  $("#chat-status").textContent = x(...pair("inline", "t09db7b706732"));
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
    back.setAttribute("aria-label", x(...pair("inline", "t19670cedd494")));
    back.onclick = () => {
      $("#chat-dialog").classList.remove("has-thread");
    };
    const identity = node("button", undefined, "p-person");
    const peerCopy = node("span", undefined, "mc-peer-copy"),
      confirmedName = node("strong", nick);
    confirmedName.dataset.mcName = peer;
    peerCopy.append(confirmedName, playerStatus(peer));
    identity.append(head(nick), peerCopy);
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
      if (!$("#chat-status").dataset.sendState)
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
    pending: x(...pair("inline", "t9a4450267469")),
    accepted: x(...pair("inline", "tf29b73cd0c79")),
    completed: x(...pair("inline", "t6fc198874fbb")),
    cancelled: x(...pair("inline", "t512303374486")),
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
    ...m.state.threads.map((d) => ({ kind: "thread", d })),
    ...m.state.deals.map((d) => ({ kind: "deal", d })),
  ];
  const unreadCount =
    rows.filter(({ kind, d }) => m.unread(kind, d)).length +
    trading.unreadCount();
  $("#notification-count").textContent = String(unreadCount);
  $("#notification-count").hidden = !unreadCount;
  notificationCenter.setSource(
    "activity",
    rows.map(({ kind, d }) => ({
      id: kind + "_" + d.docId,
      kind,
      read: !m.unread(kind, d),
      at: d.updatedAt?.toMillis?.() || d.createdAt?.toMillis?.() || 0,
      render() {
        const b = node("button");
        b.type = "button";
        b.append(
          icon(kind === "thread" ? "message" : "trade"),
          node(
            "span",
            kind === "thread"
              ? x(...pair("inline", "t4215d399f9fd")) +
                  (d.title || name(item(d.itemKey)))
              : x(...pair("inline", "t8088e7d1edf3")) + statusLabel(d.status),
          ),
        );
        b.onclick = () => {
          m.markRead(kind, d.docId).catch(() => {});
          if (kind === "thread") openChat(d.docId);
          else openDeals();
        };
        return b;
      },
    })),
  );
}

function renderState() {
  const limit = $("#sale-limit");
  if (limit)
    limit.textContent =
      x(...pair("inline", "t14ff642efaf3")) +
      m.state.ownLots.length +
      x(...pair("inline", "taadeee53753c"));
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
    loadItemIndex(),
    loadLocales(),
    fetch("./data/enchantments.json").then((r) => r.json()),
  ]);
  for (const row of catalog.items) itemIndex.set(row.key, row);
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
      $("#profile-status").textContent = accessText(
        m.state.minecraftAccess?.reason,
        lang === "en",
      );
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
      $("#sale-status").textContent = x(...pair("inline", "ta86ea73dbf90"));
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
      $("#photo-error").textContent = "";
      $("#photo-info").textContent = "";
      $("#photo-preview-wrap").hidden = true;
      ench.clear();
      $("#photo-preview").hidden = true;
      toast(x(...pair("inline", "t7f2609995371")));
      $("#catalog").scrollIntoView();
    });
  };
  $("#save-draft").onclick = () =>
    task($("#save-draft"), $("#sale-status"), async () => {
      await m.saveDraft(formValue());
      $("#sale-status").textContent = x(...pair("inline", "tfa1154ebf240"));
    });
  $("#load-draft").onclick = () =>
    task($("#load-draft"), $("#sale-status"), async () => {
      const d = await m.getDraft();
      if (!d) {
        $("#sale-status").textContent = x(...pair("inline", "t6144f054b722"));
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
      $("#sale-status").textContent = x(...pair("inline", "t669c591355ce"));
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
      const sent = await experience.send(currentThread, body);
      if (sent !== false) $("#message-text").value = "";
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
        oldTop = $("#messages").scrollTop,
        result = await m.olderMessages(currentThread, currentMessageCursor);
      older = [...result.rows, ...older];
      currentMessageCursor = result.cursor;
      renderMessages();
      $("#messages").scrollTop = oldTop + $("#messages").scrollHeight - keep;
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
  quality = initQuality({
    $,
    node,
    icon,
    x,
    t,
    show,
    toast,
    catalog,
    enchantments,
    m,
    renderCatalog,
    renderCategories,
    openLot,
    changePhoto,
    updateTotal,
    get category() {
      return category;
    },
    set category(v) {
      category = v;
    },
  });
  initTrading({
    $,
    node,
    icon,
    x,
    show,
    task,
    toast,
    item,
    name,
    card,
    money,
    openLot,
    openDeals,
    openChat,
    requireAccount,
    error,
    openReport,
    catalog,
    async template(l) {
      selected = item(l.itemKey);
      $("#quantity").value = Math.max(1, l.availableQty ?? l.quantity);
      $("#unit-price").value = l.unitPrice;
      $("#custom-name").value = l.customName || "";
      try {
        ench = new Map(
          (JSON.parse(l.traitData || "{}").enchantmentSelections || []).map(
            (e) => [e.id, e.level],
          ),
        );
      } catch {
        ench.clear();
      }
      $("#lot-photo").value = "";
      await changePhoto();
      if (l.hasPhoto) {
        preparedPhoto = await m.loadPhoto(l);
        if (preparedPhoto) {
          $("#photo-preview").src = preparedPhoto;
          $("#photo-preview-wrap").hidden = false;
          $("#photo-preview").hidden = false;
          $("#photo-info").textContent = x(...pair("inline", "t8cf39a0a27e4"));
        }
      }
      renderPicker();
      renderSelection();
      renderEnchants();
      updateTotal();
      openSale();
    },
  });
  initAdmin();
  initReleaseTools();
  quality.registerDialogs();
  initFinishUI();
  initDiscordAuth();
  activeTask(() => {
    const uid = m.state.user?.uid,
      b = $("#save-profile");
    if (uid && b?.disabled && nextManualCheck(uid) === 0) {
      b.disabled = false;
      b.title = "";
    }
  }, 1000);
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
  $("#boot-retry").onclick = () => location.reload();
});
