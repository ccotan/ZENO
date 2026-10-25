import { pair } from "./localization.js";
import {
  normalizeSearch,
  recentSearches,
  rememberSearch,
} from "./search-utils.js";
import { activeTask } from "./active-scheduler.js";
/* ZENO usability layer. Public counts and presence are never fabricated. */
export function initQuality(h) {
  const { $, node: n, icon, x, t, show, toast, m } = h;
  const words = new Proxy({}, { get: (_, key) => pair("quality", key) });
  const text = (k) => x(...words[k]);
  let routeBusy = false,
    routeTimer,
    retryTimer,
    retries = 0,
    lastState = "";
  const mobile = matchMedia("(max-width:900px)"),
    sheet = matchMedia("(max-width:760px)");
  const body = $("#filter-panel-body"),
    note = $(".filter-note"),
    sort = $(".sort-control"),
    sortHome = sort.parentElement;
  const categories = [
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
  ];
  function placeFilters() {
    if (mobile.matches) {
      body.append(note, sort);
    } else {
      $(".filters").append(note);
      sortHome.append(sort);
    }
    if ($("#filters-dialog").open) $("#filters-dialog").close();
  }
  mobile.addEventListener("change", placeFilters);
  placeFilters();
  $("#open-filters").onclick = () => show("filters-dialog");
  $("#apply-filters").onclick = () => $("#filters-dialog").close();
  $("#filter-category").onchange = () => {
    h.category = $("#filter-category").value;
    h.renderCategories();
    h.renderCatalog();
    saveRoute();
  };
  const extra = n("div", undefined, "release-extra-filters");
  for (const [id, ru, en, type] of [
    ["qty-min", "Количество от", "Minimum quantity", "number"],
    ["qty-max", "Количество до", "Maximum quantity", "number"],
    ["only-available", "Только в наличии", "In stock only", "checkbox"],
    ["rating-four", "Рейтинг продавца 4+", "Seller rating 4+", "checkbox"],
  ]) {
    const label = n(
        "label",
        undefined,
        type === "checkbox" ? "q-check" : "p-label",
      ),
      input = n("input"),
      text = n("span");
    input.id = id;
    input.type = type;
    if (type === "number") {
      input.min = "0";
      input.max = "1000000";
      input.inputMode = "numeric";
    }
    text.dataset.releaseRu = ru;
    text.dataset.releaseEn = en;
    text.textContent = x(ru, en);
    label.append(
      type === "checkbox" ? input : text,
      type === "checkbox" ? text : input,
    );
    extra.append(label);
    input.addEventListener("input", () => {
      h.renderCatalog();
      saveRoute();
      renderChips();
    });
  }
  note.append(extra);
  const chips = n("div", undefined, "release-filter-chips");
  chips.id = "active-filters";
  $("#results").before(chips);
  function renderChips() {
    chips.replaceChildren();
    let count = 0;
    const add = (label, reset) => {
      count++;
      const b = n("button", label + " ×", "chip");
      b.type = "button";
      b.onclick = () => {
        reset();
        h.renderCatalog();
        saveRoute();
        renderChips();
      };
      chips.append(b);
    };
    if (h.category !== "all")
      add(t("categories." + h.category), () => {
        h.category = "all";
        h.renderCategories();
        $("#filter-category").value = "all";
      });
    for (const [id, key] of [
      ["search", null],
      ["min-price", "priceFrom"],
      ["max-price", "priceTo"],
      ["qty-min", null],
      ["qty-max", null],
    ]) {
      const e = $("#" + id);
      if (e.value)
        add(
          (key
            ? t(key) + ": "
            : id === "search"
              ? ""
              : e.closest("label")?.querySelector("span")?.textContent + ": ") +
            e.value,
          () => (e.value = ""),
        );
    }
    for (const id of [
      "has-photo",
      "has-enchants",
      "only-available",
      "rating-four",
    ]) {
      const e = $("#" + id);
      if (e.checked)
        add(e.closest("label").textContent.trim(), () => (e.checked = false));
    }
    chips.hidden = count === 0;
    $("#open-filters").setAttribute(
      "aria-label",
      x(...pair("inline", "tb527c4d41a94")) + (count ? " (" + count + ")" : ""),
    );
    const label = $("#open-filters span");
    if (label)
      label.textContent =
        x(...pair("inline", "tb527c4d41a94")) +
        (count ? " (" + count + ")" : "");
  }
  function params() {
    const p = new URLSearchParams();
    if (h.category !== "all") p.set("cat", h.category);
    for (const [id, key] of [
      ["search", "q"],
      ["min-price", "min"],
      ["max-price", "max"],
    ])
      if ($("#" + id).value) p.set(key, $("#" + id).value);
    if ($("#sort").value !== "default") p.set("sort", $("#sort").value);
    if ($("#has-photo").checked) p.set("photo", "1");
    if ($("#has-enchants").checked) p.set("ench", "1");
    for (const [id, key] of [
      ["qty-min", "qtyMin"],
      ["qty-max", "qtyMax"],
    ])
      if ($("#" + id).value) p.set(key, $("#" + id).value);
    if ($("#only-available").checked) p.set("available", "1");
    if ($("#rating-four").checked) p.set("rating", "4");
    return p;
  }
  function saveRoute() {
    if (routeBusy) return;
    clearTimeout(routeTimer);
    routeTimer = setTimeout(() => {
      if (location.hash.startsWith("#lot=")) return;
      const q = params().toString();
      history.replaceState(null, "", "#catalog" + (q ? "?" + q : ""));
      renderChips();
    }, 160);
  }
  async function readRoute() {
    if (location.hash.startsWith("#lot=")) {
      const p = new URLSearchParams(location.hash.slice(1)),
        id = p.get("lot");
      if (!id || !/^[A-Za-z0-9_-]{1,200}$/.test(id)) return;
      try {
        const l = await m.fetchLot(id, p.get("v") || undefined);
        if (l && l.visibility !== "hidden") await h.openLot(l);
        else toast(x(...pair("inline", "tb0d1474737b2")));
      } catch {
        toast(x(...pair("inline", "t51e1b8d66154")));
      }
      return;
    }
    if (!location.hash.startsWith("#catalog")) return;
    const p = new URLSearchParams(location.hash.split("?")[1] || "");
    routeBusy = true;
    h.category = categories.includes(p.get("cat")) ? p.get("cat") : "all";
    $("#filter-category").value = h.category;
    for (const [id, key] of [
      ["search", "q"],
      ["min-price", "min"],
      ["max-price", "max"],
    ]) {
      const v = (p.get(key) || "").slice(0, 100);
      $("#" + id).value = id === "search" ? v : /^\d{1,16}$/.test(v) ? v : "";
    }
    $("#sort").value = ["default", "priceAsc", "priceDesc", "name"].includes(
      p.get("sort"),
    )
      ? p.get("sort")
      : "default";
    $("#has-photo").checked = p.get("photo") === "1";
    $("#has-enchants").checked = p.get("ench") === "1";
    for (const [id, key] of [
      ["qty-min", "qtyMin"],
      ["qty-max", "qtyMax"],
    ])
      $("#" + id).value = /^\d{1,7}$/.test(p.get(key) || "") ? p.get(key) : "";
    $("#only-available").checked = p.get("available") === "1";
    $("#rating-four").checked = p.get("rating") === "4";
    h.renderCategories();
    h.renderCatalog();
    renderChips();
    routeBusy = false;
  }
  for (const id of [
    "search",
    "min-price",
    "max-price",
    "sort",
    "has-photo",
    "has-enchants",
  ])
    $("#" + id).addEventListener("input", () => {
      h.renderCatalog();
      saveRoute();
    });
  document.addEventListener("click", (e) => {
    if (
      e.target.closest(
        "#categories button,#side-categories button,#reset-filters",
      )
    ) {
      if (e.target.closest("#reset-filters")) {
        $("#has-photo").checked = $("#has-enchants").checked = false;
        for (const id of ["qty-min", "qty-max"]) $("#" + id).value = "";
        for (const id of ["only-available", "rating-four"])
          $("#" + id).checked = false;
        h.renderCatalog();
      }
      $("#filter-category").value = h.category;
      saveRoute();
    }
  });
  function suggestions() {
    const q = normalizeSearch($("#search").value.trim());
    const list = $("#search-suggestions");
    list.replaceChildren();
    if (q.length < 2) {
      for (const v of recentSearches()) {
        const o = n("option");
        o.value = v;
        list.append(o);
      }
      return;
    }
    const en = document.documentElement.lang === "en";
    const options = h.catalog.items
      .filter((i) =>
        normalizeSearch(i.ru + " " + i.en + " " + i.key).includes(q),
      )
      .slice(0, 7)
      .map((i) => i[en ? "en" : "ru"]);
    options.push(
      ...h.enchantments
        .filter((i) => normalizeSearch(i.ru + " " + i.en).includes(q))
        .slice(0, 3)
        .map((i) => i[en ? "en" : "ru"]),
    );
    for (const v of options) {
      const o = n("option");
      o.value = v;
      list.append(o);
    }
  }
  $("#search").addEventListener("input", suggestions);
  $("#search").addEventListener("focus", suggestions);
  $("#search-form").addEventListener("submit", () =>
    rememberSearch($("#search").value),
  );
  // Menu anchored to the real topbar bounds, with a separate backdrop.
  const menu = $("#menu"),
    nav = $("#navigation"),
    backdrop = $("#menu-backdrop");
  function closeMenu(focus = false) {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
    document.body.classList.remove("q-menu-open");
    if (focus) menu.focus();
  }
  function menuPosition() {
    const r = $(".topbar").getBoundingClientRect();
    nav.style.setProperty("--menu-top", Math.round(r.bottom + 8) + "px");
  }
  menu.onclick = () => {
    if (nav.classList.contains("open")) return closeMenu();
    menuPosition();
    nav.classList.add("open");
    menu.setAttribute("aria-expanded", "true");
    backdrop.hidden = false;
    document.body.classList.add("q-menu-open");
  };
  backdrop.onclick = () => closeMenu(true);
  nav.addEventListener("click", () => closeMenu());
  window.addEventListener("resize", () => {
    closeMenu();
    menuPosition();
  });
  window.addEventListener("scroll", menuPosition, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      e.preventDefault();
      closeMenu(true);
    }
  });
  const preview = n("section", undefined, "release-sale-preview");
  preview.setAttribute("aria-live", "polite");
  const limit = n("p", undefined, "p-hint");
  limit.id = "sale-limit";
  $("#lot-form")?.prepend(limit, preview);
  function updatePreview() {
    const selected = $("#selected-item")?.textContent || "";
    const title = $("#custom-name")?.value || selected;
    const qty = $("#quantity")?.value || "0",
      price = $("#unit-price")?.value || "0";
    preview.replaceChildren(
      n("strong", x(...pair("inline", "t5a264edae4d0")) + title),
      n("p", qty + " × " + price + " " + x(...pair("inline", "t01d6097d20dd"))),
    );
  }
  $("#lot-form")?.addEventListener("input", updatePreview);
  $("#sale-dialog").addEventListener("toggle", updatePreview);
  // File drop uses the same validation/compression pipeline as the file picker.
  const drop = $("#photo-dropzone"),
    photo = $("#lot-photo");
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      photo.click();
    }
  });
  for (const ev of ["dragenter", "dragover"])
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("q-drag");
    });
  for (const ev of ["dragleave", "drop"])
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("q-drag");
    });
  drop.addEventListener("drop", (e) => {
    if (!e.dataTransfer?.files.length) return;
    const dt = new DataTransfer();
    dt.items.add(e.dataTransfer.files[0]);
    photo.files = dt.files;
    h.changePhoto();
  });
  $("#remove-photo").onclick = () => {
    photo.value = "";
    h.changePhoto();
  };
  // Standardized dialog focus and header swipe. Never swipe-close edited forms silently.
  const original = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function () {
    closeMenu();
    this._returnFocus = document.activeElement;
    original.call(this);
    this.dataset.qDirty = "";
    queueMicrotask(() => {
      const input = [
        ...this.querySelectorAll(
          "input:not([type=file]):not([type=checkbox]),textarea,select",
        ),
      ].find((e) => !e.disabled && !e.hidden && e.getClientRects().length);
      const heading = this.querySelector("h2");
      if (!input && heading) heading.tabIndex = -1;
      (input || heading)?.focus({ preventScroll: true });
    });
  };
  const registeredDialogs = new WeakSet();
  const allowClose = (dialog) =>
    dialog.dataset.qDirty !== "1" ||
    !dialog.querySelector("form") ||
    confirm(x(...pair("inline", "tfdb1a273cdde")));
  function registerDialogs() {
    for (const dialog of document.querySelectorAll("dialog")) {
      if (registeredDialogs.has(dialog)) continue;
      registeredDialogs.add(dialog);
      dialog.addEventListener("cancel", (event) => {
        if (!allowClose(dialog)) event.preventDefault();
      });
      dialog.addEventListener("close", () => {
        const target = dialog._returnFocus;
        if (target?.isConnected && !target.closest("dialog:not([open])"))
          target.focus({ preventScroll: true });
      });
      dialog.addEventListener("click", (e) => {
        if (e.target !== dialog) return;
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          if (allowClose(dialog)) dialog.close();
      });
      dialog.addEventListener("input", () => (dialog.dataset.qDirty = "1"));
      let start = null;
      dialog.addEventListener(
        "touchstart",
        (e) => {
          if (
            !sheet.matches ||
            !e.target.closest("header") ||
            e.target.closest("button,input,a,select")
          )
            return;
          start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        },
        { passive: true },
      );
      dialog.addEventListener(
        "touchend",
        (e) => {
          if (!start) return;
          const dy = e.changedTouches[0].clientY - start.y,
            dx = Math.abs(e.changedTouches[0].clientX - start.x);
          start = null;
          if (dy > 90 && dy > dx * 1.5) {
            if (
              dialog.dataset.qDirty === "1" &&
              dialog.querySelector("form") &&
              !confirm(x(...pair("inline", "tfdb1a273cdde")))
            )
              return;
            dialog.close();
          }
        },
        { passive: true },
      );
    }
  }
  registerDialogs();
  $("#lot-dialog").addEventListener("close", () => {
    document.title = x(...pair("inline", "teadef1fcf0e4"));
    if (location.hash.startsWith("#lot=")) {
      const q = params().toString();
      history.replaceState(null, "", "#catalog" + (q ? "?" + q : ""));
      renderChips();
    }
  });
  window.addEventListener("hashchange", readRoute);
  let retryAt = 0;
  const retryTask = activeTask(() => {
    if (retryAt && Date.now() >= retryAt) {
      retryAt = 0;
      retries++;
      m.loadCatalog();
    }
  }, 1000);
  function catalogChanged() {
    const state = m.state.status;
    if (state === "ready") {
      retries = 0;
      clearTimeout(retryTimer);
      retryAt = 0;
    }
    if (
      state === "error" &&
      lastState !== "error" &&
      navigator.onLine &&
      ["unavailable", "deadline-exceeded", "network-request-failed"].some((c) =>
        (m.state.error || "").includes(c),
      ) &&
      retries < 3
    ) {
      retryAt = Date.now() + Math.min(30000, 3000 * 2 ** retries);
    }
    lastState = state;
    $("#filter-category").value = h.category;
  }
  window.addEventListener("online", () => {
    clearTimeout(retryTimer);
    retryAt = 0;
    retries = 0;
    m.loadCatalog();
  });
  function sync() {
    for (const e of document.querySelectorAll("[data-q]"))
      if (words[e.dataset.q]) e.textContent = text(e.dataset.q);
    $("#filter-category").replaceChildren(
      ...categories.map((k) => {
        const o = n("option", t("categories." + k));
        o.value = k;
        return o;
      }),
    );
    $("#filter-category").value = h.category;
    $("#search").placeholder = x(...pair("inline", "t756439d062fd"));
    suggestions();
    for (const e of document.querySelectorAll("[data-release-ru]"))
      e.textContent = x(e.dataset.releaseRu, e.dataset.releaseEn);
    renderChips();
    catalogChanged();
  }
  sync();
  readRoute();
  return {
    registerDialogs,
    sync,
    catalogChanged,
    lotOpened(l) {
      document.title = (l.customName || l.nickname || "Minecraft") + " — ZENO";
      const target =
        "#lot=" +
        encodeURIComponent(l.docId) +
        "&v=" +
        encodeURIComponent(m.generation(l));
      if (location.hash !== target) history.pushState(null, "", target);
    },
    async shareLot(l) {
      const url = new URL(location.href);
      url.hash =
        "lot=" +
        encodeURIComponent(l.docId) +
        "&v=" +
        encodeURIComponent(m.generation(l));
      try {
        await navigator.clipboard.writeText(url.href);
        toast(x(...pair("inline", "td94c07339fc8")));
      } catch {
        prompt(x(...pair("inline", "te079d4c67355")), url.href);
      }
    },
  };
}
