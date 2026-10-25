import {playerStatus} from './minecraft-ui.js';
import * as m from "./market.js";
import { trading } from "./trading-ui.js";
import { deadline } from "./trading-data.js";
import * as a from "./admin-data.js";
import * as d from "./features-data.js";
import { initAds } from "./ads-ui.js";
export const experience = {
  renderThreads() {},
  renderMessages() {},
  renderDeals() {},
  chatOpened() {},
  async send() {},
  refresh() {},
};
const labels = {
  editNickname: ["Изменить ник Minecraft", "Edit Minecraft nickname"],
  rating: ["Рейтинг", "Rating"],
  deals: ["Сделки", "Deals"],
  markAllRead: ["Отметить всё прочитанным", "Mark all as read"],
  acceptAction: ["Принять запрос", "Accept request"],
  confirmAction: ["Подтвердить обмен", "Confirm exchange"],
  cancelAction: ["Отменить сделку", "Cancel trade"],
  sponsored: ["Реклама / сообщество ZENO", "Sponsored / ZENO community"],
  details: ["Подробнее", "Learn more"],
  ads: ["Реклама", "Advertising"],
  management: ["УПРАВЛЕНИЕ ZENO", "ZENO MANAGEMENT"],
  adsHelp: [
    "До 10 баннеров. Публиковать могут администратор и владелец. Карусель переключается каждые 7 секунд; при наведении, фокусе и в скрытой вкладке показ приостанавливается. Время указано по вашему устройству.",
    "Up to 10 banners. Administrators and owners can publish. Slides change every 7 seconds; hover, focus or a hidden tab pauses rotation. Times use your device timezone.",
  ],
  addBanner: ["Добавить баннер", "Add banner"],
  newBanner: ["Новый баннер", "New banner"],
  editBanner: ["Редактирование баннера", "Edit banner"],
  title: ["Заголовок", "Title"],
  description: ["Описание", "Description"],
  buttonText: ["Текст кнопки", "Button text"],
  link: ["Ссылка HTTPS", "HTTPS link"],
  starts: ["Начало показа", "Starts"],
  ends: ["Конец показа", "Ends"],
  bannerImage: ["Изображение баннера", "Banner image"],
  imageHelp: [
    "JPG, PNG или WebP до 5 МиБ. Рекомендуется широкий баннер. Изображение сжимается перед сохранением; оригинал не хранится.",
    "JPG, PNG or WebP, up to 5 MiB. A wide image is recommended. Images are compressed; originals are not stored.",
  ],
  removeImage: ["Удалить текущее изображение", "Remove current image"],
  enableBanner: ["Баннер включён", "Banner enabled"],
  saveBanner: ["Сохранить баннер", "Save banner"],
  deleteBanner: ["Удалить баннер", "Delete banner"],
  preview: ["Предпросмотр", "Preview"],
  draft: ["Черновик", "Draft"],
  noAds: ["Баннеров пока нет.", "No banners yet."],
  disabled: ["Выключен", "Disabled"],
  expired: ["Показ завершён", "Expired"],
  scheduled: ["Запланирован", "Scheduled"],
  active: ["Активен", "Active"],
  saved: ["Сохранено.", "Saved."],
  confirmDeleteBanner: [
    "Удалить баннер и изображение безвозвратно?",
    "Permanently delete this banner and its image?",
  ],
  pauseSlides: ["Остановить автопрокрутку", "Pause slideshow"],
  playSlides: ["Продолжить автопрокрутку", "Resume slideshow"],
  findChat: ["Найти диалог…", "Find a conversation…"],
  findMessage: ["Поиск в загруженных сообщениях…", "Search loaded messages…"],
  findDeal: ["Найти сделку…", "Find a deal…"],
  newMessages: ["К новым сообщениям", "Jump to new messages"],
  enterHint: [
    "Enter: отправить. Shift+Enter: новая строка",
    "Enter to send · Shift+Enter for a new line",
  ],
  listings: ["Объявления", "Listings"],
  reviews: ["Отзывы", "Reviews"],
  verifiedReviews: [
    "Отзывы могут оставлять только покупатели после завершённой сделки. Показано до 50 отзывов; оценка рассчитана по показанным.",
    "Only buyers with a completed deal can review. Up to 50 reviews are shown; the rating is based on those shown.",
  ],
  writeReview: ["Оставить отзыв", "Write a review"],
  yourRating: ["Ваша оценка", "Your rating"],
  reviewText: [
    "Что понравилось или пошло не так?",
    "What went well or could be improved?",
  ],
  reviewNotice: [
    "Один отзыв на завершённую сделку. После публикации текст нельзя изменить. Не публикуйте личные данные.",
    "One review per completed deal. Published reviews cannot be edited. Do not publish personal data.",
  ],
  publishReview: ["Опубликовать отзыв", "Publish review"],
  allDeals: ["Все статусы", "All statuses"],
  allTypes: ["Покупки и продажи", "Buying and selling"],
  pending: ["Ожидает продавца", "Awaiting seller"],
  accepted: ["Обмен согласован", "Trade agreed"],
  completed: ["Завершена", "Completed"],
  cancelled: ["Отменена", "Cancelled"],
  purchases: ["Покупки", "Purchases"],
  sales: ["Продажи", "Sales"],
  publicProfile: ["Посмотреть свой профиль", "View public profile"],
  chats: ["Чаты", "Chats"],
  favorites: ["Избранное", "Favorites"],
  sound: ["Звук уведомлений", "Notification sound"],
  on: ["Вкл.", "On"],
  off: ["Выкл.", "Off"],
  sectionHelp: ["Подсказки и ограничения раздела", "Section help and limits"],
  save: ["Сохранить", "Save"],
  copy: ["Копировать", "Copy"],
  reply: ["Ответить", "Reply"],
  edit: ["Изменить", "Edit"],
  remove: ["Удалить", "Delete"],
  deleted: ["Сообщение удалено", "Message deleted"],
  editing: ["Редактирование", "Editing message"],
  replying: ["Ответ на сообщение", "Replying to message"],
  edited: ["изменено", "edited"],
  noReviews: [
    "Отзывов пока нет. Завершите первую сделку, и покупатель сможет оставить отзыв.",
    "No reviews yet. Complete a first deal so a buyer can leave a review.",
  ],
  verified: ["Покупка подтверждена сделкой", "Verified completed deal"],
  respond: ["Ответить на отзыв", "Respond to review"],
  sellerResponse: ["Ответ продавца", "Seller response"],
  hideReview: ["Скрыть отзыв", "Hide review"],
  showReview: ["Восстановить отзыв", "Restore review"],
  hiddenReview: ["Скрыт модерацией", "Hidden by moderation"],
  reviewExists: [
    "Отзыв уже опубликован. Посмотреть его можно в профиле продавца.",
    "A review has already been published. View it on the seller profile.",
  ],
  reviewPublished: ["Отзыв опубликован.", "Review published."],
  trade: ["Сделка", "Trade"],
  message: ["Написать", "Message"],
  request: ["Запрос", "Request"],
  agreement: ["Согласование", "Agreement"],
  confirmations: ["Подтверждения", "Confirmations"],
  finished: ["Завершено", "Finished"],
  openListing: ["Открыть лот", "Open listing"],
  noMatch: [
    "Ничего не найдено. Измените поиск или фильтр.",
    "No matches. Change your search or filter.",
  ],
  inProgress: ["В работе", "In progress"],
  unread: ["Непрочитано", "Unread"],
  account: ["Аккаунт", "Account"],
  player: ["Игрок", "Player"],
  owner: ["Владелец", "Owner"],
  admin: ["Администратор", "Administrator"],
  moderator: ["Модератор", "Moderator"],
  realtime: ["Обновляется автоматически", "Updates automatically"],
  offline: [
    "Данные из кеша · нет связи с сервером",
    "Cached data · no server connection",
  ],
  copied: ["Скопировано", "Copied"],
  deleteMessage: [
    "Удалить своё сообщение? Останется отметка об удалении.",
    "Delete your message? A deleted-message marker will remain.",
  ],
  loadOlderReply: [
    "Исходное сообщение не загружено. Нажмите «Ранние сообщения».",
    "The original message is not loaded. Use Earlier messages.",
  ],
};
export function initExperience(h) {
  const {
    $,
    node: n,
    icon: i,
    x,
    show,
    task: run,
    toast,
    head,
    item,
    name,
    card,
    money,
    peerName,
    peerNames,
    openChat,
    openDeals,
    openFavorites,
    requireAccount,
    error,
  } = h;
  const t = (k) =>
    labels[k]?.[document.documentElement.lang === "en" ? 1 : 0] || k;
  const fmtTime = (v) =>
    v?.toDate
      ? new Intl.DateTimeFormat(document.documentElement.lang, {
          hour: "2-digit",
          minute: "2-digit",
        }).format(v.toDate())
      : "…";
  const fmtDate = (v) =>
    v?.toDate
      ? new Intl.DateTimeFormat(document.documentElement.lang, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(v.toDate())
      : "…";
  const btn = (key, icon, fn, cls = "v-secondary") => {
    const b = n("button", undefined, cls);
    b.type = "button";
    if (icon) b.append(i(icon));
    b.append(n("span", t(key)));
    b.onclick = fn;
    return b;
  };
  const iconBtn = (label, icon, fn) => {
    const b = btn(label, icon, fn, "icon-button");
    b.setAttribute("aria-label", t(label));
    b.title = t(label);
    b.querySelector("span").className = "sr-only";
    return b;
  };
  const metric = (label, value, icon) => {
    const c = n("div", undefined, "v-metric"),
      s = n("span");
    if (icon) s.append(i(icon));
    s.append(" " + t(label));
    c.append(s, n("strong", String(value)));
    return c;
  };
  const stars = (rating) => {
    const e = n("span", undefined, "v-stars");
    e.setAttribute("aria-label", rating + " / 5");
    for (let k = 1; k <= 5; k++) {
      const s = i("star");
      if (k <= rating) {
        s.style.fill = "currentColor";
        s.style.setProperty("--star-fill", "currentColor");
      }
      e.append(s);
    }
    return e;
  };
  const asyncText = (title, label, max, fn, min = 1) => {
    if (!$("#text-action-dialog").open) $("#text-action-dialog").showModal();
    $("#text-action-title").textContent = title;
    $("#text-action-label").textContent = label;
    const field = $("#text-action-input");
    field.value = "";
    field.maxLength = max;
    field.minLength = min;
    $("#text-action-status").textContent = "";
    $("#text-action-form").onsubmit = (e) => {
      e.preventDefault();
      run(
        $("#text-action-form button[type=submit]"),
        $("#text-action-status"),
        async () => {
          await fn(field.value.trim());
          $("#text-action-dialog").close();
        },
      );
    };
  };
  let seller = null,
    sellerReviews = [],
    sellerProfile = null,
    stopReviews = null,
    stopSellerLots = null,
    sellerEpoch = 0,
    sellerRows = [],
    reviewDeal = null,
    rating = 5,
    reviewUid = null;
  function renderReviews() {
    const box = $("#seller-review-list"),
      visible = sellerReviews.filter((r) => !r.hidden),
      average = visible.length
        ? visible.reduce((s, r) => s + r.rating, 0) / visible.length
        : 0;
    $("#seller-review-summary").replaceChildren(
      stars(Math.round(average)),
      n(
        "strong",
        visible.length
          ? average.toFixed(1) + " / 5"
          : x("Нет оценок", "Not rated"),
      ),
      n("span", t("reviews") + ": " + visible.length),
    );
    box.replaceChildren(
      ...sellerReviews.map((r) => {
        const c = n("article", undefined, "v-review"),
          header = n("header"),
          copy = n("div");
        const nick = n("strong", t("player"));
        copy.append(nick, n("p", t("verified"), "p-hint"));
        header.append(head(null), copy, stars(r.rating));
        peerName(r.authorId).then((v) => {
          if (!c.isConnected) return;
          nick.textContent = v;
          header.firstChild.replaceWith(head(v));
        });
        c.append(
          header,
          n("p", r.text),
          n("p", fmtDate(r.createdAt), "p-hint"),
        );
        if (r.hidden) c.append(n("span", t("hiddenReview"), "v-tag warn"));
        if (r.response) {
          const response = n("div", undefined, "v-review-response");
          response.append(n("strong", t("sellerResponse")), n("p", r.response));
          c.append(response);
        }
        const actions = n("div", undefined, "v-actions");
        if (m.state.publicId === seller)
          actions.append(
            btn("respond", "reply", () =>
              asyncText(t("respond"), t("sellerResponse"), 600, (text) =>
                d.respondReview(seller, r.docId, text),
              ),
            ),
          );
        if (a.isStaff())
          actions.append(
            btn(r.hidden ? "showReview" : "hideReview", "shield", () =>
              asyncText(
                t(r.hidden ? "showReview" : "hideReview"),
                x("Причина модерации", "Moderation reason"),
                500,
                (text) => d.moderateReview(seller, r, !r.hidden, text),
                8,
              ),
            ),
          );
        if (actions.childElementCount) c.append(actions);
        return c;
      }),
    );
    if (!sellerReviews.length) box.append(n("p", t("noReviews"), "p-empty"));
    $("#seller-metrics").replaceChildren(
      metric(
        "listings",
        sellerRows.filter((l) => l.visibility !== "hidden" && !l.salePaused).length,
        "package",
      ),
      metric("reviews", visible.length, "message"),
      metric(
        "rating",
        visible.length ? average.toFixed(1) + " / 5" : x("Нет", "None"),
        "star",
      ),
    );
    trading.sellerSummary($("#seller-metrics"),seller);
  }
  async function openSeller(id, nick) {
    seller = id;
    sellerProfile = null;
    sellerRows = [];
    sellerReviews = [];
    const epoch = ++sellerEpoch;
    stopReviews?.();
    stopSellerLots?.();
    stopReviews = stopSellerLots = null;
    show("seller-dialog");
    $("#seller-status").textContent = x(
      "Загрузка профиля…",
      "Loading profile…",
    );
    $("#seller-results").replaceChildren();
    $("#seller-review-list").replaceChildren();
    const profile = await m.publicProfile(id, true);
    if (epoch !== sellerEpoch) return;
    sellerProfile = profile;
    const identity = $("#seller-identity"),
      copy = n("div", undefined, "v-seller-copy"),
      title = n("h2", profile?.minecraftName || nick || t("player"));
    title.id = "seller-title";title.dataset.mcName=id;
    copy.append(
      title,
      n(
        "p",
        x(
          "Торговля внутри Minecraft · репутация по сделкам",
          "Minecraft trades · reputation from completed deals",
        ),
      ),
    );
    if(profile?.createdAt?.toDate)copy.append(n('p',x('На ZENO с ','Member since ')+new Intl.DateTimeFormat(document.documentElement.lang,{dateStyle:'medium'}).format(profile.createdAt.toDate()),'q-member-since'));
    copy.append(playerStatus(id));
    identity.replaceChildren(head(profile?.minecraftName || nick), copy);
    const follow = btn("favorites", "heart", () => {
      if (requireAccount())
        run(follow, $("#seller-status"), () =>
          m.toggleFavorite({ sellerId: id }, "seller"),
        );
    });
    follow.dataset.favoriteSeller = id;
    const syncFollow = () => {
      const saved = m.state.favorites.some((v) => v.docId === "s_" + id);
      follow.setAttribute("aria-pressed", String(saved));
    };
    syncFollow();
    identity.append(
      follow,
      btn("sectionHelp", "shield", () =>
        h.openReport({
          kind: "profile",
          id,
          label: profile?.minecraftName || nick,
        }),
      ),
    );
    identity.lastChild.querySelector("span").textContent = x(
      "Пожаловаться",
      "Report",
    );
    const { f, db } = await m.sdk();
    if (epoch !== sellerEpoch) return;
    stopSellerLots = f.onSnapshot(
      f.query(
        f.collection(db, "lots"),
        f.where("sellerId", "==", id),
        f.limit(50),
      ),
      (s) => {
        if (epoch !== sellerEpoch) return;
        sellerRows = s.docs.map((q) => ({
          ...q.data(),
          docId: q.id,
          id: q.id + ":" + q.data().id,
          cloud: true,
        }));
        $("#seller-results").replaceChildren(
          ...sellerRows.filter((l) => l.visibility !== "hidden" && !l.salePaused).map(card),
        );
        $("#seller-status").textContent = t("realtime");
        renderReviews();
      },
      (e) => ($("#seller-status").textContent = error(e)),
    );
    const stop = await d.watchReviews(
      id,
      (r) => {
        if (epoch !== sellerEpoch) return;
        sellerReviews = r;
        renderReviews();
      },
      (e) => ($("#seller-status").textContent = error(e)),
      a.isStaff(),
    );
    if (epoch !== sellerEpoch) stop();
    else stopReviews = stop;
    $("#seller-lots-tab").click();
  }
  $("#seller-dialog").addEventListener("close", () => {
    sellerEpoch++;
    stopReviews?.();
    stopSellerLots?.();
    stopReviews = stopSellerLots = null;
  });
  const sellerTab = (reviews) => {
    $("#seller-results").hidden = reviews;
    $("#seller-reviews").hidden = !reviews;
    $("#seller-lots-tab").setAttribute("aria-pressed", String(!reviews));
    $("#seller-reviews-tab").setAttribute("aria-pressed", String(reviews));
  };
  $("#seller-lots-tab").onclick = () => sellerTab(false);
  $("#seller-reviews-tab").onclick = () => sellerTab(true);
  function renderStars() {
    $("#review-stars").replaceChildren(
      ...[1, 2, 3, 4, 5].map((v) => {
        const b = iconBtn("yourRating", "star", () => {
          rating = v;
          renderStars();
        });
        b.setAttribute("aria-label", v + " / 5");
        b.setAttribute("aria-pressed", String(v <= rating));
        return b;
      }),
    );
  }
  async function openReview(deal) {
    if (!requireAccount()) return;
    reviewDeal = deal;
    reviewUid = m.state.user.uid;
    if (!$("#review-dialog").open) $("#review-dialog").showModal();
    rating = 5;
    renderStars();
    $("#review-form").reset();
    $("#review-text").disabled = false;
    $("#review-submit").disabled = true;
    $("#review-deal-name").textContent =
      (deal.title || name(item(deal.itemKey))) + " · " + deal.docId.slice(0, 8);
    $("#review-status").textContent = x("Проверка сделки…", "Checking deal…");
    try {
      const old = await d.getReview(deal);
      if (m.state.user?.uid !== reviewUid) return;
      $("#review-status").textContent = old ? t("reviewExists") : "";
      $("#review-submit").disabled = !!old;
      $("#review-text").disabled = !!old;
      if (old) {
        $("#review-text").value = old.text;
        rating = old.rating;
        renderStars();
      }
    } catch (e) {
      $("#review-status").textContent = error(e);
    }
  }
  $("#review-form").onsubmit = (e) => {
    e.preventDefault();
    if (!reviewDeal || m.state.user?.uid !== reviewUid) return;
    run($("#review-submit"), $("#review-status"), async () => {
      await d.writeReview(reviewDeal, rating, $("#review-text").value);
      $("#review-status").textContent = t("reviewPublished");
      $("#review-text").disabled = true;
      reviewDeal = null;
      setTimeout(() => {
        $("#review-submit").disabled = true;
      }, 0);
    });
  };
  let activeThread = null,
    messageRows = [],
    replyId = "",
    editing = null,
    drafts = new Map(),
    searchMessage = "",
    messageFirst = true,
    chatSeenAt = 0;
  const context = () => {
    const msg = editing || messageRows.find((r) => r.docId === replyId);
    $("#chat-context").hidden = !msg;
    $("#chat-context-text").textContent = msg
      ? (editing ? t("editing") : t("replying")) +
        ": " +
        (msg.body || t("deleted"))
      : "";
  };
  function clearContext() {
    replyId = "";
    editing = null;
    context();
  }
  function renderThreads() {
    const q = $("#thread-search").value.trim().toLowerCase(),
      box = $("#thread-list");
    box.replaceChildren(
      ...m.state.threads.map((th) => {
        const b = n(
            "button",
            undefined,
            th.docId === h.currentThread ? "active" : "",
          ),
          peer = th.sellerId === m.state.publicId ? th.buyerId : th.sellerId,
          c = n("div"),
          title = n("strong", peerNames.get(peer) || t("player")),
          art = head(peerNames.get(peer));
        b.type = "button";
        b.dataset.thread = th.docId;
        c.append(
          title,
          n("p", th.title || name(item(th.itemKey))),
          n("small", fmtDate(th.updatedAt)),
        );
        b.append(art, c);
        if (m.unread("thread", th)) b.append(n("b", "●"));
        const filter = () =>
          (b.hidden =
            !!q &&
            !(title.textContent + " " + c.textContent)
              .toLowerCase()
              .includes(q));
        filter();
        peerName(peer).then((nick) => {
          title.textContent = nick;
          art.replaceWith(head(nick));
          filter();
        });
        b.onclick = () => openChat(th.docId);
        return b;
      }),
    );
    if (!m.state.threads.length)
      box.append(
        n(
          "p",
          x(
            "Открой объявление и напиши продавцу. Диалог появится здесь.",
            "Message a seller from a listing to start a conversation.",
          ),
          "p-empty",
        ),
      );
  }
  function fitComposer() {
    const input = $("#message-text");
    input.style.height = "46px";
    input.style.height =
      Math.min(128, Math.max(46, input.scrollHeight + 2)) + "px";
  }
  document.addEventListener("input", (event) => {
    if (event.target?.id === "message-text") fitComposer();
  });
  document.addEventListener("submit", (event) => {
    if (event.target?.id === "message-form") setTimeout(fitComposer, 100);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const tools = $("#messages").querySelectorAll(".v-message-tools[open]");
    if (tools.length) {
      event.preventDefault();
      event.stopPropagation();
      tools.forEach((v) => (v.open = false));
    }
  });
  function messageActions(msg) {
    const actions = n("div", undefined, "v-message-actions");
    const copy = iconBtn("copy", "copy", () =>
      navigator.clipboard
        ?.writeText(msg.body)
        .then(() => toast(t("copied")))
        .catch(() => toast(x("Не удалось скопировать", "Could not copy"))),
    );
    actions.append(
      iconBtn("reply", "reply", () => {
        editing = null;
        replyId = msg.docId;
        context();
        $("#message-text").focus();
      }),
      copy,
    );
    if (
      msg.senderId === m.state.publicId &&
      msg.createdAt?.toMillis() &&
      Date.now() - msg.createdAt.toMillis() < 15 * 60000
    ) {
      actions.append(
        iconBtn("edit", "edit", () => {
          editing = msg;
          replyId = "";
          $("#message-text").value = msg.body;
          context();
          $("#message-text").focus();
        }),
        iconBtn("remove", "trash", () => {
          if (confirm(t("deleteMessage")))
            run(null, $("#chat-status"), () =>
              d.editMessage(activeThread, msg, "", true),
            );
        }),
      );
    }
    return actions;
  }
  function renderMessages(rows) {
    const box = $("#messages"),
      near = box.scrollHeight - box.scrollTop - box.clientHeight < 100,
      oldTop = box.scrollTop;
    messageRows = rows;
    box.replaceChildren();
    let day = "";
    let firstUnread = null;
    let matches = 0;
    for (const msg of rows) {
      const currentDay = msg.createdAt?.toDate
        ? new Intl.DateTimeFormat(document.documentElement.lang, {
            dateStyle: "long",
          }).format(msg.createdAt.toDate())
        : "";
      if (currentDay && day !== currentDay) {
        day = currentDay;
        box.append(n("div", day, "v-date-divider"));
      }
      const e = n(
        "div",
        undefined,
        "p-message" + (msg.senderId === m.state.publicId ? " mine" : ""),
      );
      if(!firstUnread&&msg.senderId!==m.state.publicId&&(msg.createdAt?.toMillis?.()||0)>chatSeenAt){firstUnread=e;box.append(n('div',x('Новые сообщения','New messages'),'q-unread-divider'))}
      e.id = "message-" + msg.docId;
      e.dataset.messageId = msg.docId;
      if (msg.replyTo) {
        const original = rows.find((q) => q.docId === msg.replyTo),
          quote = n(
            "button",
            original?.deleted ? t("deleted") : original?.body || t("replying"),
            "v-reply-quote",
          );
        quote.type = "button";
        quote.onclick = () => {
          const target = document.getElementById("message-" + msg.replyTo);
          if (target) {
            target.scrollIntoView({ block: "center" });
            target.classList.add("v-flash");
            setTimeout(() => target.classList.remove("v-flash"), 1400);
          } else toast(t("loadOlderReply"));
        };
        e.append(quote);
      }
      const body=n("div",undefined,"v-message-body");
      if(msg.deleted)body.textContent=t("deleted");else{const re=/https?:\/\/[^\s<>]+/gi;let pos=0;for(const match of msg.body.matchAll(re)){body.append(document.createTextNode(msg.body.slice(pos,match.index)));let raw=match[0],url;try{url=new URL(raw)}catch{}if(url&&!url.username&&!url.password){const a=n("a",raw+" · "+x("внешняя ссылка","external link"),"trade-external");a.href=url.href;a.target="_blank";a.rel="noopener noreferrer nofollow";a.onclick=event=>{if(!confirm(x("Открыть внешний сайт ","Open external website ")+url.hostname+"? "+x("Не вводи пароли и коды Discord.","Never enter passwords or Discord codes.")))event.preventDefault()};body.append(a)}else body.append(document.createTextNode(raw));pos=match.index+raw.length}body.append(document.createTextNode(msg.body.slice(pos)))}e.append(body);
      if (
        searchMessage &&
        !msg.deleted &&
        msg.body.toLowerCase().includes(searchMessage)
      ) {
        e.classList.add("v-found");
        matches++;
      }
      const footer = n("div", undefined, "v-message-footer");
      footer.append(
        n(
          "time",
          fmtTime(msg.createdAt) +
            (msg.editedAt && !msg.deleted ? " · " + t("edited") : ""),
        ),
      );
      if (!msg.deleted) {
        const tools = n("details", undefined, "v-message-tools"),
          summary = n("summary", "⋯");
        summary.title = x("Действия с сообщением", "Message actions");
        summary.setAttribute("aria-label", summary.title);
        const actions = messageActions(msg);
        actions.addEventListener("click", () => (tools.open = false));
        tools.append(summary, actions);
        tools.addEventListener("toggle", () => {
          if (tools.open)
            box.querySelectorAll(".v-message-tools[open]").forEach((other) => {
              if (other !== tools) other.open = false;
            });
        });
        footer.append(tools);
      }
      e.append(footer);
      box.append(e);
    }
    $("#message-search-count").textContent = searchMessage
      ? String(matches)
      : "";
    if (near || messageFirst) {
      box.scrollTop = box.scrollHeight;
      $("#chat-bottom").hidden = true;
    } else {
      box.scrollTop = oldTop;
      $("#chat-bottom").hidden = false;
    }
    if(messageFirst&&chatSeenAt&&firstUnread){box.scrollTop=Math.max(0,firstUnread.offsetTop-box.offsetTop-32);$("#chat-bottom").hidden=box.scrollHeight-box.scrollTop-box.clientHeight<100}
    messageFirst = false;
  }
  function chatOpened(id, th) {
    activeThread = id;
    let safety=$("#chat-safety");if(!safety){safety=n('div',undefined,'trade-chat-safety');safety.id='chat-safety';$('#messages').before(safety)}safety.replaceChildren();if(id){const warning=n('p',x('Не переходи по незнакомым ссылкам и не называй пароли, коды входа и токены. Обмен происходит в Minecraft.','Do not follow unknown links or share passwords, login codes or tokens. Trade takes place in Minecraft.'));const report=n('button',undefined,'v-secondary');report.type='button';report.id='chat-report';report.append(i('shield'),n('span',x('Пожаловаться','Report')));report.onclick=()=>h.openReport({kind:'thread',id,generation:'',label:x('Жалоба на переписку. Опиши нарушение; сотрудникам не открывается весь чат.','Report this conversation. Describe the issue; staff cannot access the full chat.')});safety.append(warning,report)}
    messageFirst = true;
    chatSeenAt = id ? (m.state.reads.get("thread_"+id)||0) : 0;
    messageRows = [];
    clearContext();
    if (!id) {
      $("#chat-peer").replaceChildren(
        n("p", x("Выберите диалог слева", "Select a conversation")),
      );
      $("#messages").replaceChildren();
      $("#message-text").value = "";
      return;
    }
    $("#message-text").value = drafts.get(id) || "";
    $("#message-length").textContent =
      $("#message-text").value.length + " / 2000";
    $("#message-search-wrap").hidden = true;
    $("#message-search").value = "";
    searchMessage = "";
    const actions = n("div", undefined, "v-actions");
    actions.append(
      iconBtn("findMessage", "search", () => {
        $("#message-search-wrap").hidden = !$("#message-search-wrap").hidden;
        if (!$("#message-search-wrap").hidden) $("#message-search").focus();
      }),
    );
    if (th)
      actions.append(
        iconBtn("openListing", "package", () =>
          run(null, $("#chat-status"), async () => {
            const l = await m.fetchLot(th.lotDoc, th.lotGenerationId);
            if (!l) throw { code: "listing-changed" };
            h.openLot(l);
          }),
        ),
      );
    $("#chat-peer").append(actions);
  }
  $("#thread-search").oninput = renderThreads;
  $("#message-search").oninput = () => {
    searchMessage = $("#message-search").value.trim().toLowerCase();
    renderMessages(messageRows);
  };
  $("#chat-context-close").onclick = () => {
    if (editing) $("#message-text").value = drafts.get(activeThread) || "";
    clearContext();
  };
  $("#messages").onscroll = () => {
    if (
      $("#messages").scrollHeight -
        $("#messages").scrollTop -
        $("#messages").clientHeight <
      80
    )
      $("#chat-bottom").hidden = true;
  };
  $("#chat-bottom").onclick = () => {
    $("#messages").scrollTop = $("#messages").scrollHeight;
    $("#chat-bottom").hidden = true;
  };
  $("#message-text").addEventListener("input", () => {
    if (!editing) drafts.set(activeThread, $("#message-text").value);
    $("#message-length").textContent =
      $("#message-text").value.length + " / 2000";
    $("#message-text").style.height = "auto";
    $("#message-text").style.height =
      Math.min(160, $("#message-text").scrollHeight) + "px";
  });
  $("#emoji-picker").replaceChildren(
    ...["👋", "😊", "👍", "✅", "🤝", "💎", "📍", "⏳"].map((emoji) => {
      const b = n("button", emoji);
      b.type = "button";
      b.setAttribute("aria-label", emoji);
      b.onclick = () => {
        const input = $("#message-text");
        if (input.value.length + emoji.length <= 2000) {
          const pos = input.selectionStart;
          input.setRangeText(emoji, pos, input.selectionEnd, "end");
          input.dispatchEvent(new Event("input"));
        }
        $("#emoji-picker").hidden = true;
        input.focus();
      };
      return b;
    }),
  );
  $("#chat-emoji").onclick = () =>
    ($("#emoji-picker").hidden = !$("#emoji-picker").hidden);
  async function send(id, body) {
    if (editing) await d.editMessage(id, editing, body);
    else await m.sendMessage(id, body, replyId);
    clearContext();
    drafts.delete(id);
    $("#message-length").textContent = "0 / 2000";
    $("#message-text").style.height = "auto";
  }
  function renderDeals() {
    if (!$("#deals-dialog").open) return;
    const openCount=m.state.deals.filter(d=>['pending','accepted'].includes(d.status)).length;const reminder=$('#open-reserve-note');reminder.hidden=!openCount;reminder.textContent=x(`Открытых сделок в загруженной истории: ${openCount}. Ненужные запросы лучше отменить, чтобы освободить резерв.`,`Open trades in loaded history: ${openCount}. Cancel unneeded requests to release stock.`);
    const all = m.state.deals,
      q = $("#deal-search").value.trim().toLowerCase(),
      status = $("#deal-filter").value,
      dir = $("#deal-direction").value,
      rows = all.filter(
        (v) =>
          (status === "all" || v.status === status) &&
          (dir === "all" ||
            (dir === "buy") === (v.buyerId === m.state.publicId)) &&
          (
            (v.title || name(item(v.itemKey))) +
            " " +
            v.docId +
            " " +
            (peerNames.get(
              v.buyerId === m.state.publicId ? v.sellerId : v.buyerId,
            ) || "")
          )
            .toLowerCase()
            .includes(q),
      );
    $("#deal-summary").replaceChildren(
      metric("deals", all.length, "trade"),
      metric(
        "inProgress",
        all.filter((v) => ["pending", "accepted"].includes(v.status)).length,
        "clock",
      ),
      metric(
        "completed",
        all.filter((v) => v.status === "completed").length,
        "check",
      ),
    );
    $("#deal-list").replaceChildren(
      ...rows.map((v) => {
        const me = v.buyerId === m.state.publicId,
          peer = me ? v.sellerId : v.buyerId,
          c = n("article", undefined, "p-deal"),
          copy = n("div"),
          top = n("div", undefined, "v-deal-top"),
          heading = n("div");
        c.dataset.deal = v.docId;
        heading.append(
          n("h3", v.title || name(item(v.itemKey))),
          n("p", t(me ? "purchases" : "sales") + " · #" + v.docId.slice(0, 8)),
        );
        top.append(
          heading,
          n(
            "span",
            v.expired?x("Срок истёк","Expired"):t(v.status),
            "v-tag " + (v.status === "completed" ? "good" : "warn"),
          ),
        );
        copy.append(top);
        const person = n("p"),verifiedName=n("span",t("player"));
        verifiedName.dataset.mcName=peer;
        person.append(verifiedName,n("span"," · "+fmtDate(v.createdAt)));
        peerName(peer).then(nick=>verifiedName.textContent=nick);
        copy.append(person,playerStatus(peer));
        const price = n("p", undefined, "v-deal-total");
        price.append(money(v.total));
        copy.append(
          price,
          n("p", v.quantity + x(" шт. × ", " items × ") + v.unitPrice + " ◆"),
          n(
            "p",
            x(
              `Подтверждено: покупатель ${v.buyerConfirmed ? "✓" : "-"} / продавец ${v.sellerConfirmed ? "✓" : "-"}`,
              `Confirmed: buyer ${v.buyerConfirmed ? "✓" : "-"} / seller ${v.sellerConfirmed ? "✓" : "-"}`,
            ),
          ),
        );
        if (v.status !== "cancelled") {
          const progress = n("div", undefined, "v-progress");
          for (const [j, key] of [
            "request",
            "agreement",
            "confirmations",
            "finished",
          ].entries()) {
            const done =
                j === 0 ||
                (j === 1 && v.status !== "pending") ||
                (j === 2 && (v.buyerConfirmed || v.sellerConfirmed)) ||
                (j === 3 && v.status === "completed"),
              stage = n("span", undefined, done ? "done" : "");
            stage.append(i(done ? "check" : "clock"), t(key));
            progress.append(stage);
          }
          copy.append(progress);
        }
        if(['pending','accepted'].includes(v.status)){const timer=n('p',undefined,'trade-deadline');timer.dataset.tradeDeadline=deadline(v);copy.append(timer)}
        const actions = n("div", undefined, "p-actions");
        const action = (act, key, icon) => {
          const b = btn(key, icon, () => {
            if (
              act === "confirm" &&
              !confirm(
                x(
                  "Подтвердить получение предметов и завершение обмена в Minecraft?",
                  "Confirm the items have been exchanged in Minecraft?",
                ),
              )
            )
              return;
            run(b, $("#deals-status"), () => m.changeDeal(v.docId, act));
          });
          b.dataset.dealAction = act;
          actions.append(b);
        };
        if (v.status === "pending" && !me && Date.now()<deadline(v))
          action("accept", "acceptAction", "check");
        if (
          v.status === "accepted" && Date.now()<deadline(v) &&
          !(me ? v.buyerConfirmed : v.sellerConfirmed)
        )
          action("confirm", "confirmAction", "check");
        if (["pending", "accepted"].includes(v.status))
          action("cancel", "cancelAction", "close");
        actions.append(
          btn("message", "message", () =>
            run(null, $("#deals-status"), async () =>
              openChat(await d.dealThread(v)),
            ),
          ),
        );
        if (v.status === "completed" && me)
          actions.append(btn("writeReview", "star", () => openReview(v)));
        c.append(h.sprite(item(v.itemKey)), copy, actions);
        return c;
      }),
    );
    if (!rows.length) $("#deal-list").append(n("p", t("noMatch"), "p-empty"));
    window.dispatchEvent(new Event("zeno-trades-rendered"));
  }
  for (const selector of ["#deal-search", "#deal-filter", "#deal-direction"])
    $(selector).addEventListener("input", renderDeals);
  let uid = null,
    threadsPrimed = false,
    dealsPrimed = false,
    threadBefore = new Map(),
    dealBefore = new Map(),
    unlocked = false,
    lastBeep = 0;
  const audio = new Audio("./assets/notification.mp3");
  audio.preload = "auto";
  audio.volume = 0.28;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    audio.muted = true;
    const p = audio.play();
    p?.then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    }).catch(() => {
      audio.muted = false;
    });
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  function ping(text) {
    toast(text);
    if (!m.state.soundEnabled || !unlocked || Date.now() - lastBeep < 1500)
      return;
    lastBeep = Date.now();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  function notifications() {
    const me = m.state.user?.uid || null;
    if (me !== uid) {
      uid = me;
      threadsPrimed = dealsPrimed = false;
      threadBefore.clear();
      dealBefore.clear();
      drafts.clear();
      for (const id of ["review-dialog", "text-action-dialog"])
        $("#" + id).close();
    }
    if (!me) return;
    if (m.state.threadsReady) {
      for (const v of m.state.threads) {
        const prev = threadBefore.get(v.docId);
        if (
          threadsPrimed &&
          v.lastMessageId &&
          v.lastSenderId !== m.state.publicId &&
          prev !== v.lastMessageId
        )
          ping(x("Новое сообщение", "New message"));
      }
      threadBefore = new Map(
        m.state.threads.map((v) => [v.docId, v.lastMessageId]),
      );
      threadsPrimed = true;
    }
    if (m.state.dealsReady) {
      for (const v of m.state.deals) {
        const prev = dealBefore.get(v.docId),
          meBuyer = v.buyerId === m.state.publicId,
          changed =
            (!prev && !meBuyer && v.status === "pending") ||
            (prev &&
              ((prev.status !== v.status &&
                (v.status === "cancelled"
                  ? v.cancelledBy !== m.state.publicId
                  : meBuyer && v.status === "accepted")) ||
                (meBuyer
                  ? v.sellerConfirmed && !prev.sellerConfirmed
                  : v.buyerConfirmed && !prev.buyerConfirmed)));
        if (dealsPrimed && changed)
          ping(x("Обновление сделки", "Trade update"));
      }
      dealBefore = new Map(m.state.deals.map((v) => [v.docId, { ...v }]));
      dealsPrimed = true;
    }
  }
  let nicknameFoldKey = "";
  function account() {
    const signed = !!m.state.publicId,
      fold = $("#account-nickname-editor"),
      key = (m.state.user?.uid || "guest") + "_" + (signed ? "saved" : "new");
    fold.hidden = !m.state.user;
    if (key !== nicknameFoldKey) {
      nicknameFoldKey = key;
      if (!fold.contains(document.activeElement)) fold.open = !signed;
    }
    $("#account-nickname").textContent = m.state.profile?.minecraftName || "";
    $("#account-overview").hidden = !signed;
    if (signed) {
      $("#account-metrics").replaceChildren(
        metric("listings", m.state.ownLots.length, "package"),
        metric("deals", m.state.deals.length, "trade"),
        metric(
          "unread",
          m.state.threads.filter((v) => m.unread("thread", v)).length,
          "message",
        ),
      );
      $("#account-role-badge").replaceChildren(
        n(
          "span",
          t(a.access.role === "none" ? "player" : a.access.role),
          "v-tag",
        ),
      );
    }
    for (const id of ["account-sound", "notification-sound"]) {
      $("#" + id).setAttribute("aria-pressed", String(m.state.soundEnabled));
      $("#" + id).textContent = t(m.state.soundEnabled ? "on" : "off");
    }
    const refresh = $("#refresh");
    if (!refresh.querySelector("svg")) refresh.prepend(i("refresh"));
  }
  for (const id of ["account-sound", "notification-sound"])
    $("#" + id).onclick = () =>
      run($("#" + id), $("#profile-status"), async () => {
        const next = !m.state.soundEnabled;
        if (m.state.publicId) await d.saveSound(next);
        else {
          m.state.soundEnabled = next;
          account();
        }
      });
  $("#account-public").onclick = () =>
    openSeller(m.state.publicId, m.state.profile?.minecraftName);
  $("#account-chats").onclick = () => openChat();
  $("#account-favorites").onclick = openFavorites;
  const readAll = btn("markAllRead", "check", () => {
    if (!requireAccount()) return;
    run(readAll, null, async () => {
      await Promise.all([
        trading.markAll(),
        ...m.state.threads
          .filter((v) => m.unread("thread", v))
          .map((v) => m.markRead("thread", v.docId)),
        ...m.state.deals
          .filter((v) => m.unread("deal", v))
          .map((v) => m.markRead("deal", v.docId)),
      ]);
      toast(t("saved"));
    });
  });
  $("#notification-list").before(readAll);
  const ads = initAds({ $, n, i, t, x, show, run, error });
  function translate() {
    document
      .querySelectorAll("[data-v]")
      .forEach((e) => (e.textContent = t(e.dataset.v)));
    document
      .querySelectorAll("[data-vph]")
      .forEach((e) => (e.placeholder = t(e.dataset.vph)));
    account();
    renderThreads();
    renderDeals();
    if ($("#seller-dialog").open) renderReviews();
    if (activeThread && $("#chat-dialog").open) renderMessages(messageRows);
    ads.refresh();
  }
  Object.assign(experience, {
    renderThreads,
    renderMessages,
    renderDeals,
    chatOpened,
    send,
    refresh: translate,
    openSeller,
  });
  window.addEventListener("zeno-data", () => {
    notifications();
    account();
  });
  window.addEventListener("zeno-access", () => {
    account();
    if (!a.isStaff() && sellerReviews.some((r) => r.hidden)) {
      sellerReviews = sellerReviews.filter((r) => !r.hidden);
      renderReviews();
    }
  });
  new MutationObserver(translate).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  translate();
}
