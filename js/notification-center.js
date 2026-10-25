import { pair } from "./localization.js";
const sources = new Map();
let controls,
  filter = "all",
  unreadOnly = true;
const language = () => (document.documentElement.lang === "en" ? "en" : "ru");
const text = (key) => pair("finish", key)[language() === "en" ? 1 : 0];
export function filterNotifications(
  entries,
  { kind = "all", unread = true } = {},
) {
  return entries
    .filter(
      (v) =>
        (!unread || !v.read) &&
        (kind === "all" ||
          (kind === "deal"
            ? ["deal", "reserve"].includes(v.kind)
            : v.kind === kind)),
    )
    .sort(
      (a, b) =>
        (Number(b.at) || 0) - (Number(a.at) || 0) ||
        String(a.id).localeCompare(String(b.id)),
    );
}
function render() {
  const box = document.querySelector("#notification-list");
  if (!box) return;
  if (!controls) {
    controls = document.createElement("div");
    controls.className = "finish-notification-filters";
    const label = document.createElement("label"),
      select = document.createElement("select");
    select.id = "notification-kind";
    label.append(select);
    const toggle = document.createElement("label"),
      check = document.createElement("input"),
      caption = document.createElement("span");
    check.type = "checkbox";
    check.checked = true;
    check.id = "notification-unread";
    toggle.append(check, caption);
    controls.append(label, toggle);
    box.before(controls);
    select.addEventListener("change", () => {
      filter = select.value;
      render();
    });
    check.addEventListener("change", () => {
      unreadOnly = check.checked;
      render();
    });
  }
  const select = controls.querySelector("select");
  select.setAttribute("aria-label", text("notificationType"));
  select.replaceChildren(
    ...["all", "thread", "deal", "price"].map((k) => {
      const o = document.createElement("option");
      o.value = k;
      o.textContent = text("notification_" + k);
      return o;
    }),
  );
  select.value = filter;
  controls.querySelector("span").textContent = text("unreadOnly");
  const entries = filterNotifications([...sources.values()].flat(), {
    kind: filter,
    unread: unreadOnly,
  });
  box.replaceChildren();
  let day;
  for (const row of entries) {
    const date = new Date(Number(row.at) || 0),
      key =
        Number(row.at) > 0 ? date.toLocaleDateString(language()) : "unknown";
    if (key !== day) {
      day = key;
      const heading = document.createElement("h3");
      heading.className = "finish-notification-day";
      heading.textContent =
        key === "unknown"
          ? text("noDate")
          : new Intl.DateTimeFormat(language(), { dateStyle: "long" }).format(
              date,
            );
      box.append(heading);
    }
    const button = row.render();
    button.dataset.notificationKind = row.kind;
    button.dataset.notificationId = row.id;
    button.classList.toggle("is-read", !!row.read);
    box.append(button);
  }
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "p-empty";
    empty.textContent = text("noNotifications");
    box.append(empty);
  }
}
export const notificationCenter = {
  setSource(name, rows) {
    sources.set(name, rows.slice(0, 200));
    render();
  },
  clear() {
    sources.clear();
    render();
  },
  refresh: render,
};
if (typeof window !== "undefined")
  window.addEventListener("zeno-language", render);
