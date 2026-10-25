import { message } from "./localization.js";
import { notificationCenter } from "./notification-center.js";
import { pair } from "./localization.js";
import { activeTask } from "./active-scheduler.js";
import * as m from "./market.js";
import * as d from "./trading-data.js";
export const trading = {
  sellerSummary() {},
  decorate() {},
  lotActions() {},
  openOwn() {},
  unreadCount() {
    return 0;
  },
  async markAll() {},
};
export function initTrading(h) {
  const {
    $,
    node: n,
    icon,
    x,
    show,
    task,
    toast,
    item,
    name,
    card,
    money,
    requireAccount,
    error,
  } = h;
  const tradeWord = (v) =>
    document.documentElement.lang === "en"
      ? "trades"
      : { one: "сделка", few: "сделки", many: "сделок", other: "сделки" }[
          new Intl.PluralRules("ru").select(v)
        ];
  const fmt = (v) =>
    new Intl.NumberFormat(document.documentElement.lang, {
      maximumFractionDigits: 2,
    }).format(v);
  let uid = null,
    privateStop = null,
    privateEpoch = 0,
    subscriptions = [],
    alerts = [],
    backend = null,
    currentEdit = null,
    editFromOwn = false,
    privateError = "";
  const make = (tag, text, cls) => n(tag, text, cls);
  function button(text, symbol, fn, cls = "v-secondary") {
    const b = n("button", undefined, cls);
    b.type = "button";
    if (symbol) b.append(icon(symbol));
    b.append(n("span", text));
    b.onclick = fn;
    return b;
  }
  function dialog(id, title, wide = false) {
    const el = n("dialog", undefined, "p-dialog" + (wide ? " p-wide" : ""));
    el.id = id;
    const head = n("header"),
      h2 = n("h2", title),
      close = button("×", null, () => el.close(), "icon-button");
    h2.id = id + "-title";
    close.setAttribute("aria-label", x(...pair("inline", "tc50d5ca0eab6")));
    el.setAttribute("aria-labelledby", h2.id);
    head.append(h2, close);
    el.append(head);
    document.body.append(el);
    return el;
  }
  const own = dialog(
      "own-lots-dialog",
      x(...pair("inline", "t860e36c1b9ed")),
      true,
    ),
    ownStatus = n("p", undefined, "p-status"),
    ownList = n("div", undefined, "trade-own-list");
  ownStatus.setAttribute("role", "status");
  own.append(
    n("p", x(...pair("inline", "t97fc6806e05f")), "p-hint"),
    ownStatus,
    ownList,
  );
  const edit = dialog("edit-lot-dialog", x(...pair("inline", "t6e6abbde6075"))),
    editForm = n("form"),
    editInfo = n("p", undefined, "p-hint"),
    editStatus = n("p", undefined, "p-status");
  editStatus.setAttribute("role", "status");
  function field(id, label, type = "text") {
    const l = n("label", undefined, "p-label"),
      input = n("input");
    input.id = id;
    input.type = type;
    l.append(n("span", label), input);
    return { label: l, input };
  }
  const ep = field(
      "edit-lot-price",
      x(...pair("inline", "t41fa16108e72")),
      "number",
    ),
    eq = field(
      "edit-lot-available",
      x(...pair("inline", "t9b2ccb8807b1")),
      "number",
    ),
    en = field("edit-lot-name", x(...pair("inline", "t280d64ad2eac")));
  ep.input.min = 1;
  ep.input.max = 1e9;
  ep.input.required = true;
  eq.input.min = 0;
  eq.input.max = 1e6;
  eq.input.required = true;
  en.input.maxLength = 80;
  const es = n("button", x(...pair("inline", "t945c93c4ec1c")), "primary");
  es.type = "submit";
  editForm.append(editInfo, ep.label, eq.label, en.label, editStatus, es);
  edit.append(editForm);
  editForm.onsubmit = (e) => {
    e.preventDefault();
    task(es, editStatus, async () => {
      await d.editLot(currentEdit, {
        unitPrice: ep.input.value,
        availableQty: eq.input.value,
        customName: en.input.value,
      });
      edit.close();
      if (editFromOwn) {
        show(own.id);
        renderOwn();
      }
      toast(x(...pair("inline", "t63ad1f25f631")));
    });
  };
  function openEdit(l) {
    editFromOwn = own.open;
    currentEdit = l;
    ep.input.value = l.unitPrice;
    eq.input.value = l.availableQty ?? l.quantity;
    en.input.value = l.customName || "";
    editInfo.textContent = message("dynamic", "mf2155f6496d6", {
      v0: l.reservedQty || 0,
      v1: l.soldQty || 0,
    });
    editStatus.textContent = "";
    show(edit.id);
  }
  function asLot(l) {
    return {
      ...l,
      id: l.docId + ":" + l.id,
      cloud: true,
      available: l.availableQty ?? l.quantity,
    };
  }
  function quickActions(l, container) {
    const row = n("div", undefined, "trade-actions");
    row.append(
      button(x(...pair("inline", "t0491ca96f47c")), "edit", () => openEdit(l)),
      button(
        x(
          l.salePaused ? "Вернуть в продажу" : "Снять с продажи",
          l.salePaused ? "Resume sale" : "Pause sale",
        ),
        "package",
        (e) =>
          task(e.currentTarget, ownStatus, () => d.pauseLot(l, !l.salePaused)),
      ),
      button(x(...pair("inline", "t2932c1de6037")), "arrow", (e) =>
        task(e.currentTarget, ownStatus, () => d.bumpLot(l)),
      ),
      button(x(...pair("inline", "tc742676536e1")), "copy", (e) =>
        task(e.currentTarget, ownStatus, async () => {
          await h.template(l);
        }),
      ),
    );
    const [eb, pb, bb] = row.children;
    eb.disabled = pb.disabled = l.visibility === "hidden";
    bb.disabled =
      l.visibility === "hidden" ||
      l.salePaused ||
      (l.availableQty ?? l.quantity) <= 0 ||
      !!(l.bumpedAt && Date.now() - l.bumpedAt.toMillis() < 86400000);
    if (bb.disabled) bb.title = x(...pair("inline", "tf74ea0ec585f"));
    if (l.bumpedAt && Date.now() - l.bumpedAt.toMillis() < 86400000) {
      const hint = n(
        "p",
        x(...pair("inline", "t454303a4b8d7")) +
          Math.ceil((l.bumpedAt.toMillis() + 86400000 - Date.now()) / 3600000) +
          x(...pair("inline", "t4edabe5e6c9a")),
        "p-hint",
      );
      hint.dataset.bumpDeadline = l.bumpedAt.toMillis() + 86400000;
      container.append(hint);
    }
    container.append(row);
  }
  const selectedLots = new Set(),
    bulk = n("div", undefined, "release-bulk");
  const allLabel = n("label"),
    allInput = n("input");
  allInput.type = "checkbox";
  allLabel.append(allInput, n("span", x(...pair("inline", "t2fdc6280a175"))));
  allInput.onchange = () => {
    selectedLots.clear();
    if (allInput.checked)
      for (const l of m.state.ownLots) selectedLots.add(l.docId);
    renderOwn();
  };
  bulk.append(allLabel);
  for (const [act, ru, en] of [
    ["pause", "Пауза выбранных", "Pause selected"],
    ["resume", "Вернуть выбранные", "Resume selected"],
    ["delete", "Удалить выбранные", "Delete selected"],
  ])
    bulk.append(
      button(x(ru, en), act === "delete" ? "trash" : "package", (e) =>
        task(e.currentTarget, ownStatus, async () => {
          const chosen = m.state.ownLots
            .filter((l) => selectedLots.has(l.docId))
            .slice(0, 20)
            .map(asLot);
          if (!chosen.length) return;
          if (
            act === "delete" &&
            !confirm(x(...pair("inline", "t3dcda86aa872")))
          )
            return;
          let done = 0,
            failed = 0;
          for (const l of chosen) {
            try {
              if (act === "delete") await m.deleteLot(l);
              else await d.pauseLot(l, act === "pause");
              done++;
              selectedLots.delete(l.docId);
            } catch {
              failed++;
            }
          }
          ownStatus.textContent =
            x(...pair("inline", "t7c17a8ffa1da")) +
            done +
            x(...pair("inline", "t4751016de62a")) +
            failed +
            x(...pair("inline", "t3b8c6b39f52d"));
          renderOwn();
        }),
      ),
    );
  ownList.before(bulk);
  function renderOwn() {
    if (!own.open) return;
    ownList.replaceChildren();
    const rows = m.state.ownLots
      .map(asLot)
      .sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
      );
    if (!rows.length)
      ownList.append(n("p", x(...pair("inline", "tf6071676b309")), "q-empty"));
    for (const l of rows) {
      const a = n("article", undefined, "trade-own-card"),
        top = n("div", undefined, "trade-own-top");
      top.append(
        n("h3", l.customName || name(item(l.itemKey))),
        n(
          "span",
          x(
            l.visibility === "hidden"
              ? "Скрыт модератором"
              : l.salePaused
                ? "Снят с продажи"
                : "В продаже",
            l.visibility === "hidden"
              ? "Moderated"
              : l.salePaused
                ? "Paused"
                : "On sale",
          ),
          "v-tag",
        ),
      );
      const selectLabel = n("label", undefined, "q-check"),
        select = n("input");
      select.type = "checkbox";
      select.checked = selectedLots.has(l.docId);
      select.onchange = () => {
        if (select.checked) selectedLots.add(l.docId);
        else selectedLots.delete(l.docId);
      };
      selectLabel.append(
        select,
        n("span", x(...pair("inline", "t54dc00861312"))),
      );
      a.prepend(selectLabel);
      a.dataset.lot = l.docId;
      const summary = n("p");
      summary.append(
        money(l.unitPrice),
        message("dynamic", "mdd9377c1e965", {
          v0: l.availableQty ?? l.quantity,
          v1: l.reservedQty || 0,
        }),
      );
      a.append(top, summary);
      quickActions(l, a);
      a.append(
        button(x(...pair("inline", "tb9b82aabf04e")), "search", () =>
          h.openLot(l),
        ),
      );
      ownList.append(a);
    }
  }
  function openOwn() {
    if (!requireAccount()) return;
    show(own.id);
    renderOwn();
  }
  const subs = dialog(
      "subscriptions-dialog",
      x(...pair("inline", "t7a79e52e7a91")),
    ),
    subNote = n("p", undefined, "p-hint"),
    subStatus = n("p", undefined, "p-status"),
    subForm = n("form"),
    si = field("subscription-item", x(...pair("inline", "t7b135ac00c77"))),
    sp = field(
      "subscription-price",
      x(...pair("inline", "t461dfecc8f07")),
      "number",
    ),
    ss = n("button", x(...pair("inline", "t7d2a1d9cdce9")), "primary"),
    subList = n("div", undefined, "trade-sub-list");
  si.input.required = true;
  si.input.setAttribute("list", "trade-items");
  const dl = n("datalist");
  dl.id = "trade-items";
  for (const it of h.catalog.items) {
    const o = n("option");
    o.value = it.key;
    o.label = name(it);
    dl.append(o);
  }
  sp.input.min = 2;
  sp.input.max = 1e9;
  sp.input.required = true;
  sp.input.value = 50;
  ss.type = "submit";
  subStatus.setAttribute("role", "status");
  subForm.append(
    si.label,
    dl,
    sp.label,
    n("p", x(...pair("inline", "t6bb5758c43b2")), "p-hint"),
    subStatus,
    ss,
  );
  subs.append(subNote, subForm, subList);
  subForm.onsubmit = (e) => {
    e.preventDefault();
    task(ss, subStatus, async () => {
      const q = si.input.value.trim().toLowerCase(),
        it = h.catalog.items.find((v) =>
          [v.key, v.ru, v.en].some((t) => t.toLowerCase() === q),
        );
      if (!it) throw { code: "item-required" };
      if (
        subscriptions.length >= 50 &&
        !subscriptions.some((v) => v.itemKey === it.key)
      )
        throw { code: "subscription-limit" };
      await d.saveSubscription(it.key, sp.input.value);
      subStatus.textContent = x(...pair("inline", "tffd80f48d108"));
    });
  };
  function backendReady() {
    return (
      !!backend?.lastRunAt &&
      !backend.failed &&
      Date.now() - backend.lastRunAt.toMillis() < 20 * 60 * 1000
    );
  }
  function openSubscriptions(key) {
    if (!requireAccount()) return;
    if (key) si.input.value = key;
    show(subs.id);
    renderSubscriptions();
  }
  function renderSubscriptions() {
    subNote.textContent = backendReady()
      ? x(...pair("inline", "taa08f7c4a735"))
      : x(...pair("inline", "tce738a7266a0"));
    subList.replaceChildren(n("h3", x(...pair("inline", "t08d43c02ab4f"))));
    if (privateError) subList.append(n("p", privateError, "p-status"));
    for (const v of subscriptions) {
      const c = n("article", undefined, "trade-sub-card");
      c.append(
        n("strong", name(item(v.itemKey))),
        n("p", message("dynamic", "m5c7443bcca52", { v0: fmt(v.maxPrice) })),
        button(x(...pair("inline", "tbb12d68cb9cc")), "trash", (e) =>
          task(e.currentTarget, subStatus, () => d.removeSubscription(v.docId)),
        ),
      );
      subList.append(c);
    }
    if (!subscriptions.length)
      subList.append(n("p", x(...pair("inline", "t6c5fea6708a5")), "p-hint"));
  }
  const subButton = button(x(...pair("inline", "t7a79e52e7a91")), "bell", () =>
    openSubscriptions(),
  );
  subButton.id = "open-subscriptions";
  $("#account-links").append(subButton);
  const catalogueSub = button(
    x(...pair("inline", "tf9f5eb4d34f1")),
    "bell",
    () => openSubscriptions(),
  );
  catalogueSub.id = "catalog-subscriptions";
  $("#open-filters").after(catalogueSub);
  const alertList = n("div", undefined, "trade-alert-list");
  alertList.id = "trade-alert-list";
  $("#notification-list").after(alertList);
  alertList.hidden = true;
  function renderAlerts() {
    alertList.replaceChildren();
    notificationCenter.setSource(
      "alerts",
      alerts.map((a) => ({
        id: "alert_" + a.docId,
        kind: a.kind === "price" ? "price" : "reserve",
        read: !!a.read,
        at: a.createdAt?.toMillis?.() || 0,
        render() {
          const b = button(
            a.kind === "price"
              ? message("dynamic", "ma531d093df1d", {
                  v0: name(item(a.itemKey)),
                  v1: fmt(a.unitPrice),
                })
              : x(
                  a.kind === "reserve-expired"
                    ? "Срок резерва истёк, товар освобождён"
                    : "Резерв истечёт через 6 часов",
                  a.kind === "reserve-expired"
                    ? "Reservation expired; stock released"
                    : "Reservation expires in 6 hours",
                ),
            a.kind === "price" ? "bell" : "clock",
            async () => {
              try {
                await d.readAlert(a.docId);
                if (a.kind === "price") {
                  const l = await m.fetchLot(a.lotDoc, a.generationId);
                  if (
                    !l ||
                    l.salePaused ||
                    l.visibility === "hidden" ||
                    (l.availableQty ?? l.quantity) <= 0
                  ) {
                    toast(x(...pair("inline", "t254c0e9168bc")));
                    return;
                  }
                  await h.openLot(l);
                } else h.openDeals();
              } catch (e) {
                toast(error(e));
              }
            },
          );
          return b;
        },
      })),
    );
  }
  async function privateRefresh() {
    const next = m.state.publicId ? m.state.user?.uid : null;
    if (uid === next) {
      renderOwn();
      return;
    }
    uid = next;
    const v = ++privateEpoch;
    privateStop?.();
    privateStop = null;
    subscriptions = [];
    alerts = [];
    privateError = "";
    renderAlerts();
    renderSubscriptions();
    if (!uid) {
      for (const el of [own, edit, subs]) if (el.open) el.close();
      return;
    }
    try {
      const stop = await d.watchPrivate(
        (kind, rows) => {
          if (v !== privateEpoch) return;
          if (kind === "subscriptions") {
            subscriptions = rows;
            renderSubscriptions();
          } else {
            alerts = rows;
            renderAlerts();
            m.changed();
          }
        },
        (e) => {
          if (v === privateEpoch) {
            privateError = error(e);
            renderSubscriptions();
          }
        },
      );
      if (v !== privateEpoch) stop();
      else privateStop = stop;
    } catch (e) {
      privateError = error(e);
      renderSubscriptions();
    }
  }
  // Shared listeners exist only while a card or lot is visible.
  const bindings = new Map(),
    publicWatches = new Map();
  function attach(key, col, id, fn) {
    let w = publicWatches.get(key);
    if (!w) {
      w = { listeners: new Set(), data: undefined, stop: null, closed: false };
      publicWatches.set(key, w);
      d.watchPublic(
        col,
        id,
        (data) => {
          w.data = data;
          for (const f of w.listeners) f(data);
        },
        () => {
          w.data = null;
          for (const f of w.listeners) f(null);
        },
      ).then((stop) => {
        if (w.closed) stop();
        else w.stop = stop;
      });
    }
    w.listeners.add(fn);
    if (w.data !== undefined) fn(w.data);
    return () => {
      w.listeners.delete(fn);
      if (!w.listeners.size) {
        w.closed = true;
        w.stop?.();
        publicWatches.delete(key);
      }
    };
  }
  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const r = bindings.get(e.target);
        if (!r) continue;
        if (e.isIntersecting && !r.stop) r.stop = r.start();
        if (!e.isIntersecting && r.stop) {
          r.stop();
          r.stop = null;
        }
      }
    },
    { rootMargin: "160px" },
  );
  function bind(el, start) {
    bindings.set(el, { start, stop: null });
    obs.observe(el);
  }
  function prune() {
    for (const [el, r] of bindings)
      if (!el.isConnected) {
        r.stop?.();
        obs.unobserve(el);
        bindings.delete(el);
      }
  }
  const priceDialog = dialog(
      "price-history-dialog",
      x(...pair("inline", "t4edc9a5c78ff")),
    ),
    priceBody = n("div");
  priceDialog.append(priceBody);
  function history(key, data) {
    priceBody.replaceChildren(
      n("h3", name(item(key))),
      n("p", x(...pair("inline", "t445f9c129fec")), "p-hint"),
    );
    if (!data?.sampleCount)
      priceBody.append(n("p", x(...pair("inline", "t4870b5abd2d7"))));
    else {
      const list = n("ul", undefined, "trade-price-history");
      for (const r of data.history || [])
        list.append(
          n(
            "li",
            `${r.date}: ${fmt(r.average)} ${x(...pair("inline", "tf7bdd89c7cbc"))} · ${fmt(r.count)} ${tradeWord(r.count)}`,
          ),
        );
      priceBody.append(
        n(
          "strong",
          `${x(...pair("inline", "t31012dc6f4b6"))}: ${fmt(data.average)} ${x(...pair("inline", "tf7bdd89c7cbc"))}`,
        ),
        list,
      );
    }
    show(priceDialog.id);
  }
  function decorate(c, l, details = false) {
    if (!details) return;
    const rep = n(
        "p",
        x(...pair("inline", "t3902f077ed1d")),
        "trade-card-reputation",
      ),
      pb = button(
        x(...pair("inline", "t4edc9a5c78ff")),
        "clock",
        () => history(l.itemKey, null),
        "trade-price-button",
      );
    c.append(rep, pb);
    bind(rep, () =>
      attach("seller:" + l.sellerId, "sellerStats", l.sellerId, (data) => {
        rep.textContent = data
          ? message("dynamic", "m0e40ac433dad", {
              v0: fmt(data.completedCount || 0),
              v1: data.ratingCount
                ? fmt(data.ratingSum / data.ratingCount) + "/5"
                : "нет оценок",
              v2: data.ratingCount
                ? fmt(data.ratingSum / data.ratingCount) + "/5"
                : "not rated",
            })
          : x(...pair("inline", "t157c7ef82162"));
      }),
    );
    bind(pb, () =>
      attach("item:" + l.itemKey, "itemStats", l.itemKey, (data) => {
        pb.textContent = data?.sampleCount
          ? message("dynamic", "m8923c7f99eac", {
              v0: fmt(data.average),
              v1: fmt(data.sampleCount),
              v2: tradeWord(data.sampleCount),
              v3: data.sampleCount,
            })
          : x(...pair("inline", "t73650f322df4"));
        pb.onclick = () => history(l.itemKey, data);
      }),
    );
  }
  function lotActions(info, l) {
    const row = n("div", undefined, "trade-actions");
    row.append(
      button(x(...pair("inline", "td1508755d286")), "bell", () =>
        openSubscriptions(l.itemKey),
      ),
    );
    if (m.owns(l))
      row.append(
        button(x(...pair("inline", "t6e6abbde6075")), "edit", () =>
          openEdit(l),
        ),
        button(x(...pair("inline", "tc742676536e1")), "copy", (e) =>
          task(e.currentTarget, null, () => h.template(l)),
        ),
      );
    const priceLog = button(
      x(...pair("inline", "td529f61d5105")),
      "clock",
      (e) =>
        task(e.currentTarget, null, async () => {
          const { f, db } = await m.sdk(),
            q = f.query(
              f.collection(
                db,
                "lotPriceHistory",
                l.docId,
                "versions",
                m.generation(l),
                "entries",
              ),
              f.orderBy("at", "desc"),
              f.limit(20),
            ),
            data = await f.getDocsFromServer(q);
          const list = n("div", undefined, "release-price-log");
          list.append(n("h3", x(...pair("inline", "t3eab504e9a3a"))));
          if (data.empty)
            list.append(n("p", x(...pair("inline", "t721e57e3f9e0"))));
          for (const r of data.docs) {
            const v = r.data();
            list.append(
              n(
                "p",
                fmt(v.from) +
                  " → " +
                  fmt(v.to) +
                  " · " +
                  new Intl.DateTimeFormat(document.documentElement.lang, {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(v.at.toDate()),
              ),
            );
          }
          info.querySelector(".release-price-log")?.remove();
          info.append(list);
        }),
    );
    row.append(priceLog);
    info.append(row);
    if (l.salePaused)
      info.append(
        n("p", x(...pair("inline", "td44da42f3d45")), "trade-warning"),
      );
    const rep = n("div");
    info.append(rep);
    decorate(rep, l, true);
  }
  function timers() {
    for (const el of document.querySelectorAll("[data-trade-deadline]")) {
      const remaining = Number(el.dataset.tradeDeadline) - Date.now();
      el.textContent =
        remaining > 0
          ? message("dynamic", "m33a4f3ac1342", {
              v0: Math.floor(remaining / 3600000),
              v1: Math.floor((remaining % 3600000) / 60000),
            })
          : x(...pair("inline", "t29ccafd7b324"));
      el.classList.toggle("trade-expiring", remaining < 6 * 3600000);
    }
  }
  function sellerSummary(container, seller) {
    const metric = n("div", undefined, "v-metric");
    metric.append(n("span", x(...pair("inline", "t3f24ae28951e"))));
    const count = n("strong", "…");
    metric.append(count);
    container.append(metric);
    bind(metric, () =>
      attach("seller:" + seller, "sellerStats", seller, (data) => {
        count.textContent = data
          ? fmt(data.completedCount || 0)
          : x(...pair("inline", "tdea9decbc56c"));
      }),
    );
  }
  Object.assign(trading, {
    sellerSummary,
    decorate,
    lotActions,
    openOwn,
    openSubscriptions,
    unreadCount: () => alerts.filter((a) => !a.read).length,
    async markAll() {
      await Promise.all(
        alerts.filter((a) => !a.read).map((a) => d.readAlert(a.docId)),
      );
    },
  });
  window.addEventListener("zeno-data", () => {
    privateRefresh();
    requestAnimationFrame(prune);
    timers();
  });
  window.addEventListener("zeno-trades-rendered", timers);
  activeTask(timers, 30000);
  new MutationObserver(() => {
    renderOwn();
    renderSubscriptions();
    renderAlerts();
    timers();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  d.watchPublic(
    "systemStatus",
    "trading",
    (v) => {
      backend = v;
      renderSubscriptions();
    },
    () => {},
  );
  privateRefresh();
}
