import {
  getSitePresence,
  siteOnline,
  presenceQuotaPaused,
  PRESENCE_CACHE_MS,
} from "./site-presence.js";
import { publicProfile } from "./market.js";
import { activeTask } from "./active-scheduler.js";
const cache = new Map(),
  identities = new Map();
const en = () => document.documentElement.lang === "en";
const locale = () => document.documentElement.lang;
// Repaint only when data/language/expiry changes. Null and partial values are safe.
export function paint(el, value = {}) {
  const v = value || {},
    badgeOnly = el.dataset.mcPresence === "no";
  const checked = Date.parse(v.checkedAt || ""),
    stale =
      !Number.isFinite(checked) ||
      Date.now() - checked > PRESENCE_CACHE_MS + 30000;
  const online =
    stale || typeof v.online !== "boolean" ? null : siteOnline(v.lastSeen);
  const paused = presenceQuotaPaused();
  const signature = JSON.stringify([
    locale(),
    v.name,
    v.verified,
    online,
    v.lastSeen,
    v.failed,
    badgeOnly,
    paused,
  ]);
  if (el.dataset.mcRender === signature) return;
  el.dataset.mcRender = signature;
  el.replaceChildren();
  el.className = "mc-status";
  el.title = "";
  if (v.name) {
    for (const n of document.querySelectorAll("[data-mc-name]"))
      if (n.dataset.mcName === el.dataset.mcPlayer) {
        n.textContent = v.name;
        const img = n.parentElement?.querySelector("img.p-head");
        if (img && img.dataset.mcName !== v.name) {
          img.dataset.mcName = v.name;
          img.src =
            "https://chromacube.deforce.site/api/head/" +
            encodeURIComponent(v.name) +
            "?s=64";
        }
      }
  }
  if (v.verified) {
    const b = document.createElement("span");
    b.className = "mc-verified";
    b.textContent = badgeOnly
      ? "✓"
      : en()
        ? "✓ Nickname verified"
        : "✓ Ник подтверждён";
    b.title = en() ? "Nickname verified" : "Ник подтверждён";
    el.append(b);
  }
  if (badgeOnly || paused) return;
  const status = document.createElement("span");
  status.className = "mc-online " + (online === true ? "is-online" : "");
  status.textContent =
    online === true
      ? en()
        ? "● On site"
        : "● На сайте"
      : online === false
        ? en()
          ? "○ Not on site"
          : "○ Не на сайте"
        : en()
          ? "◌ Site status unknown"
          : "◌ Статус на сайте неизвестен";
  if (v.lastSeen && online === false && Number.isFinite(Date.parse(v.lastSeen)))
    status.title =
      (en() ? "Last seen on site: " : "Был на сайте: ") +
      new Date(v.lastSeen).toLocaleString(locale());
  el.append(status);
  el.title = en()
    ? "A visible ZENO tab was active in the last 7 minutes. Updates may be delayed."
    : "Видимая вкладка ZENO была активна за последние 7 минут. Обновление происходит с задержкой.";
}
function visibleNodes() {
  return [...document.querySelectorAll("[data-mc-player]")].filter((el) => {
    if (!el.getClientRects().length) return false;
    const r = el.getBoundingClientRect();
    return (
      r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
    );
  });
}
export function playerStatus(id, { presence = true } = {}) {
  const el = document.createElement("span");
  el.className = "mc-status";
  el.dataset.mcPlayer = id;
  el.dataset.mcPresence = presence ? "yes" : "no";
  const v = presence ? cache.get(id) : identities.get(id);
  paint(el, v);
  work.wake();
  return el;
}
async function tick() {
  if (document.hidden || navigator.onLine === false) return;
  const nodes = visibleNodes();
  const ids = [
    ...new Set(
      nodes
        .filter((n) => n.dataset.mcPresence !== "no")
        .map((n) => n.dataset.mcPlayer),
    ),
  ]
    .filter(
      (id) =>
        !cache.has(id) || Date.now() - cache.get(id)._at >= PRESENCE_CACHE_MS,
    )
    .slice(0, 3);
  if (ids.length && !presenceQuotaPaused()) {
    try {
      const rows = await getSitePresence(ids);
      for (const row of rows)
        cache.set(row.publicId, { ...row, _at: Date.now() });
    } catch {
      for (const id of ids)
        cache.set(id, {
          ...cache.get(id),
          online: null,
          checkedAt: null,
          failed: true,
          _at: Date.now(),
        });
    }
  }
  // Catalogue needs identities, never reads sitePresence documents.
  const badges = [
    ...new Set(
      nodes
        .filter((n) => n.dataset.mcPresence === "no")
        .map((n) => n.dataset.mcPlayer),
    ),
  ]
    .filter(
      (id) =>
        !identities.has(id) ||
        Date.now() - identities.get(id)._at >= PRESENCE_CACHE_MS,
    )
    .slice(0, 3);
  await Promise.all(
    badges.map(async (id) => {
      try {
        const p = await publicProfile(id);
        identities.set(id, {
          verified: p?.minecraftVerified === true,
          name: p?.minecraftName || null,
          _at: Date.now(),
        });
      } catch {
        identities.set(id, { failed: true, _at: Date.now() });
      }
    }),
  );
  if (document.hidden) return;
  for (const el of visibleNodes())
    paint(
      el,
      (el.dataset.mcPresence === "no" ? identities : cache).get(
        el.dataset.mcPlayer,
      ),
    );
  for (const store of [cache, identities])
    if (store.size > 100)
      for (const key of store.keys()) {
        store.delete(key);
        if (store.size <= 100) break;
      }
}
const work = activeTask(tick, 30000);
window.addEventListener("zeno-presence-quota", () => work.wake());
window.addEventListener("zeno-data", () => work.wake());
window.addEventListener("click", () => work.wake());
let scrollWake = 0;
window.addEventListener(
  "scroll",
  () => {
    if (Date.now() - scrollWake > 2000) {
      scrollWake = Date.now();
      work.wake();
    }
  },
  { passive: true, capture: true },
);
