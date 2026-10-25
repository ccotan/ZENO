import { pair, markLocalized } from "./localization.js";
import * as m from "./market.js";
import * as a from "./admin-data.js";
const $ = (s) => document.querySelector(s),
  el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) {
      n.textContent = text;
      markLocalized(n, text);
    }
    if (cls) n.className = cls;
    return n;
  };
const labels = new Proxy({}, { get: (_, key) => pair("admin", key) });
const en = () => document.documentElement.lang === "en",
  t = (k) => labels[k]?.[en() ? 1 : 0] || k,
  x = (r, e) => (en() ? e : r);
const date = (v) =>
  v?.toDate
    ? new Intl.DateTimeFormat(en() ? "en" : "ru", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(v.toDate())
    : "-";
function error(e) {
  const code = m.codeOf(e),
    d = {
      "permission-denied": x(...pair("inline", "t4216cce49645")),
      "listing-reserved": x(...pair("inline", "t9815425d2852")),
      "listing-changed": x(...pair("inline", "t3838fef560c9")),
      "no-change": x(...pair("inline", "t61e596faf23c")),
      "nickname-ambiguous": x(...pair("inline", "td2f90916a34a")),
      "account-id-invalid": x(...pair("inline", "t9c3152092c93")),
      "profile-required": x(...pair("inline", "t4ccab9360cc7")),
      "auth/sign-in-required": x(...pair("inline", "tc82d9872011f")),
    };
  return d[code] || x(...pair("inline", "t4e721c031270")) + code;
}
const show = (id) => {
    const d = $("#" + id);
    if (!d.open) d.showModal();
  },
  button = (key, fn, danger = false) => {
    const b = el("button", undefined, danger ? "danger" : "");
    b.append(ai(key), el("span", t(key)));
    b.type = "button";
    b.onclick = fn;
    return b;
  },
  p = (text, cls) => el("p", text, cls),
  tag = (key, cls) => el("span", t(key), "a-tag " + (cls || ""));
function ai(key) {
  const names = {
    refresh: "refresh",
    copy: "copy",
    lots: "package",
    users: "users",
    reports: "shield",
    staff: "shield",
    userBlocks: "ban",
    auditLog: "list",
    ads: "megaphone",
    "lot-hide": "eye",
    "lot-show": "eye",
    "lot-delete": "trash",
    "role-set": "shield",
    "user-block": "ban",
    "user-unblock": "check",
    "report-update": "check",
    view: "eye",
    find: "search",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    use = document.createElementNS(svg.namespaceURI, "use");
  use.setAttribute(
    "href",
    "./assets/icons.svg#icon-" + (names[key] || "arrow"),
  );
  svg.append(use);
  svg.setAttribute("aria-hidden", "true");
  return svg;
}
function filterOptions() {
  const options =
    tab === "users" || tab === "staff"
      ? [
          ["all", x(...pair("inline", "t92ad39f80974"))],
          ["owner", t("owner")],
          ["admin", t("admin")],
          ["moderator", t("moderator")],
          ["none", t("none")],
        ]
      : tab === "lots"
        ? [
            ["all", x(...pair("inline", "tcd9257ebee85"))],
            ["active", t("active")],
            ["hidden", t("hidden")],
          ]
        : tab === "reports"
          ? [
              ["all", x(...pair("inline", "t9067f4292a53"))],
              ...["open", "reviewing", "resolved", "rejected"].map((k) => [
                k,
                t(k),
              ]),
            ]
          : tab === "userBlocks"
            ? [
                ["all", x(...pair("inline", "tf2167c968d50"))],
                ["blocked", t("blocked")],
                ["unblocked", t("unblocked")],
              ]
            : [["all", x(...pair("inline", "t77bd5da5cf83"))]];
  const select = $("#admin-filter"),
    old = select.value;
  select.replaceChildren(
    ...options.map(([v, text]) => {
      const o = el("option", text);
      o.value = v;
      return o;
    }),
  );
  select.value = options.some(([v]) => v === old) ? old : "all";
}
let tab = "lots",
  rows = [],
  cursor = null,
  more = false,
  version = 0,
  loading = false,
  action = null,
  reportTarget = null,
  identity = null,
  exact = false;
function translate() {
  const status = $("#admin-status");
  if (/^(Загружено:|Loaded:)/.test(status.textContent))
    status.textContent = x(...pair("inline", "t520cab3183a4")) + rows.length;
  for (const n of document.querySelectorAll(
    "#admin-dialog .p-status,#admin-action-dialog .p-status,#report-dialog .p-status",
  ))
    for (const key of ["loading", "saved", "sent", "noUser"])
      if (labels[key].includes(n.textContent)) n.textContent = t(key);
  $("#admin-tabs").setAttribute(
    "aria-label",
    x(...pair("inline", "ta56ecb76e666")),
  );
  document
    .querySelectorAll(
      "#admin-dialog [data-close],#admin-action-dialog [data-close],#report-dialog [data-close],#my-reports-dialog [data-close]",
    )
    .forEach((b) =>
      b.setAttribute("aria-label", x(...pair("inline", "tc50d5ca0eab6"))),
    );
  document
    .querySelectorAll("[data-au]")
    .forEach((n) => (n.textContent = t(n.dataset.au)));
  $("#admin-search").placeholder = t("search");
  $("#admin-refresh").prepend(ai("refresh"));
  $("#admin-tabs").replaceChildren(
    ...["lots", "users", "reports", "staff", "userBlocks", "auditLog"].map(
      (k) => {
        const b = button(k, () => {
          tab = k;
          $("#admin-search").value = "";
          $("#admin-filter").value = "all";
          translate();
          load();
        });
        b.setAttribute("aria-pressed", String(tab === k));
        return b;
      },
    ),
  );
  if (a.isManager())
    $("#admin-tabs").append(
      button("ads", () => window.dispatchEvent(new Event("zeno-promos-admin"))),
    );
  filterOptions();
  $("#admin-user-find").hidden = tab !== "users";
  $("#admin-info").textContent = [
    t("scope"),
    tab === "staff"
      ? t("ownerHint")
      : tab === "users" || tab === "userBlocks"
        ? t("blockHint")
        : tab === "lots"
          ? t("hiddenHint")
          : "",
  ].join(" ");
  renderAccess();
  render();
  if (action) $("#admin-action-title").textContent = t(action.kind);
}
function renderAccess() {
  const uid = a.access.uid;
  $("#admin-open").hidden = !a.isStaff();
  $("#account-id-details").hidden = !uid;
  $("#self-account-id").textContent = uid || "";
  $("#admin-role").textContent = t(a.access.role);
  const status = $("#account-block-status");
  status.hidden =
    !uid || (!a.access.blocked && a.access.ready && !a.access.error);
  status.textContent = a.access.error
    ? t("accessError")
    : !a.access.ready
      ? t("accessLoading")
      : a.access.blocked
        ? t("blocked") + ": " + (a.access.block?.reason || "")
        : "";
  $("#account-appeal").hidden = !a.access.blocked || !a.access.ready;
  if (!a.isStaff()) {
    version++;
    rows = [];
    action = null;
    for (const id of ["admin-dialog", "admin-action-dialog"])
      $("#" + id).close();
  }
  if (identity !== uid) {
    identity = uid;
    version++;
    rows = [];
    reportTarget = null;
    for (const id of [
      "report-dialog",
      "my-reports-dialog",
      "admin-action-dialog",
    ])
      $("#" + id).close();
    $("#my-reports-content").replaceChildren();
  }
}
function card() {
  return el("article", undefined, "a-card");
}
function line(c, label, value) {
  c.append(p(t(label) + ": " + String(value ?? "-"), "a-meta"));
}
function request(kind, target) {
  if (!a.isStaff()) return;
  action = { kind, target };
  $("#admin-action-form").reset();
  $("#admin-action-title").textContent = t(kind);
  $("#admin-action-target").textContent =
    (target.minecraftName || target.customName || target.itemKey || "") +
    " · " +
    target.docId;
  $("#admin-role-field").hidden = kind !== "role-set";
  $("#admin-report-field").hidden = kind !== "report-update";
  $("#admin-delete-check-wrap").hidden = kind !== "lot-delete";
  $("#admin-delete-check").required = kind === "lot-delete";
  $("#admin-action-status").textContent = "";
  if (kind === "role-set")
    $("#admin-role-select").value =
      target.role === "none" ? "moderator" : target.role;
  if (kind === "report-update")
    $("#admin-report-select").value =
      target.status === "reviewing" ? "resolved" : "reviewing";
  show("admin-action-dialog");
}
function reportCard(r, staff = false) {
  const c = card();
  c.append(
    el("h3", t(r.targetKind === "appeal" ? "appeal" : "complaint")),
    tag(r.status),
    p(r.text),
  );
  line(c, "target", t(r.targetKind) + " · " + r.targetId);
  if (staff) line(c, "reporter", r.reporterUid);
  line(c, "category", t(r.category));
  line(c, "date", date(r.createdAt));
  if (r.resolution) line(c, "resolution", r.resolution);
  if (staff && ["open", "reviewing"].includes(r.status)) {
    const bs = el("div", undefined, "a-buttons");
    bs.append(button("report-update", () => request("report-update", r)));
    if (r.targetKind === "lot")
      bs.append(
        button("view", async () => {
          try {
            const l = await m.fetchLot(r.targetId, r.targetGeneration);
            if (!l) throw { code: "listing-changed" };
            window.dispatchEvent(
              new CustomEvent("zeno-open-lot", { detail: l }),
            );
          } catch (e) {
            $("#admin-status").textContent = error(e);
          }
        }),
      );
    c.append(bs);
  }
  return c;
}
const bulkSelection = new Set();
let bulkTools;
function render() {
  if (!$("#admin-dialog").open) return;
  if (!bulkTools) {
    bulkTools = el("div", undefined, "release-bulk");
    const action = el(
      "button",
      x(...pair("inline", "t5d753fbdf9a5")),
      "v-secondary",
    );
    action.type = "button";
    action.onclick = async () => {
      if (!a.isStaff()) return;
      const targets = rows
        .filter((r) => bulkSelection.has(r.docId))
        .slice(0, 20);
      if (!targets.length) return;
      const reason = prompt(x(...pair("inline", "tc76f6af72886")));
      if (!reason || reason.trim().length < 8) return;
      action.disabled = true;
      let done = 0,
        failed = 0;
      for (const r of targets) {
        try {
          await a.moderate("lot-hide", r, reason);
          done++;
          bulkSelection.delete(r.docId);
        } catch {
          failed++;
        }
      }
      $("#admin-status").textContent =
        x(...pair("inline", "t39640c43edda")) +
        done +
        x(...pair("inline", "t9e43d3fdb3cd")) +
        failed;
      action.disabled = false;
      load();
    };
    bulkTools.append(action);
    $("#admin-content").before(bulkTools);
  }
  bulkTools.hidden = tab !== "lots" || !a.isStaff();
  const q = $("#admin-search").value.toLowerCase(),
    filtered = rows
      .filter((r) => {
        const v = $("#admin-filter").value;
        return (
          v === "all" ||
          v ===
            (tab === "lots"
              ? r.visibility || "active"
              : tab === "reports"
                ? r.status
                : tab === "userBlocks"
                  ? r.blocked
                    ? "blocked"
                    : "unblocked"
                  : r.role)
        );
      })
      .filter((r) =>
        [
          r.docId,
          r.minecraftName,
          r.nickname,
          r.customName,
          r.itemKey,
          r.publicId,
          r.text,
          r.reason,
          r.targetId,
          r.actorUid,
          r.action,
          r.role,
          r.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
  const summary = $("#admin-summary");
  summary.replaceChildren(
    ...[
      [x(...pair("inline", "tb10e27af5063")), rows.length],
      [x(...pair("inline", "t6d63cf23aad2")), filtered.length],
    ].map(([label, value]) => {
      const c = el("div", undefined, "v-metric");
      c.append(el("span", label), el("strong", String(value)));
      return c;
    }),
  );
  const content = $("#admin-content");
  content.replaceChildren();
  for (const r of filtered) {
    if (tab === "reports") {
      content.append(reportCard(r, true));
      continue;
    }
    const c = card(),
      bs = el("div", undefined, "a-buttons");
    if (tab === "lots") {
      const label = el("label", undefined, "q-check"),
        input = el("input");
      input.type = "checkbox";
      input.checked = bulkSelection.has(r.docId);
      input.onchange = () => {
        if (input.checked) bulkSelection.add(r.docId);
        else bulkSelection.delete(r.docId);
      };
      label.append(input, el("span", x(...pair("inline", "t54dc00861312"))));
      c.append(label);
      c.append(
        el("h3", r.customName || r.itemKey),
        p(
          (r.nickname || r.sellerId) +
            " · " +
            r.quantity +
            " × " +
            r.unitPrice +
            " ◆",
        ),
        tag(
          r.visibility || "active",
          r.visibility === "hidden" ? "warn" : "good",
        ),
      );
      line(c, "reserved", r.reservedQty || 0);
      if (r.moderationReason) c.append(p(r.moderationReason, "a-meta"));
      c.append(el("code", r.docId));
      bs.append(
        button("view", () =>
          window.dispatchEvent(
            new CustomEvent("zeno-open-lot", {
              detail: {
                ...r,
                id: r.docId + ":" + r.id,
                cloud: true,
                available: r.availableQty ?? r.quantity,
              },
            }),
          ),
        ),
        button(r.visibility === "hidden" ? "lot-show" : "lot-hide", () =>
          request(r.visibility === "hidden" ? "lot-show" : "lot-hide", r),
        ),
      );
      if (a.isManager()) {
        const b = button("lot-delete", () => request("lot-delete", r), true);
        b.disabled = (r.reservedQty || 0) > 0;
        bs.append(b);
      }
    } else if (tab === "users") {
      c.append(
        el("h3", r.minecraftName || r.publicId),
        el("code", r.docId),
        tag(r.role || "none"),
        tag(r.blocked ? "blocked" : "unblocked", r.blocked ? "warn" : "good"),
      );
      if (r.blocked && r.reason) c.append(p(r.reason));
      if (
        a.isOwner() &&
        r.docId !== a.access.uid &&
        r.role !== "owner" &&
        !r.blocked
      )
        bs.append(button("role-set", () => request("role-set", r)));
      if (
        a.isManager() &&
        r.docId !== a.access.uid &&
        r.role !== "owner" &&
        (a.isOwner() || r.role === "none")
      )
        bs.append(
          button(
            r.blocked ? "user-unblock" : "user-block",
            () => request(r.blocked ? "user-unblock" : "user-block", r),
            !r.blocked,
          ),
        );
    } else if (tab === "staff") {
      c.append(el("h3", t(r.role)), el("code", r.docId));
      line(c, "actor", r.assignedBy);
      line(c, "date", date(r.updatedAt));
      if (a.isOwner() && r.role !== "owner" && r.docId !== a.access.uid)
        bs.append(button("role-set", () => request("role-set", r)));
    } else if (tab === "userBlocks") {
      c.append(
        el("h3", t(r.blocked ? "blocked" : "unblocked")),
        el("code", r.docId),
        p(r.reason),
      );
      line(c, "date", date(r.updatedAt));
      bs.append(
        button("find", () => {
          tab = "users";
          $("#admin-user-key").value = r.docId;
          translate();
          find();
        }),
      );
    } else {
      c.append(el("h3", t(r.action)), p(r.reason));
      line(c, "actor", r.actorUid);
      line(c, "target", t(r.targetKind) + " · " + r.targetId);
      c.append(p(t(r.from) + " → " + t(r.to), "a-meta"));
      line(c, "date", date(r.createdAt));
      if (r.targetGeneration) c.append(el("code", r.targetGeneration));
    }
    if (tab === "users") {
      bs.append(
        button("copy", async () => {
          try {
            await navigator.clipboard.writeText(r.docId);
            $("#admin-status").textContent = t("copied");
          } catch {
            $("#admin-status").textContent = x(
              ...pair("inline", "t866a25dab1cf"),
            );
          }
        }),
      );
      const heading = c.querySelector("h3");
      if (heading) {
        const row = el("div", undefined, "v-card-head"),
          img = el("img", undefined, "v-avatar");
        img.alt = "";
        img.src = /^[A-Za-z0-9_]{3,16}$/.test(r.minecraftName || "")
          ? "https://minotar.net/helm/" +
            encodeURIComponent(r.minecraftName) +
            "/64.png"
          : "./assets/head-placeholder.svg";
        img.onerror = () => {
          img.onerror = null;
          img.src = "./assets/head-placeholder.svg";
        };
        heading.before(row);
        row.append(img, heading);
      }
    }
    if (bs.childElementCount) c.append(bs);
    content.append(c);
  }
  if (!filtered.length)
    content.append(p(loading ? t("loading") : t("empty"), "a-empty"));
  $("#admin-more").hidden = !more;
  $("#admin-more").disabled = loading;
}
async function enrich(input, v) {
  if (tab !== "users") return input;
  const out = await Promise.all(
    input.map(async (r) => {
      const [profile, details] = await Promise.all([
        m.publicProfile(r.publicId, true),
        a.userDetails(r.docId),
      ]);
      return {
        ...r,
        ...details,
        minecraftName: profile?.minecraftName || r.publicId,
      };
    }),
  );
  if (v !== version) return [];
  return out;
}
async function load(append = false) {
  if (!a.isStaff()) return;
  const v = ++version;
  loading = true;
  $("#admin-status").textContent = t("loading");
  if (!append) {
    rows = [];
    cursor = null;
    more = false;
    exact = false;
  }
  render();
  try {
    const result = await a.listRecords(tab, append ? cursor : null),
      items = await enrich(result.rows, v);
    if (v !== version || !a.isStaff()) return;
    rows = append
      ? [...new Map([...rows, ...items].map((r) => [r.docId, r])).values()]
      : items;
    cursor = result.cursor;
    more = result.more;
    $("#admin-status").textContent =
      x(...pair("inline", "t520cab3183a4")) + rows.length;
  } catch (e) {
    if (v === version) $("#admin-status").textContent = error(e);
  } finally {
    if (v === version) {
      loading = false;
      render();
    }
  }
}
async function find() {
  if (!a.isStaff()) return;
  exact = true;
  const v = ++version;
  rows = [];
  more = false;
  loading = true;
  render();
  $("#admin-status").textContent = t("loading");
  try {
    const r = await a.findUser($("#admin-user-key").value.trim()),
      items = r ? await enrich([r], v) : [];
    if (v !== version) return;
    rows = items;
    $("#admin-status").textContent = r ? "" : t("noUser");
  } catch (e) {
    if (v === version) $("#admin-status").textContent = error(e);
  } finally {
    if (v === version) {
      loading = false;
      render();
    }
  }
}
export function openReport(target) {
  if (!m.state.publicId) {
    window.dispatchEvent(new Event("zeno-account-needed"));
    return;
  }
  if (a.access.blocked && target.kind !== "appeal") {
    alert(t("blocked"));
    return;
  }
  reportTarget = target;
  $("#report-form").reset();
  $("#report-status").textContent = "";
  $("#report-title").textContent = t(
    target.kind === "appeal" ? "appeal" : "report",
  );
  $("#report-target").textContent = target.label || target.id;
  show("report-dialog");
}
async function showReports() {
  if (!a.access.uid) return;
  show("my-reports-dialog");
  const uid = a.access.uid;
  $("#my-reports-status").textContent = t("loading");
  $("#my-reports-content").replaceChildren();
  try {
    const result = await a.myReports();
    if (a.access.uid !== uid) return;
    $("#my-reports-content").replaceChildren(
      ...result.map((r) => reportCard(r)),
    );
    $("#my-reports-status").textContent = result.length
      ? x(...pair("inline", "tc4e93fb4bf91"))
      : t("empty");
  } catch (e) {
    if (a.access.uid === uid) $("#my-reports-status").textContent = error(e);
  }
}
export function initAdmin() {
  a.initAccess();
  translate();
  new MutationObserver(() => translate()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  window.addEventListener("zeno-access", () => {
    renderAccess();
    if (a.isStaff() && $("#admin-dialog").open) load();
  });
  $("#admin-open").onclick = () => {
    if (a.isStaff()) {
      show("admin-dialog");
      translate();
      load();
    }
  };
  $("#admin-refresh").onclick = () => load();
  $("#admin-more").onclick = () => load(true);
  $("#admin-filter").onchange = render;
  $("#admin-search").oninput = render;
  $("#admin-user-find").onsubmit = (e) => {
    e.preventDefault();
    find();
  };
  $("#my-reports").onclick = showReports;
  $("#account-appeal").onclick = () =>
    openReport({
      kind: "appeal",
      id: a.access.uid,
      generation: a.access.block?.lastAuditId,
      label: t("appeal"),
    });
  $("#copy-account-id").onclick = async () => {
    try {
      await navigator.clipboard.writeText(a.access.uid || "");
      $("#copy-account-id span").textContent = t("copied");
    } catch {
      const range = document.createRange();
      range.selectNodeContents($("#self-account-id"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };
  $("#admin-action-form").onsubmit = async (e) => {
    e.preventDefault();
    if (!action || !a.isStaff()) return;
    const b = $("#admin-action-submit");
    if (b.disabled) return;
    b.disabled = true;
    const pending = action,
      v = a.access.uid;
    try {
      await a.moderate(
        pending.kind,
        pending.target,
        $("#admin-action-reason").value,
        pending.kind === "role-set"
          ? $("#admin-role-select").value
          : $("#admin-report-select").value,
      );
      if (v !== a.access.uid) return;
      $("#admin-action-dialog").close();
      action = null;
      if (tab === "users" && exact) await find();
      else await load();
      $("#admin-status").textContent = t("saved");
    } catch (e) {
      if (v === a.access.uid) $("#admin-action-status").textContent = error(e);
    } finally {
      b.disabled = false;
    }
  };
  $("#report-form").onsubmit = async (e) => {
    e.preventDefault();
    const b = $("#report-submit");
    if (b.disabled || !reportTarget) return;
    b.disabled = true;
    const uid = a.access.uid;
    try {
      await a.submitReport(
        reportTarget,
        $("#report-category").value,
        $("#report-text").value,
      );
      if (uid !== a.access.uid) return;
      $("#report-status").textContent = t("sent");
      reportTarget = null;
    } catch (e) {
      if (uid === a.access.uid) $("#report-status").textContent = error(e);
    } finally {
      b.disabled = false;
    }
  };
}
