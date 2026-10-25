import { config } from "./config.js";
import { getFirebaseSession } from "./discord-auth.js";
const fail = (code) => Object.assign(new Error(code), { code });
export async function callMinecraft(
  name,
  data = {},
  signed = true,
  expectedUid = null,
) {
  const headers = { "Content-Type": "application/json" };
  if (signed) {
    const a = await getFirebaseSession(),
      u = a.instance.currentUser;
    if (!u) throw fail("auth/sign-in-required");
    if (expectedUid && u.uid !== expectedUid) throw fail("auth/user-changed");
    headers.Authorization = "Bearer " + (await u.getIdToken());
    if (a.instance.currentUser?.uid !== u.uid) throw fail("auth/user-changed");
  }
  let base;
  try {
    const u = new URL(config.marketApiOrigin || config.discordAuthOrigin);
    if (
      u.protocol !== "https:" ||
      u.origin !== (config.marketApiOrigin || config.discordAuthOrigin)
    )
      throw Error();
    base = u.origin + "/api/market";
  } catch {
    throw fail("minecraft-unavailable");
  }
  let r, b;
  try {
    r = await fetch(base + "/" + name, {
      method: "POST",
      headers,
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(45000),
    });
    b = await r.json();
  } catch {
    throw fail("minecraft-unavailable");
  }
  if (!r.ok || b.error) {
    const reason = b.error?.details?.reason;
    throw fail(
      typeof reason === "string"
        ? reason
        : b.error?.status === "RESOURCE_EXHAUSTED"
          ? "minecraft-rate"
          : "minecraft-unavailable",
    );
  }
  return b.result ?? b.data;
}
const verificationFlights = new Map(),
  accessCache = new Map(),
  attempts = new Map();
const CACHE_MS = 600000,
  COOLDOWN_MS = 60000;
const HARD = new Set(["banned", "not-linked", "no-vanilla", "site-blocked"]);
export function proofResult(d, id) {
  if (!d) return null;
  const t = (x) => x?.toDate?.()?.toISOString?.() || x;
  return {
    publicId: id,
    allowed: d.allowed === true,
    reason: d.reason,
    checkedAt: t(d.checkedAt),
    validUntil:
      t(d.validUntil) ||
      new Date(Date.parse(t(d.checkedAt)) + 60000).toISOString(),
    name: d.account?.name || null,
    temporary: d.lastError === "unavailable",
  };
}
export function proofUsable(v, now = Date.now()) {
  const checked = Date.parse(v?.checkedAt),
    until = Date.parse(v?.validUntil);
  return (
    v?.allowed === true &&
    !HARD.has(v.reason) &&
    checked <= now &&
    now < until &&
    until <= checked + 43200000
  );
}
export function rememberAccess(uid, value) {
  if (!value) {
    accessCache.delete(uid);
    try {
      sessionStorage.removeItem("zeno-access:" + uid);
    } catch {}
    return;
  }
  const stamp = Date.parse(value.checkedAt);
  if (Number.isFinite(stamp) && stamp <= Date.now())
    attempts.set(uid, Math.max(attempts.get(uid) || 0, stamp));
  const entry = { value, savedAt: Date.now() };
  accessCache.set(uid, entry);
  try {
    sessionStorage.setItem("zeno-access:" + uid, JSON.stringify(entry));
  } catch {}
}
function cached(uid) {
  let e = accessCache.get(uid);
  if (!e)
    try {
      e = JSON.parse(sessionStorage.getItem("zeno-access:" + uid));
    } catch {}
  return e &&
    Date.now() - e.savedAt >= 0 &&
    Date.now() - e.savedAt < CACHE_MS &&
    proofUsable(e.value)
    ? e.value
    : null;
}
export function nextManualCheck(uid) {
  return Math.max(0, (attempts.get(uid) || 0) + COOLDOWN_MS - Date.now());
}
export async function verifyOwn({ force = false } = {}) {
  const a = await getFirebaseSession(),
    uid = a.instance.currentUser?.uid;
  if (!uid) throw fail("auth/sign-in-required");
  if (verificationFlights.has(uid)) return verificationFlights.get(uid);
  if (!force) {
    const c = cached(uid);
    if (c) return c;
  }
  const request = (async () => {
    if (!force) {
      const m = await import("./market.js"),
        { f, db } = await m.sdk(),
        user = await f.getDocFromServer(f.doc(db, "users", uid));
      if (user.exists()) {
        const id = user.data().publicId;
        if (/^[A-Za-z0-9]{20}$/.test(id)) {
          const proof = await f.getDocFromServer(f.doc(db, "tradeAccess", id));
          const v = proof.exists() ? proofResult(proof.data(), id) : null;
          if (a.instance.currentUser?.uid !== uid)
            throw fail("auth/user-changed");
          if (proofUsable(v)) {
            rememberAccess(uid, v);
            return v;
          }
          if (v && HARD.has(v.reason)) {
            rememberAccess(uid, v);
            if (Date.now() - Date.parse(v.checkedAt) < 60000) return v;
          }
        }
      }
    }
    if (nextManualCheck(uid) > 0) throw fail("minecraft-rate");
    attempts.set(uid, Date.now());
    const result = await callMinecraft("verifyMinecraft", { force }, true, uid);
    if (a.instance.currentUser?.uid !== uid) throw fail("auth/user-changed");
    rememberAccess(uid, result);
    return result;
  })().finally(() => {
    if (verificationFlights.get(uid) === request)
      verificationFlights.delete(uid);
  });
  verificationFlights.set(uid, request);
  return request;
}
export async function ensureTrade(data) {
  const result = await callMinecraft("verifyTradeParticipants", data);
  if (!result?.allowed) throw fail("minecraft-unavailable");
  return result;
}
export function accessText(reason, en = false) {
  const values = {
    ok: ["Аккаунт подтверждён ✓", "Account verified ✓"],
    "not-linked": [
      "Торговля закрыта: привяжи Minecraft к своему Discord на Chromacube.",
      "Trading is locked: link Minecraft to your Discord on Chromacube.",
    ],
    "no-vanilla": [
      "Торговля закрыта: нет доступа к ваниле на Chromacube.",
      "Trading is locked: no Chromacube vanilla access.",
    ],
    banned: [
      "Торговля закрыта: на Chromacube действует бан.",
      "Trading is locked: banned on Chromacube.",
    ],
    "site-blocked": [
      "Торговля закрыта: аккаунт заблокирован на ZENO.",
      "Trading is locked: account blocked on ZENO.",
    ],
    unavailable: [
      "Не удалось проверить аккаунт. Попробуй ещё раз.",
      "Could not verify your account. Please try again.",
    ],
  };
  return (values[reason] || values.unavailable)[en ? 1 : 0];
}
