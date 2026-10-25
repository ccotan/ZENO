import { pair } from "./localization.js";
import { activeTask } from "./active-scheduler.js";
import * as m from "./market.js";
import * as a from "./admin-data.js";
import * as d from "./features-data.js";
export function initAds(h) {
  const { $, n, i, t, x, show, run } = h;
  let ads = [],
    index = 0,
    paused = matchMedia("(prefers-reduced-motion:reduce)").matches,
    hover = false,
    focused = false,
    all = [],
    selected = null,
    stopAdmin = null,
    version = 0,
    previewURL = null;
  const images = new Map();
  const live = () =>
    ads.filter(
      (p) =>
        p.startsAt?.toMillis() <= Date.now() &&
        p.endsAt?.toMillis() > Date.now(),
    );
  function render() {
    const items = live(),
      v = ++version;
    index = Math.min(index, items.length);
    const p = index ? items[index - 1] : null;
    $("#hero-carousel").classList.toggle("v-show-promo", !!p);
    $("#promo-slide").hidden = !p;
    $("#carousel-controls").hidden = !items.length;
    $("#promo-pause").textContent = paused ? "▶" : "Ⅱ";
    $("#promo-pause").setAttribute(
      "aria-label",
      paused ? t("playSlides") : t("pauseSlides"),
    );
    $("#promo-counter").textContent = index + 1 + " / " + (items.length + 1);
    $("#promo-dots").replaceChildren(
      ...[null, ...items].map((_, j) => {
        const b = n("button");
        b.type = "button";
        b.setAttribute(
          "aria-label",
          x(...pair("inline", "t8f9fcd35fd62")) + (j + 1),
        );
        b.setAttribute("aria-current", String(j === index));
        b.onclick = () => {
          index = j;
          render();
        };
        return b;
      }),
    );
    if (!p) return;
    $("#promo-title").textContent = p.title;
    $("#promo-subtitle").textContent = p.subtitle;
    const link = $("#promo-link");
    link.hidden = !p.href;
    link.textContent = p.buttonText || t("details");
    if (p.href && /^https:\/\//.test(p.href)) link.href = p.href;
    else link.removeAttribute("href");
    $("#promo-art").replaceChildren(i("megaphone"));
    if (p.hasImage) {
      const key = p.docId + "_" + p.imageVersion;
      if (!images.has(key))
        images.set(
          key,
          d.promoImage(p.docId, p.imageVersion).catch(() => null),
        );
      images.get(key).then((src) => {
        if (v !== version || !src) return;
        const img = n("img");
        img.src = src;
        img.alt = p.title;
        $("#promo-art").replaceChildren(img);
      });
    }
  }
  const next = (delta) => {
    const count = live().length + 1;
    index = (index + delta + count) % count;
    render();
  };
  $("#promo-prev").onclick = () => next(-1);
  $("#promo-next").onclick = () => next(1);
  $("#promo-pause").onclick = () => {
    paused = !paused;
    render();
  };
  const hero = $("#hero-carousel");
  hero.addEventListener("mouseenter", () => (hover = true));
  hero.addEventListener("mouseleave", () => (hover = false));
  hero.addEventListener("focusin", () => (focused = true));
  hero.addEventListener("focusout", () => (focused = false));
  activeTask(() => {
    if (!document.hidden && !paused && !hover && !focused && live().length)
      next(1);
  }, 7000);
  activeTask(() => {
    if (!document.hidden) render();
  }, 60000);
  d.watchPromos(
    (v) => {
      ads = v;
      render();
    },
    () => {
      ads = [];
      render();
    },
  ).catch(() => {});
  const local = (v) => {
    const dt = new Date(v);
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  function preview() {
    const box = $("#promo-preview");
    box.replaceChildren(
      n("span", t("preview"), "v-eyebrow"),
      n("h3", $("#promo-edit-title").value || t("newBanner")),
      n("p", $("#promo-edit-subtitle").value),
    );
    if (previewURL) {
      const img = n("img");
      img.src = previewURL;
      img.alt = t("preview");
      box.append(img);
    }
  }
  function select(p = null) {
    selected = p;
    $("#promo-form").reset();
    $("#promo-delete").hidden = !p;
    $("#promo-edit-status").textContent = "";
    if (previewURL?.startsWith("blob:")) URL.revokeObjectURL(previewURL);
    previewURL = null;
    $("#promo-editor-title").textContent = p ? t("editBanner") : t("newBanner");
    $("#promo-slot-badge").textContent = p
      ? "#" + (Number(p.docId) + 1)
      : t("draft");
    for (const [id, key] of [
      ["title", "title"],
      ["subtitle", "subtitle"],
      ["button", "buttonText"],
      ["href", "href"],
    ])
      $("#promo-edit-" + id).value = p?.[key] || "";
    $("#promo-enabled").checked = p ? p.enabled : true;
    $("#promo-edit-start").value = local(p ? p.startsAt.toDate() : Date.now());
    $("#promo-edit-end").value = local(
      p ? p.endsAt.toDate() : Date.now() + 7 * 86400000,
    );
    if (p?.hasImage)
      d.promoImage(p.docId, p.imageVersion)
        .then((src) => {
          if (selected === p) {
            previewURL = src;
            preview();
          }
        })
        .catch(() => {});
    preview();
    list();
  }
  function list() {
    const box = $("#promo-admin-list");
    box.replaceChildren(
      ...all.map((p) => {
        const b = n("button");
        b.type = "button";
        b.classList.toggle("active", p.docId === selected?.docId);
        const state = !p.enabled
          ? t("disabled")
          : p.endsAt.toMillis() <= Date.now()
            ? t("expired")
            : p.startsAt.toMillis() > Date.now()
              ? t("scheduled")
              : t("active");
        b.append(
          n("strong", p.title),
          n("span", "#" + (Number(p.docId) + 1) + " · " + state),
        );
        b.onclick = () => select(p);
        return b;
      }),
    );
    if (!all.length) box.append(n("p", t("noAds"), "p-hint"));
  }
  async function open() {
    if (!a.isManager()) return;
    show("promo-admin-dialog");
    select();
    stopAdmin?.();
    stopAdmin = await d.watchPromos(
      (v) => {
        if (!a.isManager()) return;
        all = v;
        list();
      },
      (e) => ($("#promo-edit-status").textContent = h.error(e)),
      true,
    );
  }
  window.addEventListener("zeno-promos-admin", () =>
    open().catch((e) => ($("#promo-edit-status").textContent = h.error(e))),
  );
  window.addEventListener("zeno-access", () => {
    if (!a.isManager()) $("#promo-admin-dialog").close();
  });
  $("#promo-admin-dialog").addEventListener("close", () => {
    stopAdmin?.();
    stopAdmin = null;
    $("#promo-edit-image").value = "";
    if (previewURL?.startsWith("blob:")) URL.revokeObjectURL(previewURL);
    previewURL = null;
    selected = null;
    all = [];
  });
  $("#promo-new").onclick = () => select();
  $("#promo-form").oninput = preview;
  $("#promo-edit-image").onchange = () => {
    if (previewURL?.startsWith("blob:")) URL.revokeObjectURL(previewURL);
    const f = $("#promo-edit-image").files[0];
    previewURL = f ? URL.createObjectURL(f) : null;
    $("#promo-remove-image").checked = false;
    preview();
  };
  $("#promo-form").onsubmit = (e) => {
    e.preventDefault();
    run($("#promo-save"), $("#promo-edit-status"), async () => {
      if (!a.isManager()) throw { code: "permission-denied" };
      const slot =
        selected?.docId ??
        [...Array(10)]
          .map((_, j) => String(j))
          .find((j) => !all.some((p) => p.docId === j));
      if (slot === undefined) throw { code: "promo-limit" };
      const photo = await m.preparePhoto($("#promo-edit-image").files[0]);
      await d.savePromo(
        slot,
        {
          title: $("#promo-edit-title").value,
          subtitle: $("#promo-edit-subtitle").value,
          buttonText: $("#promo-edit-button").value,
          href: $("#promo-edit-href").value,
          enabled: $("#promo-enabled").checked,
          startsAt: $("#promo-edit-start").value,
          endsAt: $("#promo-edit-end").value,
        },
        photo,
        $("#promo-remove-image").checked,
      );
      $("#promo-edit-status").textContent = t("saved");
      $("#promo-edit-image").value = "";
      selected = all.find((p) => p.docId === slot) || { docId: slot };
      $("#promo-delete").hidden = false;
      $("#promo-slot-badge").textContent = "#" + (Number(slot) + 1);
      $("#promo-editor-title").textContent = t("editBanner");
    });
  };
  $("#promo-delete").onclick = () => {
    if (!selected || !confirm(t("confirmDeleteBanner"))) return;
    run($("#promo-delete"), $("#promo-edit-status"), async () => {
      await d.deletePromo(selected.docId);
      select();
      $("#promo-edit-status").textContent = t("saved");
    });
  };
  return {
    refresh: () => {
      render();
      preview();
      list();
    },
  };
}
