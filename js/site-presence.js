// UI hint only: site presence never grants trading access.
import { sdk, state, publicProfile } from "./market.js";
import { activeTask } from "./active-scheduler.js";
export const SITE_ONLINE_MS = 420000;
export const PRESENCE_CACHE_MS = 180000;
const HEARTBEAT_MS = 180000,
  QUOTA_PAUSE_MS = 900000;
let busy = false,
  nextAttempt = 0,
  lastAccount = "",
  pauseUntil = 0;
const cache = new Map(),
  inflight = new Map();
const pidOK = (id) => typeof id === "string" && /^[A-Za-z0-9]{20}$/.test(id);
export const presenceQuotaPaused = () => Date.now() < pauseUntil;
function noteFailure(e) {
  if (
    e?.code === "resource-exhausted" ||
    e?.code === "firestore/resource-exhausted"
  ) {
    pauseUntil = Date.now() + QUOTA_PAUSE_MS;
    cache.clear();
    window.dispatchEvent(new Event("zeno-presence-quota"));
  }
}
export function siteOnline(lastSeen, now = Date.now()) {
  const at =
    typeof lastSeen === "string"
      ? Date.parse(lastSeen)
      : lastSeen?.toMillis?.();
  return Number.isFinite(at) && at <= now + 5000 && now - at < SITE_ONLINE_MS;
}
export async function heartbeat() {
  if (
    busy ||
    presenceQuotaPaused() ||
    document.hidden ||
    navigator.onLine === false
  )
    return;
  const uid = state.user?.uid,
    id = state.publicId;
  if (!uid || !pidOK(id) || !state.profile) return;
  const account = uid + "/" + id;
  if (account !== lastAccount) {
    lastAccount = account;
    nextAttempt = 0;
  }
  if (Date.now() < nextAttempt) return;
  busy = true;
  nextAttempt = Date.now() + HEARTBEAT_MS;
  try {
    const a = await sdk();
    if (
      document.hidden ||
      a.instance.currentUser?.uid !== uid ||
      state.publicId !== id
    )
      return;
    const ref = a.f.doc(a.db, "sitePresence", id);
    await a.f.runTransaction(a.db, async (tx) => {
      const s = await tx.get(ref),
        seen = s.exists() ? s.data().seenAt?.toMillis?.() : 0;
      if (
        document.hidden ||
        a.instance.currentUser?.uid !== uid ||
        state.publicId !== id
      )
        return;
      if (Number.isFinite(seen) && Date.now() - seen < HEARTBEAT_MS) return;
      tx.set(ref, { seenAt: a.f.serverTimestamp() });
    });
  } catch (e) {
    noteFailure(e);
    console.warn(
      "[ZENO site presence]",
      presenceQuotaPaused() ? "quota-paused" : "heartbeat-unavailable",
    );
  } finally {
    busy = false;
  }
}
async function readPresence(id) {
  if (presenceQuotaPaused())
    throw Object.assign(new Error("presence-paused"), {
      code: "resource-exhausted",
    });
  const old = cache.get(id);
  if (old && Date.now() - old.at < PRESENCE_CACHE_MS) return old.row;
  if (inflight.has(id)) return inflight.get(id);
  const request = (async () => {
    try {
      const a = await sdk();
      const [profile, snap] = await Promise.all([
        publicProfile(id),
        a.f.getDocFromServer(a.f.doc(a.db, "sitePresence", id)),
      ]);
      const ms = snap.exists() ? snap.data().seenAt?.toMillis?.() : null,
        lastSeen = Number.isFinite(ms) ? new Date(ms).toISOString() : null;
      const row = {
        publicId: id,
        verified: profile?.minecraftVerified === true,
        name: profile?.minecraftName || null,
        online: siteOnline(lastSeen),
        lastSeen,
        checkedAt: new Date().toISOString(),
      };
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(id, { at: Date.now(), row });
      return row;
    } catch (e) {
      noteFailure(e);
      throw e;
    } finally {
      inflight.delete(id);
    }
  })();
  inflight.set(id, request);
  return request;
}
export async function getSitePresence(ids) {
  if (!Array.isArray(ids) || ids.length > 3 || !ids.every(pidOK))
    throw new Error("invalid-presence-ids");
  return Promise.all(ids.map(readPresence));
}
const beat = activeTask(heartbeat, HEARTBEAT_MS);
window.addEventListener("zeno-data", () => beat.wake());
window.addEventListener("zeno-auth-change", () => {
  nextAttempt = 0;
  beat.wake();
});
